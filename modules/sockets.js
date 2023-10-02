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

            socket.on('getLoggedInUsers', () => {
                io.to('logged-in-users').emit('loggedInUsers', loggedInUsers)
            })

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

                        io.emit('loggedInUsers', loggedInUsers)
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
                        loggedInUsers = loggedInUsers.filter(user => user.userId !== userId)
                        io.emit('loggedInUsers', loggedInUsers)

                    } else {
                        console.log('user not found')
                    }
                } catch (error) {
                    console.error('Error while user logging in', error)
                }
            })

            // socket.on('createGameSession', (user1, user2) => {
            //     const gameSessionId = Math.random().toString()
            //     socket.join(gameSessionId);
            //     console.log(`User ${user1} and ${user2} joined game session ${gameSessionId}`);
            // })

            socket.on('userDisconnect', async (token) => {
                console.log('received userDisconnect request from socket')

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    const userId = decoded.id

                    loggedInUsers = loggedInUsers.filter(user => user.userId !== userId)
                    io.emit('loggedInUsers', loggedInUsers)


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

                const token = data.token
                let userId;

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id


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

            socket.on('sendGameRequest', (targetSocketId, senderUsername, receiverUsername) => {

                const data = {
                    senderId: socket.id,
                    receiverId: targetSocketId,
                    sender: senderUsername,
                    receiver: receiverUsername,
                    message: 'Would you like to play a game?',
                }

                io.to(targetSocketId).emit('gameRequest', data);
            })


            socket.on('acceptGameRequest', (targetSocketId, senderUsername, receiverUsername) => {
                const data = {
                    senderId: socket.id,
                    receiverId: targetSocketId,
                    sender: senderUsername,
                    receiver: receiverUsername,
                    message: 'Game accepted',
                }
                io.to(targetSocketId).emit('acceptedGameRequest', data);
            })

            socket.on('declineGameRequest', (targetSocketId) => {
                const message = 'Game declined'
                io.to(targetSocketId).emit('declinedGameRequest', message);
            })

            socket.on('joinGame', async (sender, receiver) => {
                console.log('JOIN GAME REQUEST')
                socket.join('gameRoom')

                console.log('sender from front', sender)
                console.log('receiver from front', receiver)

                try {
                    const senderFound = await userDb.findOne({username: sender})
                    const receiverFound = await userDb.findOne({username: receiver})

                    console.log('senderFound in database', senderFound)
                    console.log('receiverFound in database', receiverFound)

                    const senderEquipment = await equipmentDb.find({userId: senderFound._id})
                    const receiverEquipment = await equipmentDb.find({userId: receiverFound._id})

                    console.log('EQUIPMENT senderEquipment:', senderEquipment)
                    console.log('EQUIPMENT receiverEquipment:', receiverEquipment)

                    const senderImage = senderFound.image
                    const receiverImage = receiverFound.image

                    const player1 = {
                        username: sender,
                        image: senderImage,
                        hp: 100,
                        money: 0,
                        attackTurn: true,
                        equipment: senderEquipment,
                    }

                    const player2 = {
                        username: receiver,
                        image: receiverImage,
                        hp: 100,
                        money: 0,
                        attackTurn: false,
                        equipment: receiverEquipment,
                    }

                    const gameData = [player1, player2]
                    console.log('gameData', gameData)

                    io.to('gameRoom').emit('StartGameData', gameData)
                } catch (error) {
                    console.error('Error while StartGameData', error)
                }


            })

            socket.on('sendAttackData', async (player1, player2) => {
                console.log('received sendAttackData REQUEST:')

                console.log('player1', player1)
                console.log('player2', player2)

                const player1Weapon = player1.equipment.find(item => item.name === 'weapon')
                const player2Weapon = player2.equipment.find(item => item.name === 'weapon')
                const player1Armour = player1.equipment.find(item => item.name === 'armour')
                const player2Armour = player2.equipment.find(item => item.name === 'armour')

                console.log('player1Weapon', player1Weapon)
                console.log('player1Armour', player1Armour)
                console.log('player2Weapon', player1Weapon)
                console.log('player2Armour', player1Armour)
                const blockedDamage = (armour, damage) => {
                    return (armour / 100) * damage
                }

                if (player1.attackTurn === true) {
                    player2.hp -= (player1Weapon.damage - blockedDamage(player2Armour.armour, player1Weapon.damage))
                    player1.money += player1Weapon.generateGold
                    player2.attackTurn = true
                    player1.attackTurn = false
                }

                if (player2.attackTurn === true) {
                    player1.hp -= (player2Weapon.damage - blockedDamage(player1Armour.armour, player2Weapon.damage))
                    player2.money += player2Weapon.generateGold
                    player1.attackTurn = true
                    player2.attackTurn = false
                }

                const attackData = [player1, player2]
                console.log('attackData', attackData)

                io.to('gameRoom').emit('attackData', attackData)

            })

        }
    )
}
