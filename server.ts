import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// Ensure upload temp dir exists
if (!fs.existsSync('/tmp/uploads')) {
  fs.mkdirSync('/tmp/uploads', { recursive: true });
}

const upload = multer({ dest: '/tmp/uploads/' });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Process File and Generate Flashcards
  app.post("/api/process-lecture", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // 1. Upload to Gemini File API
      const geminiFile = await ai.files.upload({
        file: file.path,
        config: { mimeType: file.mimetype },
      });

      const { difficulty, type } = req.body;

      // Clean up the temp file
      fs.unlinkSync(file.path);

      // 2. Prompt Gemini
      const prompt = `You are an expert AI tutor. A user has uploaded a lecture file.
      
Generate a JSON output matching this structure EXACTLY:
{
  "summary": "A detailed 2-paragraph summary of the lecture.",
  "flashcards": [
    {
      "question": "The question based on the lecture.",
      "answer": "The correct answer.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"] // only if type is 'multiple_choice'
    }
  ]
}

Difficulty context: ${difficulty} (Adjust the depth and complexity of the questions accordingly).
Question Type: ${type} (Options: multiple_choice, identification, drag_drop).

Please return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          geminiFile,
          prompt
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const jsonStr = response.text;
      const data = JSON.parse(jsonStr || "{}");

      res.json(data);

    } catch (error) {
      console.error("Error processing lecture:", error);
      res.status(500).json({ error: "Failed to process lecture." });
    }
  });

  // API Route: Chat with AI Tutor
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, summaryContext } = req.body;
      
      const prompt = `You are a helpful AI tutor. The user is reviewing a lecture with the following summary:\n${summaryContext}\n\nAnswer the user's questions clearly and concisely.`;
      
      // We pass the history to gemini
      const history = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: prompt,
        }
      });

      // Send the last message
      const lastMessage = history.pop();
      // Send previous history
      // Note: @google/genai requires setting history during create, or sending all at once.
      // Better way: send history in contents array.
      
      const contents = history.concat([lastMessage]);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to generate chat response." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
