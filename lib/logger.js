'use strict';

const winston = require('winston');

const logger = new winston.Logger({
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
