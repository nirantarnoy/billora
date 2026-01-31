const { readBillTextPython } = require('./vision');
const path = require('path');
const fs = require('fs');

async function testSpeed() {
    console.log("Testing Python OCR Speed...");

    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());

    if (files.length === 0) {
        console.log("No sample image found in uploads/ for testing.");
        process.exit(0);
    }

    const testFile = path.join(uploadsDir, files[0]);
    console.log(`Using sample file: ${testFile}\n`);

    console.log("--- First Call (Model Loading) ---");
    const start1 = Date.now();
    try {
        const text1 = await readBillTextPython(testFile);
        const end1 = Date.now();
        console.log(`Time taken: ${(end1 - start1) / 1000} seconds`);
        console.log(`Result length: ${text1.length} characters`);
    } catch (err) {
        console.error("First call failed:", err.message);
    }

    console.log("\n--- Second Call (Persistent Process) ---");
    const start2 = Date.now();
    try {
        const text2 = await readBillTextPython(testFile);
        const end2 = Date.now();
        console.log(`Time taken: ${(end2 - start2) / 1000} seconds`);
        console.log(`Result length: ${text2.length} characters`);
    } catch (err) {
        console.error("Second call failed:", err.message);
    }

    process.exit(0); // Optional: if you want to close the process
}

testSpeed();
