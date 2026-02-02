const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin, hasPermission } = require('../middleware/auth');
const DashboardController = require('../controllers/DashboardController');
const BillController = require('../controllers/BillController');
const UserController = require('../controllers/UserController');
const ManagementController = require('../controllers/ManagementController');
const SlipController = require('../controllers/SlipController');
const ChannelController = require('../controllers/ChannelController');
const ExportController = require('../controllers/ExportController');
const GeneralController = require('../controllers/GeneralController');

// Dashboard
router.get('/dashboard', isAuthenticated, DashboardController.viewDashboard);

// Bills
router.get('/bills', isAuthenticated, hasPermission('bills'), BillController.listBills);

// Slips & History
router.get('/slips', isAuthenticated, hasPermission('slips'), SlipController.listSlips);
router.get('/history', isAuthenticated, isAdmin, SlipController.listOcrLogs);

// Channels
router.get('/channels', isAuthenticated, isAdmin, ChannelController.listChannels);
router.get('/auth/:platform', isAuthenticated, ChannelController.initiateAuth);
router.get('/auth/shopee/callback', isAuthenticated, ChannelController.shopeeCallback);
router.get('/auth/tiktok/callback', isAuthenticated, ChannelController.tiktokCallback);
router.get('/auth/lazada/callback', isAuthenticated, ChannelController.lazadaCallback);

// E-commerce & Logistics
router.get('/orders', isAuthenticated, GeneralController.viewOrders);
router.get('/sync-history', isAuthenticated, GeneralController.viewSyncHistory);
router.get('/fee-report', isAuthenticated, GeneralController.viewFeeReport);
router.get('/inventory', isAuthenticated, GeneralController.viewInventory);
router.get('/reconciliation', isAuthenticated, GeneralController.viewReconciliation);

// Users (Admin Only)
router.get('/users', isAuthenticated, isAdmin, UserController.listUsers);

// Management (Admin Only)
router.get('/admin/backup', isAuthenticated, isAdmin, ManagementController.listBackups);
router.post('/admin/backup/create', isAuthenticated, isAdmin, ManagementController.createBackup);
router.get('/admin/logs', isAuthenticated, isAdmin, ManagementController.listLogs);

// Export
router.get('/api/export/express', isAuthenticated, ExportController.exportExpress);
router.get('/api/export', isAuthenticated, ExportController.exportCustom);

// Other pages can be added here (History, Slips, etc.)
// router.get('/slips', isAuthenticated, hasPermission('slips'), SlipController.listSlips);

module.exports = router;
