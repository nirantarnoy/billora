require('dotenv').config();
process.env.TZ = 'Asia/Bangkok';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const { readBillText, readBillTextPython } = require('./vision');
const { parseThaiSlip } = require('./parser');
const line = require('@line/bot-sdk');
const fs = require('fs');


const JWT_SECRET = process.env.JWT_SECRET || 'billora-jwt-secret-key-2026';

const app = express();
const EcommerceAPI = require('./utils/ecommerce');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// LINE Configuration
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_CHANNEL_ACCESS_TOKEN',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'YOUR_CHANNEL_SECRET',
};
const lineClient = new line.Client(lineConfig);

// Provide io instance to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());

// LINE Webhook must be BEFORE express.json() because it needs raw body for signature validation
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleLineEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session Config
app.use(session({
  secret: 'billora-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Auth Middleware (Web & API)
const isAuthenticated = (req, res, next) => {
  // Check Session (Web)
  if (req.session.user) return next();

  // Check JWT (API/Mobile)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Store decoded user info in req.user
      // For compatibility with previous code that uses req.session.user
      if (!req.session) req.session = {};
      req.session.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'TOKEN_INVALID', message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
  }

  // No auth found
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' });
  }
  res.redirect('/login');
};

const hasPermission = (module) => {
  return (req, res, next) => {
    const user = req.session.user || req.user;
    if (user && user.permissions && user.permissions[module]) {
      return next();
    }
    res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
  };
};

// DB Connection Pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bill_ocr',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00'
});

db.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00'");
});



const upload = multer({ dest: 'uploads/' });

