const mysql = require('mysql2/promise');
process.env.TZ = 'Asia/Bangkok';

const bcrypt = require('bcryptjs');

async function setup() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    timezone: '+07:00'
  });

  await db.query("SET time_zone = '+07:00'");



  await db.query('CREATE DATABASE IF NOT EXISTS bill_ocr');
  await db.query('USE bill_ocr');

  console.log('Database created/selected');

  // Users Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      permissions JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      company_id INT DEFAULT 1,
      store_name VARCHAR(255),
      date DATE,
      total_amount DECIMAL(10, 2),
      vat DECIMAL(10, 2),
      raw_text TEXT,
      image_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT,
      name VARCHAR(255),
      qty INT,
      price DECIMAL(10, 2),
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_slips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      company_id INT DEFAULT 1,
      trans_id VARCHAR(100) UNIQUE,
      sender_name VARCHAR(255),
      sender_bank VARCHAR(100),
      receiver_name VARCHAR(255),
      receiver_bank VARCHAR(100),
      amount DECIMAL(10, 2),
      datetime DATETIME,
      status VARCHAR(50) DEFAULT 'success',
      raw_text TEXT,
      image_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert Default Admin
  const [existingAdmin] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      'INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, 'admin', JSON.stringify({ dashboard: true, bills: true, slips: true, users: true })]
    );
    console.log('Default admin user created (admin / admin123)');
  }

  console.log('Tables created successfully');
  await db.end();
}

setup().catch(console.error);
