const {Server} = require('socket.io')
const weaponGeneration = require('./weaponGeneration.js')
const armourGeneration = require('./armourGeneration.js')
const potionGeneration = require('./potionGeneration.js')
const userDb = require('../schemas/userSchema');
const inventoryDb = require('../schemas/inventoryItemSchema');
const equipmentDb = require('../schemas/equipmentItemSchema');
const jwt = require('jsonwebtoken')

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

    let loggedInUsers = []


    io.on('connection', (socket) => {

            console.log(`user connected: ${socket.id}`)

            socket.emit('images', images)

            socket.join('logged-in-users')
            io.in('logged-in-users').emit('loggedInUsers', loggedInUsers)

            socket.on('userLogin', async (token) => {
                console.log('received userLogin request from socket')

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    const userId = decoded.id
                    const userData = await userDb.findOne({_id: userId})

                    if (userData) {
                        loggedInUsers.push({
                            userId,
                            username: userData.username,
                            socketId: socket.id,
                            image: userData.image
                        })

                        // const usersQuery = userDb.find({_id: {$in: loggedInUsers}}, {username: 1, image: 1});
                        // const users = await usersQuery.exec()

                        io.emit('loggedInUsers', loggedInUsers);
                        console.log('loggedInUsers after login', loggedInUsers)
                    } else {
                        console.log('user not found')
                    }
                } catch (error) {
                    console.error('Error while user logging in', error)
                }
            })

            // socket.on('disconnect', () => {
            //     console.log('Socket disconnected:', socket.id);
            // })

            socket.on('userLoggedOut', async (token) => {
                console.log('received userLoggedOut request from socket')

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    const userId = decoded.id
                    const userData = await userDb.findOne({_id: userId})

                    if (userData) {
                        loggedInUsers = loggedInUsers.filter(user => user.id !== userId)
                        console.log('loggedInUsers', loggedInUsers)

                    } else {
                        console.log('user not found')
                    }
                } catch (error) {
                    console.error('Error while user logging in', error)
                }
            })

            socket.on('createGameSession', (user1, user2) => {
                const gameSessionId = Math.random().toString()
                socket.join(gameSessionId);
                console.log(`User ${user1} and ${user2} joined game session ${gameSessionId}`);
            })

            socket.on('userDisconnect', async (token) => {
                console.log('received userDisconnect request from socket')

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    const userId = decoded.id

                    loggedInUsers = loggedInUsers.filter(user => user.id !== userId)
                    console.log('loggedInUsers', loggedInUsers)

                } catch (error) {
                    console.error('Error while user logging in', error)
                }
            })

            socket.on('generateItems', async (data) => {
                console.log('received items generation request from socket')

                const token = data.token
                const price = data.price
                let userId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id
                    const userData = await userDb.findOne({_id: userId})

                    if (userData.money >= price) {
                        const updatedMoney = userData.money - price
                        console.log('user money updated', updatedMoney)

                        await userDb.findOneAndUpdate(
                            {_id: userId},
                            {$set: {money: updatedMoney}},
                            {new: true}
                        )

                        const weapon = weaponGeneration.generateWeapon()
                        const armour = armourGeneration.generateArmour()
                        const potion = potionGeneration.generatePotion()

                        const items = [weapon, armour, potion]
                        console.log('items', items)
                        console.log('updatedMoney', updatedMoney)

                        socket.emit('itemsGenerated', {items, updatedMoney})

                    } else {
                        console.log('not enough money for items generation')
                    }
                } catch (error) {
                    console.error('Error while generating items', error)
                }

            })

            socket.on('addToInventory', async (data) => {
                console.log('received addToInventory request from socket')
                console.log('data from front:', data)

                const token = data.token
                let userId;

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id
                    console.log('User ID:', userId)

                    console.log('DATA: from socket with token and item', data)

                    const newItem = new inventoryDb({
                        userId: userId,
                        name: data.item.name,
                        default: data.item.default,
                        damage: data.item.damage,
                        armour: data.item.armour,
                        image: data.item.image,
                        grade: data.item.grade,
                        hp: data.item.hp,
                        effects: data.item.effects,
                        generateGold: data.item.generateGold,
                    });

                    await newItem.save();
                    const inventory = await inventoryDb.find({userId: userId})
                    socket.emit('updatedInventory', inventory)
                } catch (error) {
                    console.error('Error while adding item to inventory', error)
                }
            })

            socket.on('addToEquipment', async (data) => {
                console.log('received addToEquipment request from socket')

                const token = data.token
                const item = data.item
                let userId;

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id

                    const existingItem = await equipmentDb.findOne({userId, name: item.name});

                    if (existingItem) {
                        console.log(`Item with name '${item.name}' already exists in equipment. Not adding.`)
                        return
                    }

                    const newItem = new equipmentDb({
                        userId: userId,
                        name: data.item.name,
                        default: data.item.default,
                        damage: data.item.damage,
                        armour: data.item.armour,
                        image: data.item.image,
                        grade: data.item.grade,
                        hp: data.item.hp,
                        effects: data.item.effects,
                        generateGold: data.item.generateGold,
                    })

                    await newItem.save();
                    const equipment = await equipmentDb.find({userId: userId})
                    socket.emit('updatedEquipment', equipment)
                } catch (error) {
                    console.error('Error while adding item to equipment', error)
                }
            })

            socket.on('getEquipment', async (data) => {
                const token = data.token
                let userId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id

                    const equipment = await equipmentDb.find({userId: userId})
                    socket.emit('equipment', equipment)
                } catch (error) {
                    console.error('Error while getting inventory', error)
                }
            })

            socket.on('getInventory', async (data) => {
                const token = data.token
                let userId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id

                    const inventory = await inventoryDb.find({userId: userId})
                    socket.emit('inventory', inventory)
                } catch (error) {
                    console.error('Error while getting inventory', error)
                }
            })

            socket.on('deleteFromInventory', async (data) => {
                console.log('received deleteFromInventory request from socket')
                console.log('data from front:', data)

                const token = data.token
                let userId
                const itemId = data.itemId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id


                    const item = await inventoryDb.findOne({_id: itemId})

                    if (item.default || !item) return

                    else {
                        try {
                            await inventoryDb.findOneAndDelete({_id: itemId})
                            const inventory = await inventoryDb.find({userId: userId})
                            console.log('items after deletion', inventory)
                            socket.emit('updatedInventory', inventory);

                        } catch (error) {
                            console.log(error)
                        }
                    }

                } catch (error) {
                    console.log(error)
                }
            })

            socket.on('deleteFromEquipment', async (data) => {
                console.log('received deleteFromEquipment request from socket')

                const token = data.token
                let userId
                const itemId = data.itemId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id;

                    const item = await equipmentDb.findOne({_id: itemId})

                    if (!item) return

                    else {
                        try {
                            await equipmentDb.findOneAndDelete({_id: itemId})
                            const equipment = await equipmentDb.find({userId: userId})
                            console.log('equipment after deletion', equipment)
                            socket.emit('updatedEquipment', equipment);

                        } catch (error) {
                            console.log(error)
                        }
                    }

                } catch (error) {
                    console.log(error)
                }
            })

            socket.on('getUserMoney', async (data) => {
                console.log('received getUserMoney request from socket')

                const token = data.token
                let userId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id

                    const user = await userDb.findOne({_id: userId})
                    const money = user.money

                    socket.emit('userMoney', money)
                } catch (error) {
                    console.error('Error while getting user money', error)
                }
            })

            socket.on('sendGameRequest', (targetSocketId, senderUsername) => {

                const gameRequest = {
                    senderId: socket.id,
                    sender: senderUsername,
                    message: 'Would you like to play a game?',
                }

                io.to(targetSocketId).emit('gameRequest', gameRequest);

            })

            socket.on('acceptGameRequest', (targetSocketId) => {
                const message = 'Game accepted'
                io.to(targetSocketId).emit('acceptedGameRequest', message);
            })

            socket.on('declineGameRequest', (targetSocketId) => {
                const message = 'Game declined'
                io.to(targetSocketId).emit('declinedGameRequest', message);
            })

            socket.on('joinGame', () => {
                socket.join('gameRoom');
            })


        }
    )
}
