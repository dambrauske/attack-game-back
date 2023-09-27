const {Server} = require('socket.io')
const itemsGeneration = require('./weaponGeneration.js')


module.exports = (server) => {

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

        // io.emit('images', images)

        socket.on('generateWeapon', () => {
            console.log('received request from socket')
            const weapon = itemsGeneration.generateWeapon();
            console.log('Generated weapon:', weapon);

            socket.emit('generatedWeapon', weapon);
        });


    })

}
