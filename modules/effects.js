const {
    generateRandomNum,
    generateRandomInt,
} = require('./helperFunctions.js')

const chanceGenerator = (percentage) => {
    const randomNum = Math.random()
    return randomNum < percentage;
}

const Effects = {
    criticalChanceEffect: () => {
        return chanceGenerator(0.5)
    },
    dodgeChanceEffect: () => {
        return chanceGenerator(0.5)
    },
    lifeStealChanceEffect: () => {
        return chanceGenerator(0.5)
    }
}

const generateEffects = (allEffects, maxNumberOfEffects) => {
    const allEffectNames = Object.keys(allEffects)
    const effects = []

    for (let i = 0; i < maxNumberOfEffects; i++) {
        const effectEnabled = chanceGenerator(0.5)
        const randomEffectIndex = generateRandomInt(0, allEffectNames.length - 1)

        if(effectEnabled) {
            effects.push(allEffectNames[randomEffectIndex])
            allEffectNames.splice(randomEffectIndex, 1)
        }
    }
    return effects
}

const generateCriticalChance = (damage) => {
    const randomPercentage = generateRandomNum(0.1, 0.4)
    return  (randomPercentage / 100) * damage
}

const generateDodgeChance = (damage) => {
    const randomPercentage = generateRandomNum(0.1, 0.4)
    return  (randomPercentage / 100) * damage
}

module.exports = {
    generateRandomNum,
    generateRandomInt,
    chanceGenerator,
    Effects,
    generateEffects,
    generateCriticalChance,
    generateDodgeChance,
}
