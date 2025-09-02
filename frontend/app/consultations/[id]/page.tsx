"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import ConsultationChat from "@/components/consultation-chat"

interface User {
  id: string
  name: string
  role: string
  language: string
  specialization?: string
}

export default function ConsultationPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const consultationId = params.id as string

  useEffect(() => {
    const loadUser = () => {
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
      setLoading(false)
    }

    loadUser()
  }, [consultationId])

  const handleBack = () => {
    window.location.href = "/consultations"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600 mb-4">Please log in to access consultations.</p>
          <button onClick={() => window.location.href = "/hero"} className="text-blue-600 hover:text-blue-800">
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <ConsultationChat
      consultationId={consultationId}
      currentUser={currentUser}
      onBack={handleBack}
    />
  )
}
