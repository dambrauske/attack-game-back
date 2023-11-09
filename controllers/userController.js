const userDb = require('../schemas/userSchema');
const inventoryDb = require('../schemas/inventoryItemSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res) => {
        const {username, image, password} = req.body

        try {
            const user = await userDb.findOne({username: username})

            if (!user) {
                const hash = await bcrypt.hash(password, 13)
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
                    default: true,
                    name: 'weapon',
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
                            userId: newUser._id,
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
                    }
                    const token = jwt.sign(userToken, process.env.JWT_SECRET)

                    res.status(200).send({
                        error: false,
                        message: 'User found',
                        data: {
                            token,
                            username: user.username,
                            image: user.image,
                            money: user.money,
                        },
                    })
                }
            }
        } catch (error) {
            res.status(500).send({error: true, message: 'An error occurred', data: null})
        }
    },

}
