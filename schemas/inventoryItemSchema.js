const mongoose = require('mongoose')
const Schema = mongoose.Schema


const inventoryItemSchema = new Schema({

            userId: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            damage: {
                type: Number,
                required: false,
            },
            image: {
                type: String,
                required: true,
            },
            grade: {
                type: String,
                required: false,
            },
            hp: {
                type: Number,
                required: false,
            },
            effects: {
                type: [String],
                required: false,
            },
            generateGold: {
                type: Number,
                required: false,
            }

})

const userPost = mongoose.model('Game-inventory', inventoryItemSchema)

module.exports = userPost
