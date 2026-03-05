const express = require('express');
const vision = require('@google-cloud/vision');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = 3001;

// Setup Google Vision Client
const client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, 'vision-key.json'),
});

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Setup Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/scan', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        console.log('--- Processing New Document ---');

        // Step 1: Get Raw Text from Vision (Fast fallback and anchor)
        const [visionResult] = await client.documentTextDetection(req.file.buffer);
        const rawText = visionResult.fullTextAnnotation ? visionResult.fullTextAnnotation.text : '';

        // Step 2: Use Gemini for Advanced Interpretation (Handwriting & Structure)
        const prompt = `You are an expert OCR assistant for Thai warehouse documents. 
    Analyze the image of a "Material Withdrawal Slip" (ใบเบิกสินค้า) and extract the data into JSON.
    
    The document might be handwritten or printed. 
    
    Extract:
    1. date: The date of withdrawal (Thai or International format)
    2. items: An array of objects { name, amount, unit }
    
    Rules:
    - Return ONLY valid JSON.
    - If a field is missing, use null or empty string.
    - Translate or normalize units to Thai if possible (เช่น ชิ้น, อัน, กล่อง).
    
    JSON Structure:
    {
      "date": "DD/MM/YYYY",
      "items": [
        { "name": "ชื่อสินค้า", "amount": 10, "unit": "ชุด" }
      ]
    }`;

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            },
        };

        let data = {
            date: '',
            items: [],
            rawText: rawText
        };

        try {
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const aiText = response.text();
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const aiData = JSON.parse(jsonMatch[0]);
                data.date = aiData.date || '';
                data.items = aiData.items || [];
                console.log('Gemini extraction successful');
            }
        } catch (aiErr) {
            console.error('Gemini Error, falling back to basic parsing:', aiErr.message);
            // Fallback heuristic logic (original)
            const lines = rawText.split('\n');
            lines.forEach(line => {
                const match = line.match(/(.+)\s+(\d+)\s*(ชิ้น|อัน|แพ็ค|ถุง|ขวด)?/i);
                if (match && match[1].length > 2) {
                    data.items.push({
                        name: match[1].trim(),
                        amount: match[2],
                        unit: match[3] || ''
                    });
                }
                if (!data.date && line.includes('/')) data.date = line.trim();
            });
        }

        // Save to local JSON file for log
        const scansDir = path.join(__dirname, 'scans');
        if (!fs.existsSync(scansDir)) fs.mkdirSync(scansDir);
        const fileName = `scan-${Date.now()}.json`;
        fs.writeFileSync(path.join(scansDir, fileName), JSON.stringify(data, null, 2));

        data.serverFile = fileName;
        res.json(data);
    } catch (error) {
        console.error('Processing Error:', error);
        res.status(500).json({ error: 'Failed to process document', details: error.message });
    }
});

// Template Management
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir);

app.post('/api/templates', (req, res) => {
    try {
        const { name, data } = req.body;
        if (!name || !data) return res.status(400).json({ error: 'Missing name or data' });

        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        fs.writeFileSync(path.join(templatesDir, `${safeName}.json`), JSON.stringify(data, null, 2));
        res.json({ success: true, name: safeName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/templates', (req, res) => {
    try {
        const files = fs.readdirSync(templatesDir);
        const templates = files.map(f => {
            const content = JSON.parse(fs.readFileSync(path.join(templatesDir, f)));
            return { id: f.replace('.json', ''), name: content.templateName || f, data: content };
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Demo OCR Server (with Gemini) running at http://localhost:${port}`);
});
