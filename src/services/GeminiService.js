const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeWithGemini(filePath) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("[Gemini] GEMINI_API_KEY is missing, skipping AI audit.");
            return null;
        }

        // Use model from .env or fallback to a stable default
        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        const imageData = fs.readFileSync(filePath);
        const imagePart = {
            inlineData: {
                data: Buffer.from(imageData).toString("base64"),
                mimeType: "image/jpeg"
            },
        };

        const prompt = `You are a professional accountant and document auditor. Analyze the provided document image and extract information into a valid JSON object.
        
        TASKS:
        1. Identify the document type: BANK_SLIP, RECEIPT, or TAX_INVOICE.
        2. Extract all relevant data fields.
        3. Audit the structure: Is it a standard official document? Are the vendor's Tax ID and company address valid/present?
        4. Detect potential forgery: Check for irregular fonts, misaligned text, or logical inconsistencies in the slip.
        
        OUTPUT FORMAT (JSON ONLY):
        {
          "type": "BANK_SLIP" | "RECEIPT" | "TAX_INVOICE",
          "confidence_score": 0.0 to 1.0,
          "data": {
            "trans_id": "string",
            "datetime": "ISO8601 string",
            "amount": number,
            "sender": { "name": "string", "bank": "string", "account_no": "string" },
            "receiver": { "name": "string", "bank": "string", "account_no": "string" },
            "vendor": { "name": "string", "tax_id": "string", "address": "string" },
            "items": [
              { "name": "string", "qty": number, "price": number, "total": number }
            ],
            "vat": number,
            "total": number
          },
          "audit_result": {
            "is_standard_structure": boolean,
            "is_valid_vendor_info": boolean,
            "forgery_detected": boolean,
            "forgery_reason": "string",
            "audit_remark": "string"
          }
        }
        
        Note: If any field is unavailable, set it to null. If you are not sure about the accuracy, lower the confidence_score. Respond ONLY with the JSON block.`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn("[Gemini] Could not find JSON in response.");
            return null;
        }

        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        if (err.message.includes('429')) {
            console.warn("[Gemini] Quota exceeded (429). Falling back to standard OCR.");
        } else {
            console.error("[Gemini] Error:", err.message);
        }
        return null; // Return null so OcrService can fallback quietly
    }
}

module.exports = { analyzeWithGemini };
