var xlsx = require("xlsx")
var fs = require("fs")
var fuzzyset = require("fuzzyset.js")

var parseODS = function(parseData) {
    var ods = {}
    for (var id in parseData) {
        var column = id.substr(0, 1);
        var row = id.substr(1);

        if (!(row in ods)) {
            ods[row] = {}
        } 
        ods[row][column] = parseData[id]["v"]
    }
    return ods
}

cardswac = xlsx.readFile("./cardswac.ods")
parsedCardswac = parseODS(cardswac["Sheets"]["cardswac"])

elever = xlsx.readFile("./Elever.ods")
parsedElever = parseODS(elever["Sheets"]["Elever"])

ug = xlsx.readFile("./Undervisningsgrupper.ods")
parsedUG = parseODS(ug["Sheets"]["Undervisningsgrupper"])

var db = []
for (var row in parsedElever) {
    if (row == "1" || row == "ref") continue
    var data = parsedElever[row]
    db.push({
        "ID": data["A"],
        "ClassID": data["B"],
        "Firstname": data["C"],
        "Lastname": data["D"],
        "Username":  data["E"],
        "Cardnumber": "",
        "Class": ""
    })
}

var set = []
for (var i in parsedCardswac) {
    set.push(parsedCardswac[i]["B"] + " " + parsedCardswac[i]["A"])
}
var fuzzy = fuzzyset(set)

for (var i in parsedCardswac) {
    var data = parsedCardswac[i]
    for (var dbRow in db) {
        var dbData = db[dbRow]
        if (dbData["Firstname"] == data["B"] && dbData["Lastname"] == data["A"]) {
            db[dbRow]["Cardnumber"] = data["C"]
            break;
        }
    }
}

for (var dbRow in db) {
    if (db[dbRow]["Cardnumber"] == "") {
        var found = fuzzy.get(db[dbRow]["Firstname"] + " " + db[dbRow]["Lastname"])
        if (found.length <= 0) continue
        for (var i in parsedCardswac) {
            var data = parsedCardswac[i]
            if (data["B"] + " " + data["A"] == found[0][1]) {
                db[dbRow]["Cardnumber"] = data["C"]
            }
        }
    }
}

for (var dbRow in db) {
    var dbData = db[dbRow]

    for (var i in parsedUG) {
        if (i == "1" || i == "ref") continue
        var data = parsedUG[i]
        if (dbData["ClassID"] == data["A"]) {
            db[dbRow]["Class"] = data["B"]
            break;
        }
    }
}

fs.writeFileSync("db.json", JSON.stringify(db, null, 4), "utf-8")