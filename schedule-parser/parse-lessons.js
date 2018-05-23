const sw = 0.995
const sx = 1.1
const sy = 1.07
const tx = -30.5
const ty = -12

const seperator = '|||'

module.exports = function parseLessons(pdfData) {
    let page = pdfData.Pages[0]
    let texts = page.Texts

    let width = Math.round(pdfData.Width * 6) * sw
    let height = Math.round(page.Height * 6)

    let lessonFills = page.Fills.filter((fill) => {
        // Not an empty fill
        return fill.w > 0 && fill.h > 0
        // Not a title fill
        && !(fill.w == 18.391 && fill.h == 2.75)
        // Not too big of a fill
        && fill.h < 46
        // Not too small of a fill
        && fill.w * fill.h > 2
    })

    lessonFills = lessonFills.map((fill) => {
        let cx = (fill.x + fill.w / 2) * 6 * sx + tx
        return {
            x: fill.x * 6 * sx + tx,
            y: fill.y * 6 * sy + ty,
            w: fill.w * 6 * sx,
            h: fill.h * 6 * sy,
            oc: fill.oc,
            cx: cx,
            cy: (fill.y + fill.h / 2) * 6 * sy + ty,
            day: Math.floor(cx / width * 5),
            clr: fill.clr
        }
    })

    texts.sort((a, b) => {
        let compareY = a.y - b.y
        return compareY === 0 ? a.x - b.x : compareY
    })

    let titles = texts.splice(0, 5).map((text) => decodeURIComponent(text.R[0].T))

    texts = texts.map((text) => {
        // The x and y where offsetted so i fixed them!
        text.x = text.x + 0.7
        text.y = text.y + 0.42

        // These values seem to work fine
        text.w = 1.5
        text.h = 0.5

        let cx = (text.x + text.w / 2) * 6 * sx + tx
        return {
            x: text.x * 6 * sx + tx,
            y: text.y * 6 * sy + ty,
            w: text.w * 6 * sx,
            h: text.h * 6 * sy,
            cx: cx,
            cy: (text.y + text.h / 2) * 6 * sy + ty,
            day: Math.floor(cx / width * 5),
            text: decodeURIComponent(text.R[0].T)
        }
    })

    let lessonTexts = []
    let timeTexts = []

    texts.forEach((text) => {
        if (isTime(text.text)) {
            timeTexts.push(text)
        } else if (isPartialTime(text.text)) {
            timeTexts.push(completePartialTime(text))
        } else {
            lessonTexts.push(text);
        }
    })

    function day() { return { title: null, lessonFills: [], lessonTexts: [], timeTexts: [] } }
    var days = [day(), day(), day(), day(), day(), day()];
    lessonFills.forEach((fill) => {
        if (fill.day !== -1)
        return days[fill.day].lessonFills.push(fill)
    })
    lessonTexts.forEach((text) => {
        if (text.day !== -1)
        days[text.day].lessonTexts.push(text)
    })
    timeTexts.forEach((text) => {
        if (text.day !== -1)
        days[text.day].timeTexts.push(text)
    })

    var days = days.slice(0, 5);

    days.forEach((day, i) => {
        day.lessonFills.forEach((lessonFill, j) => {
            let startTime = day.timeTexts.filter((timeText) => {
                return intersectHorizontalLine(
                    timeText.y,
                    timeText.y + timeText.h,
                    lessonFill.y
                )
            })[0].text

            let endTime = day.timeTexts.filter((timeText) => {
                return intersectHorizontalLine(
                    timeText.y,
                    timeText.y + timeText.h,
                    lessonFill.y + lessonFill.h
                )
            })[0].text

            lessonFill.startTime = startTime
            lessonFill.endTime = endTime

            let rows = day.lessonTexts.filter((lessonText) => {
                return intersectRectangles(
                    lessonFill.x + lessonFill.w,
                    lessonFill.y + lessonFill.h,
                    lessonFill.x,
                    lessonFill.y,
                    lessonText.x + lessonText.w,
                    lessonText.y + lessonText.h,
                    lessonText.x,
                    lessonText.y
                )
            })

            lessonFill.rows = rows

            lessonFill.details= parseRows(rows, lessonFill)
        })
    })

    function parseRows(rows, lessonFill) {
        if (!rows.length) return null

        let rowTexts = rows.map((row) => row.text)

        let parts = rowTexts
            .join(seperator)
            .replace(/  /g, seperator)
            .replace(/ /g, seperator)
            .replace(',' + seperator, ',')
            .split(seperator)

        let onlyWords = parts.every((str) => /^[a-zåäö.]+$/i.test(str))
        if (onlyWords) {
            return [{
                course: rowTexts.join(' '),
                unknowns: null,
                teacher: null,
                location: null
            }]
        }

        let details = []

        while (parts.length) {
            let course = []
            while (parts[0] && !isPeriod(parts[0])) {
                course.push(parts.shift())
            }

            let period = []
            while (parts[0] && isPeriod(parts[0])) {
                period.push(parts.shift())
            }
            
            let unknowns = [];
            while (parts[0] && isUnknown(parts[0])) {
                unknowns.push(parts.shift())
            }

            let teacher = parts[0] && isTeacher(parts[0]) ? parts.shift() : null
            let location = parts[0] && isLocation(parts[0]) ? parts.shift() : null

            details.push({
                course: course.join(" "),
                period: period.join(" "),
                unknowns,
                teacher,
                location
            })
        }

        return details
    }

    // May produce error since it was edited without being tested afterwards
    function completePartialTime(partialText) {
        let timeText = timeTexts.filter((timeText) => timeText.y < partialText.y)
            .sort((a, b) => b.y - a.y)[0]

        let parts = timeText.text.split(':').map((str) => parseInt(str))
        let hour = parts[0]
        let minute = parts[1]
        let partialMinute = parseInt(partialText.text)

        // If a new hour has started since the above text
        // For example if above text is 9:50 and partial text is 00
        if (partialMinute < minute) hour++

        partialText.text = hour + ':' + partialMinute
        return partialText
    }

    function isOneOrMore(str, fn) {
        let parts = str.split(',')
        return parts.filter(fn).length == parts.length
    }

    function isLocation(str) {
        let regex = /^\d{1,3}([a-z])?$/i
        return isOneOrMore(str, (str) => regex.test(str))
    }

    function isTeacher(str) {
        let regex = /^[a-zåäö]{2,5}$/i
        return isOneOrMore(str, (str) => regex.test(str))
    }

    function isPeriod(str) {
        let regex = /(Läsår)|(Ht)|(Vt)|(v\d+)/i
        return regex.test(str)
    }

    function isCourse(str) {
        var regex = /^(([a-zåäö]{3,}\d{1,2}\w?)|(gyar[a-zåäö]{2,3})|(tisdag)|(mentorsråd)|([a-z]\d{1,3}(-skrivsalen)?))$/i
        return regex.test(str)
    }

    function isUnknown(str) {
        return !isLocation(str) && !isTeacher(str) && !isCourse(str)
    }

    function isTime(str) {
        return /^\d{2}:\d{2}$/i.test(str)
    }

    function isPartialTime(str) {
        return /^\d{2}$/.test(str)
    }

    function stringStartsWith(str, test) {
        return test.lastIndexOf(str, 0) === 0
    }

    function stringEndsWith(str, test) {
        return str.indexOf(test, str.length - test.length) !== -1
    }

    var kColors = [
        '#000000',		// 0
        '#ffffff',		// 1
        '#4c4c4c',		// 2
        '#808080',		// 3
        '#999999',		// 4
        '#c0c0c0',		// 5
        '#cccccc',		// 6
        '#e5e5e5',		// 7
        '#f2f2f2',		// 8
        '#008000',		// 9
        '#00ff00',		// 10
        '#bfffa0',		// 11
        '#ffd629',		// 12
        '#ff99cc',		// 13
        '#004080',		// 14
        '#9fc0e1',		// 15
        '#5580ff',		// 16
        '#a9c9fa',		// 17
        '#ff0080',		// 18
        '#800080',		// 19
        '#ffbfff',		// 20
        '#e45b21',		// 21
        '#ffbfaa',		// 22
        '#008080',		// 23
        '#ff0000',		// 24
        '#fdc59f',		// 25
        '#808000',		// 26
        '#bfbf00',		// 27
        '#824100',		// 28
        '#007256',		// 29
        '#008000',		// 30
        '#000080',		// Last + 1
        '#008080',		// Last + 2
        '#800080',		// Last + 3
        '#ff0000',		// Last + 4
        '#0000ff',		// Last + 5
        '#008000',		// Last + 6
        '#000000'		// Last + 7
    ];

    let lessons = lessonFills.map((lessonFill) => {
        var oc = undefined
        if (typeof lessonFill.oc == "undefined" && lessonFill.clr >= 0) {
            oc = kColors[lessonFill.clr]
        } else {
            oc = lessonFill.oc
        }
        return {
            startTime: lessonFill.startTime,
            endTime: lessonFill.endTime,
            details: lessonFill.details,
            day: lessonFill.day,
            cx: lessonFill.cx,
            cy: lessonFill.cy,
            x: lessonFill.x,
            y: lessonFill.y,
            w: lessonFill.w,
            h: lessonFill.h,
            oc: oc
        }
    })

    function intersectHorizontalLine(yMin, yMax, yLine) {
        return yLine >= yMin && yLine <= yMax
    }

    function intersectRectangles(xMax1, yMax1, xMin1, yMin1, xMax2, yMax2, xMin2, yMin2) {
        if (xMax1 < xMin2) return false; // a is left of b
        if (xMin1 > xMax2) return false; // a is right of b
        if (yMax1 < yMin2) return false; // a is above b
        if (yMin1 > yMax2) return false; // a is below b
        return true; // boxes overlap
    }
    
    return {
        width: width,
        height: height,
        titles: titles,
        lessons: lessons
    }
}

