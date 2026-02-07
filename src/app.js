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
    const isInventoryBulk = req.originalUrl === '/inventory/transaction/bulk';
    const isRootPost = (req.originalUrl === '/' || req.originalUrl === '') && req.method === 'POST';

    if (isApi || isWebhook || isInventoryBulk || isRootPost) {
        return next();
    }

    // Log potential CSRF issues (for other paths)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        console.log(`[CSRF Check] ${req.method} ${req.originalUrl}`);
    }

    security(req, res, next);
});

// Global Template Variables
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals._csrf = res.locals._csrf || ''; // Lusca usually sets this
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
