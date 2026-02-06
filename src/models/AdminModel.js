const pool = require('../config/db');

class AdminModel {
    // --- Subscription Plans ---

    static async getAllPlans() {
        const [rows] = await pool.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC, price_monthly ASC');
        return rows;
    }

    static async getPlanById(id) {
        const [rows] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [id]);
        return rows[0];
    }

    static async savePlan(data) {
        const {
            id, plan_code, plan_name, plan_name_en, description,
            price_monthly, price_yearly, max_users, max_storage_mb,
            max_transactions_per_month, features, sort_order, is_active
        } = data;

        const featuresJson = typeof features === 'string' ? features : JSON.stringify(features || {});

        if (id) {
            // Update
            await pool.query(`
                UPDATE subscription_plans SET
                plan_code = ?, plan_name = ?, plan_name_en = ?, description = ?,
                price_monthly = ?, price_yearly = ?, max_users = ?, max_storage_mb = ?,
                max_transactions_per_month = ?, features = ?, sort_order = ?, is_active = ?,
                updated_at = NOW()
                WHERE id = ?
            `, [
                plan_code, plan_name, plan_name_en, description,
                price_monthly, price_yearly, max_users, max_storage_mb,
                max_transactions_per_month, featuresJson, sort_order, is_active ? 1 : 0,
                id
            ]);
            return id;
        } else {
            // Create
            const [result] = await pool.query(`
                INSERT INTO subscription_plans (
                    plan_code, plan_name, plan_name_en, description,
                    price_monthly, price_yearly, max_users, max_storage_mb,
                    max_transactions_per_month, features, sort_order, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                plan_code, plan_name, plan_name_en, description,
                price_monthly, price_yearly, max_users, max_storage_mb,
                max_transactions_per_month, featuresJson, sort_order || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1
            ]);
            return result.insertId;
        }
    }

    static async deletePlan(id) {
        const [result] = await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // --- System Modules ---

    static async getAllModules() {
        const [rows] = await pool.query('SELECT * FROM system_modules ORDER BY sort_order ASC');
        return rows;
    }

    static async saveModule(data) {
        const { id, module_code, module_name, description, icon, is_active, sort_order } = data;

        if (id) {
            await pool.query(`
                UPDATE system_modules SET
                module_code = ?, module_name = ?, description = ?, icon = ?, 
                is_active = ?, sort_order = ?, updated_at = NOW()
                WHERE id = ?
            `, [module_code, module_name, description, icon, is_active ? 1 : 0, sort_order, id]);
            return id;
        } else {
            const [result] = await pool.query(`
                INSERT INTO system_modules (module_code, module_name, description, icon, is_active, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [module_code, module_name, description, icon, is_active !== undefined ? (is_active ? 1 : 0) : 1, sort_order || 0]);
            return result.insertId;
        }
    }

    static async deleteModule(id) {
        const [result] = await pool.query('DELETE FROM system_modules WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = AdminModel;
