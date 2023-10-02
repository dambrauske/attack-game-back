const express = require('express')
const router = express.Router()

const {
    login,
    getUSer,
    getAllUsersExceptCurrent,
} = require('../controllers/userController')

const {
    checkToken
} = require('../middleware/tokenCheck')

router.post('/login', login)
router.get('/getUser', checkToken, getUSer)
router.get('/getUsers', checkToken, getAllUsersExceptCurrent)


module.exports = router
