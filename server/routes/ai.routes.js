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

// Models. Set GEMINI_MODEL (and optionally GEMINI_FALLBACK_MODEL) in your environment.
const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash";

// Google sometimes answers "high demand" (503) or "slow down" (429). Those are
// temporary, so we retry once, then switch to the fallback model.
const RETRY_STATUSES = new Set([0, 429, 500, 502, 503, 504]); // 0 = network error or timeout
// Statuses worth trying the other model for. 400/401 (bad image or key) fail the same everywhere.
const FALLBACK_STATUSES = new Set([0, 403, 404, 429, 500, 502, 503, 504]);
const BUSY_STATUSES = new Set([429, 503]);
const CALL_TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callOnce(model, body) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body,
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
  });
}

async function askGemini(body) {
  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  const models = fallback && fallback !== primary ? [primary, fallback] : [primary];
  const delay = Number(process.env.GEMINI_RETRY_DELAY_MS ?? 1500);
  let last = { status: 0, text: "" };

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      let response;
      try {
        response = await callOnce(model, body);
      } catch (err) {
        last = { status: 0, text: String(err?.message || err) };
        console.error(`Gemini API error (${model}): network error or timeout:`, last.text);
        if (attempt < 2) await sleep(delay);
        continue;
      }

      if (response.ok) return { ok: true, data: await response.json(), model };

      last = { status: response.status, text: await response.text() };
      console.error(`Gemini API error (${model}):`, response.status, last.text);
      if (RETRY_STATUSES.has(last.status) && attempt < 2) {
        await sleep(delay);
        continue;
      }
      break;
    }
    if (!FALLBACK_STATUSES.has(last.status)) break; // another model won't help
  }
  return { ok: false, ...last };
}

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

    const body = JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            { inline_data: { mime_type: req.file.mimetype, data: req.file.buffer.toString("base64") } },
          ],
        },
      ],
      // Ask for JSON directly; the parser below also copes with stray fences.
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    });

    const result = await askGemini(body);
    if (!result.ok) {
      if (BUSY_STATUSES.has(result.status)) {
        return res.status(503).json({
          message: "The AI service is busy right now. Please try again in a minute, or enter the items by hand.",
        });
      }
      return res.status(502).json({ message: "The AI extraction service returned an error. Try manual entry instead." });
    }

    const data = result.data;
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
