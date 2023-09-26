const express = require('express')
const cors = require('cors')
const app = express()

const router = require('./router/mainRouter')
const mongoose = require('mongoose')

require('dotenv').config()

mongoose?.connect(process.env.DB_KEY)
    .then(() => {
        console.log('connection successful')
    }).catch(e => {
    console.log('error', e)
})

app.get('/', (req, res) => {
    res.send('Root path');
})


const {createServer} = require('node:http')
const {Server} = require('socket.io')

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173'
    }
})

const images = [
    {
        image: 'https://cdn.pixabay.com/photo/2022/12/14/19/34/knight-7656103_1280.jpg',
        username: '',
    },
    {
        image: 'https://cdn.pixabay.com/photo/2022/12/02/21/22/warrior-7631680_1280.jpg',
        username: '',
    },
    {
        image: 'https://cdn.pixabay.com/photo/2023/07/25/22/06/ai-generated-8149993_1280.jpg',
        username: '',
    },
    {
        image: 'https://cdn.pixabay.com/photo/2022/12/02/21/22/warrior-7631678_1280.jpg',
        username: '',
    },
    {
        image: 'https://cdn.pixabay.com/photo/2022/09/27/15/36/diablo-7483039_1280.jpg',
        username: '',
    },
]


io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`)

    socket.emit('images', images)

    // RECEIVES EVENT FROM SINGLE SOCKET

    // socket.on('setUserImage', (data) => {
    //     if (images[data.index] === null) {
    //         images[data.index] = data.photo
    //         images[data.index] = data.username
    //     }
    //
    //     console.log(images)


        io.emit('images', images)

    //
    //
    // socket.on('deleteUserPhoto', (data) => {
    //     if (photos[data.index].username === data.username) {
    //         photos[data.index].photo = null
    //     }
    //
    //     // EMITS EVENT TO ALL SOCKETS
    //     io.emit('photos', photos)
    // })
    //
    // socket.on('updateUsersPhoto', (data) => {
    //
    //     if (photos[data.index].username === data.username) {
    //         photos[data.index].photo = data.photo
    //     }
    //     io.emit('photos', photos)
    // })
    //
    // console.log(photos)

})


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

