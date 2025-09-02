APUS_ROUTER = "TED2PpCVx0KbkQtzEYBo0TRAO-HPJlpCMmUzch9ZL2g"
ORCHESTRATOR_PROCESS = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0"
HAS_SETUP = true
TrackingData = TrackingData or {}
DoctorAssignments = TrackingData or {}
DEBUG = nil

local json = require("json")

local function hasPermissions(sender, allowed)
	-- If allowed is nil or empty, return true (no restrictions)
	if not allowed or #allowed == 0 then
		return true
	end

	-- Otherwise, check if sender is in the allowed list
	for _, process in ipairs(allowed) do
		if process and sender == process then
			return true
		end
	end

	return true
end

local function hasSetup()
	return HAS_SETUP
end

local function parse_json_wrapped(json_str)
	json_str = json_str:match("^%s*(.-)%s*$")
	-- Strip ```json and ``` wrappers if present
	json_str = json_str:gsub("^```json%s*", "")
	json_str = json_str:gsub("^```%s*", "") -- handles plain ``` case
	json_str = json_str:gsub("```%s*$", "")
	local success, result = pcall(json.decode, json_str)
	if not success then
		return false
	end
	return result
end

local function buildPrompt(contextJson)
	local prompt = [[
You are a medical triage agent. Your job is to guide a short triage conversation and then select the most appropriate doctor.  

Doctor specialties available:  
- General Medicine
- Cardiology
- Dermatology
- Endocrinology
- Gastroenterology
- Neurology
- Oncology
- Orthopedics
- Pediatrics
- Psychiatry
- Pulmonology
- Radiology
- Surgery
- Urology

### Instructions
1. **Ask 2–4 questions maximum** to determine the patient’s condition and severity.  
   - Ask one question per turn.  
   - Use the same language as the previous questions (if prior messages are in French, continue in French).  

2. **Response format:** Always respond with JSON wrapped in ```json``` blocks.  

   - If you are asking a question, use this structure:
```json
   {
     "response-type": "question",
     "question": "When last did you eat?"
   }
````

If the triage is complete and you are selecting a doctor, use this structure:

```json
{
  "response-type": "select-doctor",
  "doctor-specialty": "General Medicine",
  "triage-summary": "The patient has a running stomach, experienced fever in the last 2 days. The fever did not break. He has no appetite but has eaten in the last 6 hours."
}
```

3. **Triage summary requirements:**

   * Be concise but informative (1–3 sentences).
   * Include main symptoms, timeline, and severity if known.

4. **Do not output anything except the JSON response.**

   * No explanations.
   * No extra text outside the JSON wrapper.

### Context

<PreviousMessages>

```json
##CONTEXTHERE##
```

</PreviousMessages>

### Task

Generate the next JSON response following the above rules.
]]

	return prompt:gsub("##CONTEXTHERE##", contextJson)
end

Handlers.add("Setup", { Action = "Setup" }, function(msg)
	if hasSetup() then
		msg.reply({ Data = "Setup Error: The process has already been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if HAS_SETUP then
		msg.reply({ Data = "Setup Error: The Process has already been setup" })
		return
	end
	if not msg.Tags.APUS_ROUTER then
		msg.reply({ Data = "Setup Error: Missing setup data in tags" })
	end
	if not msg.Tags.ORCHESTRATOR_PROCESS then
		msg.reply({ Data = "Setup Error: Missing orchestrator process in tags" })
	end
	APUS_ROUTER = msg.Tags.APUS_ROUTER
	ORCHESTRATOR_PROCESS = msg.Tags.ORCHESTRATOR_PROCESS
	HAS_SETUP = true
	msg.reply({ Data = "Setup Babel Successfully" })
end)

Handlers.add("ProcessTriageResponse", { Action = "ProcessTriageResponse" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	-- local callbackId = randomModule.generateUUID()
	local trackingId = "1881207838"
	local tracking = {
		ConsultationId = msg.Tags.ConsultationID,
		SenderId = msg.Tags.SenderID,
		TargetLanguage = msg.Tags.TargetLanguage,
		SourceLanguage = msg.Tags.SourceLanguage,
		PastMessages = msg.Tags.PastMessages,
		Timestamp = os.time(),
	}
	TrackingData[trackingId] = tracking
	local prompt = buildPrompt(msg.Tags.PastMessages)
	local request = {
		Target = APUS_ROUTER,
		Action = "Infer",
		["X-Prompt"] = prompt,
		["X-Reference"] = trackingId,
	}
	ao.send(request)
	DEBUG = request
	msg.reply({ Data = "Triage request successfully processed" })
end)

Handlers.add("AcceptInfer", { Action = "Infer-Response" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if msg.Code then
		print(msg.Code)
		print(msg.Data)
		return
	end
	if not msg["X-Reference"] then
		msg.reply({ Data = "Triage Error: X-Reference missing" })
		return
	end
	if not TrackingData[msg["X-Reference"]] then
		msg.reply({ Data = "Triage Error: TrackingData not found for X-Reference" })
		return
	end
	local tracking = TrackingData[msg["X-Reference"]]
	local inferResponse = json.decode(msg.Data)
	local attestation = inferResponse.attestation
	local nextMessage = parse_json_wrapped(inferResponse.result)
	if not nextMessage then
		msg.reply({ Data = "Invalid json during parse" })
		return
	end
	if nextMessage.response_type == "question" then
		local newMessage = {
			Sender = ao.id,
			Timestamp = tracking.Timestamp,
			OriginalLanguage = tracking.SourceLanguage,
			OriginalContent = nextMessage.question,
			TranslatedLanguage = tracking.TargetLanguage,
			TranslatedContent = nextMessage.question,
			attestation = attestation,
		}
		local request = {
			Target = tracking.ConsultationId,
			Action = "AddMessage",
			Tags = newMessage,
		}
		DEBUG = request
		ao.send(request)
		msg.reply({ Data = "Triage Agent: Insert Question Successful" })
	elseif nextMessage.response_type == "select-doctor" then
		local tags = {
			ConsultationId = tracking.ConsultationId,
			DoctorSpecialty = nextMessage.doctor_specialty,
			TriageSummary = nextMessage.triage_summary,
			TranslatedLanguage = tracking.TargetLanguage,
		}
		local request = {
			Target = ORCHESTRATOR_PROCESS,
			Action = "RequestDoctorAssignment",
			Tags = tags,
		}
		ao.send(request)
		DoctorAssignments[tracking.ConsultationId] = "ASSIGNING"
		local messageContent = "You are currently being assigned a doctor, hold on patiently, it should not take long. Your triage summary is "
			.. nextMessage.triage_summary
		local newMessage = {
			Sender = ao.id,
			Timestamp = tracking.Timestamp,
			OriginalLanguage = tracking.SourceLanguage,
			OriginalContent = messageContent,
			TranslatedLanguage = tracking.TargetLanguage,
			TranslatedContent = messageContent,
		}
		local triageNotificationRequest = {
			Target = tracking.ConsultationId,
			Action = "AddMessage",
			tags = newMessage,
		}
		ao.send(triageNotificationRequest)
		msg.reply({ Data = "Triage Agent: Assign Doctor Successful" })
	else
		msg.reply({
			Data = "Triage Error: Message type must either be question or select-doctor it is: "
				.. nextMessage.response_type,
		})
		return
	end
end)
