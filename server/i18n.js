var i18next = require('i18next');
var Promise = require('bluebird');

// TODO replace "en" by language of specific user from database
var en = require('./i18n/de.json'); // = requirejs('public/js/app/nls/en/mail');
var de = require('./i18n/en.json'); // = requirejs('public/js/app/nls/de/mail');

exports.initAsync = Promise.promisify(i18next.init).bind(i18next)({
    lng: 'en', // TODO de
    resources: {
        en: { translation: en },
        de: { translation: de }
    }
});

exports.t = i18next.t.bind(i18next);
