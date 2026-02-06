const fs = require('fs');
const path = require('path');

class PdpaController {
    async recordConsent(req, res) {
        try {
            const { consent_value, user_agent } = req.body;
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const timestamp = new Date().toISOString();

            const consentData = {
                timestamp,
                ip,
                consent_value,
                user_agent: user_agent || req.headers['user-agent'],
                browser_info: req.headers['sec-ch-ua'] || 'Unknown'
            };

            const logDir = path.join(process.cwd(), 'logs');
            const logFile = path.join(logDir, 'pdpa_consents.json');

            // Ensure directory exists
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            let history = [];
            if (fs.existsSync(logFile)) {
                const fileContent = fs.readFileSync(logFile, 'utf8');
                try {
                    history = JSON.parse(fileContent);
                } catch (e) {
                    history = [];
                }
            }

            history.push(consentData);
            fs.writeFileSync(logFile, JSON.stringify(history, null, 2));

            res.json({ success: true, message: 'Consent recorded' });
        } catch (err) {
            console.error('PDPA Record Error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async getConsentStats(req, res) {
        try {
            const logFile = path.join(process.cwd(), 'logs', 'pdpa_consents.json');
            if (!fs.existsSync(logFile)) {
                return res.json({ success: true, count: 0, history: [] });
            }

            const fileContent = fs.readFileSync(logFile, 'utf8');
            const history = JSON.parse(fileContent);
            res.json({ success: true, count: history.length, history });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new PdpaController();
