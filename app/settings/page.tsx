import { ApiKeyForm } from "@/components/api-key-form";
import { InfoIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto py-8 px-4">
      <div className="w-full">
        <h1 className="font-bold text-3xl mb-4">Settings</h1>
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mb-6">
          <InfoIcon size="16" strokeWidth={2} />
          Configure your AI settings here. Your API keys are stored securely in your browser.
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="font-bold text-xl mb-4">AI Configuration</h2>
          <ApiKeyForm />
        </div>
        
        <div>
          <h2 className="font-bold text-xl mb-4">About AI Features</h2>
          <div className="prose prose-sm dark:prose-invert">
            <p>
              This application uses Google Gemini to provide AI features. 
              You'll need to provide your own API key to use these features.
            </p>
            <p>
              Get a key at{" "}
              <a 
                href="https://ai.google.dev/" 
                target="_blank" 
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}