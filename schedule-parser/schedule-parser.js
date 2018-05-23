var novasoftware = require('./novasoftware.js');
var pdfParser = require('./pdf-parser.js');

async function scheduleParser(schoolID, clazz) {
    return new Promise(async function(resolve, reject) {
        try {
            let pdf = await novasoftware.schedulePdf(schoolID, clazz.id)

            let schedule = await pdfParser(pdf)
            schedule.className = clazz

            let incompleteLessons = schedule.lessons.filter((lesson) => {
                return lesson.details == null
            })

            if (incompleteLessons.length == 0) {
                removeRedudantsFields(schedule)
                resolve(schedule)
                return
            }

            let coords = incompleteLessons.map((lesson) => {
                return [Math.round(lesson.cx), Math.round(lesson.cy)]
            })

            let width = Math.round(schedule.width)
            let height = Math.round(schedule.height)

            console.log("multiple fix multiple....")
        } catch (error) {
            reject(error)
        }
    })

    function removeRedudantsFields(schedule) {
        // delete schedule.width
        // delete schedule.height
        schedule.lessons.forEach((lesson) => {
            // delete lesson.cx
            // delete lesson.cy
            lesson.details.forEach((detail) => {
                delete detail.unknowns
            })
        })
    }
}

module.exports = scheduleParser