async function handleLineEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'image') {
    // Handle "link" command
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim();
      if (text.toLowerCase().startsWith('link ')) {
        const username = text.split(' ')[1];
        const lineUserId = event.source.userId;
        try {
          const [result] = await db.execute('UPDATE users SET line_user_id = ? WHERE username = ?', [lineUserId, username]);
          if (result.affectedRows > 0) {
            return lineClient.replyMessage(event.replyToken, { type: 'text', text: `✅ ผูกบัญชีกับผู้ใช้ ${username} สำเร็จ` });
          } else {
            return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ ไม่พบผู้ใช้ชื่อ ${username}` });
          }
        } catch (err) {
          return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ เกิดข้อผิดพลาด: ${err.message}` });
        }
      }
    }
    return Promise.resolve(null);
  }

  const { message, source } = event;
  const lineUserId = source.userId;

  // Find user by line_user_id
  const [users] = await db.execute('SELECT id FROM users WHERE line_user_id = ?', [lineUserId]);
  let userId = users.length > 0 ? users[0].id : null;

  if (!userId) {
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ กรุณาผูกบัญชี LINE กับระบบก่อนใช้งาน\nพิมพ์: link [ชื่อผู้ใช้]\nตัวอย่าง: link admin'
    });
  }

  try {
    const stream = await lineClient.getMessageContent(message.id);
    const fileName = `line_${message.id}.jpg`;
    const absolutePath = path.join(__dirname, 'uploads', fileName);
    const relativePath = `uploads/${fileName}`;
    const writer = fs.createWriteStream(absolutePath);

    stream.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        try {
          const result = await handleFileProcessing({ path: relativePath, originalname: fileName }, userId, 'LINE');

          let replyText = '';
          if (result.type === 'BANK_SLIP') {
            if (result.status === 'duplicate') {
              replyText = `⚠️ ตรวจพบสลิปซ้ำ!\n🔢 เลขที่รายการ: ${result.transId}\nสลิปนี้เคยมีการบันทึกในระบบแล้วครับ`;
            } else if (result.status === 'warning') {
              replyText = `🚫 ตรวจพบสลิปที่อาจมีความผิดปกติ!\nกรุณาตรวจสอบความถูกต้องของสลิปนี้อีกครั้งเพื่อป้องกันการทุจริต`;
            } else {
              replyText = `✅ บันทึกสลิปสำเร็จ\n💰 ยอดเงิน: ${result.amount} บาท\n👤 จาก: ${result.sName}\n➡️ ถึง: ${result.rName}`;
            }
          } else {
            replyText = `✅ บันทึกใบเสร็จสำเร็จ\n💰 ยอดเงิน: ${result.amount} บาท`;
          }

          // Emit socket event for real-time update in dashboard
          io.emit('new_upload', {
            count: 1,
            results: [{
              type: result.type,
              amount: result.amount,
              sender: result.sName || 'ร้านค้า (ไม่ระบุ)',
              receiver: result.rName,
              status: result.status || 'success'
            }]
          });

          await lineClient.replyMessage(event.replyToken, { type: 'text', text: replyText });
          resolve(result);
        } catch (err) {
          console.error('Processing error:', err);
          await lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ เกิดข้อผิดพลาด: ${err.message}` });
          resolve(null);
        }
      });
      writer.on('error', (err) => {
        console.error('Writer Error:', err);
        reject(err);
      });
    });

  } catch (err) {
    console.error('LINE Content Error:', err);
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: '❌ ไม่สามารถดาวน์โหลดรูปภาพได้' });
  }
}

// Auth Routes
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          company_id: user.company_id || 1,
          permissions: user.permissions
        };
        // Parse permissions if it's a string
        if (typeof req.session.user.permissions === 'string') {
          req.session.user.permissions = JSON.parse(req.session.user.permissions);
        }
        return res.redirect('/dashboard');
      }
    }
    res.render('login', { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// API: Login for Mobile/Flutter
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
        const payload = {
          id: user.id,
          username: user.username,
          role: user.role,
          company_id: user.company_id || 1,
          permissions: permissions
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          success: true,
          token,
          user: { id: user.id, username: user.username, role: user.role, permissions }
        });
      }
    }
    res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to process a single file
async function handleFileProcessing(file, userId, source = 'BROWSER') {
  const filePath = file.path;

  // 1. OCR Stage
  let rawText = '';
  const ocrEngine = process.env.OCR_ENGINE || 'VISION';

  try {
    if (ocrEngine === 'PYTHON') {
      console.log("Using Python OCR...");
      rawText = await readBillTextPython(filePath);
    } else {
      console.log("Using Google Vision OCR...");
      rawText = await readBillText(filePath);
    }

    if (!rawText) throw new Error("Could not extract any text from image");
  } catch (err) {
    console.error(`${ocrEngine} OCR Error:`, err.message);
    throw new Error(`ไม่สามารถอ่านข้อความจากรูปภาพได้ (${ocrEngine})`);
  }


  // 2. Simple Extraction Logic (Regex)
  const amountRegex = /([0-9,]+\.[0-9]{2})/g;
  const amounts = rawText.match(amountRegex) || [];
  const maxAmount = amounts.length ? Math.max(...amounts.map(a => parseFloat(a.replace(/,/g, '')))) : 0;

  const slipKeywords = [
    'โอนเงินสำเร็จ', 'รายการสำเร็จ', 'โอนเงินแล้ว', 'สำเร็จ',
    'Successful', 'Transfer Successful', 'Payment Success',
    'เลขที่อ้างอิง', 'รหัสรายการ', 'สลิป', 'PromptPay', 'โอนเข้า', 'บันทึกช่วยจำ', 'จาก', 'ไปยัง'
  ];

  const isSlip = slipKeywords.some(keyword => new RegExp(keyword, 'i').test(rawText)) ||
    /ref\.?\s*no/i.test(rawText) ||
    /transaction\s*id/i.test(rawText) ||
    /บันทึกช่วยจำ/i.test(rawText);

  let resultData = {
    rawText: rawText,
    total: maxAmount,
    type: isSlip ? 'BANK_SLIP' : 'RECEIPT',
    status: 'success'
  };

  // 3. Database Stage
  if (isSlip) {
    const slipData = parseThaiSlip(rawText);
    const transId = slipData.trans_id || `TEMP_${Date.now()}`;
    const amount = slipData.amount || maxAmount;

    // Fake Slip Check (Simple heuristic)
    let status = 'success';
    if (!slipData.trans_id || amount <= 0 || !rawText.includes('บาท')) {
      status = 'warning'; // Suspicious
    }

    const banks = [
      { name: 'กสิกรไทย', keywords: ['กสิกร', 'Kasikorn', 'K-Bank', 'KBANK'] },
      { name: 'ไทยพาณิชย์', keywords: ['ไทยพาณิชย์', 'SCB', 'Siam Commercial'] },
      { name: 'กรุงเทพ', keywords: ['กรุงเทพ', 'Bangkok Bank', 'BBL'] },
      { name: 'กรุงไทย', keywords: ['กรุงไทย', 'Krung Thai', 'KTB'] },
      { name: 'กรุงศรี', keywords: ['กรุงศรี', 'Krungsri', 'BAY'] },
      { name: 'ทหารไทยธนชาต', keywords: ['ทหารไทย', 'ธนชาต', 'ttb'] },
      { name: 'ออมสิน', keywords: ['ออมสิน', 'GSB'] },
      { name: 'ธ.ก.ส.', keywords: ['ธ.ก.ส.', 'BAAC'] },
      { name: 'ยูโอบี', keywords: ['ยูโอบี', 'UOB'] },
      { name: 'CIMB', keywords: ['CIMB'] }
    ];

    const findBank = (snippet) => {
      for (const bank of banks) {
        if (bank.keywords.some(k => new RegExp(k, 'i').test(snippet))) return bank.name;
      }
      return 'ไม่ระบุ';
    };

    const docLines = rawText.split('\n');
    let sName = slipData.sender;
    let rName = slipData.receiver;
    let sBank = 'ไม่ระบุ', rBank = 'ไม่ระบุ';

    const sIdx = docLines.findIndex(l => l.includes(sName) || /จาก|ผู้โอน|From/i.test(l));
    const rIdx = docLines.findIndex(l => l.includes(rName) || /ไปยัง|ผู้รับ|To/i.test(l));

    sBank = findBank(docLines.slice(Math.max(0, sIdx - 1), sIdx + 3).join(' '));
    rBank = findBank(docLines.slice(Math.max(0, rIdx - 1), rIdx + 3).join(' '));

    // Duplicate Check
    const [duplicates] = await db.execute(`SELECT id FROM payment_slips WHERE trans_id = ?`, [transId]);
    if (duplicates.length > 0) {
      // Log the duplicate attempt before returning
      await db.execute(
        `INSERT INTO ocr_logs (user_id, type, source, status, amount, trans_id, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'BANK_SLIP', source, 'duplicate', amount, transId, filePath]
      );
      return { type: 'BANK_SLIP', transId, sName, rName, amount, status: 'duplicate', source };
    }

    await db.execute(
      `INSERT INTO payment_slips (user_id, trans_id, sender_name, sender_bank, receiver_name, receiver_bank, amount, datetime, status, raw_text, image_path, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, transId, sName, sBank, rName, rBank, amount, new Date(), status, rawText, filePath, source]
    );

    // Logging
    await db.execute(
      `INSERT INTO ocr_logs (user_id, type, source, status, amount, trans_id, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'BANK_SLIP', source, status, amount, transId, filePath]
    );

    return { type: 'BANK_SLIP', transId, sName, rName, amount: amount, status: status, source };
  } else {
    const [billResult] = await db.execute(
      `INSERT INTO bills (user_id, store_name, date, total_amount, raw_text, image_path, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'ร้านค้า (ไม่ระบุ)', new Date(), maxAmount, rawText, filePath, source]
    );

    // Logging
    await db.execute(
      `INSERT INTO ocr_logs (user_id, type, source, status, amount, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, 'RECEIPT', source, 'success', maxAmount, filePath]
    );

    return { type: 'RECEIPT', id: billResult.insertId, amount: maxAmount, status: 'success', source };
  }
}

