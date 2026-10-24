import { localApiOnly } from './local-api-guard.mjs';
import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

// Initialize Gemini SDK (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Configure Multer for file uploads (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  const app = express();
app.use('/api', localApiOnly(() => PORT));
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API endpoints
  app.post("/api/analyze-call", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      console.log(`Received audio file: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

      // Base64 encode the audio file for Gemini inlineData
      const base64AudioString = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "audio/mp3";

      const audioPart = {
        inlineData: {
          mimeType: mimeType,
          data: base64AudioString,
        },
      };

      // Step 1: Transcribe using gemini-3.5-transcribe
      console.log("Transcribing audio...");
      const transcribeResponse = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            audioPart,
            { text: "Transcribe this sales call audio. Diarize the speakers as 'Speaker A' and 'Speaker B' (or 'Salesperson' and 'Client'). Please output the full transcript." }
          ]
        },
      });

      const transcript = transcribeResponse.text;
      if (!transcript) {
        throw new Error("Failed to get transcript from model.");
      }
      
      console.log("Transcription complete. Length:", transcript.length);

      // Step 2: Analyze sentiment and generate coaching card using gemini-3.1-pro-preview
      console.log("Analyzing transcript...");
      
      const analysisSchema = {
        type: Type.OBJECT,
        properties: {
          sentiment: {
            type: Type.ARRAY,
            description: "A series of data points tracking engagement throughout the call (approx 10-15 points).",
            items: {
              type: Type.OBJECT,
              properties: {
                timeCode: {
                  type: Type.STRING,
                  description: "Approximate time or segment of the call (e.g., '0:00', 'Introduction', 'Segment 1')",
                },
                engagementLevel: {
                  type: Type.NUMBER,
                  description: "Engagement level from 0 to 100",
                },
                speaker: {
                  type: Type.STRING,
                  description: "The speaker at this point (e.g., 'Speaker A')",
                }
              },
              required: ["timeCode", "engagementLevel", "speaker"]
            }
          },
          coaching: {
            type: Type.OBJECT,
            properties: {
              doneWell: {
                type: Type.ARRAY,
                description: "3 things the salesperson did well",
                items: { type: Type.STRING }
              },
              missedOpportunities: {
                type: Type.ARRAY,
                description: "3 missed opportunities for the salesperson",
                items: { type: Type.STRING }
              }
            },
            required: ["doneWell", "missedOpportunities"]
          }
        },
        required: ["sentiment", "coaching"]
      };

      const analyzeResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze the following transcript from a sales call.\n\nTranscript:\n${transcript}\n\nTask: Provide sentiment/engagement data points across the call and a Coaching Card listing 3 things the salesperson did well and 3 missed opportunities.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        }
      });

      const analysisRaw = analyzeResponse.text;
      if (!analysisRaw) {
         throw new Error("Failed to get analysis from model.");
      }
      
      const analysis = JSON.parse(analysisRaw);

      res.json({
        transcript,
        analysis
      });

    } catch (error: any) {
      console.error("Error analyzing call:", error);
      res.status(500).json({ error: error.message || "Failed to analyze call" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
