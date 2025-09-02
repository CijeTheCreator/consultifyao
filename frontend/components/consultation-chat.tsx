"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Pill, Languages, Copy, Shield, CheckCircle, XCircle } from "lucide-react"
import type { User } from "@/lib/types"
import PrescriptionModal from "./prescription-modal"
import PrescriptionCard from "./prescription-card"
import { sendAOSMessage } from "@/lib/aos-lib"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ConsultationChatProps {
  consultationId: string
  currentUser: User
  onBack: () => void
  fromAITriage?: boolean
}

interface AOSMessage {
  message_id: string
  sender: string
  timestamp: string
  translatedContent: string
  translatedLanguage: string
  originalContent: string
  originalLanguage: string
  attestation?: string
}

interface ConsultationDetails {
  patient_id?: string
  doctor_id?: string
  state: "TRIAGE" | "DOCTOR" | "PRESCRIPTION"
  created_at?: string
  patient_language?: string
  doctor_language?: string
}

// Translation object
const translations = {
  en: {
    loading: "Loading...",
    patient: "patient",
    doctor: "doctor",
    connectedViaAI: "Connected via AI Triage",
    typeMessage: "Type your message...",
    sendPrescription: "Send Prescription",
    welcomeMessage: "You've been connected to your doctor. Your symptoms have been reviewed.",
    failedToFetch: "Failed to fetch messages:",
    failedToSend: "Failed to send message:",
    failedToSendTyping: "Failed to send typing indicator:",
    failedToMarkRead: "Failed to mark message as read:",
    failedToSendPrescription: "Failed to send prescription:",
    otherUser: "Other User",
    translating: "Translating..."
  },
  fr: {
    loading: "Chargement...",
    patient: "patient",
    doctor: "médecin",
    connectedViaAI: "Connecté via Triage IA",
    typeMessage: "Tapez votre message...",
    sendPrescription: "Envoyer l'ordonnance",
    welcomeMessage: "Vous avez été connecté à votre médecin. Vos symptômes ont été examinés.",
    failedToFetch: "Échec de la récupération des messages:",
    failedToSend: "Échec de l'envoi du message:",
    failedToSendTyping: "Échec de l'envoi de l'indicateur de saisie:",
    failedToMarkRead: "Échec du marquage du message comme lu:",
    failedToSendPrescription: "Échec de l'envoi de l'ordonnance:",
    otherUser: "Autre utilisateur",
    translating: "Traduction..."
  }
}

