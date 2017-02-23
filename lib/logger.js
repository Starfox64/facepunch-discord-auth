'use strict';

const winston = require('winston');

const logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			colorize: true,
			timestamp: true,
			prettyPrint: true,
			humanReadableUnhandledException: true
		})
	]
});

module.exports = logger;
