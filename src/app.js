require('dotenv').config();
process.env.TZ = 'Asia/Bangkok';

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const lusca = require('lusca');
const line = require('@line/bot-sdk');

const { handleLineEvent, lineConfig } = require('./controllers/LineController');
const webRoutes = require('./routes/webRoutes');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');
const SecurityLogger = require('./utils/securityLogger');

const app = express();

app.set('trust proxy', true);  // Trust all proxies (needed for Nginx/Cloudflare)

// LINE Webhook BEFORE express.json()
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
    const io = req.app.get('io');
    Promise
        .all(req.body.events.map(event => handleLineEvent(event, io)))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'billora-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false, // Set to true if using HTTPS in production
        sameSite: 'lax'
    }
}));

// Security (Excluding /api and /webhook from CSRF)
const security = lusca({
    csrf: true,
    xframe: 'SAMEORIGIN',
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xssProtection: true,
    nosniff: true
});

app.use((req, res, next) => {
    const isApi = req.originalUrl.startsWith('/api');
    const isWebhook = req.originalUrl === '/webhook';
    const isRootPost = req.originalUrl === '/' && req.method === 'POST';
    if (isApi || isWebhook || isRootPost) {
        return next();
    }

    // Log potential CSRF issues (for other paths)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        console.log(`[CSRF Check] ${req.method} ${req.originalUrl}`);
    }

    security(req, res, (err) => {
        if (err && err.code === 'EBADCSRFTOKEN') {
            SecurityLogger.logCsrfAttack(req);
            return res.status(403).send('Invalid CSRF Token - Suspicious Activity Logged');
        }
        next(err);
    });
});

// Global Template Variables & Tenant Loading
app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.tenant = null;
    res.locals._csrf = res.locals._csrf || '';

    // Bypass for login/logout/public routes to avoid infinite loops
    const publicPaths = ['/login', '/logout', '/register', '/api/login'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    if (req.session.user) {
        try {
            const pool = require('./config/db');

            // 1. Load Latest User Data (to sync permissions)
            const [users] = await pool.query(
                `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
                [req.session.user.id]
            );

            if (users.length === 0 || !users[0].is_active) {
                req.session.destroy();
                if (req.xhr || req.originalUrl.startsWith('/api/')) {
                    return res.status(401).json({ success: false, message: 'บัญชีถูกระงับ' });
                }
                return res.redirect('/login?error=account_inactive');
            }

            const dbUser = users[0];
            // Format permissions
            if (dbUser.permissions && typeof dbUser.permissions === 'string') {
                try {
                    dbUser.permissions = JSON.parse(dbUser.permissions);
                } catch (e) {
                    dbUser.permissions = {};
                }
            }

            // Update session data to stay in sync
            req.session.user.permissions = dbUser.permissions;
            req.session.user.role = dbUser.role;

            res.locals.user = dbUser;
            req.user = dbUser;

            // 2. Load Tenant Data & Enforce Active Status
            if (dbUser.tenant_id) {
                const [tenants] = await pool.query(
                    `SELECT * FROM tenants WHERE id = ? AND deleted_at IS NULL`,
                    [dbUser.tenant_id]
                );

                if (tenants.length === 0 || !tenants[0].is_active) {
                    // Do not block Super Admin from system tenant (ID 1)
                    if (dbUser.tenant_id !== 1) {
                        req.session.destroy();
                        if (req.xhr || req.originalUrl.startsWith('/api/')) {
                            return res.status(403).json({ success: false, message: 'องค์กรถูกระงับการใช้งาน' });
                        }
                        return res.redirect('/login?error=tenant_inactive');
                    }
                }

                if (tenants.length > 0) {
                    const tenant = tenants[0];
                    if (tenant.features && typeof tenant.features === 'string') {
                        try {
                            tenant.features = JSON.parse(tenant.features);
                        } catch (e) {
                            tenant.features = {};
                        }
                    }
                    if (tenant.settings && typeof tenant.settings === 'string') {
                        try {
                            tenant.settings = JSON.parse(tenant.settings);
                        } catch (e) {
                            tenant.settings = {};
                        }
                    }
                    res.locals.tenant = tenant;
                    req.tenant = tenant;
                }
            }
        } catch (err) {
            console.error('Global Loader Error:', err);
        }
    }
    next();
});

// Route Mapping
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('landing', { layout: false });
});

app.use('/', authRoutes);
app.use('/', webRoutes);
app.use('/api', apiRoutes);

module.exports = app;
