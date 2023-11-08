const {
    generateRandomInt,
} = require('./helperFunctions.js')

const weaponImages = [
    'https://cdn.pixabay.com/photo/2016/10/23/10/18/sword-1762560_1280.png',
    'https://cdn.pixabay.com/photo/2017/11/01/14/26/star-wars-2908144_1280.png',
    'https://cdn.pixabay.com/photo/2013/07/12/19/16/battle-axe-154454_1280.png',
    'https://cdn.pixabay.com/photo/2017/10/24/09/04/axe-2883896_1280.png',
    'https://cdn.pixabay.com/photo/2016/06/20/08/44/sword-1468332_1280.png',
    'https://cdn.pixabay.com/photo/2021/02/22/06/47/arco-de-garra-6039059_1280.png',
    'https://cdn.pixabay.com/photo/2016/06/20/08/44/dagger-1468334_1280.png',
    'https://cdn.pixabay.com/photo/2019/02/16/03/43/sword-3999672_1280.png',
    'https://cdn.pixabay.com/photo/2023/09/22/07/50/ai-generated-8268356_1280.png',
    'https://cdn.pixabay.com/photo/2019/10/25/20/59/dagger-4578137_1280.png',
    'https://cdn.pixabay.com/photo/2016/07/30/06/35/machado-1556480_1280.png',
]

const weaponGradesDescriptor = {
    'A': {
        damageRange: [6,30],
        generatedGoldRange: [1, 10]
    },
    'B': {
        damageRange: [3,20],
        generatedGoldRange: [1, 6]
    },
    'C': {
        damageRange: [1,5],
        generatedGoldRange: [1, 3]
    }
}

const generateWeapon = () => {
    const grade = getWeaponGrade(weaponGradesDescriptor)
    const damage = generateRandomInt(...weaponGradesDescriptor[grade].damageRange)
    const gold = generateRandomInt(...weaponGradesDescriptor[grade].generatedGoldRange)

    return {
        name: 'weapon',
        default: false,
        image: getWeaponImage(weaponImages),
        grade,
        damage,
        generateGold: gold,
    }
}

const getWeaponImage = (allImages) => {
    const imageIndex = generateRandomInt(0, allImages.length -1)
    return allImages[imageIndex]
}


const getWeaponGrade = (grades) => {
    const gradeNames = Object.keys(grades)
    const gradesCount = gradeNames.length
    const randomWeaponGradeIndex = generateRandomInt(0, gradesCount - 1 )

    console.warn(gradesCount, randomWeaponGradeIndex)

    return gradeNames[randomWeaponGradeIndex]
}

module.exports = {
    generateWeapon,
}
