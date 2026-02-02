const SyncController = require('./controllers/SyncController');

const controller = new SyncController();
controller.actionIndex().catch(err => {
    console.error('Fatal synchronization error:', err);
    process.exit(1);
});
