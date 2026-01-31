const mysql = require('mysql2/promise');

async function fixPaths() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bill_ocr'
    });

    try {
        const tables = ['ocr_logs', 'payment_slips', 'bills'];

        for (const table of tables) {
            console.log(`Fixing paths in table: ${table}`);
            const [rows] = await db.execute(`SELECT id, image_path FROM ${table}`);

            for (const row of rows) {
                if (row.image_path && (row.image_path.includes(':\\') || row.image_path.includes(':/'))) {
                    const parts = row.image_path.split('uploads');
                    if (parts.length > 1) {
                        const newPath = 'uploads' + parts[1].replace(/\\/g, '/');
                        await db.execute(`UPDATE ${table} SET image_path = ? WHERE id = ?`, [newPath, row.id]);
                        console.log(`  Updated ID ${row.id}: ${newPath}`);
                    }
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
        process.exit();
    }
}

fixPaths();
