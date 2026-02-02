const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { isAuthenticated } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');
const DashboardController = require('../controllers/DashboardController');
const BillController = require('../controllers/BillController');
const SlipController = require('../controllers/SlipController');
const ChannelController = require('../controllers/ChannelController');

// Public API
router.post('/login', AuthController.apiLogin);

// Protected API (Used by Flutter)
router.get('/stats', isAuthenticated, DashboardController.getStats);
router.get('/dashboard/data', isAuthenticated, DashboardController.getApiDashboardData);
router.post('/upload', isAuthenticated, upload.fields([{ name: 'files' }, { name: 'file' }]), BillController.upload);
router.delete('/bills/:id', isAuthenticated, BillController.deleteBill);
router.get('/history', isAuthenticated, SlipController.getApiHistory);

// Channels Sync (Can be used by mobile)
router.post('/channels', isAuthenticated, ChannelController.saveChannel);
router.delete('/channels', isAuthenticated, ChannelController.disconnectChannel);
router.put('/channels/:id', isAuthenticated, ChannelController.updateBookCode);

module.exports = router;
