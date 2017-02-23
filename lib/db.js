'use strict';

const mongoose = require('mongoose');
const config = require('./config');
mongoose.Promise = require('bluebird');

module.exports = mongoose.createConnection(config.get('mongoUrl'));

process.on('SHUTDOWN', () => {
	module.exports.close();
});
