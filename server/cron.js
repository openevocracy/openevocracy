var _ = require('underscore');
const CronJob = require('cron').CronJob;
const cfg = require('../shared/config').cfg;
const mail = require('./mail');
const chats = require('./chats');
const topics = require('./routes/topics');

/**
 * @desc: Defines several cronjob intervals and starts all of them in the end
 */
exports.initializeAndStart = function() {
	// Each minute
	const each5Minutes = new CronJob({
		cronTime: '*/5 * * * *',
		onTick: calledEach5Minutes,
		start: true
	});
	
	// Each 15 seconds
	const each15Seconds = new CronJob({
		cronTime: '*/15 * * * * *',
		onTick: calledEach15Seconds,
		start: true
	});
	
	// Start all cronjobs
	each5Minutes.start();
	each15Seconds.start();
};

/**
 * @desc: This function is called every minute
 */
function calledEach5Minutes() {
	// Manage topics
	topics.manage.manageAndListTopicsAsync().then(function(topics) {
		// FIXME: An error could occur if i18n and mail initialization is not ready when cronjob runs for the first time
		_.map(topics, mail.sendTopicReminderMessages); // NOTE Promise.map does not work above
	});
	
	// Regularily check for chatroom orphans
	const now = new Date().getTime();
	_.each(chats.rooms, (room, id) => {
		// If room was not used for a longer time, remove it from cache
		if (room.cacheUpdate + cfg.CHATROOM_CACHE_TIMEOUT < now)
			delete chats.rooms[id];
	});
}

/**
 * @desc: This function is called every 10 seconds
 */
function calledEach15Seconds() {
	// Sends first email from queue, if exists
	mail.sendMailFromQueue();
}
