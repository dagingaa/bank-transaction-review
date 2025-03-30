'use client'

// Function to get the Gemini API key from localStorage
export const getGeminiApiKey = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('geminiApiKey')
}

// Function to check if an API key is configured
export const hasGeminiApiKey = (): boolean => {
  return !!getGeminiApiKey()
}