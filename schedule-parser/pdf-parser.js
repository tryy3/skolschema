var PDFParser = require("pdf2json");
var parseLessons = require('./parse-lessons.js');

module.exports = function parsePdf(pdf) {
    return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser()

        pdfParser.on("pdfParser_dataError", function(err) {
            reject(err)
        })

        pdfParser.on("pdfParser_dataReady", function(result) {
            let pdfData = result.data
            try {
                let schedule = parseLessons(pdfData)
                resolve(schedule)
            } catch(err) {
                reject(err)
            }
        })

        pdfParser.parseBuffer(pdf)
    })
}