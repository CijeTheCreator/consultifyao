"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ProgressBar from "./progress-bar"
import LanguageSelection from "./language-selection"
import UserTypeSelection from "./user-type-selection"
import NameInput from "./name-input"
import { sendAOSMessage } from "@/lib/aos-lib"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isRegistering, setIsRegistering] = useState(false)
  const router = useRouter()
  const [onboardingData, setOnboardingData] = useState({
    language: "",
    userType: "" as "doctor" | "patient" | "",
    name: "",
    specialization: "",
  })

  const totalSteps = 3

  const handleLanguageNext = (language: string) => {
    setOnboardingData((prev) => ({ ...prev, language }))
    setCurrentStep(2)
  }

  const handleUserTypeNext = (userType: "doctor" | "patient") => {
    setOnboardingData((prev) => ({ ...prev, userType }))
    setCurrentStep(3)
  }

  const handleNameComplete = async (name: string, specialization?: string) => {
    const finalData = { ...onboardingData, name, specialization: specialization || "" }
    setIsRegistering(true)

    try {
      // Store user metadata to localStorage
      const userMetadata = {
        language: finalData.language,
        role: finalData.userType,
        name: finalData.name,
        specialization: finalData.specialization,
        onboarding_completed: true,
        id: crypto.randomUUID(), // Generate a unique ID for the user
      }
      
      localStorage.setItem('userMetadata', JSON.stringify(userMetadata))

      // Register with AOS
      const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS
      if (!orchestratorProcess) {
        throw new Error('Orchestrator process ID not configured')
      }

      const tags = [
        { name: 'Action', value: finalData.userType === 'doctor' ? 'RegisterDoctor' : 'RegisterPatient' },
        { name: 'LanguagePreference', value: finalData.language }
      ]

      if (finalData.userType === 'doctor' && finalData.specialization) {
        tags.push({ name: 'SpecialtyType', value: finalData.specialization })
      }

      const result = await sendAOSMessage({
        process: orchestratorProcess,
        tags
      })

      if (result === false) {
        throw new Error('Failed to communicate with AOS network')
      }

      if (result.includes('successfully')) {
        // Navigate to appropriate landing page
        if (finalData.userType === 'doctor') {
          router.push('/doctor-dashboard')
        } else {
          router.push('/patient-dashboard')
        }
        onComplete()
      } else {
        throw new Error(result || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }


  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 },
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  }

  return (
    <div className="relative">
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="language"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <LanguageSelection onNext={handleLanguageNext} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="usertype"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <UserTypeSelection onNext={handleUserTypeNext} />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="name"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <NameInput onNext={handleNameComplete} userType={onboardingData.userType} isLoading={isRegistering} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
