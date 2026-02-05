const pool = require('../config/db');

class PaymentModel {
    /**
     * บันทึกรายการชำระเงินใหม่
     */
    static async create(data) {
        const {
            tenant_id,
            subscription_id,
            transaction_no,
            omise_charge_id,
            amount,
            currency,
            payment_method,
            status = 'pending',
            omise_raw_data
        } = data;

        const [result] = await pool.query(
            `INSERT INTO payments (
                tenant_id, subscription_id, transaction_no, omise_charge_id,
                amount, currency, payment_method, status, omise_raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tenant_id, subscription_id, transaction_no, omise_charge_id,
                amount, currency, payment_method, status,
                JSON.stringify(omise_raw_data)
            ]
        );

        return result.insertId;
    }

    /**
     * อัพเดทสถานะการชำระเงิน
     */
    static async updateStatus(chargeId, status, extraData = {}) {
        const updates = ['status = ?'];
        const params = [status];

        if (extraData.failure_code) {
            updates.push('failure_code = ?');
            params.push(extraData.failure_code);
        }
        if (extraData.failure_message) {
            updates.push('failure_message = ?');
            params.push(extraData.failure_message);
        }
        if (extraData.raw) {
            updates.push('omise_raw_data = ?');
            params.push(JSON.stringify(extraData.raw));
        }

        params.push(chargeId);
        const query = `UPDATE payments SET ${updates.join(', ')}, updated_at = NOW() WHERE omise_charge_id = ?`;

        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    /**
     * ค้นหา Payment ด้วย Charge ID
     */
    static async findByChargeId(chargeId) {
        const [rows] = await pool.query('SELECT * FROM payments WHERE omise_charge_id = ?', [chargeId]);
        return rows[0];
    }
}

module.exports = PaymentModel;
