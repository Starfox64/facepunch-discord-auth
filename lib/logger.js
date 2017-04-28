'use strict';

const winston = require('winston');
const Graylog = require('winston-graylog2');
const config = require('./config');

let graylogTransport;
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
	graylogTransport = new Graylog({
		level: config.get('logLevel'),
		handleExceptions: true,
		graylog: {
			servers: [{ host: config.get('graylog.host'), port: config.get('graylog.port') }],
			facility: 'fpauth-node'
		}
	});

	transports.push(graylogTransport);
}

const logger = new winston.Logger({
	level: config.get('logLevel'),
	transports
});

process.on('SIGTERM', () => {
	if (!graylogTransport) return;
	graylogTransport.graylog2.close();
});

module.exports = logger;
