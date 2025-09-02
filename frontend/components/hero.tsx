"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import GradientWrapper from "./gradientwrapper"
import NavLink from "./navlink"
import { useWallet } from "@/hooks/use-wallet"
import { sendAOSMessage } from "@/lib/aos-lib"
import OnboardingFlow from "./onboarding/onboarding-flow"

const Hero = () => {
  const { checkLogin, activeAddress } = useWallet()
  const router = useRouter()
  const [isCheckingDetails, setIsCheckingDetails] = useState(false)
  const [userType, setUserType] = useState<"doctor" | "patient" | "new" | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const ORCHESTRATOR_PROCESS = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS || "your-process-id"
  console.log(ORCHESTRATOR_PROCESS)

  const handleConnectWallet = () => {
    checkLogin()
  }

  const checkUserDetails = async (address: string) => {
    setIsCheckingDetails(true)

    try {
      // Send concurrent messages to check both doctor and patient details
      const [doctorResult, patientResult] = await Promise.all([
        sendAOSMessage({
          process: ORCHESTRATOR_PROCESS,
          tags: [{ name: "Action", value: "GetDoctorDetails" }]
        }),
        sendAOSMessage({
          process: ORCHESTRATOR_PROCESS,
          tags: [{ name: "Action", value: "GetPatientDetails" }]
        })
      ])

      // Parse results
      let doctorData = null
      let patientData = null

      if (doctorResult && doctorResult !== false) {
        try {
          doctorData = JSON.parse(doctorResult)
        } catch (e) {
          console.error("Failed to parse doctor result:", e)
        }
      }

      if (patientResult && patientResult !== false) {
        try {
          patientData = JSON.parse(patientResult)
        } catch (e) {
          console.error("Failed to parse patient result:", e)
        }
      }

      // Determine user type based on results
      const isDoctorNotFound = doctorData?.error?.includes("not found")
      const isPatientNotFound = patientData?.error?.includes("not found")

      if (isDoctorNotFound && isPatientNotFound) {
        // Both not found - new user needs onboarding
        setUserType("new")
        setShowOnboarding(true)
      } else if (!isDoctorNotFound) {
        // Doctor found
        setUserType("doctor")
      } else if (!isPatientNotFound) {
        // Patient found
        setUserType("patient")
      }
    } catch (error) {
      console.error("Error checking user details:", error)
      // On error, assume new user needs onboarding
      setUserType("new")
      setShowOnboarding(true)
    } finally {
      setIsCheckingDetails(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // The onboarding flow itself handles navigation to the dashboard
    // So we don't need to do anything else here
  }

  // Check user details when wallet connects
  useEffect(() => {
    if (activeAddress && !isCheckingDetails && userType === null) {
      // First check if user has completed onboarding locally
      const userMetadata = JSON.parse(localStorage.getItem('userMetadata') || '{}')
      if (userMetadata.onboarding_completed) {
        // User has completed onboarding, redirect to appropriate dashboard
        if (userMetadata.role === 'doctor') {
          router.push('/doctor-dashboard')
          return
        } else if (userMetadata.role === 'patient') {
          router.push('/patient-dashboard')
          return
        }
      }
      
      // If no local onboarding data, check with AOS
      checkUserDetails(activeAddress)
    }
  }, [activeAddress])

  return (
    <section className="min-h-screen flex items-center justify-center">
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="w-full h-full py-8">
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          </div>
        </div>
      )}

      <GradientWrapper wrapperClassName="inset-0" className="custom-screen text-gray-600 w-full">
        <div className="space-y-5 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl text-gray-800 font-extrabold mx-auto sm:text-6xl">
            Connect with doctors, no matter the <span className=" bg-clip-text text-transparent bg-gradient-to-r from-[#9867F0] to-[#ED4E50]">language</span>
          </h1>
          <p className="max-w-xl mx-auto">Built on AO, the decentralized supercomputer of the future — bringing doctors and patients together with verifiable AI translations stored on Arweave</p>

          {activeAddress ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-x-2 text-green-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.47a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Wallet Connected
              </div>

              {isCheckingDetails ? (
                <div className="flex items-center justify-center gap-x-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking details...
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 font-mono">
                    {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                  </p>
                  {userType && userType !== "new" && (
                    <div className="flex items-center justify-center gap-x-3 font-medium text-sm">
                      <button
                        onClick={() => {
                          if (userType === 'doctor') {
                            router.push('/doctor-dashboard')
                          } else if (userType === 'patient') {
                            router.push('/patient-dashboard')
                          }
                        }}
                        className="flex items-center gap-x-2 text-white bg-green-600 hover:bg-green-500 active:bg-green-700 py-2.5 px-4 text-center rounded-full duration-150"
                      >
                        Go to Dashboard
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <NavLink
                        href="#cta"
                        className="flex items-center gap-x-2 text-gray-700 hover:text-gray-900"
                        scroll={false}
                      >
                        Docs
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </NavLink>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-x-3 font-medium text-sm">
              <button
                onClick={handleConnectWallet}
                className="flex items-center gap-x-2 text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 py-2.5 px-4 text-center rounded-full duration-150"
              >
                Connect Wallet
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
              <NavLink
                href="#cta"
                className="flex items-center gap-x-2 text-gray-700 hover:text-gray-900"
                scroll={false}
              >
                Docs
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </NavLink>
            </div>
          )}
        </div>
      </GradientWrapper>
    </section>
  )
}

export default Hero
