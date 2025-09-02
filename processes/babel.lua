local json = require("json")
APUS_ROUTER = "TED2PpCVx0KbkQtzEYBo0TRAO-HPJlpCMmUzch9ZL2g"
HAS_SETUP = false
TrackingData = TrackingData or {}

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
	return true
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

local function generateBabelPrompt(msg)
	local prompt = [[
You are a **translator**. Your task is to translate the provided text into the specified `target-language`.

**Output rules:**

* Respond **only** in valid JSON.
* Include the `json` wrapper.
* Do **not** add explanations, confirmations, or extra text outside the JSON.

**Expected Output Format:**

```json
{
  "target-language": "fr",
  "target-content": "Quand as-tu mangé pour la dernière fois ?"
}
```

**Input Format (you will be given):**

```json
{
  "target-language": "fr",
  "source-content": "When last did you eat?"
}
```
The languages currently supported are:
code: "en" name: "English"
code: "es" name: "Español"
code: "fr" name: "Français"
code: "de" name: "Deutsch"
code: "it" name: "Italiano"
code: "pt" name: "Português"
code: "zh" name: "中文"
code: "ja" name: "日本語"


**Task:**
Translate the text inside `source-content` to the `target-language` and return the result in the expected output format.

**Text to Translate:**

```json
##CONTEXTHERE##
```
]]

	local context = {
		target_language = msg.Tags.TargetLanguage,
		source_content = msg.Tags.SourceContent,
	}
	local contextJson = json.encode(context)
	return prompt:gsub("##CONTEXTHERE##", contextJson)
end

Handlers.add("Setup", { Action = "Setup" }, function(msg)
	if hasSetup() then
		msg.reply({ Data = "Setup Error: The process has already been setup" })
		return
	end
	if not hasPermissions(msg.From, { Owner }) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not msg.APUS_ROUTER then
		msg.reply({ Data = "Setup Error: Missing setup data in tags" })
		return
	end
	APUS_ROUTER = msg.APUS_ROUTER
	HAS_SETUP = true
	msg.reply({ Data = "Setup Babel Successfully" })
end)

Handlers.add("ProcessBabelResponse", { Action = "ProcessBabelResponse" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local trackingId = tostring(os.time())
	local tracking = {
		ConsultationId = msg.Tags.ConsultationID,
		Sender = msg.Tags.SenderID,
		TranslatedLanguage = msg.Tags.TargetLanguage,
		OriginalLanguage = msg.Tags.SourceLanguage,
		OriginalContent = msg.Tags.SourceContent,
		Timestamp = os.time(),
	}
	TrackingData[trackingId] = tracking
	local prompt = generateBabelPrompt(msg)
	local request = {
		Target = APUS_ROUTER,
		Action = "Infer",
		["X-Prompt"] = prompt,
		["X-Reference"] = trackingId,
	}
	ao.send(request)
	msg.reply({ Data = "Sent translation request successfully" })
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
		msg.reply({ Data = "No reference for this response" })
		return
	end
	if not TrackingData[msg["X-Reference"]] then
		msg.reply({ Data = "No tracking data for this reference" })
		return
	end
	local tracking = TrackingData[msg["X-Reference"]]
	local inferResponse = json.decode(msg.Data)
	local attestation = inferResponse.attestation
	local translation = parse_json_wrapped(inferResponse.result)
	if not translation then
		msg.reply({ Data = "Invalid json during parse - TRANSLATION" })
		return
	end
	if not translation.target_content then
		msg.reply({ Data = "Translation Error: Content empty" })
		return
	end
	tracking.TranslatedContent = translation.target_content
	tracking.attestation = attestation
	local request = {
		Target = tracking.ConsultationId,
		Action = "AddMessage",
		Tags = tracking,
	}
	ao.send(request)
	msg.reply({ Data = "Babel-Infer Response finished successfully" })
end)
