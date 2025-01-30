import { logger } from "../../services/logger.service.js"
import { userService } from "./user.service.js"

export async function login(req, res) {
    try {
        const user = req.query
        const myRes = await userService.login(user)
        res.send(myRes)
    } catch (err) {
        logger.error('Failed to login', err)
        res.status(500).send({ err: 'Failed to login' })
    }
}

export async function signup(req, res) {
    try {
        const user = req.query
        const myRes = await userService.signup(user)
        res.send(myRes)
    } catch (err) {
        logger.error('Failed to signup', err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

export async function updateExpenses(req, res) {
    try {
        const { userId, newExpenses } = req.body
        const myRes = await userService.updateExpenses(userId, newExpenses)
        res.send(myRes)
    } catch (err) {
        logger.error('Failed to update expenses', err)
        res.status(500).send({ err: 'Failed to update expenses' })
    }
}