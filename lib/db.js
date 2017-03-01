'use strict';

const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./logger');
mongoose.Promise = require('bluebird');

module.exports = mongoose.createConnection(config.get('mongoUrl'));

process.on('SIGTERM', () => {
	logger.debug('Closing mongoose connection...');
	module.exports.close(() => {
		logger.debug('Mongoose connection closed.');
	});
});
