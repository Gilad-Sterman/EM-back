import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import axios from 'axios'
import mongodb from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const { ObjectId } = mongodb

export const userService = {
    login,
    signup,
    updateExpenses
}

async function login(user) {
    try {
        const { username, password } = user
        const collection = await dbService.getCollection('EM_users')
        const res = await collection.findOne({ username })
        if (!res) return { txt: 'שם משתמש לא נמצא' }
        if (res.password !== password) return { txt: 'סיסמא לא נכונה' }
        logger.info("user.service",`user "${res.username}" logged in`)
        delete res.password
        return res
    } catch (err) {
        logger.error(`while finding user ${username}`, err)
        throw err
    }
}

async function signup(user) {
    try {
        const { username, password } = user
        const collection = await dbService.getCollection('EM_users')
        const res = await collection.findOne({ username })
        if (res) return { txt: 'שם משתמש כבר קיים' }
        const newUser = {
            username,
            password,
            expenses: [],
        } 
        const insertRes = await collection.insertOne(newUser)
        newUser._id = insertRes.insertedId
        logger.info("user.service",`user "${username}" signup`)
        delete newUser.password
        return newUser
    } catch (err) {
        logger.error(`while finding user ${username}`, err)
        throw err
    }
}

async function updateExpenses(userId, newExpenses) {
    try {
        const userCollection = await dbService.getCollection('EM_users')
        const user = await userCollection.findOne({ _id: ObjectId(userId) })
        user.expenses = newExpenses
        await userCollection.updateOne({ _id: ObjectId(userId) }, { $set: user })
        logger.info("user.service",`user "${user.username}" expenses updated`)
        return user
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}