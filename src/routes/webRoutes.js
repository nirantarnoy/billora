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

// Multer Config for temporary uploads
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/templates';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'test-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// Dashboard
router.get('/dashboard', isAuthenticated, loadTenant, DashboardController.viewDashboard);

// Bills
router.get('/bills', isAuthenticated, loadTenant, hasPermission('bills'), BillController.listBills);

// OCR Templates
const OcrTemplateController = require('../controllers/OcrTemplateController');
router.get('/ocr-templates', isAuthenticated, loadTenant, hasPermission('bills'), OcrTemplateController.listTemplates);
router.post('/api/ocr-templates', isAuthenticated, loadTenant, hasPermission('bills'), OcrTemplateController.createTemplate);
router.post('/api/ocr-templates/test-scan', isAuthenticated, loadTenant, hasPermission('bills'), upload.single('file'), OcrTemplateController.testScan);
router.put('/api/ocr-templates/:id', isAuthenticated, loadTenant, hasPermission('bills'), OcrTemplateController.updateTemplate);
router.delete('/api/ocr-templates/:id', isAuthenticated, loadTenant, hasPermission('bills'), OcrTemplateController.deleteTemplate);

// Slips & History
router.get('/slips', isAuthenticated, loadTenant, hasPermission('slips'), SlipController.listSlips);
router.get('/history', isAuthenticated, loadTenant, isAdmin, SlipController.listOcrLogs);

// Channels
router.get('/channels', isAuthenticated, isAdmin, ChannelController.listChannels);
router.get('/auth/:platform', isAuthenticated, ChannelController.initiateAuth);
router.get('/auth/shopee/callback', isAuthenticated, ChannelController.shopeeCallback);
router.get('/auth/tiktok/callback', isAuthenticated, ChannelController.tiktokCallback);
router.get('/auth/lazada/callback', isAuthenticated, ChannelController.lazadaCallback);
router.post('/sync/:platform', isAuthenticated, ChannelController.triggerSync);

// E-commerce & Logistics
router.get('/orders', isAuthenticated, loadTenant, GeneralController.viewOrders);
router.get('/sync-history', isAuthenticated, loadTenant, GeneralController.viewSyncHistory);
router.get('/fee-report', isAuthenticated, loadTenant, GeneralController.viewFeeReport);
router.get('/inventory', isAuthenticated, loadTenant, GeneralController.viewInventory);
router.get('/reconciliation', isAuthenticated, loadTenant, GeneralController.viewReconciliation);

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
router.get('/admin/security-logs', isAuthenticated, isAdmin, ManagementController.listSecurityLogs);

// Tenant Management (Super Admin Only)
router.get('/admin/tenants', isAuthenticated, isSuperAdmin, AdminTenantController.listTenants);
router.post('/admin/tenants/:id/status', isAuthenticated, isSuperAdmin, AdminTenantController.apiUpdateStatus);
router.post('/admin/tenants/:id/approve', isAuthenticated, isSuperAdmin, AdminTenantController.apiApproveTenant);
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
router.get('/api/export/express', isAuthenticated, loadTenant, ExportController.exportExpress);
router.get('/api/export', isAuthenticated, loadTenant, ExportController.exportCustom);

// Inventory Management
const InventoryController = require('../controllers/InventoryController');
router.get('/inventory/transactions', isAuthenticated, loadTenant, InventoryController.viewTransactions);
router.get('/inventory/balances', isAuthenticated, loadTenant, InventoryController.viewBalances);
router.get('/inventory/purchase-plan', isAuthenticated, loadTenant, InventoryController.viewPurchasePlan); // Purchase Plan
router.get('/inventory/issue/create', isAuthenticated, loadTenant, InventoryController.viewIssueForm); // New Master-Detail Form
router.get('/inventory/transaction/:type', isAuthenticated, loadTenant, InventoryController.viewTransactionForm); // Old Form (keep for other types)
router.post('/inventory/transaction', isAuthenticated, loadTenant, InventoryController.createTransaction);
router.post('/inventory/transaction/bulk', isAuthenticated, loadTenant, InventoryController.createBulkTransaction); // New Bulk Submit
router.get('/api/inventory/warehouse/:warehouseId/locations', isAuthenticated, loadTenant, InventoryController.getLocations);
router.get('/api/inventory/stock/:productId', isAuthenticated, loadTenant, InventoryController.getStockForProduct); // New Stock API

// Fulfillment Module
router.get('/fulfillment/warehouses', isAuthenticated, loadTenant, FulfillmentController.viewWarehouses);
router.post('/fulfillment/warehouses', isAuthenticated, loadTenant, FulfillmentController.createWarehouse);
router.post('/fulfillment/warehouses/delete', isAuthenticated, loadTenant, FulfillmentController.deleteWarehouse);
router.get('/fulfillment/warehouses/:warehouseId/locations', isAuthenticated, loadTenant, FulfillmentController.viewLocations);
router.post('/fulfillment/warehouses/:warehouseId/locations', isAuthenticated, loadTenant, FulfillmentController.createLocation);

router.get('/fulfillment/products', isAuthenticated, loadTenant, FulfillmentController.viewProducts);
router.get('/fulfillment/products/create', isAuthenticated, loadTenant, FulfillmentController.viewProductForm);
router.get('/fulfillment/products/:id/edit', isAuthenticated, loadTenant, FulfillmentController.viewProductForm);
router.post('/fulfillment/products', isAuthenticated, loadTenant, FulfillmentController.saveProduct);
router.get('/api/fulfillment/products/online-candidates', isAuthenticated, loadTenant, FulfillmentController.getOnlineCandidates);
router.post('/api/fulfillment/products/import-online', isAuthenticated, loadTenant, FulfillmentController.importOnlineProducts);

// Other pages can be added here (History, Slips, etc.)
// router.get('/slips', isAuthenticated, hasPermission('slips'), SlipController.listSlips);

module.exports = router;
