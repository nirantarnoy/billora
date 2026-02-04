/**
 * User Management Controller (Multi-tenant)
 * จัดการผู้ใช้งานในระบบ SaaS
 */

const UserModel = require('../models/UserModel');
const TenantModel = require('../models/TenantModel');

class UserManagementController {
    /**
     * ดึงรายการผู้ใช้ทั้งหมดใน Tenant
     */
    static async getAll(req, res) {
        try {
            const tenantId = req.tenantId;
            const filters = {
                role: req.query.role,
                is_active: req.query.is_active,
                search: req.query.search,
                limit: req.query.limit
            };

            const users = await UserModel.getAllByTenant(tenantId, filters);

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Get All Users Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
            });
        }
    }

    /**
     * ดึงข้อมูลผู้ใช้ตาม ID
     */
    static async getById(req, res) {
        try {
            const tenantId = req.tenantId;
            const userId = req.params.id;

            const user = await UserModel.findById(tenantId, userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบผู้ใช้งาน'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get User By ID Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
            });
        }
    }

    /**
     * สร้างผู้ใช้ใหม่
     */
    static async create(req, res) {
        try {
            const tenantId = req.tenantId;
            const currentUser = req.session.user;

            // ตรวจสอบสิทธิ์
            if (!['owner', 'admin'].includes(currentUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่มีสิทธิ์สร้างผู้ใช้ใหม่'
                });
            }

            // ตรวจสอบ quota
            const quota = await TenantModel.checkQuota(tenantId, 'users');
            if (!quota.allowed) {
                return res.status(403).json({
                    success: false,
                    message: `คุณใช้งานผู้ใช้ครบจำนวนสูงสุดแล้ว (${quota.limit} คน)`,
                    quota
                });
            }

            const {
                username,
                email,
                password,
                first_name,
                last_name,
                phone,
                role,
                permissions
            } = req.body;

            // Validate
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอกอีเมลและรหัสผ่าน'
                });
            }

            // ตรวจสอบว่า email ซ้ำหรือไม่
            const existingUser = await UserModel.findByEmail(tenantId, email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'อีเมลนี้ถูกใช้งานแล้ว'
                });
            }

            // สร้างผู้ใช้
            const userId = await UserModel.create(tenantId, {
                username: username || email,
                email,
                password,
                first_name,
                last_name,
                phone,
                role: role || 'user',
                permissions: permissions || {}
            });

            res.status(201).json({
                success: true,
                message: 'สร้างผู้ใช้สำเร็จ',
                data: { id: userId }
            });
        } catch (error) {
            console.error('Create User Error:', error);

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว'
                });
            }

            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
            });
        }
    }

    /**
     * อัพเดทข้อมูลผู้ใช้
     */
    static async update(req, res) {
        try {
            const tenantId = req.tenantId;
            const userId = req.params.id;
            const currentUser = req.session.user;

            // ตรวจสอบสิทธิ์ (แก้ไขตัวเองได้ หรือเป็น admin)
            if (currentUser.id != userId && !['owner', 'admin'].includes(currentUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้นี้'
                });
            }

            const updated = await UserModel.update(tenantId, userId, req.body);

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'ไม่สามารถอัพเดทข้อมูลได้'
                });
            }

            res.json({
                success: true,
                message: 'อัพเดทข้อมูลผู้ใช้สำเร็จ'
            });
        } catch (error) {
            console.error('Update User Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
            });
        }
    }

    /**
     * เปลี่ยนรหัสผ่าน
     */
    static async changePassword(req, res) {
        try {
            const tenantId = req.tenantId;
            const userId = req.params.id;
            const currentUser = req.session.user;
            const { old_password, new_password } = req.body;

            // ตรวจสอบสิทธิ์ (เปลี่ยนรหัสผ่านตัวเองเท่านั้น)
            if (currentUser.id != userId) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่สามารถเปลี่ยนรหัสผ่านของผู้อื่นได้'
                });
            }

            if (!old_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่'
                });
            }

            const result = await UserModel.changePassword(
                tenantId,
                userId,
                old_password,
                new_password
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Change Password Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
            });
        }
    }

    /**
     * อัพเดท Role
     */
    static async updateRole(req, res) {
        try {
            const tenantId = req.tenantId;
            const userId = req.params.id;
            const currentUser = req.session.user;
            const { role } = req.body;

            // เฉพาะ owner และ admin เท่านั้น
            if (!['owner', 'admin'].includes(currentUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่มีสิทธิ์เปลี่ยน role'
                });
            }

            // ไม่สามารถเปลี่ยน role ของตัวเองได้
            if (currentUser.id == userId) {
                return res.status(400).json({
                    success: false,
                    message: 'คุณไม่สามารถเปลี่ยน role ของตัวเองได้'
                });
            }

            const updated = await UserModel.updateRole(tenantId, userId, role);

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'ไม่สามารถอัพเดท role ได้'
                });
            }

            res.json({
                success: true,
                message: 'อัพเดท role สำเร็จ'
            });
        } catch (error) {
            console.error('Update Role Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัพเดท role'
            });
        }
    }

    /**
     * ระงับ/เปิดใช้งานผู้ใช้
     */
    static async toggleActive(req, res) {
        try {
            const tenantId = req.tenantId;
            const userId = req.params.id;
            const currentUser = req.session.user;
            const { is_active } = req.body;

            // เฉพาะ owner และ admin เท่านั้น
            if (!['owner', 'admin'].includes(currentUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่มีสิทธิ์ระงับ/เปิดใช้งานผู้ใช้'
                });
            }

            // ไม่สามารถระงับตัวเองได้
            if (currentUser.id == userId) {
                return res.status(400).json({
                    success: false,
                    message: 'คุณไม่สามารถระงับบัญชีของตัวเองได้'
                });
            }

            const updated = await UserModel.toggleActive(tenantId, userId, is_active);

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'ไม่สามารถอัพเดทสถานะได้'
                });
            }

            res.json({
                success: true,
                message: is_active ? 'เปิดใช้งานผู้ใช้สำเร็จ' : 'ระงับผู้ใช้สำเร็จ'
            });
        } catch (error) {
            console.error('Toggle Active Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ'
            });
        }
    }

    /**
     * ลบผู้ใช้
     */
    static async delete(req, res) {
        try {
            const tenantId = req.tenantId;
            const userId = req.params.id;
            const currentUser = req.session.user;

            // เฉพาะ owner และ admin เท่านั้น
            if (!['owner', 'admin'].includes(currentUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'คุณไม่มีสิทธิ์ลบผู้ใช้'
                });
            }

            // ไม่สามารถลบตัวเองได้
            if (currentUser.id == userId) {
                return res.status(400).json({
                    success: false,
                    message: 'คุณไม่สามารถลบบัญชีของตัวเองได้'
                });
            }

            const deleted = await UserModel.delete(tenantId, userId);

            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: 'ไม่สามารถลบผู้ใช้ได้'
                });
            }

            res.json({
                success: true,
                message: 'ลบผู้ใช้สำเร็จ'
            });
        } catch (error) {
            console.error('Delete User Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบผู้ใช้'
            });
        }
    }
}

module.exports = UserManagementController;
