'use strict';

const mongoose = require('mongoose');
const db = require('../lib/db');

const Guild = new mongoose.Schema({
	id: { type: String, index: true, required: true, unique: true },
	data: { type: Object, required: true, default: {} }
});

module.exports = db.model('Guild', Guild);
