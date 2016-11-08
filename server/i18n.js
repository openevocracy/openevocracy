var i18next = require('i18next');
var i18nextnodefsbackend = require('i18next-node-fs-backend');
var Promise = require('bluebird');

i18next.use(i18nextnodefsbackend);

exports.initAsync = Promise.promisify(i18next.init).bind(i18next)({
    lng: 'en', // TODO de
    backend: {
        loadPath: 'lang/en/lang.json',
        //loadPath: 'lang/{{lng}}/lang.json',
        //addPath: 'lang/{{lng}}/lang.missing.json',
        jsonIndent: 2
    }
});

exports.t = i18next.t.bind(i18next);
