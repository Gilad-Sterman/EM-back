import express from 'express'
import { login, signup, updateExpenses } from './user.controller.js'

export const userRoutes = express.Router()

userRoutes.get('/login', login)
userRoutes.get('/signup', signup)

userRoutes.put('/updateExpenses', updateExpenses)