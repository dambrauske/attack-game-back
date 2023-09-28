const {
    generateRandomInt,
} = require('./helperFunctions.js')


const generatePotion = () => {
    const hp = generateRandomInt(1, 100)

    return {
        name: 'potion',
        image: 'https://cdn.pixabay.com/photo/2023/02/12/22/46/magic-7786147_1280.png',
        hp,
    }
}

module.exports = {
    generatePotion,
}

