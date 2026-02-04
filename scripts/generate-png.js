const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function convert() {
    const svgPath = path.join(__dirname, '../public/img/logo.svg');
    const pngPath = path.join(__dirname, '../public/img/logo.png');

    console.log(`Reading SVG from: ${svgPath}`);

    try {
        const image = await loadImage(svgPath);
        console.log(`Image loaded. Width: ${image.width}, Height: ${image.height}`);

        // Use 512x512 if dimensions are not detected (sometimes happens with SVG)
        const width = image.width || 512;
        const height = image.height || 512;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0, width, height);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(pngPath, buffer);
        console.log(`Successfully created logo.png at ${pngPath}`);
    } catch (err) {
        console.error('Failed to convert SVG to PNG:', err);
        process.exit(1);
    }
}

convert();
