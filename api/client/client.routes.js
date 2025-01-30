import express from 'express'
import { addClient, getClient } from './client.controller.js'


export const clientRoutes = express.Router()

clientRoutes.post('/',  addClient)
clientRoutes.get('/:email', getClient)