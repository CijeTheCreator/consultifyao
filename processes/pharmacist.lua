local json = require("json")

Prescriptions = Prescriptions or {}
FollowUpsSent = FollowUpsSent or {}
ORCHESTRATOR_PROCESS = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0"
HAS_SETUP = true

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

local function getMedicationNotification(languageCode, drugName)
	local translations = {
		["en"] = "Time to take your medication: ",
		["es"] = "Hora de tomar tu medicamento: ",
		["fr"] = "Il est temps de prendre votre médicament : ",
		["de"] = "Zeit für Ihre Medikamenteneinnahme: ",
		["it"] = "È ora di prendere il tuo farmaco: ",
		["pt"] = "Hora de tomar o seu medicamento: ",
		["zh"] = "该服药了：",
		["ja"] = "薬を飲む時間です：",
	}

	-- Get the translation for the language code, default to English if not found
	local message = translations[languageCode] or translations["en"]

	return message .. drugName
end

local function getPrescriptionsByPatient(patient_id)
	local results = {}
	for _, prescription in ipairs(Prescriptions) do
		if prescription.patient_id == patient_id then
			table.insert(results, prescription)
		end
	end
	return results
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
	if not msg.Tags.ORCHESTRATOR_PROCESS then
		msg.reply({ Data = "Setup Error: Missing orchestrator process in tags" })
	end
	ORCHESTRATOR_PROCESS = msg.Tags.ORCHESTRATOR_PROCESS
	msg.reply({ Data = "Setup Pharmacist Successfully" })
end)

local function notifyUser(recipient, message, json_metadata)
	local tags = {
		Recipient = recipient,
		Timestamp = os.time(),
		JSONMetadata = json_metadata,
	}

	local request = {
		Target = ORCHESTRATOR_PROCESS,
		Data = message,
		Tags = tags,
		Action = "AddNotification",
	}

	ao.send(request)
	print("Successfully notified user")
end

Handlers.add("AddPrescription", { Action = "AddPrescription" }, function(msg)
	print("Timestamp: " .. msg.Timestamp)
	local prescription = {
		patient_id = msg.Tags.PatientID,
		consultaiton_id = msg.Tags.ConsultationID,
		drug_name = msg.Tags.DrugName,
		frequency = tonumber(msg.Tags.Frequency),
		startTimestamp = tonumber(msg.Tags.Start),
		endTimestamp = tonumber(msg.Tags.End),
		patient_language = msg.Tags.PatientLanguage,
	}
	table.insert(Prescriptions, prescription)
	msg.reply({ Data = "Prescription added successfully" })
end)

Handlers.add("SendReminder", { Action = "Cron" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local currentTimestamp = tonumber(msg.Timestamp)
	local remindersSent = 0
	for i, prescription in ipairs(Prescriptions) do
		-- Check if prescription is still active
		if
			currentTimestamp >= tonumber(prescription.startTimestamp)
			and currentTimestamp <= tonumber(prescription.endTimestamp)
		then
			-- Initialize nextReminderTimestamp if it's nil (first time)
			if prescription.nextReminderTimestamp == nil then
				prescription.nextReminderTimestamp = tonumber(prescription.startTimestamp)
			end
			-- Check if it's time to send a reminder
			if currentTimestamp >= tonumber(prescription.nextReminderTimestamp) then
				local notificaiton = getMedicationNotification(prescription.patient_language, prescription.drug_name)
				local metadata = {
					Target = prescription.patient_id,
					Data = notificaiton,
					DrugName = prescription.drug_name,
					ConsultationID = prescription.consultaiton_id,
					Frequency = prescription.frequency,
					Timestamp = tostring(currentTimestamp),
				}
				notifyUser(prescription.patient_id, notificaiton, json.encode(metadata))
				-- Calculate next reminder time based on frequency
				-- Frequency: 1 = once daily (24 hours), 2 = twice daily (12 hours), etc.
				local hoursInterval = 24 / tonumber(prescription.frequency)
				local secondsInterval = hoursInterval * 3600 -- Convert to seconds
				-- Update nextReminderTimestamp for the next dose
				prescription.nextReminderTimestamp = tonumber(prescription.nextReminderTimestamp) + secondsInterval
				remindersSent = remindersSent + 1
				-- Log the reminder for tracking
				print(
					"Reminder sent to patient "
						.. prescription.patient_id
						.. " for "
						.. prescription.drug_name
						.. " at timestamp "
						.. currentTimestamp
				)
			end
		end
	end
	print({
		Data = "Reminder check completed. " .. remindersSent .. " reminders sent.",
		RemindersSent = tostring(remindersSent),
		Timestamp = tostring(currentTimestamp),
	})
end)

Handlers.add("GetPrescriptions", { Action = "GetPrescriptions" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local prescriptions = getPrescriptionsByPatient(msg.From)
	if not prescriptions then
		local reply = json.encode({ error = "No prescriptions found for this account" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(prescriptions)
	msg.reply({ Data = reply })
end)
