import express from "express";
import multer from "multer";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const EXTRACTION_PROMPT = `You are reading a restaurant or shop receipt image. Extract the line items, tax, and total.

Respond with ONLY valid JSON in this exact shape, nothing else — no markdown fences, no commentary:
{
  "merchant": "string or null if unreadable",
  "items": [{ "name": "string", "price": number }],
  "taxPercent": number or null,
  "taxAmount": number or null,
  "total": number or null
}

If the tax is shown as a flat amount rather than a percent, set taxAmount and leave taxPercent null.
If you cannot read the receipt clearly, return items: [] and merchant: null so the app can fall back to manual entry.`;

// Set GEMINI_MODEL in your environment to use a different model.
const DEFAULT_MODEL = "gemini-3.5-flash";

// POST /api/ai/scan-receipt  (multipart/form-data, field name "receipt")
router.post("/scan-receipt", upload.single("receipt"), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: "AI bill scan isn't configured — add GEMINI_API_KEY to your server .env, or use manual entry.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image uploaded" });
    }
    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ message: "Please upload an image of the receipt" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: EXTRACTION_PROMPT },
                { inline_data: { mime_type: req.file.mimetype, data: base64Image } },
              ],
            },
          ],
          // Ask for JSON directly; the parser below also copes with stray fences.
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res.status(502).json({ message: "The AI extraction service returned an error. Try manual entry instead." });
    }

    const data = await response.json();

    if (data.promptFeedback?.blockReason) {
      console.error("Gemini blocked the request:", data.promptFeedback.blockReason);
      return res.status(502).json({ message: "The AI service couldn't process that image. Try manual entry instead." });
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();
    if (!text) {
      return res.status(502).json({ message: "AI response had no readable content" });
    }

    let extracted;
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      extracted = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON:", text);
      return res.status(502).json({ message: "Couldn't parse the receipt. Try manual entry instead." });
    }

    res.json(extracted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error scanning receipt" });
  }
});

export default router;
