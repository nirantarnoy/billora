const SecurityLogger = require('../utils/securityLogger');

class ErrorHandler {
    /**
     * 403 Forbidden - ไม่มีสิทธิ์เข้าถึง
     */
    static forbidden(req, res, message = 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้') {
        SecurityLogger.logUnauthorizedAccess(req, message);
        // ถ้าเป็น API request หรือ AJAX ให้ return JSON
        if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: message
            });
        }

        // ถ้าเป็น web request ให้แสดงหน้า error สวยงาม
        return res.status(403).render('errors/403', {
            layout: false,
            message: message
        });
    }

    /**
     * 404 Not Found - ไม่พบหน้าที่ต้องการ
     */
    static notFound(req, res) {
        // ถ้าเป็น API request หรือ AJAX ให้ return JSON
        if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: 'ไม่พบข้อมูลที่ต้องการ'
            });
        }

        // ถ้าเป็น web request ให้แสดงหน้า error สวยงาม
        return res.status(404).render('errors/404', {
            layout: false
        });
    }

    /**
     * 500 Internal Server Error - เกิดข้อผิดพลาดในระบบ
     */
    static serverError(err, req, res) {
        console.error('Server Error:', err);

        // ถ้าเป็น API request หรือ AJAX ให้ return JSON
        if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'เกิดข้อผิดพลาดในระบบ',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        }

        // ถ้าเป็น web request ให้แสดงหน้า error
        return res.status(500).send(`
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>เกิดข้อผิดพลาด - Billora</title>
                <script src="/js/tailwind.min.js"></script>
                <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { font-family: 'Prompt', sans-serif; }
                    body {
                        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                </style>
            </head>
            <body>
                <div class="max-w-md w-full mx-4 bg-white rounded-3xl shadow-2xl p-10 text-center">
                    <div class="mb-6">
                        <div class="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <i class="fas fa-exclamation-triangle text-white text-5xl"></i>
                        </div>
                    </div>
                    <h1 class="text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-4">500</h1>
                    <h2 class="text-2xl font-bold text-slate-800 mb-3">เกิดข้อผิดพลาด</h2>
                    <p class="text-slate-600 mb-8">ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง</p>
                    <a href="/dashboard" class="inline-block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 transform">
                        กลับหน้าหลัก
                    </a>
                    ${process.env.NODE_ENV === 'development' ? `
                        <div class="mt-6 p-4 bg-red-50 rounded-xl text-left">
                            <p class="text-xs text-red-600 font-mono">${err.message}</p>
                        </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `);
    }

    /**
     * 401 Unauthorized - ต้องเข้าสู่ระบบ
     */
    static unauthorized(req, res, message = 'กรุณาเข้าสู่ระบบ') {
        // ถ้าเป็น API request หรือ AJAX ให้ return JSON
        if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: message
            });
        }

        // ถ้าเป็น web request ให้ redirect ไป login
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
}

module.exports = ErrorHandler;
