const nodemailer = require('nodemailer');
const path = require('path');

const {MAILER_LOGIN, MAILER_PASSWORD, WEBSITE} = require('./constants')

let transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
   port: 587,
   auth: {
       user: "apikey",
       pass: process.env.SENDGRID_API_KEY
   }
});

let mailOptions = {
  from: 'contact.alhau@gmail.com',
  subject: 'Lost Password'
};

exports.sendEmail = (email,code) => {
	const to = email;
	const html = `<img src="cid:alhaulogo" style="height:50px"> 
				  <h1> Lost Password </h1>
				  <p> 
					  Hello, a password recovery was requested from Alhau for your email ${email}. You can reset your password using this link:
					  <a href='${WEBSITE}/lostpass?code=${code}'>Reset password </a>.<br/>
					  If you have not requested a recovery please ignore this email.
					  <br/>
					  <br/>
					  Best,
					  <br/>
					  ALHAU team
				  </p> `;

	mailOptions.html = html;
	mailOptions.to = to;
	mailOptions.attachments= [{   // file on disk as an attachment
            filename: 'alhau_logo.png',
            path: path.join(__dirname,'../public/images/alhau_large_logo.png'), // stream this file
            cid:'alhaulogo'
        }]
	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
}