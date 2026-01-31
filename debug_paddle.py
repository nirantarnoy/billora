from paddleocr import PaddleOCR
import inspect

try:
    print("Inspecting PaddleOCR.__init__ arguments:")
    sig = inspect.signature(PaddleOCR.__init__)
    for name, param in sig.parameters.items():
        print(f" - {name}: {param.default}")
except Exception as e:
    print(f"Error inspecting: {e}")

try:
    print("\nAttempting basic initialization...")
    ocr = PaddleOCR()
    print("Success with no args")
except Exception as e:
    print(f"Failed with no args: {e}")
