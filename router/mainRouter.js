const express = require('express')
const router = express.Router()

const {
    createUser,
    login,
} = require('../controllers/mainController')

const {
    checkToken
} = require('../middleware/tokenCheck')

router.post('/login', login)


module.exports = router
