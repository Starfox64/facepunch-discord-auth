'use strict';

const request = require('./request');
const cheerio = require('cheerio');
const co = require('co');

const FP_PROFILE_URL = 'https://facepunch.com/member.php?u=';

module.exports = (facepunchId) => {
	return co(function*() {
		let html = yield request(FP_PROFILE_URL + facepunchId);

		if (!html) return {ok: false};

		let $ = cheerio.load(html);

		let token = $('#view-aboutme dt:contains(Flickr username:) + dd').text();
		token = token.length > 0 ? token : null;

		let postCount = Number($('.member_blockrow dt:contains(Total Posts) + dd').text().replace(/[^0-9 | ^.]/g, ''));
		let isGoldMember = $('#userinfo strong > font').attr('color') === '#A06000';
		let username = $('#userinfo > span:first-child').text();

		return {
			ok: true,
			token,
			postCount,
			isGoldMember,
			username
		};
	});
};
