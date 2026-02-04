/**
 * Tenant Routes
 * เส้นทางสำหรับจัดการ Tenant (องค์กร/บริษัท)
 */

const express = require('express');
const router = express.Router();
const TenantController = require('../controllers/TenantController');
const { isAuthenticated } = require('../middleware/auth');
const { loadTenant, checkTenantLimits } = require('../middleware/tenant');

// Public Routes
router.post('/register', TenantController.register);

// Protected Routes (ต้อง login)
router.use(isAuthenticated);
router.use(loadTenant);

// Tenant Info
router.get('/current', TenantController.getCurrent);
router.put('/current', TenantController.update);

// Subscription
router.get('/subscription', TenantController.getSubscription);

// Quota
router.get('/quota/:type', TenantController.checkQuota);

// Super Admin Only
// router.get('/all', TenantController.getAll);

module.exports = router;
