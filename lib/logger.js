'use strict';

const winston = require('winston');
const Graylog = require('winston-graylog2');
const config = require('./config');

const transports = [
	new winston.transports.Console({
		colorize: true,
		timestamp: true,
		prettyPrint: true,
		handleExceptions: true,
		humanReadableUnhandledException: true
	})
];

if (config.get('graylog.host')) {
	transports.push(new Graylog({
		level: config.get('logLevel'),
		handleExceptions: true,
		graylog: {
			servers: [{ host: config.get('graylog.host'), port: config.get('graylog.port') }],
			facility: 'fpauth-node'
		}
	}));
}

const logger = new winston.Logger({
	level: config.get('logLevel'),
	transports
});

module.exports = logger;
