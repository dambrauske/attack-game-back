const express = require('express')
const cors = require('cors')
const app = express()

const router = require('./router/mainRouter')
const mongoose = require('mongoose')

require('dotenv').config()
const {createServer} = require('node:http')


mongoose?.connect(process.env.DB_KEY)
    .then(() => {
        console.log('connection successful')
    }).catch(e => {
    console.log('error', e)
})

app.get('/', (req, res) => {
    res.send('Root path');
})

const server = createServer(app)

require('./modules/sockets')(server)

app.use(express.json())
app.use(cors())
app.use('/', router)

const portApp = 8000
const portSocket = 8001


server.listen(portSocket, () => {
    console.log('Socket.IO server running at http://localhost:' + portSocket)
})


app.listen(portApp, () => {
    console.log('Express app running at http://localhost:' + portApp)
})

