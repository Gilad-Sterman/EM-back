import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { recurringExpenseService } from '../../services/recurring-expense.service.js'
import axios from 'axios'
import mongodb from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const { ObjectId } = mongodb

export const userService = {
    login,
    signup,
    updateExpenses,
    updateRecurringExpenses
}

async function login(user) {
    try {
        const { username, password } = user
        const collection = await dbService.getCollection('EM_users')
        const res = await collection.findOne({ username })
        if (!res) return { txt: 'שם משתמש לא נמצא' }
        if (res.password !== password) return { txt: 'סיסמא לא נכונה' }
        
        // Process recurring expenses if any exist
        const processedUser = await processRecurringExpenses(res)
        
        logger.info("user.service",`user "${processedUser.username}" logged in`)
        delete processedUser.password
        return processedUser
    } catch (err) {
        logger.error(`while finding user ${username}`, err)
        throw err
    }
}

/**
 * Process recurring expenses for a user
 * Checks for any recurring expenses that should have been generated
 * and creates them if they don't already exist
 * @param {Object} user - The user object
 * @returns {Object} Updated user object with new expenses and updated recurring expenses
 */
async function processRecurringExpenses(user) {
    try {
        // If user has no recurring expenses, return the original user
        if (!user.recurringExpenses || !user.recurringExpenses.length) {
            logger.info("user.service", `No recurring expenses found for user "${user.username}"`)
            return user
        }
        
        logger.info("user.service", `Processing ${user.recurringExpenses.length} recurring expenses for user "${user.username}"`)
        
        // Generate expenses from recurring templates
        const { newExpenses, updatedRecurringExpenses } = recurringExpenseService.generateExpensesFromRecurring(
            user.recurringExpenses,
            user.expenses || []
        )
        
        // If there are no new expenses to add, return the original user
        if (!newExpenses.length) {
            logger.info("user.service", `No new expenses to create from recurring expenses for user "${user.username}"`)
            return user
        }
        
        // Log details about each new expense being created
        newExpenses.forEach(expense => {
            const recurringExpense = user.recurringExpenses.find(re => re.id === expense.recurringId)
            const recurringName = recurringExpense ? (recurringExpense.name || recurringExpense.desc) : 'Unknown'
            
            logger.info("user.service", 
                `Created expense from recurring "${recurringName}": ${expense.paid}₪ on ${expense.date} (${expense.desc})`
            )
        })
        
        // Create updated user object with new expenses and updated recurring expenses
        const updatedUser = {
            ...user,
            expenses: [...(user.expenses || []), ...newExpenses],
            recurringExpenses: updatedRecurringExpenses
        }
        
        // Update the user in the database
        const userCollection = await dbService.getCollection('EM_users')
        await userCollection.updateOne({ _id: user._id }, { $set: updatedUser })
        
        logger.info("user.service", `Generated ${newExpenses.length} recurring expenses for user "${user.username}"`)
        
        return updatedUser
    } catch (err) {
        logger.error(`Failed to process recurring expenses for user ${user._id}:`, err)
        return user
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

async function updateRecurringExpenses(userId, newRecurringExpenses) {
    try {
        const userCollection = await dbService.getCollection('EM_users')
        const user = await userCollection.findOne({ _id: ObjectId(userId) })
        user.recurringExpenses = newRecurringExpenses
        await userCollection.updateOne({ _id: ObjectId(userId) }, { $set: user })
        logger.info("user.service",`user "${user.username}" recurring expenses updated`)
        return user
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}