const mongoose = require('mongoose')
const Schema = mongoose.Schema


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    money: {
        type: Number,
        required: true,
    }
})

const userLogin = mongoose.model('Game-users', userSchema)

module.exports = userLogin
