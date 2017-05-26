'use strict';

const winston = require('winston');
const raven = require('raven');
const config = require('./config');

if (config.get('raven'))
	raven.config(config.get('raven'), {
		release: require('../package.json').version
	});

const transports = [
	new winston.transports.Console({
		colorize: true,
		timestamp: false,
		prettyPrint: true,
		handleExceptions: true,
		humanReadableUnhandledException: true
	})
];

const logger = new winston.Logger({
	level: config.get('logLevel'),
	transports,
	exitOnError: function (err) {
		if (!config.get('raven')) return true;

		raven.captureException(err, (ravenErr, eventId) => {
			if (ravenErr) logger.warn(ravenErr);
			logger.debug(`Exception sent to Sentry, EventID: ${eventId}.`);
			process.exit(1);
		});

		return false;
	}
});

module.exports = logger;
