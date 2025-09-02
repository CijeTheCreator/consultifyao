"use client"

import { useState, useEffect } from "react"
import DoctorLandingPage from "@/components/doctor-landing-page"
import NameInputDialog from "@/components/name-input-dialog"
import { sendAOSMessage } from "@/lib/aos-lib"

interface DoctorData {
  doctor_id: string
  specialty_type: string
  language_preference: string
  registration_date: string
}

interface User {
  id: string
  name: string
  language: string
  specialization: string
}

export default function DoctorDashboard() {
  const [user, setUser] = useState<User>({ id: "", name: "", language: "", specialization: "" })
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [tempUserData, setTempUserData] = useState<any>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user metadata from localStorage
        let userMetadata = JSON.parse(localStorage.getItem('userMetadata') || '{}')

        // If localStorage is empty or incomplete, try to restore from AO network
        if (!userMetadata.onboarding_completed) {
          const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS
          if (!orchestratorProcess) {
            throw new Error('Orchestrator process ID not configured')
          }

          // Try to get doctor details from AO network
          const result = await sendAOSMessage({
            process: orchestratorProcess,
            tags: [{ name: 'Action', value: 'GetDoctorDetails' }]
          })

          if (result && result !== 'false' && !result.includes('error')) {
            try {
              const data = JSON.parse(result)
              // If doctor exists in AO network, reconstruct userMetadata
              if (data && !data.error) {
                userMetadata = {
                  id: data.doctor_id || '',
                  name: userMetadata.name || '', // Keep existing name if available
                  language: data.language_preference || 'en',
                  specialization: data.specialty_type || 'General Medicine',
                  role: 'doctor',
                  onboarding_completed: true
                }
                
                // If name is still missing, show name dialog
                if (!userMetadata.name) {
                  setTempUserData(userMetadata)
                  setShowNameDialog(true)
                  setLoading(false)
                  return
                }
                
                // Save restored metadata to localStorage
                localStorage.setItem('userMetadata', JSON.stringify(userMetadata))
              }
            } catch (parseError) {
              console.error('Failed to parse doctor data:', parseError)
            }
          }
        }

        // Final check after potential restoration
        if (!userMetadata.onboarding_completed) {
          setError('User not found or onboarding not completed')
          return
        }
        
        // If name is missing but user is onboarded, show name dialog
        if (!userMetadata.name) {
          setTempUserData(userMetadata)
          setShowNameDialog(true)
          setLoading(false)
          return
        }

        // Verify this is a doctor
        if (userMetadata.role !== 'doctor') {
          setError('Access denied: This page is for doctors only')
          return
        }

        setUser({
          id: userMetadata.id,
          name: userMetadata.name,
          language: userMetadata.language,
          specialization: userMetadata.specialization || 'General Medicine'
        })

        // Fetch additional doctor details from AOS if not already fetched
        const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS
        if (!orchestratorProcess) {
          throw new Error('Orchestrator process ID not configured')
        }

        const result = await sendAOSMessage({
          process: orchestratorProcess,
          tags: [{ name: 'Action', value: 'GetDoctorDetails' }]
        })
        if (result && result !== 'false' && !result.includes('error')) {
          try {
            const data = JSON.parse(result)
            setDoctorData(data)
          } catch (parseError) {
            console.error('Failed to parse doctor data:', parseError)
          }
        }
      } catch (err) {
        console.error('Error fetching doctor data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch doctor data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleNameSubmit = (name: string) => {
    if (tempUserData) {
      const completedUserData = {
        ...tempUserData,
        name: name
      }
      
      // Save to localStorage
      localStorage.setItem('userMetadata', JSON.stringify(completedUserData))
      
      // Update user state
      setUser({
        id: completedUserData.id,
        name: completedUserData.name,
        language: completedUserData.language,
        specialization: completedUserData.specialization
      })
      
      // Hide dialog and continue loading
      setShowNameDialog(false)
      setTempUserData(null)
      
      // Continue with fetching doctor data
      fetchDoctorDetails(completedUserData)
    }
  }

  const fetchDoctorDetails = async (userMetadata: any) => {
    try {
      const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS
      if (!orchestratorProcess) {
        throw new Error('Orchestrator process ID not configured')
      }

      const result = await sendAOSMessage({
        process: orchestratorProcess,
        tags: [{ name: 'Action', value: 'GetDoctorDetails' }]
      })

      if (result && result !== 'false' && !result.includes('error')) {
        try {
          const data = JSON.parse(result)
          setDoctorData(data)
        } catch (parseError) {
          console.error('Failed to parse doctor data:', parseError)
        }
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewConsultations = async () => {
    try {
      setLoading(true)
      const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS
      if (!orchestratorProcess) {
        throw new Error('Orchestrator process ID not configured')
      }

      const result = await sendAOSMessage({
        process: orchestratorProcess,
        tags: [{ name: 'Action', value: 'GetDoctorConsultations' }]
      })
      console.log("Consultations data: ", result)
      if (result && result !== 'false') {
        // Check if the result is the "no consultations" message
        if (result.includes('No consultations found for this doctor')) {
          // Handle no consultations gracefully - pass empty array
          localStorage.setItem('consultationsData', JSON.stringify([]))
          window.location.href = '/consultations'
          return
        }
        
        // Check for other error messages
        if (result.includes('error')) {
          setError(result)
          return
        }

        try {
          const data = JSON.parse(result)
          if (data.error) {
            if (data.error === "No consultations found for this doctor") {
              // Handle no consultations gracefully - pass empty array
              localStorage.setItem('consultationsData', JSON.stringify([]))
              window.location.href = '/consultations'
            } else {
              setError(data.error)
            }
          } else {
            // Navigate to consultations page with the data
            localStorage.setItem('consultationsData', JSON.stringify(data))
            window.location.href = '/consultations'
          }
        } catch (parseError) {
          // If it's not valid JSON but not an error, might be a plain text success response
          if (!result.includes('error') && !result.includes('You don\'t have')) {
            localStorage.setItem('consultationsData', JSON.stringify([]))
            window.location.href = '/consultations'
          } else {
            setError('Failed to parse consultations data')
          }
        }
      } else {
        setError(result || 'Failed to fetch consultations')
      }
    } catch (err) {
      console.error('Error fetching consultations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch consultations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading your practice dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
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
    <>
      <NameInputDialog
        isOpen={showNameDialog}
        onSubmit={handleNameSubmit}
        userType="doctor"
      />
      <DoctorLandingPage
        user={user}
        onViewConsultations={handleViewConsultations}
      />
    </>
  )
}
