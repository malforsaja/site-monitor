const express = require('express')
const https = require('https')
const domainPing = require("domain-ping");
const connectivity = require('connectivity');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
require('dotenv').config()


const app = express()
const port = 3000

const transporter = nodemailer.createTransport({
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
            for (const site of sites) {
                // ping each site
                domainPing(site)
                    .then((res) => {
                        console.log(res.domain, ' is online');
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

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err)
    }
    console.log(`Server is listening on ${port}`)
})