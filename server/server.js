// server.js — Entry point (starts the HTTP server)
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => logger.success('[SERVER]', `Running on port ${PORT}`));
