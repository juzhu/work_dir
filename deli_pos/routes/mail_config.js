var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
        service: 'qq',
        port: 465, // SMTP
        secureConnection: true, //SSL
        auth: {
            user: '2202055547@qq.com',
            //smtp passwd
            pass: 'crznbwipetsqdjgb'
        }
	});

exports.mail_transporter = transporter;