// API: Multiple Uploads (Supports both 'files' and 'file' fields for Flutter/Web)
app.post('/api/upload', isAuthenticated, upload.fields([{ name: 'files' }, { name: 'file' }]), async (req, res) => {
  const uploadedFiles = [];
  if (req.files['files']) uploadedFiles.push(...req.files['files']);
  if (req.files['file']) uploadedFiles.push(...req.files['file']);

  if (uploadedFiles.length === 0) {
    return res.status(400).json({ success: false, error: "ไม่พบไฟล์ที่อัปโหลด" });
  }

  const userId = req.session.user.id;
  // Automatically detect source: if Authorization header exists, it's likely from MOBILE (Flutter)
  const source = req.headers['x-source'] || (req.headers['authorization'] ? 'MOBILE' : 'BROWSER');
  const results = [];
  const errors = [];

  for (const file of uploadedFiles) {
    try {
      const result = await handleFileProcessing(file, userId, source);
      results.push({ fileName: file.originalname, ...result });
    } catch (err) {
      console.error('API Upload error:', err);
      errors.push({ fileName: file.originalname, error: err.message });
    }
  }

  if (results.length > 0) {
    req.io.emit('new_upload', {
      count: results.length,
      results: results.map(r => ({
        type: r.type,
        amount: r.amount,
        sender: r.sName || r.store_name,
        receiver: r.rName
      }))
    });
  }

  res.json({ success: true, results, errors });
});

