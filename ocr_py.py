import easyocr
import sys
import os
import io
import logging
import warnings
import cv2

# ปรับให้เงียบที่สุด
warnings.filterwarnings("ignore")
logging.getLogger('easyocr').setLevel(logging.ERROR)

# Force UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    try:
        # Initialize EasyOCR
        reader = easyocr.Reader(['th', 'en'], gpu=False, verbose=False)
        print("READY")
        sys.stdout.flush()
    except Exception as e:
        print(f"INITIALIZATION_ERROR:{str(e)}")
        sys.stdout.flush()
        return

    while True:
        line = sys.stdin.readline()
        if not line:
            break
        
        image_path = line.strip()
        if not image_path or image_path == "EXIT":
            break

        try:
            if os.path.exists(image_path):
                img = cv2.imread(image_path)
                if img is None:
                    print("ERROR:Could not read image")
                else:
                    # 1. เพิ่มความละเอียดเป็น 1000px (เพื่อความแม่นยำที่สูงขึ้น)
                    height, width = img.shape[:2]
                    target_width = 1000
                    if width > target_width:
                        scale = target_width / width
                        img = cv2.resize(img, (target_width, int(height * scale)), interpolation=cv2.INTER_LANCZOS4)

                    # 2. ปรับ Parameter เพื่อความแม่นยำ
                    # mag_ratio=1.5 (ค่ามาตรฐาน) ช่วยให้อ่านตัวหนังสือเล็กๆ ได้ดีขึ้นมาก
                    # paragraph=True ช่วยจัดกลุ่มข้อความให้เป็นระเบียบ
                    result = reader.readtext(
                        img, 
                        detail=0, 
                        paragraph=True,
                        mag_ratio=1.5,
                        contrast_ths=0.2
                    )
                    
                    output_text = "\n".join(result)
                    print(f"RESULT:{output_text}")
            else:
                print("ERROR:File not found")
        except Exception as e:
            print(f"ERROR:{str(e)}")
        
        print("---END---")
        sys.stdout.flush()

if __name__ == "__main__":
    main()
