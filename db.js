'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

module.exports = mongoose.createConnection(process.env.FPAUTH_MONGO_URL || 'mongodb://127.0.0.1:27017/fpauth');

process.on('SHUTDOWN', () => {
	module.exports.close();
});
