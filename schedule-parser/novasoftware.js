const request = require('request');

const baseURL = "http://www.novasoftware.se/WebViewer//MZDesign1.aspx"
const pdfURL = "http://www.novasoftware.se/ImgGen/schedulegenerator.aspx"
const pngURL = "http://www.novasoftware.se/ImgGen/schedulegenerator.aspx"

function buildBaseURL(id) { return baseURL + "?schoolid=" + id }

function performRequest(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else if (response.statusCode == 500) {
                reject(new Error('Server error'))
            } else {
                resolve({error, response, body});
            }
        })
    })
}

function schedulePdf(schoolID, classID) {
    return new Promise(async function(resolve, reject) {
        try {
            let data = await performRequest({
                url: pdfURL,
                method: 'GET',
                encoding: null,
                qs: {
                    format: 'pdf',
                    schoolid: schoolID,
                    id: classID,
                    period: null,
                    week: null,
                    width: 1,
                    height: 1
                }
            })

            resolve(data.body)
        } catch (error) {
            reject(error)
        }
    })
}

function schedulePng(schoolID, classID) {
    return new Promise(async function(resolve, reject) {
        try {
            let data = await performRequest({
                url: pdfURL,
                method: 'GET',
                encoding: null,
                qs: {
                    format: 'png',
                    schoolid: schoolID,
                    id: classID,
                    period: null,
                    week: null,
                    width: 1920,
                    height: 1080,
                    colors: 128,
                }
            })
            resolve(data.body)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    baseURL,
    pdfURL,
    pngURL,
    buildBaseURL,
    performRequest,
    schedulePdf,
    schedulePng
}