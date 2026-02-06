const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tenantId = req.session?.user?.tenant_id || 'default';
        const dir = path.join('uploads', tenantId.toString());
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

const { isAuthenticated } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');
const DashboardController = require('../controllers/DashboardController');
const BillController = require('../controllers/BillController');
const SlipController = require('../controllers/SlipController');
const ChannelController = require('../controllers/ChannelController');
const PaymentController = require('../controllers/PaymentController');
const PdpaController = require('../controllers/PdpaController');


// Multi-tenant Routes
const tenantRoutes = require('./tenantRoutes');
const userManagementRoutes = require('./userManagementRoutes');

// Public API
router.post('/login', AuthController.apiLogin);
router.post('/change-password', isAuthenticated, AuthController.changePassword);

// Protected API (Used by Flutter)
router.get('/stats', isAuthenticated, DashboardController.getStats);
router.get('/dashboard/data', isAuthenticated, DashboardController.getApiDashboardData);
router.post('/upload', isAuthenticated, upload.fields([{ name: 'files' }, { name: 'file' }]), BillController.upload);
router.delete('/bills/:id', isAuthenticated, BillController.deleteBill);
router.post('/debug/clear-data', isAuthenticated, DashboardController.clearTestData);
router.get('/history', isAuthenticated, SlipController.getApiHistory);

// Channels Sync (Can be used by mobile)
router.post('/channels', isAuthenticated, ChannelController.saveChannel);
router.delete('/channels', isAuthenticated, ChannelController.disconnectChannel);
router.put('/channels/:id', isAuthenticated, ChannelController.updateBookCode);

// Multi-tenant API
router.use('/tenants', tenantRoutes);
router.use('/users', userManagementRoutes);

// Omise Payment API
router.post('/payments/checkout', isAuthenticated, PaymentController.checkout);
router.get('/payments/sync/:chargeId', isAuthenticated, PaymentController.syncPaymentStatus);
router.post('/payments/webhook', PaymentController.handleWebhook); // Public Webhook
router.post('/pdpa/consent', PdpaController.recordConsent);
router.get('/pdpa/stats', isAuthenticated, PdpaController.getConsentStats);


module.exports = router;
