import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Extract the input from the request
    const { prompt } = await req.json();

    // Get API key from request headers
    const apiKey = req.headers.get("X-API-KEY");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

    // Initialize the Google Generative AI client with the API key
    const genAI = createGoogleGenerativeAI({
      apiKey: apiKey,
    });
    const model = genAI.languageModel("gemini-2.0-flash-lite-preview-02-05");

    // Generate a response (non-streaming for simplicity)
    const result = await model.doGenerate({
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 100,
      topP: 0.95,
      topK: 40,
      inputFormat: "prompt",
      mode: {
        type: "regular",
        tools: undefined,
        toolChoice: undefined,
      },
    });

    const response = result.text;

    // Return the response
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in Gemini API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
