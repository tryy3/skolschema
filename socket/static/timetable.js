/**
 * Config: {
 *      startTime: string - The start time of the schedule (expected format: H:M)
 *      endTime: string - The end time of the schedule (expected format: H:M)
 *      stepTime: string - How long between the times on the schedule (minutes)
 *      element: Element - The html element of the timetable
 * }
 */
function Timetable(config) {
    // Initialize the config with default settings
    this.config = Object.assign({}, {
        startTime: "08:00",
        endTime: "17:00",
        stepTime: 30,
        element: undefined
    }, config)

    // Verify the config
    this.verifyConfig()

    // Set some internal variables for easier access
    this._element = this.config.element

    // reset the timetable element
    this.reset()
}

Timetable.prototype.reset = function() {
    // calculate timespan
    this._timespan = this.calculateTimespan()

    // reset element
    this._element.empty()

    // create timetable
    this.timetable = $("<div>")
        .addClass("timetable")

    // create the time axis
    this.timeAxis = $("<div>")
        .addClass("timetable-time-axis")

    // create schedule columns
    this.columnEl = $("<div>")
        .addClass("timetable-columns")

    // finally append everything
    for (var time of this._timespan.timespan) {
        this.timeAxis.append($("<div>")
            .addClass("axis-item")
            .text(time)
        )
    }
    
    this.timetable.append(this.timeAxis, this.columnEl)
    this._element.append(this.timetable)
}

Timetable.prototype.verifyConfig = function() {
    if (typeof this.config.element === "undefined") throw "element is undefined"

    if (typeof this.config.startTime !== "string") throw "startTime is invalid type"
    if (typeof this.config.endTime !== "string") throw "endTime is invalid type"

    if (this.config.startTime.split(":").length != 2) throw "startTime does not follow the expected format"
    if (this.config.endTime.split(":").length != 2) throw "endTime does not follow the expected format"

    if (this.config.stepTime <= 0) throw "stepTime has to be greater then 0"
}

Timetable.prototype.calculateTimespan = function() {
    var startDate = parseTime(this.config.startTime)
    var endDate = parseTime(this.config.endTime)

    // calculate amount of minutes
    var minutes = (endDate - startDate) / 1000 / 60 / this.config.stepTime

    // calculate the timespan
    var timespan = []
    for (var i = 0; i <= minutes; i++) {
        var hour = startDate.getUTCHours().toString().padStart(2, "0")
        var min = startDate.getUTCMinutes().toString().padStart(2, "0")
        timespan[i] = hour + ":" + min
        startDate.setUTCMinutes(startDate.getUTCMinutes() + this.config.stepTime)
    }
    
    return {minutes, timespan}
}

Timetable.prototype.render = function(data) {
    this.columns = []
    for (var i = 0; i < data.titles.length; i++) {
        this.columns[i] = $("<div>")
            .addClass("timetable-column")

        var header = $("<div>")
            .addClass("timetable-column-header")
            .text(data.titles[i])

            console.log(i, (new Date()).getDay())
        
        if (i == (new Date()).getDay() - 1) {
            header.css("font-weight", "bold").css("text-decoration", "underline")
        }

        var contents = $("<div>")
            .addClass("timetable-column-contents")

        var grid = $("<div>")
            .addClass("timetable-column-grid")

        for (var j = 0; j < this._timespan.minutes; j++) {
            if (i == 0) grid.append($("<div>").addClass("grid-item first-column"))
            else grid.append($("<div>").addClass("grid-item"))
        }

        this.columns[i].append(header, contents, grid)
    }

    for (var i = 0; i < data.lessons.length; i++) {
        var lesson = data.lessons[i]

        var lessonDiv = $("<div>")
            .addClass("column-item")

        var height = ((8 / 12) * calculateLessonPosition(lesson.startTime, lesson.endTime))
        /* var bodyFontSize = $("body").css("font-size").replace("px", "")
        var letters = lesson.details[0].course.length + (lesson.startTime + "-" + lesson.endTime).length + lesson.details[0].location.length
        var fontSize = (((window.innerHeight / 100) * height) / letters * 5) */

        var title = $("<div>")
            .addClass("column-item-title")
            .css("top", ((8 / 12) * calculateLessonPosition(this.config.startTime, lesson.startTime)) + "vh")
            .css("height", height + "vh")
            .css("background", lesson.oc)
           // .css("font-size", fontSize + "px")


        var width = data.width / 5
        var size = Math.round(width / lesson.w)
        var percentage = 100 / size
        title.css("width", (percentage) + "%")

        var left = width / size
        var x = lesson.x - (width * lesson.day)
        var amount = Math.round(x / left)
        title.css("left", (percentage * amount) + "%")
        
        /*title.append($("<div>").addClass("title-name").text(lesson.details[0].course))
        title.append($("<div>").addClass("title-time").text(lesson.startTime + "-" + lesson.endTime))
        title.append($("<div>").addClass("title-room").text(lesson.details[0].location)) */
        title.html(lesson.details[0].course + "</br>" + lesson.startTime + "-" + lesson.endTime + "</br>" + lesson.details[0].location)
        title.append($("<div>").addClass("title-starttime").text(lesson.startTime))
        title.append($("<div>").addClass("title-endtime").text(lesson.endTime))

        lessonDiv.append(title)
        this.columns[lesson.day].find(".timetable-column-contents").append(lessonDiv)
    }

    this.columnEl.append(this.columns)

    setTimeout(resizeFonts, 1)
    $(window).resize(resizeFonts)
}

function resizeFonts() {
    var maxFont = 16;
    var minFont = 8;

    $(".column-item-title").each(function(i, e) {
        var $el = $(e)
        $el.css("font-size", maxFont + "px")
        var size = $el.css("font-size").replace("px", "")

        var starttime = $el.find(".title-starttime")[0]
        var endtime = $el.find(".title-endtime")[0]
        
        var height = e.clientHeight
        var width = e.clientWidth

        var scrollHeight = e.scrollHeight - starttime.scrollHeight - endtime.scrollHeight
        var scrollWidth = e.scrollWidth

        while(size > (minFont + 1) && (scrollHeight > height || scrollWidth > width)) {
            scrollHeight = e.scrollHeight - starttime.scrollHeight - endtime.scrollHeight
            scrollWidth = e.scrollWidth
            
            size = $el.css("font-size").replace("px", "")
            $el.css("font-size", (size - 1) + "px")
        }
    })
}

function calculateLessonPosition(startTime, lessonTime) {
    var start = parseTime(startTime)
    var lesson = parseTime(lessonTime)

    var minutes = (lesson - start) / 1000 / 60 / 5;
    return minutes
}

function parseTime(time) {
    // Parse the times (H:M)
    var parsed = time.split(":")

    // Create new Date objects
    var date = new Date()

    // Set the hours and minutes
    date.setUTCHours(parsed[0])
    date.setUTCMinutes(parsed[1])
    date.setUTCMilliseconds(0)
    date.setUTCSeconds(0)
    return date
}

function betweenDates(time, start, end) {
    if (
        time.getHours() < start.getHours() ||
        time.getHours() > end.getHours()
    ) return false

    if (
        time.getMinutes() <= start.getMinutes() ||
        time.getMinutes() >= end.getMinutes()
    ) return false

    return true
}