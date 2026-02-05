const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function findMysqldump() {
    try {
        const { execSync } = require('child_process');
        // Check standard path first
        try {
            const result = execSync('where mysqldump', { encoding: 'utf8', stdio: 'pipe' });
            const paths = result.trim().split('\n');
            if (paths.length > 0 && paths[0]) return `"${paths[0].trim()}"`;
        } catch (e) {
            // where command failed, ignore
        }
    } catch (e) { }

    // Common Windows Paths
    const possiblePaths = [
        'E:\\xampp\\mysql\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
        'C:\\wamp64\\bin\\mysql\\mysql8.0.27\\bin\\mysqldump.exe',
        'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
        'C:\\MariaDB\\bin\\mysqldump.exe'
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return `"${p}"`;
    }
    return 'mysqldump';
}

const mysqldump = findMysqldump();
const outputFile = path.join(__dirname, '..', 'initial_setup.sql');
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bill_ocr'
};

// Add --routines --triggers to include stored procedures if any
const cmd = `${mysqldump} -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} --hex-blob --default-character-set=utf8mb4 --routines --triggers ${dbConfig.database} > "${outputFile}"`;

console.log(`Using mysqldump at: ${mysqldump}`);
console.log('Generating SQL dump...');
console.log(`Output file: ${outputFile}`);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error('Error generating dump:', error.message);
        console.error('Verify your database connection and mysqldump path.');
        return;
    }
    console.log('✅ Created initial_setup.sql successfully!');
});
