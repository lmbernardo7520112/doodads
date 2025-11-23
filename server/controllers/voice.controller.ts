import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import VoiceLog from "../models/VoiceLog";
import fs from "fs";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Using gemini-flash-latest as it is explicitly listed in the user's available models
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export const processVoiceCommand = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No audio file provided" });
            return;
        }

        console.log(`🎤 Processing audio command. Size: ${req.file.size} bytes, Mime: ${req.file.mimetype}`);

        // Convert buffer to base64 for Gemini
        const audioBase64 = req.file.buffer.toString("base64");

        const prompt = `
      You are a helpful barber shop assistant for "Barbearia Estilo Fino".
      Listen to this audio command from a customer.
      
      Your tasks:
      1. Transcribe the user's intent accurately.
      2. Extract structured data: action (agendar, consultar_horario, cancelar, outros), service, date (YYYY-MM-DD), time (HH:mm).
      3. Generate a polite, natural text response in Portuguese (Brazil) to speak back to the user.
      
      Return ONLY a JSON object with this structure (no markdown):
      {
        "text": "Your polite response here",
        "intent": {
          "acao": "agendar" | "consultar" | "cancelar" | "outros",
          "servico": "string" | null,
          "data": "YYYY-MM-DD" | null,
          "hora": "HH:mm" | null
        },
        "transcription": "User's exact words"
      }
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: audioBase64
                }
            }
        ]);

        const responseText = result.response.text();
        console.log("🤖 Gemini Response:", responseText);

        // Clean up markdown code blocks if present
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedResponse = JSON.parse(jsonString);

        // Log to Database
        await VoiceLog.create({
            usuario: (req as any).user?._id, // Assuming auth middleware populates this, or null if public
            textoReconhecido: parsedResponse.transcription,
            intencao: parsedResponse.intent,
            sucesso: true,
            dataHora: new Date()
        });

        res.json({
            text: parsedResponse.text,
            intent: parsedResponse.intent,
            transcription: parsedResponse.transcription
        });

    } catch (error: any) {
        console.error("❌ Error processing voice command:", error);

        // Log failure
        await VoiceLog.create({
            usuario: (req as any).user?._id,
            textoReconhecido: "",
            intencao: {},
            sucesso: false,
            erro: error.message || "Unknown error",
            dataHora: new Date()
        });

        res.status(500).json({
            error: "Failed to process voice command",
            details: error.message
        });
    }
};
