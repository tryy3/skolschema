const cheerio = require('cheerio');
const novasoftware = require('./novasoftware.js');

const teacherRegex = /(.+) (\(.+\))/

module.exports.fetch = async function fetch(id) {
    return new Promise(async function(resolve, reject) {
        try {
            let data = await novasoftware.performRequest({
                url: novasoftware.buildBaseURL(id),
                method: 'GET',
                followRedirect: true
            })

            // Load html into cheerio
            let $ = cheerio.load(data.body);

            // Retrieve all classes
            let classOptions = $("select[name='ctl02'] option");
            let classes = classOptions.map((i, el) => {
                let $el = $(el);
                let value = $el.val();
                let text = $el.text();

                return { id: value, name: text }
            }).get()

            // Remove empty option
            classes.splice(0, 1);

            // Retrieve all teachers
            let teacherOptions = $("select[name='ctl01'] option");
            let teachers = teacherOptions.map((i, el) => {
                let $el = $(el);
                let value = $el.val();
                let text = $el.text();

                let teacher = teacherRegex.exec(text)
                if (teacher == null) return

               return { id: value, name: teacher[1], short: teacher[2] }
            }).get()
            
            resolve({classes, teachers})
        } catch (error) {
            reject(error)
        }
    })
}