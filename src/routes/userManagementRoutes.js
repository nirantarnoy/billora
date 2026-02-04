/**
 * User Management Routes
 * เส้นทางสำหรับจัดการผู้ใช้งานในระบบ Multi-tenant
 */

const express = require('express');
const router = express.Router();
const UserManagementController = require('../controllers/UserManagementController');
const { isAuthenticated } = require('../middleware/auth');
const { loadTenant, checkTenantLimits } = require('../middleware/tenant');

// ต้อง login และมี tenant context
router.use(isAuthenticated);
router.use(loadTenant);

// User Management
router.get('/', UserManagementController.getAll);
router.get('/:id', UserManagementController.getById);
router.post('/', checkTenantLimits('users'), UserManagementController.create);
router.put('/:id', UserManagementController.update);
router.delete('/:id', UserManagementController.delete);

// Password Management
router.post('/:id/change-password', UserManagementController.changePassword);

// Role Management
router.put('/:id/role', UserManagementController.updateRole);
router.put('/:id/toggle-active', UserManagementController.toggleActive);

module.exports = router;
