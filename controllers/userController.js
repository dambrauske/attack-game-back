const userDb = require('../schemas/userSchema');
const inventoryDb = require('../schemas/inventoryItemSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res) => {
        const {username, image, password} = req.body
        console.log('user', username, image, password)

        try {
            const user = await userDb.findOne({username: username})

            // IF NEW USER
            if (!user) {
                const hash = await bcrypt.hash(password, 13)
                console.log('new user tries to login')
                const newUser = new userDb({
                    username,
                    image,
                    password: hash,
                    money: 2000,
                })

                const userToken = {
                    id: newUser.id,
                    username: newUser.username,
                }

                const token = jwt.sign(userToken, process.env.JWT_SECRET);

                const defaultWeapon = new inventoryDb({
                    userId: newUser._id,
                    name: 'default weapon',
                    damage: 3,
                    image: 'https://cdn.pixabay.com/photo/2021/05/24/20/13/knife-6280510_1280.png',
                    grade: 'C',
                    generateGold: 1,
                })
                try {
                    await newUser.save()
                    await defaultWeapon.save()
                    res.status(200).send({
                        error: false,
                        message: 'User saved',
                        data: {
                            token,
                            username: newUser.username,
                            money: newUser.money,
                            image: newUser.image,
                            defaultWeapon,
                        },
                    })
                } catch (error) {
                    res.status(500).send({error: true, message: 'Error', data: null})
                }
            } else {
                const isValid = await bcrypt.compare(password, user.password)

                if (!isValid) {
                    res.status(404).send({error: true, message: 'Wrong credentials', data: null})
                } else {
                    const userToken = {
                        id: user.id,
                        username: user.username,
                    };
                    const token = jwt.sign(userToken, process.env.JWT_SECRET)

                    res.status(200).send({
                        error: false,
                        message: 'User found',
                        data: {
                            token,
                            username: user.username,
                            image: user.image,
                        },
                    })
                }
            }
        } catch (error) {
            res.status(500).send({error: true, message: 'An error occurred', data: null})
        }
    },
    getUSer: async (req, res) => {
        const user = req.user
        console.log(user)

        try {
            const userData = await userDb.findOne({_id: user.id})
            res.status(200).send({
                error: false, message: 'User found', data: {
                    username: userData.username,
                    image: userData.image,
                    money: userData.money,
                }
            })

        } catch (error) {
            res.status(404).send({error: true, message: 'User not found', data: null})
            console.log('getUSer error', error)
        }
    },
    getAllUsersExceptCurrent: async (req, res) => {
        const currentUser = req.user

        try {
            const allUsers = await userDb.find({ _id: { $ne: currentUser.id } })

            res.status(200).send({
                error: false,
                message: 'Users found',
                data: allUsers,
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: 'An error occurred while fetching users',
                data: null,
            })
        }
    },
}
