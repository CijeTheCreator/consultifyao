"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pill, ArrowLeft, Calendar, AlertCircle, Clock, Repeat } from "lucide-react"
import { motion } from "framer-motion"
import { sendAOSMessage } from "@/lib/aos-lib"

interface Prescription {
  endTimestamp: number
  nextReminderTimestamp: number
  consultaiton_id: string  // Note: typo preserved from Lua data structure
  drug_name: string
  patient_id: string
  frequency: number
  startTimestamp: number
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get pharmacist process ID from environment
      const pharmacistProcess = process.env.NEXT_PUBLIC_PHARMACIST_PROCESS
      if (!pharmacistProcess) {
        setError("Pharmacist process not configured")
        return
      }

      // Send AOS message to get prescriptions
      const result = await sendAOSMessage({
        process: pharmacistProcess,
        tags: [
          { name: "Action", value: "GetPrescriptions" }
        ]
      })

      if (result === false) {
        setError("Failed to fetch prescriptions")
        return
      }

      if (typeof result === "string") {
        try {
          const parsedResult = JSON.parse(result)

          // Handle empty array or no prescriptions
          const prescriptionsList: Prescription[] = Array.isArray(parsedResult)
            ? parsedResult
            : []

          // Sort by start timestamp (newest first)
          const sortedPrescriptions = prescriptionsList.sort((a, b) =>
            b.startTimestamp - a.startTimestamp
          )
          console.log(sortedPrescriptions)
          setPrescriptions(sortedPrescriptions)
        } catch (parseError) {
          console.error("Error parsing prescriptions:", parseError)
          setError("Failed to parse prescriptions")
        }
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
      setError("Failed to fetch prescriptions")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    // Convert AO timestamp to readable format
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isActive = (prescription: Prescription) => {
    const now = Date.now()
    return now >= prescription.startTimestamp && now <= prescription.endTimestamp
  }

  const getStatusBadge = (prescription: Prescription) => {
    const active = isActive(prescription)
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${active
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-600'
        }`}>
        {active ? 'Active' : 'Completed'}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-sage-green/10 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4 text-forest-green hover:bg-sage-green/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center">
            <Pill className="w-8 h-8 text-forest-green mr-3" />
            <h1 className="text-3xl font-bold text-forest-green">My Prescriptions</h1>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-forest-green border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sage-green">Loading prescriptions...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Prescriptions</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button
                  onClick={fetchPrescriptions}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : prescriptions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="w-16 h-16 text-sage-green/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-forest-green mb-2">No Prescriptions</h3>
                <p className="text-sage-green">You don't have any prescriptions at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription, index) => (
                <motion.div
                  key={`${prescription.consultaiton_id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CardTitle className="text-lg text-forest-green">
                            {prescription.drug_name}
                          </CardTitle>
                          {getStatusBadge(prescription)}
                        </div>
                        <div className="flex items-center text-sm text-sage-green">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatTimestamp(prescription.startTimestamp)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Repeat className="w-4 h-4 text-olive-green" />
                          <span className="text-sage-green">Frequency:</span>
                          <span className="font-medium text-forest-green">{prescription.frequency}x daily</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-olive-green" />
                          <span className="text-sage-green">Duration:</span>
                          <span className="font-medium text-forest-green">
                            {formatTimestamp(prescription.startTimestamp)} - {formatTimestamp(prescription.endTimestamp)}
                          </span>
                        </div>
                        {prescription.nextReminderTimestamp && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-olive-green" />
                            <span className="text-sage-green">Next reminder:</span>
                            <span className="font-medium text-forest-green">
                              {formatTime(prescription.nextReminderTimestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-sage-green/20">
                        <p className="text-xs text-sage-green">
                          Consultation ID: {prescription.consultaiton_id}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
