import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please manage it via settings/secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Reusable helper to execute generateContent with automatic retry on 503/high demand and automatic model fallback
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
) {
  const maxRetries = 3;
  let delay = 350; // initial delay in ms
  let lastError: any = null;

  // We try models in sequence if they are overloaded or error out with 503 or 429 rate limit
  const modelsToTry = Array.from(new Set([
    params.model,
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ]));

  for (const model of modelsToTry) {
    let delay = 350; // reset delay for every model
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Calling Gemini API (Model: ${model}, Attempt: ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err.message || String(err)).toLowerCase();
        const errStatus = err.status || err.code;
        const isUnavailable = 
          errStatus === 503 || 
          errStatus === "503" || 
          errStatus === 429 ||
          errStatus === "429" ||
          errMsg.includes("503") || 
          errMsg.includes("429") || 
          errMsg.includes("unavailable") || 
          errMsg.includes("high demand") || 
          errMsg.includes("rate limit") || 
          errMsg.includes("overloaded") ||
          errMsg.includes("resource exhausted") ||
          errMsg.includes("quota") ||
          errMsg.includes("spike");

        if (isUnavailable) {
          console.warn(`Gemini API overloaded or limited (Model: ${model}). Retrying in ${delay}ms... Error:`, errMsg);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          // Propagation of structural or bad parameter errors immediately
          throw err;
        }
      }
    }
    console.warn(`Model ${model} failed after ${maxRetries} attempts due to unavailability. Trying fallback model...`);
  }

  throw lastError || new Error("Yapay zeka analiz motoru şu an çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin.");
}

function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();
  // Remove markdown block wraps if present
  if (cleaned.startsWith("```")) {
    const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: search for first '{' and last '}'
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJSON = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJSON);
      } catch (innerErr) {
        throw new Error("Yapay zeka yanıtı geçerli bir veri formatına dönüştürülemedi: " + rawText);
      }
    }
    throw new Error("Yapay zeka yanıtı geçerli bir JSON yapısına sahip değil: " + rawText);
  }
}

// 1. Core API Route: Analyze social media post
app.post("/api/analyze", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Lütfen analiz edilecek bir içerik girin." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Sen vekil bir sosyal medya içerik analisti, dezenformasyon dedektifi ve medya okuryazarlığı liderisin. 
Kullanıcının paylaştığı metni titizlikle analiz et. 
Gönderideki manipülatif ton, kurgu, clickbait, yanlış yönlendirme veya dezenformasyonu süz ve siber güvenlik odaklı değerlendirmeler ortaya koy.
Analizini Türkçe olarak, ç, ş, ğ, ü, ö, ı karakterlerine ve Türkçe yazım kurallarına %100 uyarak gerçekleştir.
Teknik jargondan kesinlikle kaçın, anlaşılır, ikna edici ve eğitsel bir dil kullan.

DÖNDÜRÜLECEK FORMAT: Sadece ve sadece geçerli bir JSON formatında şu anahtarları içeren bir nesne döndürmelisin:
{
  "hedefKitle": "bu içerik kime hitap ediyor, yaş grubu, ilgi alanı, olası demografik profili nedir? Başlığı '🎯 Hedef Kitle' olmadan, doğrudan akıcı ve kısa bir paragraf halinde yaz.",
  "dilTonu": "içerğin dili resmi mi, nötr mü? Dil tonunun amacını açıklayan, başlığı '💬 Dil Tonu' olmadan doğrudan akıcı ve kısa bir paragraf.",
  "manipulatifUnsurlar": "Korku yayma, aciliyet hissi oluşturma gibi unsurlar var mı? Başlığı '🚫 Manipülatif Unsurlar' olmadan doğrudan akıcı ve kısa bir paragraf.",
  "genelDegerlendirme": "İçeriğin güvenilirlik ve etik açıdan özeti. Başlığı '⚖️ Genel Değerlendirme' olmadan doğrudan akıcı ve kısa bir paragraf.",
  "soruSorma": "Bu analiz hakkında sormak istediğin bir şey var mı?",
  "guvenilirlikSkoru": 65
}
Yanıtında JSON dışında hiçbir metin, açıklama veya öbek bulunmamalıdır. JSON bloğunu her zaman standart \`\`\`json ve \`\`\` arasına alarak dön. Her alan birer paragraftan oluşmalı ve asla madde madde (-) listeler barındırmamalıdır.`;

    const userPrompt = `Aşağıdaki sosyal medya gönderisini analiz et:
Gönderi İçeriği:
"""
${content}
"""`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Yapay zekadan boş yanıt döndü.");
    }

    const result = cleanAndParseJSON(text);

    // Google Search elements are removed as per user request
    result.groundedNews = [];

    return res.json(result);
  } catch (error: any) {
    console.error("Analiz hatası:", error);
    return res.status(500).json({ error: error.message || "Analiz sırasında bir sorun oluştu." });
  }
});

// 2. Chat API Route: Keep discussing the analysis
app.post("/api/ask", async (req, res) => {
  try {
    const { content, analysis, question, history } = req.body;
    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({ error: "Lütfen bir soru girin." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Sen uzman bir sosyal medya içerik analisti ve medya okuryazarlığı liderisin.
Kullanıcı senin az önce yaptığın analizi inceliyor. Orijinal gönderi ve yaptığın analiz aşağıdadır.
Kullanıcının bu analiz hakkında sorduğu soruya Türkçe, son derece akıcı, samimi ama profesyonel, anlaşılır bir üslupla cevap ver.
Yazım kurallarına, ç, ş, ğ, ü, ö, ı gibi Türkçe karakterlere dikkat et. Teknik jargondan kaçın. Cevabını 2-3 kısa paragrafta tut. Madde işaretleri kullanmamaya çalış.`;

    const instructionsText = `Orijinal Paylaşım:
"""
${content}
"""

Daha önce Yapılan Analiz:
- Hedef Kitle: ${analysis?.hedefKitle || ""}
- Dil Tonu: ${analysis?.dilTonu || ""}
- Manipülatif Unsurlar: ${analysis?.manipulatifUnsurlar || ""}
- Genel Değerlendirme: ${analysis?.genelDegerlendirme || ""}

Lütfen kullanıcının şu sorusuna en uygun yanıtı ver:
"${question}"`;

    const chatHistory = history 
      ? history.map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        }))
      : [];

    chatHistory.push({
      role: "user",
      parts: [{ text: instructionsText }]
    });

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: chatHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text;
    return res.json({ reply: reply?.trim() || "" });
  } catch (error: any) {
    console.error("Soru cevaplama hatası:", error);
    return res.status(500).json({ error: error.message || "Soruya cevap verilirken bir hata oluştu." });
  }
});

// Setup Vite or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build service configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running at HTTP host 0.0.0.0 on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupVite().catch((err) => {
    console.error("Failed to boot Express+Vite application:", err);
  });
}

export default app;
