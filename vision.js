const vision = require('@google-cloud/vision');
const { spawn } = require('child_process');
const path = require('path');

const client = new vision.ImageAnnotatorClient();

let pyProcess = null;
let pyReady = false;
let currentResolve = null;
let currentReject = null;
let outputBuffer = '';

function startPythonProcess() {
    if (pyProcess) return;

    const pythonScript = path.join(__dirname, 'ocr_py.py');
    // Using 'python' as requested (ensure it's in PATH)
    pyProcess = spawn('python', [pythonScript]);

    pyProcess.stdout.on('data', (data) => {
        const text = data.toString();

        if (text.includes("READY")) {
            pyReady = true;
            console.log("Python OCR Engine Ready");
        }

        outputBuffer += text;

        if (outputBuffer.includes("---END---")) {
            const parts = outputBuffer.split("---END---");
            const resultPart = parts[0].trim();
            outputBuffer = parts.slice(1).join("---END---");

            if (currentResolve) {
                if (resultPart.startsWith("RESULT:")) {
                    currentResolve(resultPart.substring(7));
                } else if (resultPart.startsWith("ERROR:")) {
                    currentReject(new Error(resultPart.substring(6)));
                } else {
                    currentResolve(resultPart);
                }
                currentResolve = null;
                currentReject = null;
            }
        }
    });

    pyProcess.stderr.on('data', (data) => {
        console.error(`Python OCR Error: ${data}`);
    });

    pyProcess.on('close', (code) => {
        console.log(`Python OCR process exited with code ${code}`);
        pyProcess = null;
        pyReady = false;
        // If it dies during a request, reject it
        if (currentReject) {
            currentReject(new Error("Python process closed unexpectedly"));
            currentResolve = null;
            currentReject = null;
        }
    });
}

// Start the process immediately when the module is loaded
startPythonProcess();

async function readBillText(filePath) {
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;
    return detections.length ? detections[0].description : '';
}

// A simple queue to handle concurrent requests
let processingQueue = Promise.resolve();

async function readBillTextPython(filePath) {
    return new Promise((resolve, reject) => {
        processingQueue = processingQueue.then(async () => {
            try {
                if (!pyProcess) {
                    startPythonProcess();
                }

                // Wait for READY signal if just started
                let attempts = 0;
                while (!pyReady && attempts < 300) { // Increase to 30 seconds for first-run model download
                    await new Promise(r => setTimeout(r, 100));
                    attempts++;
                }

                if (!pyReady) {
                    throw new Error("Python OCR process failed to initialize in time.");
                }

                currentResolve = resolve;
                currentReject = reject;
                outputBuffer = ''; // Clear buffer for new request

                pyProcess.stdin.write(filePath + '\n');
            } catch (err) {
                reject(err);
            }
        });
    });
}

module.exports = { readBillText, readBillTextPython };
