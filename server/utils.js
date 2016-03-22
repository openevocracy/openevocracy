var _ = require('underscore');
var rp = require('request-promise');
var requirejs = require('requirejs');
var nodemailer = require('nodemailer');

var cfg = requirejs('public/js/setup/configs');

var transporter;

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

exports.getPadBodyAsync = function(pid) {
    // get html export
    var padurl = cfg.ETHERPAD_HOST+pid+'/export/html';
    return rp.get(padurl).then(function(data) {
        
        //var body = data.statusCode;
        var str = data.replace(/\r?\n/g, "");
        var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
        
        return body;
    }).timeout(1000).catch(function (err) {
        return err.message;
    });
};

exports.getPadPDFAsync = function(pid) {
    // get pdf export
    var padurl = cfg.ETHERPAD_HOST+pid+'/export/pdf';
    return rp.get(padurl, {encoding: null}).catch(function (err) {
        return err.message;
    });
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
        auth: {
            user: 'noreply@openevocracy.org',
            pass: 'hpbqmigjdo'
        }
    };
    
    this.transporter = nodemailer.createTransport(smtpConfig);
}

exports.sendMail = function(mailTo, mailSubject, mailText) {
    var mailOptions = {
        from: '"Evocracy Project" <noreply@openevocracy.org>', // sender address
        to: mailTo, // list of receivers
        subject: mailSubject, // Subject line
        text: mailText//, // plaintext body
        //html: '<b>Welcome/b>' // html body
    };
    
    this.transporter.sendMail(mailOptions, function(error, info){
        if(error)
            return console.log(error);
        console.log('Message sent: ' + info.response);
    });
}