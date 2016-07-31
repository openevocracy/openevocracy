var _ = require('underscore');
var rp = require('request-promise');
var requirejs = require('requirejs');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');

var cfg = requirejs('public/js/setup/configs');

var transporter;

exports.sendNotification = function(res,status,message) {
    res.status(status).send({'status': status, 'message': message});
}
exports.rejectPromiseWithNotification = function(status,message) {
    return Promise.reject({'status': status, 'message': message});
}
exports.isOwnError = function(error) {
    return _.has(error,'status') && _.has(error,'message');
}
exports.handleOwnError = function(res) {
    return function(error) {
        res.status(error.status).send(error);
    };
}

var ObjectIdToStringMapper = exports.ObjectIdToStringMapper = function(obj) {
    return _.mapObject(obj,function(val) {
        return val.toString();
    });
};

var ObjectIdToStringMapperArray = exports.ObjectIdToStringMapperArray = function(objs) {
    return _.map(objs,ObjectIdToStringMapper);
};

exports.checkArrayEntryExists = function(objs,obj) {
    return _.findWhere(ObjectIdToStringMapperArray(objs),
                       ObjectIdToStringMapper(obj)) != undefined;
};

exports.initializeMail = function() {
    var smtpConfig = {
        host: 'smtp.openevocracy.org',
        port: 2587,
        secure: false,
        //logger: true,
        //debug: true,
        tls: {
            rejectUnauthorized: false // allow self signed certificate
        },
        
        auth: db.collection('configs').findOneAsync({'type': 'mailauth'},{'user': true, 'pass': true})
    };
    
    Promise.props(smtpConfig).then(function(smtpConfig) {
        this.transporter = nodemailer.createTransport(smtpConfig);
    }.bind(this));
};

exports.sendMail = function(mailTo, mailSubject, mailText) {
    var mailOptions = {
        from: '"Evocracy Project" <noreply@openevocracy.org>', // sender address
        to: mailTo, // list of receivers
        subject: mailSubject, // Subject line
        text: mailText//, // plaintext body
        //html: '<b>Welcome/b>' // html body
    };
    
    if(cfg.MAIL) {
        this.transporter.sendMail(mailOptions, function(error, info){
            if(error)
                return console.log(error);
            console.log('Message sent: ' + info.response);
        });
    } else {
        console.log('Message was NOT sent: Configurations flag MAIL was set to false');
    }
};