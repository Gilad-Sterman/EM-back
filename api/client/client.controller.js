import { logger } from '../../services/logger.service.js'
import { clientService } from './client.service.js'

export async function getClient(req, res) {
    try {
        const client = await clientService.getByEmail(req.params.email)
        logger.info(client)
        res.send(client)
    } catch (err) {
        logger.error('Failed to get client', err)
        res.status(500).send({ err: 'Failed to get client' })
    }
}

export async function addClient(req, res) {
    try {
        const { clientInfo } = req.body
        const newClient = await clientService.add(clientInfo)
        res.send(newClient)
    } catch (err) {
        logger.error('Failed to add client', err)
        res.status(500).send({ err: 'Failed to add client' })
    }
}

// export async function getClients(req, res) {
//     try {
//         const filterBy = {
//             txt: req.query?.txt || '',
//         }
//         const clients = await clientService.query(filterBy)
//         res.send({clients: clients.length})
//     } catch (err) {
//         logger.error('Failed to get clients', err)
//         res.status(500).send({ err: 'Failed to get clients' })
//     }
// }