const {Server} = require('socket.io')
const weaponGeneration = require('./weaponGeneration.js')
const armourGeneration = require('./armourGeneration.js')
const potionGeneration = require('./potionGeneration.js')
const userDb = require('../schemas/userSchema');
const inventoryDb = require('../schemas/inventoryItemSchema');
const jwt = require('jsonwebtoken')

// const defaultWeaponGeneration = require('./defaultWeaponGeneration.js')


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

        // socket.once('generateDefaultWeapon', () => {
        //     console.log('received default weapon request from socket')
        //     const defaultWeapon = defaultWeaponGeneration.generateDefaultWeapon()
        //     console.log('Generated default weapon:', defaultWeapon)
        //     socket.emit('generatedDefaultWeapon', defaultWeapon)
        //
        // })

        // io.emit('images', images)

        socket.on('generateWeapon', () => {
            console.log('received weapon request from socket')
            const weapon = weaponGeneration.generateWeapon()

            // console.log('Generated weapon:', weapon)
            socket.emit('generatedWeapon', weapon)

        })

        socket.on('generateArmour', () => {
            console.log('received armour request from socket')
            const armour = armourGeneration.generateArmour()

            // console.log('Generated armour:', armour)
            socket.emit('generatedArmour', armour)
        })

        socket.on('generatePotion', () => {
            console.log('received potion request from socket')
            const potion = potionGeneration.generatePotion()

            // console.log('Generated potion:', potion)
            socket.emit('generatedPotion', potion)
        })

        socket.on('addToInventory', async (data) => {
            console.log('received addToInventory request from socket')
            console.log('data from front:', data)

            const token = data.token
            let userId;

            try {
                const decoded = await jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('User ID:', userId);

                console.log('DATA: from socket with token and item', data);

                const newItem = new inventoryDb({
                    userId: userId,
                    name: data.item.name,
                    damage: data.item.damage,
                    image: data.item.image,
                    grade: data.item.grade,
                    hp: data.item.hp,
                    effects: data.item.effects,
                    generateGold: data.item.generateGold,
                });

                await newItem.save();
                const inventory = await inventoryDb.find({userId: userId});
                socket.emit('updatedInventory', inventory);
            } catch (error) {
                console.error('Error while adding item to inventory', error);
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
                userId = decoded.id;
                console.log('User ID:', userId)

                const item = await inventoryDb.findOne({_id: itemId})
                console.log('delete this item', item)
                console.log('delete this item name', item.name)

                if (!item) return

                if (item.name === 'default weapon') return

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
    })
}
