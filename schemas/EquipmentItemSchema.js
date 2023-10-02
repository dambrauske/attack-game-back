const mongoose = require('mongoose')
const Schema = mongoose.Schema


const equipmentItemSchema = new Schema({

    userId: {
        type: String,
        required: true,
    },
    default: {
        type: Boolean,
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    damage: {
        type: Number,
        required: false,
    },
    armour: {
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

const userEquipment = mongoose.model('User-equipment', equipmentItemSchema)

module.exports = userEquipment
