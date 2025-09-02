local json = require("json")

Consultation = Consultaiton
	or {
		patient_id = nil,
		doctor_id = nil,
		state = "TRIAGE",
		created_at = nil,
		patient_language = nil,
		doctor_language = nil,
	}

Messages = Messages or {}
DEBUG = nil
HAS_SETUP = false

REGISTRATION_PROCESS = "ur8IRjSbYqAmBK1cvCTYeV_YJ4SkOMTGOc58SIcpZ9w"
TRIAGE_PROCESS = "lMgy700XJrMr3bmYnScMLok6uItTCSFQBDb_HAEZ-XI"
BABEL_PROCESS = "_oV0m-XablmsYqkj7w_7WpkV2Qx-1IQ1fTL4LvaW6xQ"

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

	return false
end

local function hasSetup()
	return HAS_SETUP
end

local function mapMessages(messages)
	local result = {}
	for _, msg in ipairs(messages) do
		local mapped = {}
		if msg.sender == TRIAGE_AGENT then
			mapped["triage_agent"] = msg.originalContent
		elseif msg.sender == Consultation.patient_id then
			mapped["patient"] = msg.originalContent
		end
		table.insert(result, mapped)
	end
	return json.encode(result)
end

local function notifyUser(recipient, message, json_metadata)
	local tags = {
		Recipient = recipient,
		Timestamp = os.time(),
		JSONMetadata = json_metadata,
	}

	local request = {
		Target = REGISTRATION_PROCESS,
		Action = "AddNotification",
		Data = message,
		Tags = tags,
	}

	ao.send(request)
end

function BraodcastToParticipants(msg, act)
	notifyUser(Consultation.patient_id, act, "{}")
	if doctor_id ~= nil then
		notifyUser(Consultation.doctor_id, act, "{}")
	end
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
	if not msg.Tags.REGISTRATION_PROCESS then
		msg.reply({ Data = "Setup Error: Missing orchestrator process in tags" })
	end
	if not msg.Tags.TRIAGE_PROCESS then
		msg.reply({ Data = "Setup Error: Missing triage process in tags" })
	end
	if not msg.Tags.BABEL_PROCESS then
		msg.reply({ Data = "Setup Error: Missing babel process in tags" })
	end
	REGISTRATIION_PROCESS = msg.Tags.REGISTRATION_PROCESS
	TRIAGE_PROCESS = msg.Tags.TRIAGE_PROCESS
	BABEL_PROCESS = msg.Tags.BABEL_PROCESS
	HAS_SETUP = true
	msg.reply({ Data = "Setup Babel Successfully" })
end)

Handlers.add("CreateConsultation", { Action = "CreateConsultation" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, { REGISTRATIION_PROCESS }) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local patient_id = msg.Tags.PatientID
	local created_at = os.time()
	local patient_language = msg.Tags.PatientLanguage
	Consultation.patient_id = patient_id
	Consultation.created_at = created_at
	Consultation.patient_language = patient_language
	BraodcastToParticipants(msg, "Consultation Initialized")
	msg.reply({ Data = "Successfully Initialized Consultation" })
end)

Handlers.add("UpdateConsultationState", { Action = "UpdateConsultationState" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, { TRIAGE_PROCESS, Consultation.doctor_id }) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if msg.Tags.NewState ~= "TRIAGE" or msg.Tags.NewState ~= "DOCTOR" or msg.Tags.NewState ~= "PRESCRIPTION" then
		msg.reply({
			Data = "Consultation state not updated. You can only change the state to TRIAGE, DOCTOR or PRESCRIPTION",
		})
	end
	Consultation.state = msg.Tags.NewState
	BraodcastToParticipants(msg, "Consultation state updated")
end)

