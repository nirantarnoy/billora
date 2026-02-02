const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

router.get('/login', AuthController.webLogin);
router.post('/login', AuthController.processWebLogin);
router.get('/logout', AuthController.webLogout);

module.exports = router;
