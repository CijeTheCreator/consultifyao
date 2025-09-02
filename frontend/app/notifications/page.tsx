"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, ArrowLeft, Calendar, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { sendAOSMessage } from "@/lib/aos-lib"

interface Notification {
  message: string
  timestamp: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get orchestrator process ID from environment
      const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS
      if (!orchestratorProcess) {
        setError("Orchestrator process not configured")
        return
      }

      // Send AOS message to get notifications
      const result = await sendAOSMessage({
        process: orchestratorProcess,
        tags: [
          { name: "Action", value: "GetUserNotifications" }
        ]
      })

      if (result === false) {
        setError("Failed to fetch notifications")
        return
      }

      if (typeof result === "string") {
        try {
          const parsedResult = JSON.parse(result)

          if (parsedResult.error) {
            // No notifications found - this is normal, not an error
            setNotifications([])
            return
          }

          // Parse notifications and sort by timestamp (newest first)
          const notificationsList: Notification[] = Array.isArray(parsedResult)
            ? parsedResult
            : []

          const sortedNotifications = notificationsList.sort((a, b) =>
            parseInt(b.timestamp) - parseInt(a.timestamp)
          )

          setNotifications(sortedNotifications)
        } catch (parseError) {
          console.error("Error parsing notifications:", parseError)
          setError("Failed to parse notifications")
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    // Convert AO timestamp to readable format
    // This is a simple conversion - you might need to adjust based on AO's timestamp format
    console.log("Timestamp is ", parseInt(timestamp))
    const date = new Date(parseInt(timestamp))
    console.log("Date is ", date.toLocaleString())
    return date.toLocaleString()
  }

  const formatMessage = (message: string) => {
    // Clean up the message text for better readability
    return message.replace(/The triage summary so far is: /, '\n\nTriage Summary: ')
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
            <Bell className="w-8 h-8 text-forest-green mr-3" />
            <h1 className="text-3xl font-bold text-forest-green">Notifications</h1>
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
                <p className="text-sage-green">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Notifications</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button
                  onClick={fetchNotifications}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 text-sage-green/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-forest-green mb-2">No Notifications</h3>
                <p className="text-sage-green">You don't have any notifications at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <motion.div
                  key={`${notification.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-forest-green">
                          Consultation Update
                        </CardTitle>
                        <div className="flex items-center text-sm text-sage-green">
                          {/* <Calendar className="w-4 h-4 mr-1" /> */}
                          {/* {formatTimestamp(notification.timestamp)} */}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-forest-green leading-relaxed whitespace-pre-line">
                        {formatMessage(notification.message)}
                      </p>
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
