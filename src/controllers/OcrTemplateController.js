const db = require('../config/db');
const { recordAction } = require('../utils/logger');

class OcrTemplateController {
    // Web: List Templates
    async listTemplates(req, res) {
        try {
            const tenantId = req.session.user.tenant_id || 1;
            const [templates] = await db.execute(
                'SELECT * FROM ocr_templates WHERE tenant_id = ? ORDER BY id DESC',
                [tenantId]
            );

            res.render('ocr_templates', {
                templates,
                user: req.session.user,
                active: 'ocr_templates',
                title: 'จัดการ OCR Templates',
                _csrf: req.csrfToken ? req.csrfToken() : ''
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    }

    // API: Create Template
    async createTemplate(req, res) {
        try {
            const { name, match_keyword, description, system_prompt } = req.body;
            const tenantId = req.session.user.tenant_id || 1;

            await db.execute(
                `INSERT INTO ocr_templates (tenant_id, name, match_keyword, description, system_prompt) VALUES (?, ?, ?, ?, ?)`,
                [tenantId, name, match_keyword, description, system_prompt]
            );

            await recordAction(req.session.user.id, 'Create OCR Template', `สร้างแม่แบบ ${name}`, req);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // API: Update Template
    async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const { name, match_keyword, description, system_prompt, is_active } = req.body;
            const tenantId = req.session.user.tenant_id || 1;

            await db.execute(
                `UPDATE ocr_templates SET name = ?, match_keyword = ?, description = ?, system_prompt = ?, is_active = ? WHERE id = ? AND tenant_id = ?`,
                [name, match_keyword, description, system_prompt, is_active, id, tenantId]
            );

            await recordAction(req.session.user.id, 'Update OCR Template', `แก้ไขแม่แบบ ID ${id}`, req);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // API: Delete Template
    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.session.user.tenant_id || 1;

            await db.execute('DELETE FROM ocr_templates WHERE id = ? AND tenant_id = ?', [id, tenantId]);
            await recordAction(req.session.user.id, 'Delete OCR Template', `ลบแม่แบบ ID ${id}`, req);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new OcrTemplateController();
