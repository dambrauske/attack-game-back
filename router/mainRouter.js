const express = require('express')
const router = express.Router()

const {
    login,
    getUSer,
    getAllUsersExceptCurrent,
} = require('../controllers/userController')

const {
    addItemToInventory,
    deleteItem,
    getUserInventoryItems,
} = require('../controllers/inventoryController')

const {
    checkToken
} = require('../middleware/tokenCheck')

router.post('/login', login)
router.post('/addToInventory', checkToken, addItemToInventory)
router.post('/deleteItem', checkToken, deleteItem)
router.get('/getInventory', checkToken, getUserInventoryItems)
router.get('/getUser', checkToken, getUSer)
router.get('/getUsers', checkToken, getAllUsersExceptCurrent)


module.exports = router
