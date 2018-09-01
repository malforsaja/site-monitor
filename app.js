const express = require('express')
const https = require('https')
const domainPing = require("domain-ping");
var connectivity = require('connectivity');
var CronJob = require('cron').CronJob;
var nodemailer = require('nodemailer');
require('dotenv').config()


const app = express()
const port = 3000

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

let sites = ['www.salvinipremier.it', 'www.asst-franciacorta.it', 'onefirewall.com', 'app.onefirewall.com', 'onefirewall.cloud']

const job = new CronJob('0 0 */1 * * *', function () { // every 2 minutes 0 */2 * * * * 
    const d = new Date();
    // first check for internet connection
    connectivity(function (online) {
        if (online) {
            console.log('connected to the internet!')
            // loop the sites
            for (let i = 0; i < sites.length; i++) {
                // ping each site
                domainPing(sites[i])
                    .then((res) => {
                        console.log(res.domain, ' is online');
                        //console.log(res); 
                    })
                    .catch((error) => {
                        console.log(error.domain, ' is offline');
                        const mailOptions = {
                            from: process.env.EMAIL,
                            to: process.env.RECEIVER,
                            subject: 'Site down',
                            html: `<p>The site <strong> ${error.domain} </strong> is offline. Time: ${d} </p>`
                        };
                        // send email with the options above
                        transporter.sendMail(mailOptions, function (err, info) {
                            if (err)
                                console.log(err)
                            else
                                console.log('Email sent to notify the site was down: ', info);
                        });
                        console.error(error);
                    });
            }
        } else {
            console.error('sorry, not connected!')
        }
    })
});

job.start();


/* https.get(sites[i], function (res) {
        
        // If you get here, you have a response.
        // If you want, you can check the status code here to verify that it's `200` or some other `2xx`.
        if (res.statusCode == 200) {
            console.log('site is online');
        }
        
    }).on('error', function (e) {
        console.log('error arrin');
        
        // Here, an error occurred.  Check `e` for the error.
        console.log('site is offline');

    });; */

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err)
    }
    console.log(`Server is listening on ${port}`)
})