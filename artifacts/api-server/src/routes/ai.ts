import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/ai/generate-description", requireAuth, async (req, res) => {
  const { productName, category, keywords, tone = "professional" } = req.body as {
    productName: string;
    category?: string;
    keywords?: string;
    tone?: string;
  };

  if (!productName) {
    res.status(400).json({ error: "productName is required" });
    return;
  }

  const toneGuide: Record<string, string> = {
    professional: "formal, trustworthy, and business-like",
    casual: "friendly, conversational, and approachable",
    luxury: "premium, elegant, and aspirational",
    fun: "playful, energetic, and exciting",
  };

  const prompt = `Write a compelling product description for a WhatsApp store product.

Product Name: ${productName}
${category ? `Category: ${category}` : ""}
${keywords ? `Keywords to include: ${keywords}` : ""}
Tone: ${toneGuide[tone] ?? toneGuide.professional}

Return a JSON object with:
- "description": a detailed product description (2-3 sentences, ~80 words)
- "shortDescription": a brief one-line description (~15 words) for quick display

Only return valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch {
    res.json({ description: content, shortDescription: content.slice(0, 100) });
  }
});

router.post("/ai/pricing-suggestion", requireAuth, async (req, res) => {
  const { productName, category, description, currency } = req.body as {
    productName: string;
    category?: string;
    description?: string;
    currency: string;
  };

  if (!productName || !currency) {
    res.status(400).json({ error: "productName and currency are required" });
    return;
  }

  const prompt = `Suggest a competitive retail price for a product in a WhatsApp online store.

Product: ${productName}
${category ? `Category: ${category}` : ""}
${description ? `Description: ${description}` : ""}
Currency: ${currency}

Consider typical market prices for this type of product.
Return a JSON object with:
- "suggestedPrice": a single number (the recommended price)
- "priceRange": an object with "min" and "max" numbers showing the competitive range
- "reasoning": a brief 1-2 sentence explanation

Only return valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch {
    res.json({ suggestedPrice: 0, priceRange: { min: 0, max: 0 }, reasoning: content });
  }
});

router.post("/ai/enhance-image", requireAuth, async (req, res) => {
  const { productName, category, style = "clean_white" } = req.body as {
    productName: string;
    category?: string;
    style?: string;
  };

  if (!productName) {
    res.status(400).json({ error: "productName is required" });
    return;
  }

  const styleDescriptions: Record<string, string> = {
    clean_white: "on a clean white background, professional product photography, studio lighting, sharp focus",
    lifestyle: "lifestyle product photo, natural setting, warm ambient lighting, aspirational mood",
    studio: "professional studio photography, dramatic lighting, dark background, luxury feel",
    minimal: "minimalist flat lay photography, pastel background, top-down view, clean aesthetic",
  };

  const styleDesc = styleDescriptions[style] ?? styleDescriptions.clean_white;
  const prompt = `Professional e-commerce product photo of ${productName}${category ? ` (${category})` : ""}, ${styleDesc}, suitable for an online store, high quality`;

  const buffer = await generateImageBuffer(prompt, "1024x1024");
  const b64 = buffer.toString("base64");
  const imageUrl = `data:image/png;base64,${b64}`;

  res.json({ imageUrl, b64_json: b64 });
});

export default router;
