const AdminModel = require('../models/AdminModel');

class AdminPlanController {
    /**
     * แสดงหน้าจัดการแพ็กเกจและโมดูล
     */
    static async index(req, res) {
        try {
            const plans = await AdminModel.getAllPlans();
            const modules = await AdminModel.getAllModules();

            res.render('admin/plans', {
                title: 'จัดการแพ็กเกจและโมดูล',
                active: 'admin-plans',
                plans,
                modules,
                user: req.session.user
            });
        } catch (error) {
            console.error('Error in AdminPlanController.index:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * บันทึกข้อมูลแพ็กเกจ (Create/Update)
     */
    static async apiSavePlan(req, res) {
        try {
            const planData = req.body;
            const id = await AdminModel.savePlan(planData);
            res.json({ success: true, message: 'บันทึกข้อมูลแพ็กเกจเรียบร้อยแล้ว', id });
        } catch (error) {
            console.error('Error saving plan:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * ลบแพ็กเกจ
     */
    static async apiDeletePlan(req, res) {
        try {
            const { id } = req.params;
            const success = await AdminModel.deletePlan(id);
            if (success) {
                res.json({ success: true, message: 'ลบแพ็กเกจเรียบร้อยแล้ว' });
            } else {
                res.status(404).json({ success: false, message: 'ไม่พบข้อมูลแพ็กเกจ' });
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * บันทึกข้อมูลโมดูล (Create/Update)
     */
    static async apiSaveModule(req, res) {
        try {
            const moduleData = req.body;
            const id = await AdminModel.saveModule(moduleData);
            res.json({ success: true, message: 'บันทึกข้อมูลโมดูลเรียบร้อยแล้ว', id });
        } catch (error) {
            console.error('Error saving module:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * ลบโมดูล
     */
    static async apiDeleteModule(req, res) {
        try {
            const { id } = req.params;
            const success = await AdminModel.deleteModule(id);
            if (success) {
                res.json({ success: true, message: 'ลบโมดูลเรียบร้อยแล้ว' });
            } else {
                res.status(404).json({ success: false, message: 'ไม่พบข้อมูลโมดูล' });
            }
        } catch (error) {
            console.error('Error deleting module:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = AdminPlanController;
