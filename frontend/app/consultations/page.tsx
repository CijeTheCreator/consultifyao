"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, MessageCircle, Clock } from "lucide-react"

interface User {
  id: string
  name: string
  role: string
  language: string
  specialization?: string
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const loadData = async () => {
      // Get user data from localStorage
      const userMetadata = JSON.parse(localStorage.getItem('userMetadata') || '{}')
      if (userMetadata.name && userMetadata.onboarding_completed) {
        setCurrentUser({
          id: userMetadata.id,
          name: userMetadata.name,
          role: userMetadata.role,
          language: userMetadata.language,
          specialization: userMetadata.specialization
        })
      }

      // Get consultations data from localStorage
      const storedData = localStorage.getItem('consultationsData')
      if (storedData) {
        const data = JSON.parse(storedData)
        let transformedConsultations = []

        if (userMetadata.role === 'doctor') {
          // For doctors: data is an array of consultation IDs
          if (Array.isArray(data)) {
            transformedConsultations = data.map((consultationId: string) => ({
              id: consultationId,
              consultation_id: consultationId,
              patient_id: null, // We don't have patient info from just the ID
              doctor_id: userMetadata.id,
              title: `Consultation ${consultationId.slice(0, 8)}...`,
              status: "active",
              createdAt: new Date().toISOString(),
              patientName: "Patient",
              doctorName: null,
              doctorSpecialization: "General Medicine"
            }))
          }
        } else {
          // For patients: data is an array of consultation objects
          if (Array.isArray(data)) {
            transformedConsultations = data.map((consultation: any) => ({
              id: consultation.consultation_id,
              consultation_id: consultation.consultation_id,
              patient_id: consultation.patient_id,
              doctor_id: consultation.doctor_id || null,
              title: `Consultation ${consultation.consultation_id.slice(0, 8)}...`,
              status: consultation.doctor_id ? "active" : "pending",
              createdAt: new Date().toISOString(),
              patientName: null,
              doctorName: consultation.doctor_id ? "Doctor" : null,
              doctorSpecialization: "General Medicine"
            }))
          }
        }

        setConsultations(transformedConsultations)
        // Clear the stored data
        localStorage.removeItem('consultationsData')
      }
      
      setLoading(false)
    }

    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getOtherParticipantName = (consultation: any) => {
    if (!currentUser) return "Unknown"
    return currentUser.role === "patient"
      ? consultation.doctorName || "Doctor"
      : consultation.patientName || "Patient"
  }

  const handleConsultationClick = (consultationId: string) => {
    window.location.href = `/consultation/${consultationId}`
  }

  const handleBack = () => {
    const dashboardPath = currentUser?.role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard'
    window.location.href = dashboardPath
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultations...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">User not found</p>
          <button 
            onClick={() => window.location.href = '/hero'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentUser.role === "patient" ? "Your Consultations" : "Patient Consultations"}
            </h1>
            <p className="text-gray-600">
              {consultations.length} consultation{consultations.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {/* Consultations List */}
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No consultations yet</h3>
              <p className="text-gray-600">
                {currentUser.role === "patient"
                  ? "Start your first consultation to connect with a doctor"
                  : "No patient consultations assigned yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const otherParticipantName = getOtherParticipantName(consultation)
              return (
                <Card
                  key={consultation.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleConsultationClick(consultation.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {otherParticipantName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {consultation.title}
                            </h3>
                            <Badge className={getStatusColor(consultation.status)}>{consultation.status}</Badge>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <span>
                                {currentUser.role === "patient" ? "Dr. " : ""}
                                {otherParticipantName}
                              </span>
                              {currentUser.role === "patient" && consultation.doctorSpecialization && (
                                <>
                                  <span>•</span>
                                  <span>{consultation.doctorSpecialization}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Started {new Date(consultation.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
