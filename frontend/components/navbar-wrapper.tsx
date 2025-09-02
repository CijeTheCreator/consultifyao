"use client"

import { useState, useEffect } from "react"
import Navbar from "./navbar"

interface User {
  id: string
  name: string
  email?: string
  language: string
  role: "doctor" | "patient"
  specialization?: string
}

export default function NavbarWrapper() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get user metadata from localStorage
    const userMetadata = JSON.parse(localStorage.getItem('userMetadata') || '{}')
    
    if (userMetadata.name && userMetadata.onboarding_completed) {
      setUser({
        id: userMetadata.id,
        name: userMetadata.name,
        email: "", // Not used in AOS version
        language: userMetadata.language,
        role: userMetadata.role,
        specialization: userMetadata.specialization
      })
    }
  }, [])

  const handleSignOut = () => {
    // Clear localStorage and redirect to hero
    localStorage.removeItem('userMetadata')
    window.location.href = '/hero'
  }

  return <Navbar user={user} onSignOut={handleSignOut} />
}