// API: Export for Express Accounting
app.get('/api/export/express', isAuthenticated, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // 1. Slips Sheet (Income)
    const slipSheet = workbook.addWorksheet('รายรับ (สลิป)');
    slipSheet.columns = [
      { header: 'วันที่', key: 'date', width: 15 },
      { header: 'เลขที่เอกสาร', key: 'doc_no', width: 20 },
      { header: 'รหัสสมุดเงินฝาก', key: 'book_code', width: 15 },
      { header: 'ชื่อผู้โอน/ลูกค้า', key: 'customer', width: 30 },
      { header: 'จำนวนเงิน', key: 'amount', width: 15 },
      { header: 'หมายเหตุ', key: 'remark', width: 30 }
    ];

    const [slips] = await db.execute(`
      SELECT s.*, c.express_book_code 
      FROM payment_slips s 
      LEFT JOIN online_channels c ON s.source = UPPER(c.platform)
      WHERE s.status = 'success'
      ORDER BY s.datetime DESC
    `);

    slips.forEach(s => {
      const date = new Date(s.datetime);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      slipSheet.addRow({
        date: formattedDate,
        doc_no: s.trans_id,
        book_code: s.express_book_code || 'CASH', // Default if not mapped
        customer: s.sender_name,
        amount: Number(s.amount),
        remark: `โอนผ่าน ${s.source}`
      });
    });

    // 2. Bills Sheet (Expenses)
    const billSheet = workbook.addWorksheet('รายจ่าย (บิล)');
    billSheet.columns = [
      { header: 'วันที่', key: 'date', width: 15 },
      { header: 'เลขที่บิล', key: 'doc_no', width: 20 },
      { header: 'ชื่อผู้จำหน่าย', key: 'vendor', width: 30 },
      { header: 'ยอดก่อนภาษี', key: 'before_vat', width: 15 },
      { header: 'ภาษี (7%)', key: 'vat', width: 15 },
      { header: 'ยอดรวมสุทธิ', key: 'total', width: 15 },
      { header: 'หมายเหตุ', key: 'remark', width: 30 }
    ];

    const [bills] = await db.execute('SELECT * FROM bills ORDER BY date DESC');
    bills.forEach(b => {
      const date = new Date(b.date);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      const total = Number(b.total_amount);
      const vat = b.vat ? Number(b.vat) : Number((total * 7 / 107).toFixed(2));
      const beforeVat = Number((total - vat).toFixed(2));

      billSheet.addRow({
        date: formattedDate,
        doc_no: `EXP-${b.id}`,
        vendor: b.store_name,
        before_vat: beforeVat,
        vat: vat,
        total: total,
        remark: `ซื้อจาก ${b.store_name}`
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Express_Format_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API: Upload History for Flutter/Mobile
app.get('/api/history', isAuthenticated, async (req, res) => {
  const user = req.user || req.session.user;
  const userId = user.id;
  try {
    const [bills] = await db.execute(
      'SELECT id, store_name, date, total_amount, image_path, created_at, "RECEIPT" as type FROM bills WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const [slips] = await db.execute(
      'SELECT id, trans_id, sender_name, receiver_name, amount, datetime, image_path, created_at, "BANK_SLIP" as type FROM payment_slips WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Combine and sort by created_at DESC
    const history = [...bills, ...slips].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard Route
app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const companyId = 1; // Default for now
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === 'admin';

    // If admin, show all, if user, show only theirs? 
    // Usually dashboard shows overview, maybe based on company_id?
    // For now, let's filter by user for normalcy, but stats can be company-wide.

    const [[summary]] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM bills WHERE company_id=?) AS bill_count,
        (SELECT IFNULL(SUM(total_amount), 0) FROM bills WHERE company_id=?) AS total_sales,
        (SELECT IFNULL(SUM(vat), 0) FROM bills WHERE company_id=?) AS total_vat,
        (SELECT COUNT(*) FROM payment_slips WHERE company_id=?) AS slip_count
    `, [companyId, companyId, companyId, companyId]);

    // Added: Channel-wise totals and overall total for slips
    const [slipStatsRaw] = await db.execute(`
      SELECT 
        source, 
        IFNULL(SUM(amount), 0) as total_amount
      FROM payment_slips 
      WHERE company_id = ? AND status = 'success'
      GROUP BY source
    `, [companyId]);

    const slipStats = {
      BROWSER: 0,
      MOBILE: 0,
      LINE: 0,
      TOTAL: 0
    };

    slipStatsRaw.forEach(row => {
      const amount = Number(row.total_amount) || 0;
      if (slipStats.hasOwnProperty(row.source)) {
        slipStats[row.source] = amount;
      }
      slipStats.TOTAL += amount;
    });

    const [bills] = await db.execute(
      `SELECT * FROM bills WHERE company_id=? ORDER BY id DESC LIMIT 10`, [companyId]);

    const [slips] = await db.execute(
      `SELECT * FROM payment_slips WHERE company_id=? ORDER BY id DESC LIMIT 10`, [companyId]);

    res.render('dashboard', { summary, bills, slips, user: req.session.user, slipStats });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API: Dashboard Data for Mobile
app.get('/api/dashboard/data', isAuthenticated, async (req, res) => {
  try {
    const user = req.user || req.session.user;
    const companyId = user.company_id || 1;

    const [summaryRows] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM bills WHERE company_id=?) AS bill_count,
        (SELECT IFNULL(SUM(total_amount), 0) FROM bills WHERE company_id=?) AS total_sales,
        (SELECT IFNULL(SUM(vat), 0) FROM bills WHERE company_id=?) AS total_vat,
        (SELECT COUNT(*) FROM payment_slips WHERE company_id=?) AS slip_count
    `, [companyId, companyId, companyId, companyId]);

    const summary = summaryRows[0] || { bill_count: 0, total_sales: 0, total_vat: 0, slip_count: 0 };

    // 2. Slip Statistics by Channel
    const [slipStatsRaw] = await db.execute(`
      SELECT source, IFNULL(SUM(amount), 0) as total_amount
      FROM payment_slips 
      WHERE company_id = ? AND status = 'success'
      GROUP BY source
    `, [companyId]);

    const slipStats = { BROWSER: 0, MOBILE: 0, LINE: 0, TOTAL: 0 };
    slipStatsRaw.forEach(row => {
      const amount = Number(row.total_amount) || 0;
      if (slipStats.hasOwnProperty(row.source)) slipStats[row.source] = amount;
      slipStats.TOTAL += amount;
    });

    // 3. Latest Entries
    const [latestBillsData] = await db.execute(`SELECT id, store_name, total_amount, date FROM bills WHERE company_id=? ORDER BY id DESC LIMIT 5`, [companyId]);
    const [latestSlipsData] = await db.execute(`SELECT id, trans_id, amount, datetime, source FROM payment_slips WHERE company_id=? ORDER BY id DESC LIMIT 5`, [companyId]);

    // Format numbers to ensure they are not strings
    const formattedSummary = {
      bill_count: Number(summary.bill_count) || 0,
      total_sales: Number(summary.total_sales) || 0,
      total_vat: Number(summary.total_vat) || 0,
      slip_count: Number(summary.slip_count) || 0
    };

    res.json({
      success: true,
      summary: formattedSummary,
      slipStats,
      latestBills: latestBillsData.map(b => ({ ...b, total_amount: Number(b.total_amount) })),
      latestSlips: latestSlipsData.map(s => ({ ...s, amount: Number(s.amount) }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API for Dashboard Chart
app.get('/api/stats', isAuthenticated, async (req, res) => {
  try {
    const user = req.user || req.session.user;
    const companyId = user.company_id || 1;
    // Get stats for the last 6 months grouped by month AND source
    const [rows] = await db.execute(`
      SELECT 
        DATE_FORMAT(datetime, '%Y-%m') as month, 
        source,
        SUM(amount) as value
      FROM payment_slips
      WHERE company_id = ? 
        AND status = 'success'
        AND datetime >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY month, source
      ORDER BY month ASC
    `, [companyId]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bills List Page
app.get('/bills', isAuthenticated, hasPermission('bills'), async (req, res) => {
  try {
    const companyId = 1;
    const page = parseInt(req.query.page) || 1;
    const limitParam = req.query.limit || '20';
    const limit = limitParam === 'all' ? null : parseInt(limitParam);
    const search = req.query.search || '';
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const startDate = req.query.startDate !== undefined ? req.query.startDate : today;
    const endDate = req.query.endDate !== undefined ? req.query.endDate : today;
    const offset = (page - 1) * (limit || 0);

    let whereClause = 'WHERE company_id = ?';
    let params = [companyId];

    if (search) {
      whereClause += ' AND (store_name LIKE ? OR raw_text LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }

    const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM bills ${whereClause}`, params);

    let query = `SELECT * FROM bills ${whereClause} ORDER BY id DESC`;
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [bills] = await db.execute(query, params);

    res.render('bills', {
      bills,
      user: req.session.user,
      page,
      limit: limitParam,
      search,
      startDate,
      endDate,
      total,
      totalPages: limit ? Math.ceil(total / limit) : 1
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Slips List Page
app.get('/history', isAuthenticated, (req, res, next) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).send('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
  }
  next();
}, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const startDate = req.query.startDate || today;
  const endDate = req.query.endDate || today;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM ocr_logs l 
    JOIN users u ON l.user_id = u.id 
  `;

  let dataQuery = `
    SELECT l.*, u.username 
    FROM ocr_logs l 
    JOIN users u ON l.user_id = u.id 
  `;

  const params = [];
  let where = "";

  if (startDate || endDate) {
    where = " WHERE ";
    const conditions = [];
    if (startDate) {
      conditions.push("DATE(l.created_at) >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("DATE(l.created_at) <= ?");
      params.push(endDate);
    }
    where += conditions.join(" AND ");
  }

  countQuery += where;
  dataQuery += where + " ORDER BY l.created_at DESC LIMIT ? OFFSET ?";

  try {
    const [[{ total }]] = await db.execute(countQuery, params);
    const [logs] = await db.execute(dataQuery, [...params, limit, offset]);

    const totalPages = Math.ceil(total / limit);

    res.render('history', {
      user: req.session.user,
      logs,
      active: 'history',
      filters: { startDate, endDate },
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        limit: limit
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/slips', isAuthenticated, hasPermission('slips'), async (req, res) => {
  try {
    const companyId = 1;
    const page = parseInt(req.query.page) || 1;
    const limitParam = req.query.limit || '20';
    const limit = limitParam === 'all' ? null : parseInt(limitParam);
    const search = req.query.search || '';
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const startDate = req.query.startDate !== undefined ? req.query.startDate : today;
    const endDate = req.query.endDate !== undefined ? req.query.endDate : today;
    const offset = (page - 1) * (limit || 0);

    let whereClause = 'WHERE company_id = ?';
    let params = [companyId];

    if (search) {
      whereClause += ' AND (sender_name LIKE ? OR receiver_name LIKE ? OR trans_id LIKE ? OR raw_text LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereClause += ' AND DATE(datetime) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND DATE(datetime) <= ?';
      params.push(endDate);
    }

    const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM payment_slips ${whereClause}`, params);

    let query = `SELECT * FROM payment_slips ${whereClause} ORDER BY id DESC`;
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [slips] = await db.execute(query, params);

    res.render('slips', {
      slips,
      user: req.session.user,
      page,
      limit: limitParam,
      search,
      startDate,
      endDate,
      total,
      totalPages: limit ? Math.ceil(total / limit) : 1
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// User Management Routes (Admin Only)
app.get('/users', isAuthenticated, hasPermission('users'), async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, username, role, permissions, created_at FROM users');
    res.render('users', { users, user: req.session.user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/users', isAuthenticated, hasPermission('users'), async (req, res) => {
  const { username, password, role, permissions } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, JSON.stringify(permissions)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', isAuthenticated, hasPermission('users'), async (req, res) => {
  try {
    if (req.params.id == req.session.user.id) {
      return res.status(400).json({ success: false, error: "ไม่สามารถลบตัวเองได้" });
    }
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id', isAuthenticated, hasPermission('users'), async (req, res) => {
  const { username, password, role, permissions } = req.body;
  const { id } = req.params;
  try {
    let query = 'UPDATE users SET username = ?, role = ?, permissions = ?';
    let params = [username, role, JSON.stringify(permissions)];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.execute(query, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Online Channels Routes
app.get('/channels', isAuthenticated, (req, res, next) => {
  if (req.session.user.role === 'admin') return next();
  res.redirect('/dashboard');
}, async (req, res) => {
  try {
    const companyId = req.session.user.company_id || 1;
    const [channels] = await db.execute('SELECT * FROM online_channels WHERE company_id = ?', [companyId]);
    res.render('channels', {
      channels,
      user: req.session.user,
      title: 'จัดการช่องทางขายออนไลน์'
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/channels', isAuthenticated, (req, res, next) => {
  if (req.session.user.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin Only' });
}, async (req, res) => {
  const { platform, shop_name, shop_id } = req.body;
  const companyId = req.session.user.company_id || 1;
  try {
    // Check if platform already connected for this company
    const [existing] = await db.execute('SELECT id FROM online_channels WHERE company_id = ? AND platform = ?', [companyId, platform]);

    if (existing.length > 0) {
      await db.execute(
        'UPDATE online_channels SET shop_name = ?, shop_id = ?, status = "active" WHERE id = ?',
        [shop_name, shop_id, existing[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO online_channels (company_id, platform, shop_name, shop_id, status) VALUES (?, ?, ?, ?, "active")',
        [companyId, platform, shop_name, shop_id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/channels/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { express_book_code } = req.body;
  try {
    await db.execute('UPDATE online_channels SET express_book_code = ? WHERE id = ?', [express_book_code, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/channels', isAuthenticated, (req, res, next) => {
  if (req.session.user.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin Only' });
}, async (req, res) => {
  const { platform } = req.query;
  const companyId = req.session.user.company_id || 1;
  try {
    await db.execute('DELETE FROM online_channels WHERE company_id = ? AND platform = ?', [companyId, platform]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- OAuth Initiation Routes ---
app.get('/auth/:platform', isAuthenticated, (req, res) => {
  const { platform } = req.params;
  let authUrl = '';

  switch (platform) {
    case 'shopee':
      authUrl = EcommerceAPI.getShopeeAuthUrl();
      break;
    case 'tiktok':
      authUrl = EcommerceAPI.getTikTokAuthUrl();
      break;
    case 'lazada':
      authUrl = EcommerceAPI.getLazadaAuthUrl();
      break;
    default:
      return res.status(400).send('Invalid platform');
  }

  res.redirect(authUrl);
});

// --- OAuth Callback Routes ---
app.get('/auth/shopee/callback', isAuthenticated, async (req, res) => {
  const { code, shop_id } = req.query;
  const companyId = req.session.user.company_id || 1;

  try {
    // In a real scenario, you'd exchange the code for tokens here
    // const tokens = await EcommerceAPI.getShopeeTokens(code, shop_id);

    // Mocking success for demonstration since we don't have real keys yet
    await db.execute(
      `INSERT INTO online_channels (company_id, platform, shop_name, shop_id, status, access_token) 
       VALUES (?, 'shopee', ?, ?, 'active', ?) 
       ON DUPLICATE KEY UPDATE shop_name = VALUES(shop_name), shop_id = VALUES(shop_id), status = 'active', access_token = VALUES(access_token)`,
      [companyId, `Shopee Shop ${shop_id}`, shop_id, code] // Using code as placeholder for token
    );

    res.redirect('/channels?success=shopee');
  } catch (err) {
    res.status(500).send(`Auth Error: ${err.message}`);
  }
});

app.get('/auth/tiktok/callback', isAuthenticated, async (req, res) => {
  const { code } = req.query;
  const companyId = req.session.user.company_id || 1;

  try {
    await db.execute(
      `INSERT INTO online_channels (company_id, platform, shop_name, shop_id, status, access_token) 
       VALUES (?, 'tiktok', 'My TikTok Shop', 'tiktok_shop_id', 'active', ?) 
       ON DUPLICATE KEY UPDATE status = 'active', access_token = VALUES(access_token)`,
      [companyId, code]
    );
    res.redirect('/channels?success=tiktok');
  } catch (err) {
    res.status(500).send(`Auth Error: ${err.message}`);
  }
});

app.get('/auth/lazada/callback', isAuthenticated, async (req, res) => {
  const { code } = req.query;
  const companyId = req.session.user.company_id || 1;

  try {
    await db.execute(
      `INSERT INTO online_channels (company_id, platform, shop_name, shop_id, status, access_token) 
       VALUES (?, 'lazada', 'My Lazada Shop', 'lazada_shop_id', 'active', ?) 
       ON DUPLICATE KEY UPDATE status = 'active', access_token = VALUES(access_token)`,
      [companyId, code]
    );
    res.redirect('/channels?success=lazada');
  } catch (err) {
    res.status(500).send(`Auth Error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});