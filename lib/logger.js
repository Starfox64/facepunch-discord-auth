'use strict';

const winston = require('winston');
const config = require('./config');

const logger = new winston.Logger({
	level: config.get('logLevel'),
	transports: [
		new winston.transports.Console({
			colorize: true,
			timestamp: true,
			prettyPrint: true,
			handleExceptions: true,
			humanReadableUnhandledException: true
		})
	]
});

module.exports = logger;
