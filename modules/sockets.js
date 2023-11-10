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
        'https://cdn.pixabay.com/photo/2022/12/14/19/34/knight-7656103_1280.jpg',
        'https://cdn.pixabay.com/photo/2022/12/02/21/22/warrior-7631680_1280.jpg',
        'https://cdn.pixabay.com/photo/2023/07/25/22/06/ai-generated-8149993_1280.jpg',
        'https://cdn.pixabay.com/photo/2022/12/02/21/22/warrior-7631678_1280.jpg',
        'https://cdn.pixabay.com/photo/2022/09/27/15/36/diablo-7483039_1280.jpg',
    ]

    let loggedInUsers = []

    io.on('connection', (socket) => {

            console.log(`user connected: ${socket.id}`)

            socket.on('disconnect', () => {
                console.log(`Socket ${socket.id} disconnected`)
                loggedInUsers = loggedInUsers.filter(user => user.socketId !== socket.id)
                io.emit('loggedInUsers', loggedInUsers)
            })

            socket.emit('images', images)

            socket.on('getLoggedInUsers', () => {
                io.emit('loggedInUsers', loggedInUsers)
            })

            socket.on('userLogin', async (token) => {
                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    const userId = decoded.id
                    const userData = await userDb.findOne({_id: userId})

                    if (userData) {

                        const userAlreadyOnline = loggedInUsers.find(user => user.id === userData._id)

                        if (userAlreadyOnline) {
                            loggedInUsers = loggedInUsers.map(user => {
                                if (user.id === userAlreadyOnline.id) {
                                    return {
                                        ...user,
                                        socketId: socket.id,
                                    }
                                }
                                return user
                            })
                        } else {
                            loggedInUsers.push({
                                id: userId,
                                username: userData.username,
                                socketId: socket.id,
                                image: userData.image
                            })
                        }
                        io.emit('loggedInUsers', loggedInUsers)
                    } else {
                        console.error('user not found')
                    }
                } catch (error) {
                    console.error('Error while user logging in', error)
                }
            })

            socket.on('userLoggedOut', async (token) => {
                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    const userId = decoded.id
                    const userData = await userDb.findOne({_id: userId})

                    if (userData) {
                        loggedInUsers = loggedInUsers.filter(user => user.id !== userId)
                        io.emit('loggedInUsers', loggedInUsers)

                    } else {
                        console.error('user not found')
                    }
                } catch (error) {
                    console.error('Error while user logging in', error)
                }
            })

            socket.on('generateItems', async (data) => {
                const token = data.token
                const price = data.price
                let userId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id
                    const userData = await userDb.findOne({_id: userId})

                    if (userData.money >= price) {
                        const updatedMoney = userData.money - price

                        await userDb.findOneAndUpdate(
                            {_id: userId},
                            {$set: {money: updatedMoney}},
                            {new: true}
                        )

                        const weapon = weaponGeneration.generateWeapon()
                        const armour = armourGeneration.generateArmour()
                        const potion = potionGeneration.generatePotion()

                        const items = [weapon, armour, potion]

                        socket.emit('itemsGenerated', {items, updatedMoney})

                    } else {
                        console.error('not enough money for items generation')
                    }
                } catch (error) {
                    console.error('Error while generating items', error)
                }

            })

            socket.on('addToInventory', async (data) => {
                const token = data.token
                let userId

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
                const token = data.token
                const item = data.item
                let userId

                try {
                    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
                    userId = decoded.id

                    const existingItem = await equipmentDb.findOne({userId, name: item.name});

                    if (existingItem) {
                        console.error(`Item with name '${item.name}' already exists in equipment. Not adding.`)
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
                            socket.emit('updatedInventory', inventory);

                        } catch (error) {
                            console.error(error)
                        }
                    }

                } catch (error) {
                    console.error(error)
                }
            })

            socket.on('deleteFromEquipment', async (data) => {
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
                            socket.emit('updatedEquipment', equipment);

                        } catch (error) {
                            console.error(error)
                        }
                    }

                } catch (error) {
                    console.error(error)
                }
            })

            socket.on('getUserMoney', async (data) => {
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

            socket.on('sendGameRequest', (sender, receiver) => {
                const receiverLoggedIn = loggedInUsers.filter(user => user.username === receiver)
                const receiverSocketid = receiverLoggedIn[0].socketId

                const data = {
                    senderId: socket.id,
                    receiverId: receiverSocketid,
                    sender,
                    receiver,
                    message: 'Would you like to play a game?',
                }

                io.to(receiverSocketid).emit('gameRequest', data)
            })

            socket.on('acceptGameRequest', async (sender, receiver) => {
                const receiverLoggedIn = loggedInUsers.filter(user => user.username === receiver)
                const receiverSocketId = receiverLoggedIn[0].socketId

                const senderLoggedIn = loggedInUsers.filter(user => user.username === sender)
                const senderSocketId = senderLoggedIn[0].socketId

                const data = {
                    sender,
                    receiver,
                    message: 'Game accepted',
                }

                try {
                    const senderFound = await userDb.findOne({username: sender})
                    const receiverFound = await userDb.findOne({username: receiver})

                    const senderEquipment = await equipmentDb.find({userId: senderFound._id})
                    const receiverEquipment = await equipmentDb.find({userId: receiverFound._id})

                    const senderImage = senderFound.image
                    const receiverImage = receiverFound.image

                    const player1 = {
                        username: sender,
                        image: senderImage,
                        hp: 100,
                        money: 0,
                        attackTurn: sender,
                        equipment: senderEquipment,
                    }

                    const player2 = {
                        username: receiver,
                        image: receiverImage,
                        hp: 100,
                        money: 0,
                        attackTurn: sender,
                        equipment: receiverEquipment,
                    }

                    io.to(receiverSocketId).emit('acceptedGameRequest', {player1, player2, data})
                    io.to(senderSocketId).emit('otherUserAcceptedGameRequest', {player1, player2, data})
                } catch (e) {
                    console.error(e)
                }
            })

            socket.on('declineGameRequest', (sender) => {
                const senderLoggedIn = loggedInUsers.filter(user => user.username === sender)
                const senderSocketid = senderLoggedIn[0].socketId
                const message = 'Game declined'
                io.to(senderSocketid).emit('declinedGameRequest', message);
            })

            socket.on('usePotion', (data) => {
                const player1Data = data.player1
                const player2Data = data.player2
                const player1Equipment = data.player1.equipment
                const player2Equipment = data.player2.equipment
                const currentUsername = data.currentUsername

                const user = loggedInUsers.filter(user => user.username === currentUsername)
                const userSocketid = user[0].socketId

                if (player1Data.username === currentUsername) {
                    const player2LoggedIn = loggedInUsers.filter(user => user.username === player2Data.username)
                    const player2SocketId = player2LoggedIn[0].socketId

                    const potion = player1Data.equipment.find(item => item.name === "potion")
                    const hp = potion.hp
                    const updatedHp = player1Data.hp + hp >= 100 ? 100 : player1Data.hp + hp
                    const updatedEquipment = player1Equipment.filter(item => item.name !== "potion")

                    const player1 = {
                        username: player1Data.username,
                        image: player1Data.image,
                        hp: updatedHp,
                        money: player1Data.money,
                        attackTurn: player1Data.attackTurn,
                        equipment: updatedEquipment,
                    }

                    const player2 = {
                        username: player2Data.username,
                        image: player2Data.image,
                        hp: player2Data.hp,
                        money: player2Data.money,
                        attackTurn: player2Data.attackTurn,
                        equipment: player2Data.equipment,
                    }
                    io.to(userSocketid).emit('potionUsed', {player1, player2});
                    io.to(player2SocketId).emit('potionUsed', {player1, player2});
                }

                if (player2Data.username === currentUsername) {
                    const player1LoggedIn = loggedInUsers.filter(user => user.username === player1Data.username)
                    const player1SocketId = player1LoggedIn[0].socketId

                    const potion = player2Equipment.find(item => item.name === "potion")
                    const hp = potion.hp
                    const updatedHp = player1Data.hp + hp >= 100 ? 100 : player1Data.hp + hp
                    const updatedEquipment = player2Data.equipment.filter(item => item.name !== "potion")

                    const player1 = {
                        username: player1Data.username,
                        image: player1Data.image,
                        hp: player1Data.hp,
                        money: player1Data.money,
                        attackTurn: player1Data.attackTurn,
                        equipment: player1Data.equipment,
                    }

                    const player2 = {
                        username: player2Data.username,
                        image: player2Data.image,
                        hp: updatedHp,
                        money: player2Data.money,
                        attackTurn: player2Data.attackTurn,
                        equipment: updatedEquipment,
                    }
                    io.to(userSocketid).emit('potionUsed', {player1, player2});
                    io.to(player1SocketId).emit('potionUsed', {player1, player2});
                }
            })

            socket.on('sendAttackData', (player1, player2) => {
                const player1LoggedIn = loggedInUsers.filter(user => user.username === player1.username)
                const player1SocketId = player1LoggedIn[0].socketId
                const player2LoggedIn = loggedInUsers.filter(user => user.username === player2.username)
                const player2SocketId = player2LoggedIn[0].socketId
                const player1Weapon = player1.equipment.find(item => item.name === 'weapon')
                const player2Weapon = player2.equipment.find(item => item.name === 'weapon')
                const player1Armour = player1.equipment.find(item => item.name === 'armour')
                const player2Armour = player2.equipment.find(item => item.name === 'armour')
                let player1Damage
                let player2Damage
                const blockedDamage = (armour, damage) => {
                    return (armour / 100) * damage
                }

                if (player1.attackTurn === player1.username) {
                    if (player2Armour) {
                        player2Damage = (player1Weapon.damage - blockedDamage(player2Armour.armour, player1Weapon.damage))
                    } else {
                        player2Damage = player1Weapon.damage
                    }

                    player1.money += player1Weapon.generateGold
                    player1.attackTurn = player2.username
                    player2.attackTurn = player2.username
                    player2.hp = player2.hp - player2Damage

                    io.to(player1SocketId).emit('attackData', {player1, player2})
                    io.to(player2SocketId).emit('attackData', {player1, player2})

                } else {
                    if (player1Armour) {
                        player1Damage = (player2Weapon.damage - blockedDamage(player1Armour.armour, player2Weapon.damage))
                    } else {
                        player1Damage = player2Weapon.damage
                    }

                    player2.money += player2Weapon.generateGold
                    player2.attackTurn = player1.username
                    player1.attackTurn = player1.username
                    player1.hp = player1.hp - player1Damage

                    io.to(player1SocketId).emit('attackData', {player1, player2})
                    io.to(player2SocketId).emit('attackData', {player1, player2})
                }

            })

            socket.on('userWon', async (winner) => {
                const winnerLoggedIn = loggedInUsers.filter(user => user.username === winner.username)
                const winnerSocketId = winnerLoggedIn[0].socketId

                try {
                    const userInDb = await userDb.findOne({username: winner.username})
                    const previousMoney = userInDb.money

                    if (userInDb) {
                        await userDb.findOneAndUpdate(
                            { username: userInDb.username },
                            { $set: { money: previousMoney + winner.money } },
                            { new: true }
                        )
                    }

                    const user = await userDb.findOne({username: userInDb.username}).select('-password')
                    const money = user.money

                    io.to(winnerSocketId).emit('winnerMoney', money)
                } catch (e) {
                    console.error(e)
                }

            })

        }
    )
}
