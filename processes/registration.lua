local json = require("json")
-- Constants
MINIMUM_DOCTOR_STAKE = 5
CONSULTATION_FEE = 5
PROTOCOL_FEE = 0.05
ORCHESTRATOR_PROCESS = ao.id
HAS_SETUP = true
-- State tables
Doctors = Doctors or {}
Patients = Patients or {}
USDToken = USDToken or ""
PatientConsultations = PatientConsultations or {}
DoctorConsultations = DoctorConsultations or {}
Payments = Payments or {}
Notifications = Notifications or {}
ConsultationsIndexed = ConsultationsIndexed or {}
Drops = Drops or {}
DROP_SIZE = 50

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

local function notifyUser(recipient, message, json_metadata)
	print("Notifying user")
	local tags = {
		Recipient = recipient,
		Timestamp = os.time(),
		JSONMetadata = json_metadata,
	}
	local request = {
		Target = ORCHESTRATOR_PROCESS,
		Action = "AddNotification",
		Data = message,
		Tags = tags,
	}
	ao.send(request)
end

local function selectWeightedRandomDoctor(doctors, entropy)
	if #doctors == 0 then
		return nil
	end
	-- Calculate total stake
	local totalStake = 0
	for i = 1, #doctors do
		totalStake = totalStake + doctors[i].stake
	end
	-- Generate random number based on entropy within the total stake range
	local randomValue = tonumber(entropy) % totalStake
	-- Find the doctor corresponding to this weighted random value
	local cumulativeStake = 0
	for i = 1, #doctors do
		cumulativeStake = cumulativeStake + doctors[i].stake
		if randomValue < cumulativeStake then
			return doctors[i]
		end
	end
	-- Fallback to last doctor (shouldn't reach here normally)
	return doctors[#doctors]
end

local function addNotification(msg)
	local user_id = msg.Tags.Recipient
	local message = msg.Data
	local timestamp = msg.Tags.Timestamp
	Notifications[user_id] = Notifications[user_id] or {}
	local notification = {
		message = message,
		timestamp = timestamp,
	}
	table.insert(Notifications[user_id], notification)
end

local function getDoctorsBySpecialty(doctorsTable, specialtyType)
	local result = {}
	local count = 0
	for doctorKey, doctorData in pairs(doctorsTable) do
		if doctorData.specialty_type == specialtyType and doctorData.stake >= MINIMUM_DOCTOR_STAKE then
			table.insert(result, doctorData)
			count = count + 1
		end
	end
	-- If no doctors found with the given specialty and minimum stake, return all doctors with minimum stake as array
	if count == 0 then
		for doctorKey, doctorData in pairs(doctorsTable) do
			if doctorData.stake >= MINIMUM_DOCTOR_STAKE then
				table.insert(result, doctorData)
				count = count + 1
			end
		end
	end
	return count, result
end

local function updatePayments(sender, quantity)
	if Payments[sender] ~= nil then
		Payments[sender] = Payments[sender] + tonumber(quantity)
		return
	end
	Payments[sender] = tonumber(quantity)
end

-- InstantiateUSDA handler
Handlers.add("InstantiateUSDA", { Action = "InstantiateUSDA" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, { Owner }) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	USDToken = msg.Tags.ProcessId
	msg.reply({ Data = "USDA token instantiated successfully" })
end)

-- RegisterPatient handler
Handlers.add("RegisterPatient", { Action = "RegisterPatient" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local patient_id = msg.From
	local language_preference = msg.Tags.LanguagePreference or "en"
	if Patients[patient_id] then
		msg.reply({ Data = "Patient already registered" })
		return
	end
	Patients[patient_id] = {
		patient_id = patient_id,
		consultation_history = {},
		language_preference = language_preference,
		registration_date = msg.Timestamp,
	}
	msg.reply({ Data = "Patient registered successfully" })
end)

-- UnregisterPatient handler
Handlers.add("UnregisterPatient", { Action = "UnregisterPatient" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local patient_id = msg.From
	if not Patients[patient_id] then
		msg.reply({ Data = "Patient not found" })
		return
	end
	Patients[patient_id] = nil
	msg.reply({ Data = "Patient unregistered successfully" })
end)

-- RegisterDoctor handler
Handlers.add("RegisterDoctor", { Action = "RegisterDoctor" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local doctor_id = msg.From
	local specialty_type = msg.Tags.SpecialtyType or ""
	local language_preference = msg.Tags.LanguagePreference or "en"
	if Doctors[doctor_id] then
		msg.reply({ Data = "Doctor already registered" })
		ao.log("Doctor already registered")
		return
	end
	Doctors[doctor_id] = {
		doctor_id = doctor_id,
		specialty_type = specialty_type,
		language_preference = language_preference,
		registration_date = msg.Timestamp,
	}
	msg.reply({ Data = "Doctor registered successfully, awaiting staking" })
end)

-- UnregisterDoctor handler
Handlers.add("UnregisterDoctor", { Action = "UnregisterDoctor" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local doctor_id = msg.From
	if not Doctors[doctor_id] then
		msg.reply({ Data = "Doctor not found" })
		ao.log("Doctor not found")
		return
	end
	local doctor = Doctors[doctor_id]
	local stake_amount = doctor.stake
	-- Return stake to doctor
	if stake_amount > 0 and USDToken ~= "" then
		ao.send({
			Target = USDToken,
			Action = "Transfer",
			Recipient = doctor_id,
			Quantity = tostring(stake_amount),
			Reason = "Unregistration from platform",
		})
	end
	Doctors[doctor_id] = nil
	msg.reply({ Data = "Doctor unregistered successfully" })
end)

-- SpawnConsultation handler
Handlers.add("Create", { Action = "Create" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	print("Sending spawn command")
	if not Payments[msg.From] then
		msg.reply({
			Data = "You don't have USDA in the protocol, transfer atleast "
				.. CONSULTATION_FEE
				.. " to start a consultation",
		})
		return
	end
	if Payments[msg.From] < CONSULTATION_FEE then
		msg.reply({ Data = "You don't have enough USDA in the protocol to create a consultation" })
		return
	end
	Payments[msg.From] = Payments[msg.From] - CONSULTATION_FEE
	ao.spawn(ao.env.Module.Id, { Tags = { Authority = ao.authorities[1] } })
	print("Receiving output from spawn command")
	-- local childProcessId = Receive({ Action = "Spawned" }).Process
	local childProcessId = "GMuj6KTp4RQLfRa9P-6tSv3MIbV5GY1FBJ-E9fr9gV4"
	print("childProcessId: " .. childProcessId)
	PatientConsultations[msg.From] = PatientConsultations[msg.From] or {}
	local newConsultation = {
		consultation_id = childProcessId,
		patient_id = msg.From,
		doctor_id = nil,
	}
	table.insert(PatientConsultations[msg.From], newConsultation)
	ConsultationsIndexed[childProcessId] = newConsultation
	-- TODO: Send message after splitting this up
	local reply = json.encode({
		success = "Consultation Created Successfully",
		consultation = newConsultation,
	})
	msg.reply({ Data = reply })
end)

Handlers.add("StakeUSDA", { Action = "StakeUSDA" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not Doctors[msg.From] then
		msg.reply({ Data = "Register as a doctor to stake" })
		return
	end
	if not Payments[msg.From] then
		msg.reply({ Data = "Transfer some USDA to the protocol to stake" })
		return
	end
	local amount = tonumber(msg.Tags.Quantity)
	if Payments[msg.From] < amount then
		msg.reply({ Data = "You don't have upto " .. msg.Tags.Quantity .. " in the protocol, send more to stake more" })
	end
	-- Doctor logic to add stake here
	Doctors[msg.From].stake = Doctors[msg.From].stake or 0
	Payments[msg.From] = Payments[msg.From] - amount
	Doctors[msg.From].stake = Doctors[msg.From].stake + amount
	ao.send({
		Target = msg.Sender,
		Action = "Payment-Received",
		Data = "Successfully staked " .. msg.Quantity,
	})
end)

Handlers.add("AcceptUSDA", function(Msg)
	return Msg.Action == "Credit-Notice" and Msg.From == USDToken and "continue"
end, function(msg)
	updatePayments(msg.Sender, msg.Quantity)
	ao.send({
		Target = msg.Sender,
		Action = "Payment-Received",
	})
end)

Handlers.add("AssignDoctor", { Action = "RequestDoctorAssignment" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	local entropy = tostring(os.time())
	local callbackData = {
		consultation = msg.Tags.ConsultationId,
		doctorSpecialty = msg.Tags.DoctorSpecialty,
		triageSummary = msg.Tags.TriageSummary,
		language = msg.Tags.TranslatedLanguage,
	}
	local count, doctors = getDoctorsBySpecialty(Doctors, callbackData.doctorSpecialty)
	if count == 0 then
		msg.reply({ Data = "There are no available doctors for selection at this time" })
		return
	end
	local selectedDoctor = selectWeightedRandomDoctor(doctors, entropy)
	if selectedDoctor then
		ao.send({
			Target = callbackData.consultation,
			Action = "UpdateDoctor",
			Tags = {
				DoctorID = selectedDoctor.doctor_id,
			},
		})
		DoctorConsultations[selectedDoctor.doctor_id] = DoctorConsultations[selectedDoctor.doctor_id] or {}
		table.insert(DoctorConsultations[selectedDoctor.doctor_id], callbackData.consultation)
		notifyUser(
			selectedDoctor.doctor_id,
			"You have been assigned to the Consultation with Consultation Id "
				.. callbackData.consultation
				.. "The triage summary so far is: "
				.. callbackData.triageSummary,
			"{}"
		)
		local messageContent = "You have been assigned the doctor with the id "
			.. selectedDoctor.doctor_id
			.. " your triage summary is "
			.. callbackData.triageSummary
		local newMessage = {
			SenderID = TRIAGE_AGENT,
			Timestamp = os.time(),
			SourceLanguage = callbackData.language,
			SourceContent = messageContent,
			TargetLanguage = callbackData.language,
			TargetContent = messageContent,
		}
		local triageDoctorSelectionNotification = {
			Target = ao.id,
			Action = "AddMessage",
			tags = newMessage,
		}
		ao.send(triageDoctorSelectionNotification)
		msg.reply({ Data = "Doctor assigned successfully" })
	else
		msg.reply({ Data = "Error in doctor selection process" })
	end
end)

Handlers.add("WithdrawUSDA", { Action = "WithdrawUSDA" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if Payments[msg.Sender] == nil or Payments[msg.Sender] == 0 then
		msg.reply({ Data = "You don't have USDA in the protocol" })
		return
	end
	local amountToSend = tostring(Payments[msg.Sender])
	Payments[msg.Sender] = 0
	ao.send({
		Target = USDToken,
		Action = "Transfer",
		Recipient = msg.Sender,
		Quantity = amountToSend,
		Reason = "USDA withdrawal from the platform",
	})
	msg.reply({ Data = "Successfully completed USDA transfer" })
end)

Handlers.add("AddNotification", { Action = "AddNotification" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	addNotification(msg)
	msg.reply({ Data = "Successfully notified the user" })
end)

Handlers.add("GetUSDABalance", { Action = "GetUSDABalance" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not Payments[msg.From] then
		local reply = json.encode({ balance = nil })
		msg.reply({ Data = reply })
		return
	end

	local reply = json.encode({ balance = Payments[msg.From] })
	msg.reply({ Data = reply })
end)

Handlers.add("GetDoctorDetails", { Action = "GetDoctorDetails" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not Doctors[msg.From] then
		local reply = json.encode({ error = "Doctor not found for this account" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(Doctors[msg.From])
	msg.reply({ Data = reply })
end)

Handlers.add("GetPatientDetails", { Action = "GetPatientDetails" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not Patients[msg.From] then
		local reply = json.encode({ error = "Patient not found for this account" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(Patients[msg.From])
	msg.reply({ Data = reply })
end)

Handlers.add("GetUserNotifications", { Action = "GetUserNotifications" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not Notifications[msg.From] then
		local reply = json.encode({ error = "No notifications found for this account" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(Notifications[msg.From])
	msg.reply({ Data = reply })
end)

Handlers.add("GetPatientConsultations", { Action = "GetPatientConsultations" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not PatientConsultations[msg.From] then
		local reply = json.encode({ error = "No consultations found for this patient" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(PatientConsultations[msg.From])
	msg.reply({ Data = reply })
end)

Handlers.add("GetDoctorConsultations", { Action = "GetDoctorConsultations" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if not DoctorConsultations[msg.From] then
		local reply = json.encode({ error = "No consultations found for this doctor" })
		msg.reply({ Data = reply })
		return
	end
	local reply = json.encode(DoctorConsultations[msg.From])
	msg.reply({ Data = reply })
end)

Handlers.add("RequestTokens", { Action = "RequestTokens" }, function(msg)
	if not hasSetup() then
		msg.reply({ Data = "Setup Error: The process has not been setup" })
		return
	end
	if not hasPermissions(msg.From, {}) then
		msg.reply({ Data = "Permission Error: You do not have permissions to interact with this handler" })
		return
	end
	if Drops[msg.From] then
		msg.reply({ Data = "You have already gotten tokens from this faucet" })
		return
	end
	local amountToSend = tostring(DROP_SIZE)
	Drops[msg.From] = true
	ao.send({
		Target = USDToken,
		Action = "Transfer",
		Recipient = msg.From,
		Quantity = amountToSend,
		Reason = "USDA request for demo",
	})
	msg.reply({ Data = "Successfully completed USDA transfer" })
end)
