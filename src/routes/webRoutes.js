const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin, isSuperAdmin, hasPermission } = require('../middleware/auth');
const { loadTenant } = require('../middleware/tenant');
const DashboardController = require('../controllers/DashboardController');
const BillController = require('../controllers/BillController');
const UserController = require('../controllers/UserController');
const ManagementController = require('../controllers/ManagementController');
const SlipController = require('../controllers/SlipController');
const ChannelController = require('../controllers/ChannelController');
const ExportController = require('../controllers/ExportController');
const GeneralController = require('../controllers/GeneralController');
const WebTenantController = require('../controllers/WebTenantController');
const FulfillmentController = require('../controllers/FulfillmentController');
const AdminTenantController = require('../controllers/AdminTenantController');
const AdminPlanController = require('../controllers/AdminPlanController');


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
router.post('/sync/:platform', isAuthenticated, ChannelController.triggerSync);

// E-commerce & Logistics
router.get('/orders', isAuthenticated, GeneralController.viewOrders);
router.get('/sync-history', isAuthenticated, GeneralController.viewSyncHistory);
router.get('/fee-report', isAuthenticated, GeneralController.viewFeeReport);
router.get('/inventory', isAuthenticated, GeneralController.viewInventory);
router.get('/reconciliation', isAuthenticated, GeneralController.viewReconciliation);

// Users (Admin Only)
router.get('/users', isAuthenticated, isAdmin, UserController.listUsers);
router.get('/profile', isAuthenticated, UserController.showProfile);

// Multi-tenant Routes
router.get('/register', WebTenantController.showRegisterPage); // Public - ลูกค้าลงทะเบียนเอง
router.get('/tenant/users', isAuthenticated, loadTenant, WebTenantController.showUserManagementPage); // จัดการ users ในแต่ละ tenant
router.get('/tenant/settings', isAuthenticated, loadTenant, WebTenantController.showTenantSettings); // ตั้งค่า tenant
router.post('/tenant/settings', isAuthenticated, loadTenant, WebTenantController.updateTenantSettings); // อัพเดทค่าที่ตั้งไว้
router.post('/tenant/change-plan', isAuthenticated, isAdmin, WebTenantController.changePlan); // เปลี่ยนแพ็กเกจ (Admin Only)

// Management (Admin Only)
router.get('/admin/backup', isAuthenticated, isAdmin, ManagementController.listBackups);
router.post('/admin/backup/create', isAuthenticated, isAdmin, ManagementController.createBackup);
router.post('/admin/backup/delete', isAuthenticated, isAdmin, ManagementController.deleteBackup);
router.post('/admin/backup/restore', isAuthenticated, isAdmin, ManagementController.restoreBackup);
router.get('/admin/logs', isAuthenticated, isAdmin, ManagementController.listLogs);

// Tenant Management (Super Admin Only)
router.get('/admin/tenants', isAuthenticated, isSuperAdmin, AdminTenantController.listTenants);
router.post('/admin/tenants/:id/status', isAuthenticated, isSuperAdmin, AdminTenantController.apiUpdateStatus);
router.post('/admin/tenants/:id/plan', isAuthenticated, isSuperAdmin, AdminTenantController.apiChangePlan);
router.delete('/admin/tenants/:id', isAuthenticated, isSuperAdmin, AdminTenantController.apiDeleteTenant);

// Plan & Module Management (Super Admin Only)
router.get('/admin/plans', isAuthenticated, isSuperAdmin, AdminPlanController.index);
router.post('/admin/plans/save', isAuthenticated, isSuperAdmin, AdminPlanController.apiSavePlan);
router.delete('/admin/plans/:id', isAuthenticated, isSuperAdmin, AdminPlanController.apiDeletePlan);
router.post('/admin/modules/save', isAuthenticated, isSuperAdmin, AdminPlanController.apiSaveModule);
router.delete('/admin/modules/:id', isAuthenticated, isSuperAdmin, AdminPlanController.apiDeleteModule);


// Backup Schedules (Admin Only)
const BackupScheduleController = require('../controllers/BackupScheduleController');
router.get('/backup/schedules', isAuthenticated, isAdmin, BackupScheduleController.index);
router.post('/backup/schedules', isAuthenticated, isAdmin, BackupScheduleController.create);
router.put('/backup/schedules/:id', isAuthenticated, isAdmin, BackupScheduleController.update);
router.delete('/backup/schedules/:id', isAuthenticated, isAdmin, BackupScheduleController.delete);
router.post('/backup/schedules/:id/toggle', isAuthenticated, isAdmin, BackupScheduleController.toggle);
router.post('/backup/schedules/:id/run', isAuthenticated, isAdmin, BackupScheduleController.runNow);
router.get('/backup/history', isAuthenticated, isAdmin, BackupScheduleController.history);

// Export
router.get('/api/export/express', isAuthenticated, ExportController.exportExpress);
router.get('/api/export', isAuthenticated, ExportController.exportCustom);

// Inventory Management
const InventoryController = require('../controllers/InventoryController');
router.get('/inventory/transactions', isAuthenticated, InventoryController.viewTransactions);
router.get('/inventory/balances', isAuthenticated, InventoryController.viewBalances);
router.get('/inventory/purchase-plan', isAuthenticated, InventoryController.viewPurchasePlan); // Purchase Plan
router.get('/inventory/issue/create', isAuthenticated, InventoryController.viewIssueForm); // New Master-Detail Form
router.get('/inventory/transaction/:type', isAuthenticated, InventoryController.viewTransactionForm); // Old Form (keep for other types)
router.post('/inventory/transaction', isAuthenticated, InventoryController.createTransaction);
router.post('/inventory/transaction/bulk', isAuthenticated, InventoryController.createBulkTransaction); // New Bulk Submit
router.get('/api/inventory/warehouse/:warehouseId/locations', isAuthenticated, InventoryController.getLocations);
router.get('/api/inventory/stock/:productId', isAuthenticated, InventoryController.getStockForProduct); // New Stock API

// Fulfillment Module
router.get('/fulfillment/warehouses', isAuthenticated, FulfillmentController.viewWarehouses);
router.post('/fulfillment/warehouses', isAuthenticated, FulfillmentController.createWarehouse);
router.post('/fulfillment/warehouses/delete', isAuthenticated, FulfillmentController.deleteWarehouse);
router.get('/fulfillment/warehouses/:warehouseId/locations', isAuthenticated, FulfillmentController.viewLocations);
router.post('/fulfillment/warehouses/:warehouseId/locations', isAuthenticated, FulfillmentController.createLocation);

router.get('/fulfillment/products', isAuthenticated, FulfillmentController.viewProducts);
router.get('/fulfillment/products/create', isAuthenticated, FulfillmentController.viewProductForm);
router.get('/fulfillment/products/:id/edit', isAuthenticated, FulfillmentController.viewProductForm);
router.post('/fulfillment/products', isAuthenticated, FulfillmentController.saveProduct);

// Other pages can be added here (History, Slips, etc.)
// router.get('/slips', isAuthenticated, hasPermission('slips'), SlipController.listSlips);

module.exports = router;
