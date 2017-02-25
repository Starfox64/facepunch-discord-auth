'use strict';

const cloudscraper = require('cloudscraper');

module.exports = (url) => {
	return new Promise((resolve, reject) => {
		cloudscraper.get(url, (err, res, body) => {
			if (err) return reject(err);
			resolve(body);
		});
	});
};
