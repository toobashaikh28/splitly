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

// POST /api/ai/scan-receipt  (multipart/form-data, field name "receipt")
router.post("/scan-receipt", upload.single("receipt"), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        message: "AI bill scan isn't configured — add ANTHROPIC_API_KEY to your server .env, or use manual entry.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image uploaded" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mediaType = req.file.mimetype; // e.g. "image/jpeg"

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(502).json({ message: "The AI extraction service returned an error. Try manual entry instead." });
    }

    const data = await response.json();
    const textBlock = data.content?.find((block) => block.type === "text");
    if (!textBlock) {
      return res.status(502).json({ message: "AI response had no readable content" });
    }

    let extracted;
    try {
      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      extracted = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON:", textBlock.text);
      return res.status(502).json({ message: "Couldn't parse the receipt. Try manual entry instead." });
    }

    res.json(extracted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error scanning receipt" });
  }
});

export default router;
