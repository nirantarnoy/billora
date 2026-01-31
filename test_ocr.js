const { readBillTextPython } = require('./vision');
const path = require('path');
const fs = require('fs');

async function testPythonOCR() {
    console.log("Testing Python OCR integration...");

    // Find a sample image in uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        console.error("Uploads directory not found");
        return;
    }

    const files = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());
    if (files.length === 0) {

        console.log("No sample image found in uploads/ for testing.");
        return;
    }

    const testFile = path.join(uploadsDir, files[0]);
    console.log(`Using sample file: ${testFile}`);

    try {
        const text = await readBillTextPython(testFile);
        console.log("--- OCR Result ---");
        console.log(text);
        console.log("------------------");
    } catch (err) {
        console.error("Test Failed:", err.message);
        console.log("\nPossible Fix: Run 'pip install easyocr' manually in your terminal.");
    }
}

testPythonOCR();
