const inventoryDb = require('../schemas/inventoryItemSchema');
const jwt = require('jsonwebtoken');


module.exports = {
    addItemToInventory: async (req, res) => {
        const {item} = req.body
        const user = req.user

        console.log('user.id', user.id)

        const newItem = new inventoryDb({
            userId: user.id,
            name: item.name,
            damage: item.damage,
            image: item.image,
            grade: item.grade,
            hp: item.hp,
            effects: item.effects,
            generateGold: item.generateGold,
        })

        try {
            newItem.save()
            const items = await inventoryDb.find({userId: user.id})
            res.status(200).send({error: false, message: 'Item saved', data: items})

        } catch (error) {
            res.status(404).send({error: true, message: 'Error', data: null,})
        }
    },
    deleteItem: async (req, res) => {
        const user = req.user
        const {itemId} = req.body

        const item = await inventoryDb.findOne({_id: itemId})

        if (!item) {
            res.status(404).send({error: true, message: 'Item not found', data: null});
        }

        try {
            await inventoryDb.findOneAndDelete({_id: itemId})
            const items = await inventoryDb.find({userId: user._id})
            res.status(200).send({error: false, message: 'Item deleted', data: items});

        } catch (error) {
            console.log(error)
            res.status(500).send({error: true, message: 'An error occurred', data: null})
        }
    },
    getUserInventoryItems: async (req, res) => {
        const user = req.user
        console.log('getUserInventoryItems', user)

        try {
            const items = await inventoryDb.find({userId: user.id})
            console.log('user items', items)
            res.status(200).send({error: false, message: 'Items retrieved', data: items});

        } catch (error) {
            res.status(404).send({error: true, message: 'Items not found', data: null});
        }
    },
}
