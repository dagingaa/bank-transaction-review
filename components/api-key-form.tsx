'use client'

import { useState, useEffect } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card } from "./ui/card"
import { SaveIcon, EyeIcon, EyeOffIcon } from "lucide-react"

export function ApiKeyForm() {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('geminiApiKey')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save API key to localStorage
    localStorage.setItem('geminiApiKey', apiKey)
    setIsSaved(true)
    
    // Reset the saved indicator after 3 seconds
    setTimeout(() => {
      setIsSaved(false)
    }, 3000)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-medium">Google Gemini API Key</h3>
        <p className="text-sm text-muted-foreground">
          Enter your Google Gemini API key to enable AI features. The key is stored only in your browser.
        </p>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Gemini API key"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
              className="ml-2"
            >
              {showApiKey ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button type="submit">
          {isSaved ? (
            <>Saved!</>
          ) : (
            <>
              <SaveIcon className="mr-2 h-4 w-4" />
              Save API Key
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}