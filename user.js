'use strict';

const mongoose = require('mongoose');
const db = require('./db');

var User = new mongoose.Schema({
	facepunchId: {type: Number, index: true, unique: true, sparse: true},
	discordId: {type: String, index: true, unique: true, required: true},
	token: {type: String, index: true, unique: true, required: true}
});

module.exports = db.model('User', User);
