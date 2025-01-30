import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import axios from 'axios'
import mongodb from 'mongodb'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const { ObjectId } = mongodb

export const clientService = {
    getByEmail,
    add
}

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "g.sterman.cp@gmail.com",
        pass: process.env.GMAIL_APP_PASS,
    },
})

async function add(client) {
    try {
        const existClient = await getByEmail(client.email)
        if (existClient) return existClient

        const clientToAdd = {
            email: client.email,
            name: client.name,
            addInfo: client.addInfo,
            createdAt: Date.now()
        }
        const mailOptions = {
            from: "g.sterman.cp@gmail.com",
            to: client.email,
            subject: "Thank You for Reaching Out!",
            text: `Hi ${client.name},
Thank you for getting in touch! We appreciate you taking the time to reach out and express interest in our web development services.
We're excited to learn more about your project and how we can help bring your vision to life. We bring a unique blend of skills and expertise to every project we undertake. Our proficiency spans a wide range of technologies including HTML, CSS, JavaScript, React.js, Node.js, Express.js, MongoDB, and more.
Here's what you can expect next:
            
Initial Consultation: We will review your message and get back to you within 24 hours to schedule an initial consultation. This will help us discuss your project requirements in detail and understand your goals.
Project Proposal: Following our discussion, we will prepare a detailed project proposal outlining the scope, timeline, and costs involved.
Kickoff Meeting: Once we agree on the terms, we’ll have a kickoff meeting to set the stage for a successful collaboration.
            
In the meantime, feel free to explore the portfolio to see some of the projects we’ve worked on. If you have any immediate questions, don’t hesitate to reply to this email.
Looking forward to connecting with you soon!
            
Best regards,
            
Gilad Sterman
Web Developer
            
g.sterman.cp@gmail.com
+972-58-500-3431
https://www.linkedin.com/in/gilad-sterman-7b2469278/
https://github.com/Gilad-Sterman
http://www.g-soft.site/ `,
        }

        const alertMail = {
            from: "g.sterman.cp@gmail.com",
            to: "g.sterman.cp@gmail.com",
            subject: "New client",
            text: `Name: ${client.name}, Email: ${client.email}`
        }
        const collection = await dbService.getCollection('clients')
        await collection.insertOne(clientToAdd)
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
            } else {
                console.log("Email sent: ", info.response);
            }
        })

        transporter.sendMail(alertMail, (error, info) => {
            if (error) {
                console.error("Error sending alert email: ", error);
            } else {
                console.log("Alert email sent: ", info.response);
            }
        })

        return clientToAdd
    } catch (err) {
        logger.error('cannot insert client', err)
        throw err
    }
}

async function getByEmail(email) {
    try {
        const collection = await dbService.getCollection('clients')
        const client = await collection.findOne({ email })
        return client
    } catch (err) {
        logger.error(`while finding client ${email}`, err)
        throw err
    }
}
