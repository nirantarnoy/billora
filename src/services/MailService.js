/**
 * Mail Service
 * จัดการการส่งอีเมลในระบบ
 */

const nodemailer = require('nodemailer');

class MailService {
    constructor() {
        // ดึงการตั้งค่าจาก Environment Variables
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            family: 4, // บังคับให้ใช้ IPv4
            connectionTimeout: 10000,
            greetingTimeout: 10000
        });
    }

    /**
     * ส่งอีเมล
     * @param {Object} options { to, subject, html, text }
     */
    async sendMail(options) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"Goodoper Billora System" <noreply@billora.com>',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✓ Email sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('✗ Send Mail Error:', error);
            // ไม่ throw error เพื่อไม่ให้กระทบ Flow หลัก แต่ log ไว้
            return null;
        }
    }

    /**
     * ส่งเมลแจ้งเตือนเมื่อมี Tenant ใหม่สมัครสมาชิก
     */
    async sendNewTenantNotification(tenantData) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@billora.com';

        const html = `
            <h2>มีการลงทะเบียนองค์กรใหม่ (Tenant Registration)</h2>
            <p><strong>ชื่อบริษัท:</strong> ${tenantData.company_name}</p>
            <p><strong>รหัสองค์กร:</strong> ${tenantData.tenant_code}</p>
            <p><strong>อีเมลผู้ติดต่อ:</strong> ${tenantData.owner_email}</p>
            <p><strong>ชื่อผู้ติดต่อ:</strong> ${tenantData.owner_first_name} ${tenantData.owner_last_name}</p>
            <p><strong>เบอร์โทรศัพท์:</strong> ${tenantData.owner_phone || tenantData.phone || '-'}</p>
            <hr>
            <p>กรุณาตรวจสอบและอนุมัติการใช้งานในระบบหลังบ้าน</p>
        `;

        return this.sendMail({
            to: adminEmail,
            subject: `[New Tenant] ${tenantData.company_name} ได้ลงทะเบียนเข้าสู่ระบบ`,
            html: html
        });
    }
}

module.exports = new MailService();
