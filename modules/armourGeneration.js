const {
    Effects,
    chanceGenerator,
    generateEffects,
    generateCriticalChance,
    generateDodgeChance
} = require('./effects.js')

const {
    generateRandomNum,
    generateRandomInt,
} = require('./helperFunctions.js')


const armourImages = [
    'https://cdn.pixabay.com/photo/2017/12/19/03/40/helmet-3027322_1280.png',
    'https://cdn.pixabay.com/photo/2022/09/24/12/54/shield-7476352_1280.png',
    'https://cdn.pixabay.com/photo/2022/09/24/10/40/shield-7476130_1280.png',
    'https://cdn.pixabay.com/photo/2013/07/12/19/30/shield-154907_1280.png',
    'https://cdn.pixabay.com/photo/2022/09/24/02/15/shield-7475501_1280.png',
    'https://cdn.pixabay.com/photo/2021/07/30/21/03/coat-of-arms-6510701_1280.png',
    'https://cdn.pixabay.com/photo/2017/11/23/16/58/frame-2973207_1280.png',
    'https://cdn.pixabay.com/photo/2021/05/24/17/59/banner-6280029_1280.png',
    'https://cdn.pixabay.com/photo/2017/12/28/23/51/shield-3046442_1280.png',
    'https://cdn.pixabay.com/photo/2016/03/31/22/36/armor-1297117_1280.png',
]

const armourGradesDescriptor = {
    'A': {
        armourRange: [10,90],
        maxEffects: 3,
    },
    'B': {
        armourRange: [0,50],
        maxEffects: 1,
    },
    'C': {
        armourRange: [0,20],
        maxEffects: 0,
    }
}


const generateArmour = () => {
    const grade = getArmourGrade(armourGradesDescriptor)
    const armour = generateRandomInt(...armourGradesDescriptor[grade].armourRange)
    const effects = generateEffects(Effects, armourGradesDescriptor[grade].maxEffects)

    return {
        image: getArmourImage(armourImages),
        grade,
        armour,
        effects,
    }
}

const getArmourImage = (allImages) => {
    const imageIndex = generateRandomInt(0, allImages.length -1)
    return allImages[imageIndex]
}


const getArmourGrade = (grades) => {
    const gradeNames = Object.keys(grades)
    const gradesCount = gradeNames.length
    const randomWeaponGradeIndex = generateRandomInt(0, gradesCount - 1 )

    console.warn(gradesCount, randomWeaponGradeIndex)

    return gradeNames[randomWeaponGradeIndex]
}

module.exports = {
    generateArmour,
}
