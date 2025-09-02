"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { sendAOSMessage } from "@/lib/aos-lib"

export default function FaucetPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null)

  const handleRequestTokens = async () => {
    setIsLoading(true)
    setMessage("")
    setMessageType(null)

    try {
      console.log("Orchestrator: ", process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!)
      const response = await sendAOSMessage({
        process: process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!,
        tags: [
          { name: "Action", value: "RequestTokens" }
        ]
      })
      console.log("Response: ", response)

      if (response === false) {
        setMessage("Failed to request tokens. Please try again.")
        setMessageType("error")
      } else {
        const responseText = response as string
        if (responseText.includes("already gotten tokens")) {
          setMessage("You have already received tokens from this faucet.")
          setMessageType("error")
        } else if (responseText.includes("Successfully completed")) {
          setMessage("Successfully received 50 USDA tokens!")
          setMessageType("success")
          // Refresh the page after 2 seconds to update navbar balances
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } else {
          setMessage("Unexpected response. Please try again.")
          setMessageType("error")
        }
      }
    } catch (error) {
      console.error("Faucet request error:", error)
      setMessage("An error occurred while requesting tokens. Please try again.")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-green via-sage-green to-forest-green pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cream mb-4">USDA Token Faucet</h1>
          <p className="text-lg text-cream/80">
            Get free USDA tokens to try out the Consultify platform
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-sage-green/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-forest-green/10 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-forest-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-forest-green">
              Request USDA Tokens
            </CardTitle>
            <CardDescription className="text-sage-green">
              Click the button below to receive 50 USDA tokens for testing the platform.
              Each wallet can only request tokens once.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {message && (
              <div className={`p-4 rounded-lg border flex items-center space-x-3 ${messageType === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
                }`}>
                {messageType === "success" ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={handleRequestTokens}
                disabled={isLoading}
                size="lg"
                className="bg-forest-green hover:bg-forest-green/90 text-cream px-8 py-3 text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Requesting Tokens...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-5 w-5" />
                    Request 50 USDA
                  </>
                )}
              </Button>
            </div>

            <div className="bg-olive-green/10 p-4 rounded-lg">
              <h3 className="font-semibold text-forest-green mb-2">How it works:</h3>
              <ul className="text-sm text-sage-green space-y-1">
                <li>• Click the button to request 50 USDA tokens</li>
                <li>• Each wallet address can only request tokens once</li>
                <li>• Tokens will be transferred to your connected wallet</li>
                <li>• Use these tokens to try out consultations and other platform features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