Handlers.add("AddMessage", { Action = "AddMessage" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if
		not hasPermissions(
			msg.From,
			{ REGISTRATIION_PROCESS, TRIAGE_PROCESS, BABEL_PROCESS, Consultation.doctor_id, Consultation.patient_id }
		)
	then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local newMessage = {
		message_id = tostring(os.time()) .. msg.Tags.Sender,
		sender = msg.Tags.Sender,
		timestamp = msg.Tags.Timestamp,
		originalLanguage = msg.Tags.OriginalLanguage,
		originalContent = msg.Tags.OriginalContent,
		translatedLanguage = msg.Tags.TranslatedLanguage,
		translatedContent = msg.Tags.TranslatedContent,
		attestation = msg.Tags.attestation,
	}
	table.insert(Messages, newMessage)
	msg.reply({ Data = "Successfully added message to thread" })
end)

Handlers.add("UpdateDoctor", { Action = "UpdateDoctor" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if
		not hasPermissions(
			msg.From,
			{ REGISTRATIION_PROCESS, TRIAGE_PROCESS, BABEL_PROCESS, Consultation.doctor_id, Consultation.patient_id }
		)
	then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	Consultation.doctor_id = msg.Tags.DoctorID
	Consultation.state = "DOCTOR"
	BraodcastToParticipants(
		msg,
		"Doctor with DoctorID "
			.. Consultation.doctor_id
			.. " set Successfully for Consultation with Consultation ID "
			.. ao.id
	)
end)

Handlers.add("MessageListener", { Action = "Message-Response" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if
		not hasPermissions(
			msg.From,
			{ REGISTRATIION_PROCESS, TRIAGE_PROCESS, BABEL_PROCESS, Consultation.doctor_id, Consultation.patient_id }
		)
	then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if msg.From ~= Consultation.doctor_id or msg.From ~= Consultation.patient_id then
		msg.reply({ Data = "You are not a participant in this consultation" })
	end
	local senderMeta = {}
	if msg.From == Consultation.patient_id then
		senderMeta.role = "Patient"
		senderMeta.sourceLanguage = Consultation.patient_language
		senderMeta.targetLanguage = Consultation.doctor_language
	else
		senderMeta.role = "Doctor"
		senderMeta.sourceLanguage = Consultation.doctor_language
		senderMeta.targetLanguaget = Consultation.patient_language
	end
	local tags = {
		ConsultationID = ao.id,
		SenderID = msg.From,
		TargetLanguage = senderMeta.targetLanguage,
		SourceLanguage = senderMeta.sourceLanguage,
	}
	table.insert(Messages, {
		message_id = msg.Tags.MessageID,
		sender = msg.From,
		translatedLanguage = senderMeta.sourceLanguage, -- Also use
		translatedContent = msg.Data,
		originalLanguage = senderMeta.sourceLanguage, -- Also use
		originalContent = msg.Data,
		timestamp = msg.Timestamp,
	})
	if Consultation.state == "TRIAGE" then
		tags.PastMessages = mapMessages(Messages)
		local request = {
			Target = TRIAGE_AGENT,
			Action = "ProcessTriageResponse",
			Tags = tags,
		}
		ao.send(request)
		msg.reply({ Data = "Message Processed Successfully, sent to triage agent" })
	elseif Consultation.state == "DOCTOR" then
		tags.SourceContent = msg.Data
		local request = {
			Target = BABEL_AGENT,
			Action = "ProcessBabelResponse",
			Tags = tags,
		}
		DEBUG = request
		ao.send(request)
		msg.reply({ Data = "Message Processed Successfully, sent to babel agent" })
	else
		msg.reply({ Data = "Consultation finished already, you could always start a new consultation" })
	end
end)

Handlers.add("GetMessages", { Action = "GetMessages" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if
		not hasPermissions(
			msg.From,
			{ REGISTRATIION_PROCESS, TRIAGE_PROCESS, BABEL_PROCESS, Consultation.doctor_id, Consultation.patient_id }
		)
	then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if Consultation.patient_id ~= msg.From and (not Consultation.doctor_id or Consultation.doctor_id ~= msg.From) then
		local reply =
			json.encode({ error = "You can't get messages as you are not an active participant of this consultation" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(Messages)
	msg.reply({ Data = reply })
end)

Handlers.add("GetConsultationDetails", { Action = "GetConsultationDetails" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if
		not hasPermissions(
			msg.From,
			{ REGISTRATIION_PROCESS, TRIAGE_PROCESS, BABEL_PROCESS, Consultation.doctor_id, Consultation.patient_id }
		)
	then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if Consultation.patient_id ~= msg.From and (not Consultation.doctor_id or Consultation.doctor_id ~= msg.From) then
		local reply = json.encode({
			error = "You can't get consultation details as you are not an active participant of this consultation",
		})
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(Consultation)
	msg.reply({ Data = reply })
end)
