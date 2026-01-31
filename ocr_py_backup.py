import easyocr
import sys
import os

# Set logging level to avoid unnecessary messages
import logging
import io

# Force UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Set logging level to avoid unnecessary messages
logging.getLogger('easyocr').setLevel(logging.ERROR)

def perform_ocr(image_path):
    try:
        # Check if file exists
        if not os.path.exists(image_path):
            return f"Error: File not found at {image_path}"
        
        # Initialize reader (Thai and English)
        # verbose=False disables progress bars and downloading messages
        reader = easyocr.Reader(['th', 'en'], gpu=False, verbose=False) 
        result = reader.readtext(image_path, detail=0)

        return "\n".join(result)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        text = perform_ocr(img_path)
        # Print results to stdout for Node.js to catch
        print(text)
    else:
        print("Error: No image path provided")
