=== Billora Standalone Installation Guide ===

1. Database Setup:
   - Ensure MySQL is installed and running.
   - Create a database named 'bill_ocr' (or match the name in .env).
   - Import the provided SQL schema (if any).

2. Configuration:
   - Open .env file with Notepad.
   - Update DB_USER and DB_PASSWORD to match your MySQL credentials.
   - Adjust PORT if needed (Default: 5000).

3. Start Application:
   - Double-click 'billora.exe'.
   - A console window will appear showing the server status.
   - Keep this window open while using the program.

4. Access:
   - Open your web browser (Chrome/Edge).
   - Go to: http://localhost:5000 (or the port you configured).

Troubleshooting:
- If image processing fails, ensure 'canvas.node' is in the same folder as 'billora.exe'.
- If database errors occur, check .env credentials.
