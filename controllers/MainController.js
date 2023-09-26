const userDb = require('../schemas/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async (req, res) => {
        const { username, image, password } = req.body
        console.log('user', username, image, password)

        try {
            const user = await userDb.findOne({ username: username })

            // IF NEW USER
            if (!user) {
                const hash = await bcrypt.hash(password, 13)

                const newUser = new userDb({
                    username,
                    image,
                    password: hash,
                })

                const userToken = {
                    id: newUser.id,
                    username: newUser.username,
                }

                const token = jwt.sign(userToken, process.env.JWT_SECRET);

                try {
                    await newUser.save()
                    res.status(200).send({
                        error: false,
                        message: 'User saved',
                        data: {
                            token,
                            username: newUser.username,
                            image: newUser.image,
                        },
                    })
                } catch (error) {
                    res.status(500).send({ error: true, message: 'An error occurred', data: null })
                }
            } else {
                const isValid = await bcrypt.compare(password, user.password)

                if (!isValid) {
                    res.status(404).send({ error: true, message: 'Wrong credentials', data: null })
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
            res.status(500).send({ error: true, message: 'An error occurred', data: null })
        }
    },
}