// Attestation Dialog Component
function AttestationDialog({
  isOpen,
  onClose,
  attestation,
  messageId
}: {
  isOpen: boolean
  onClose: () => void
  attestation?: string
  messageId: string
}) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)

  const handleCopy = () => {
    if (attestation) {
      navigator.clipboard.writeText(attestation)
      toast.success("Attestation copied to clipboard")
    }
  }

  const handleVerify = async () => {
    if (!attestation) return

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const response = await fetch('http://72.46.85.207:8734/~cc@1.0/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: attestation
      })

      const result = await response.json()
      setVerificationResult(result === true)

      if (result === true) {
        toast.success("Message attestation verified successfully")
      } else {
        toast.error("Message attestation verification failed")
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error("Failed to verify attestation")
      setVerificationResult(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const truncatedAttestation = attestation ?
    attestation.length > 100 ?
      `${attestation.substring(0, 100)}...` :
      attestation
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Message Attestation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {attestation ? (
            <>
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm font-mono break-all">
                  {truncatedAttestation}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="flex-1"
                >
                  {isVerifying ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>

              {verificationResult !== null && (
                <div className={`flex items-center space-x-2 p-2 rounded ${verificationResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                  {verificationResult ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {verificationResult ? 'Attestation verified' : 'Attestation verification failed'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No attestation available for this message
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ConsultationChat({ consultationId, currentUser, onBack, fromAITriage }: ConsultationChatProps) {
  const [messages, setMessages] = useState<AOSMessage[]>([])
  const [input, setInput] = useState("")
  const [consultationDetails, setConsultationDetails] = useState<ConsultationDetails | null>(null)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [showAttestationDialog, setShowAttestationDialog] = useState(false)
  const [selectedMessageAttestation, setSelectedMessageAttestation] = useState<{ attestation?: string, messageId: string } | null>(null)
  const triageProcessId = process.env.NEXT_PUBLIC_TRIAGE_PROCESS || ""

  // Get translations based on user role
  const t = currentUser.role === "doctor" ? translations.en : translations.fr

  // Get user languages
  const currentUserLanguage = currentUser.role === "doctor" ? "en" : "fr"

  // Get wallet address
  const getWalletAddress = async () => {
    try {
      if ((window as any).arweaveWallet) {
        const address = await (window as any).arweaveWallet.getActiveAddress()
        setWalletAddress(address)
        return address
      }
    } catch (error) {
      console.error("Failed to get wallet address:", error)
    }
    return ""
  }

  // Fetch consultation details from AOS
  const fetchConsultationDetails = async () => {
    try {
      const result = await sendAOSMessage({
        process: consultationId,
        tags: [{ name: "Action", value: "GetConsultationDetails" }]
      })

      if (result) {
        const details = JSON.parse(result) as ConsultationDetails
        setConsultationDetails(details)

        // Set other participant based on consultation details
        if (details.patient_id && details.doctor_id) {
          const isPatient = currentUser.id === details.patient_id
          setOtherParticipant({
            id: isPatient ? details.doctor_id : details.patient_id,
            name: isPatient ? "Dr. Assistant" : "Patient",
            role: isPatient ? "doctor" : "patient"
          })
        } else if (details.patient_id && details.state === "TRIAGE") {
          // Only patient is present, in triage mode
          setOtherParticipant({
            id: triageProcessId,
            name: "Triage Agent",
            role: "triage"
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch consultation details:", error)
    }
  }

  // Fetch messages from AOS
  const fetchMessages = async () => {
    try {
      const result = await sendAOSMessage({
        process: consultationId,
        tags: [{ name: "Action", value: "GetMessages" }]
      })

      if (result) {
        let aosMessages: AOSMessage[]

        try {
          const parsedResult = JSON.parse(result)

          // Check if result has an error
          if (parsedResult.error) {
            console.error("AOS Error:", parsedResult.error)
            return
          }

          // Ensure we have an array
          if (Array.isArray(parsedResult)) {
            aosMessages = parsedResult
          } else {
            console.warn("Expected array but got:", typeof parsedResult, parsedResult)
            return
          }
        } catch (parseError) {
          console.error("Failed to parse AOS response:", parseError, "Raw result:", result)
          return
        }

        // Get current pending messages to preserve them
        const currentPendingMessages = messages.filter(msg => pendingMessages.has(msg.message_id))

        // Create a comparison excluding pending messages
        const nonPendingCurrentIds = messages
          .filter(msg => !pendingMessages.has(msg.message_id))
          .map(m => m.message_id)
          .sort()
        const newMessageIds = aosMessages.map(m => m.message_id).sort()

        // Only update if the non-pending message IDs are different
        if (JSON.stringify(nonPendingCurrentIds) !== JSON.stringify(newMessageIds)) {
          // Merge AOS messages with pending messages, avoiding duplicates
          const mergedMessages = [...aosMessages]

          // Add pending messages that aren't already in AOS messages
          currentPendingMessages.forEach(pendingMsg => {
            if (!aosMessages.some(aosMsg => aosMsg.message_id === pendingMsg.message_id)) {
              mergedMessages.push(pendingMsg)
            }
          })

          // Sort by timestamp to maintain order
          mergedMessages.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))

          // Debug: Log sender IDs to help identify the issue
          console.log("Current User ID:", currentUser.id)
          console.log("Messages with senders:", mergedMessages.map(m => ({ id: m.message_id, sender: m.sender, content: m.originalContent })))

          setMessages(mergedMessages)
        }

        // Set loading to false after first successful fetch
        setIsLoadingMessages(false)
      }
    } catch (error) {
      console.error(t.failedToFetch, error)
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (fromAITriage && messages.length > 0) {
      // Show a brief welcome message about the transition
      const welcomeMessage = t.welcomeMessage
      // This could be shown as a system message or notification
    }
  }, [fromAITriage, messages, t.welcomeMessage])

  // Handle input change (simplified - no typing indicators)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Send message via AOS
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !consultationDetails) return

    const currentWalletAddress = walletAddress || await getWalletAddress()
    const messageId = Date.now().toString() + currentWalletAddress
    const messageContent = input.trim()

    // Determine user's language based on role and consultation details
    const sourceLanguage = currentUser.role === "patient" ?
      consultationDetails.patient_language || "fr" :
      consultationDetails.doctor_language || "en"

    const targetLanguage = currentUser.role === "patient" ?
      consultationDetails.doctor_language || "en" :
      consultationDetails.patient_language || "fr"

    // Add pending message to UI immediately
    const pendingMessage: AOSMessage = {
      message_id: messageId,
      sender: currentWalletAddress,
      timestamp: Date.now().toString(),
      translatedContent: messageContent,
      translatedLanguage: sourceLanguage,
      originalContent: messageContent,
      originalLanguage: sourceLanguage
    }

    // Mark as pending and add to messages
    setPendingMessages(prev => new Set(prev).add(messageId))
    setMessages(prev => [...prev, pendingMessage])
    setInput("")

    try {
      const result = await sendAOSMessage({
        process: consultationId,
        data: messageContent,
        tags: [
          { name: "Action", value: "Message-Response" },
          { name: "MessageID", value: messageId },
          { name: "ConsultationID", value: consultationId },
          { name: "SenderID", value: currentWalletAddress },
          { name: "SourceLanguage", value: sourceLanguage },
          { name: "TargetLanguage", value: targetLanguage }
        ],
        // signer: (window as any).arweaveWallet
      })

      if (result) {
        // Message was processed successfully - remove from pending
        setPendingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(messageId)
          return newSet
        })

        // Wait before refreshing to allow AOS processing
        setTimeout(() => {
          fetchMessages()
        }, 1000)
      }
    } catch (error) {
      console.error(t.failedToSend, error)
      // Remove the pending message on failure
      setMessages(prev => prev.filter(msg => msg.message_id !== messageId))
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    }
  }

  const sendPrescription = async (medications: any[]) => {
    try {
      const pharmacistProcessId = process.env.NEXT_PUBLIC_PHARMACIST_PROCESS || ""

      if (!pharmacistProcessId) {
        console.error("Pharmacist process ID not found in environment variables")
        toast.error("Pharmacist service not available")
        return
      }

      let successCount = 0
      let failCount = 0

      const sourceLanguage = currentUser.role === "patient" ?
        consultationDetails?.patient_language || "fr" :
        consultationDetails?.doctor_language || "en"

      // Send each medication as a separate prescription
      for (const medication of medications) {
        const startTimestamp = new Date(medication.startDate).getTime()
        const endTimestamp = new Date(medication.endDate).getTime()

        const result = await sendAOSMessage({
          process: pharmacistProcessId,
          tags: [
            { name: "Action", value: "AddPrescription" },
            { name: "PatientID", value: consultationDetails?.patient_id || "" },
            { name: "ConsultationID", value: consultationId },
            { name: "DrugName", value: medication.drug_name },
            { name: "Frequency", value: medication.frequency.toString() },
            { name: "PatientLanguage", value: sourceLanguage },
            { name: "Start", value: startTimestamp.toString() },
            { name: "End", value: endTimestamp.toString() }
          ]
        })

        if (result) {
          successCount++
        } else {
          failCount++
          console.error(`Failed to add prescription for ${medication.drug_name}`)
        }
      }

      // Show appropriate toast notification
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully sent ${successCount} prescription${successCount > 1 ? 's' : ''}`)
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Sent ${successCount} prescription${successCount > 1 ? 's' : ''}, ${failCount} failed`)
      } else {
        toast.error("Failed to send prescriptions. Please try again.")
      }

    } catch (error) {
      console.error(t.failedToSendPrescription, error)
      toast.error("Failed to send prescriptions. Please try again.")
    }
  }

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load consultation details and initial messages
  useEffect(() => {
    getWalletAddress()
    fetchConsultationDetails()
    fetchMessages()

    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [consultationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Helper function to determine if message is from current user
  const isCurrentUserMessage = (message: AOSMessage) => {
    return message.sender === walletAddress
  }

  // Helper function to get sender name for display
  const getSenderName = (message: AOSMessage) => {
    if (message.sender === walletAddress) {
      return currentUser.name
    }

    if (message.sender === triageProcessId) {
      return "Triage Agent"
    }

    if (consultationDetails?.doctor_id && message.sender === consultationDetails.doctor_id) {
      return currentUser.role === "patient" ? "Dr. Assistant" : "Doctor"
    }

    if (consultationDetails?.patient_id && message.sender === consultationDetails.patient_id) {
      return currentUser.role === "doctor" ? "Patient" : "Patient"
    }

    return t.otherUser
  }

  // Helper function to get message content (original for current user, translated for others)
  const getMessageContent = (message: AOSMessage) => {
    if (message.sender === walletAddress) {
      // Show original content for current user's messages
      return message.originalContent
    } else {
      // Show translated content for other users' messages
      return message.translatedContent || message.originalContent
    }
  }

  // Helper function to get message status icon
  const getMessageStatusIcon = (message: AOSMessage) => {
    if (message.sender !== walletAddress) return null

    // Show checkmark if message is no longer pending
    if (!pendingMessages.has(message.message_id)) {
      return <span className="text-green-500 text-xs">✓</span>
    }

    return <span className="text-gray-400 text-xs">⏳</span>
  }

  // Handle message click to show attestation
  const handleMessageClick = (message: AOSMessage) => {
    setSelectedMessageAttestation({
      attestation: message.attestation,
      messageId: message.message_id
    })
    setShowAttestationDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20">
      <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {otherParticipant?.name?.charAt(0).toUpperCase() || (currentUser.role === "patient" ? "Dr" : "P")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {currentUser.role === "patient" ? "Dr. " : ""}
                  {otherParticipant?.name || t.loading}
                </CardTitle>
                {otherParticipant?.specialization && (
                  <p className="text-sm text-gray-600">{otherParticipant.specialization}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{t[currentUser.role as keyof typeof t] || currentUser.role}</Badge>
              {consultationDetails?.state && (
                <div className={`text-xs px-2 py-1 rounded ${consultationDetails.state === "TRIAGE" ? "text-orange-600 bg-orange-50" :
                  consultationDetails.state === "DOCTOR" ? "text-green-600 bg-green-50" :
                    "text-purple-600 bg-purple-50"
                  }`}>
                  {consultationDetails.state}
                </div>
              )}
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center space-x-1">
                <Languages className="w-3 h-3" />
                <span>{currentUserLanguage.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">{t.loading}</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.message_id} className={`flex ${isCurrentUserMessage(message) ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUserMessage(message) ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {getSenderName(message).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`rounded-lg px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity ${isCurrentUserMessage(message) ? "bg-blue-500 text-white" : "bg-white border text-gray-900"
                        }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start space-x-2">
                        <p className="text-sm flex-1">{getMessageContent(message)}</p>
                        {!isCurrentUserMessage(message) &&
                          message.translatedContent &&
                          message.translatedContent !== message.originalContent && (
                            <Languages className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {new Date(parseInt(message.timestamp)).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t">
          <div className="flex w-full space-x-2">
            <form onSubmit={sendMessage} className="flex flex-1 space-x-2">
              <Input value={input} onChange={handleInputChange} placeholder={t.typeMessage} className="flex-1" />
              <Button type="submit" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {currentUser.role === "doctor" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPrescriptionModal(true)}
                className="whitespace-nowrap"
              >
                <Pill className="w-4 h-4 mr-2" />
                {t.sendPrescription}
              </Button>
            )}
          </div>

          <PrescriptionModal
            isOpen={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            onSend={sendPrescription}
            patientName={otherParticipant?.name || "Patient"}
          />

          <AttestationDialog
            isOpen={showAttestationDialog}
            onClose={() => setShowAttestationDialog(false)}
            attestation={selectedMessageAttestation?.attestation}
            messageId={selectedMessageAttestation?.messageId || ""}
          />
        </CardFooter>
      </Card>
    </div>
  )
}
