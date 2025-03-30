'use client'

import { useState, useCallback } from 'react'

// Function to get API key from localStorage (client-side only)
export const getApiKey = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('geminiApiKey')
}

// Hook to use AI with simple fetch
export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completion, setCompletion] = useState<string>('')
  
  const apiKey = getApiKey()
  const hasApiKey = !!apiKey

  // Function to generate text
  const generateText = useCallback(async (prompt: string) => {
    if (!apiKey) {
      setError('API key not found. Please set your Google Gemini API key in settings.')
      return ''
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate text')
      }
      
      const data = await response.json()
      setCompletion(data.response)
      return data.response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate text'
      setError(message)
      return ''
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  return {
    generateText,
    completion,
    isLoading,
    error,
    hasApiKey
  }
}