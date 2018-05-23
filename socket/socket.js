var debug = true
var image = false // If a image should be genereted or if it should use novasoftwares generated image

if (!debug) {
    var rc522 = require("./rc522/main.js")
}

var fs = require("fs")
var ws = require("ws")
var express = require('express')
var path = require('path')
var serveStatic = require('serve-static')

const wss = new ws.Server({ port: 9000 });

wss.broadcast = function broadcast(data) {
    data = JSON.stringify(data)
    wss.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(ws) {
    var card = findCard("864bee7f")
    if (typeof card !== "undefined") {
        wss.broadcast(card)
        return
    }
    wss.broadcast({"error": "Hittade inte eleven."})
    ws.on('error', () => console.log('errored'));
});

if (!debug) {
    rc522(function(uid){
        var card = findCard(uid)
        if (typeof card !== "undefined") {
            wss.broadcast(card)
            return
        }
        wss.broadcast({"error": "Hittade inte eleven."})
    });
} else {
    var stdin = process.openStdin()

    stdin.addListener("data", function(d) {
        var card = findCard("864bee7f")
        console.log(card)
        if (typeof card !== "undefined") {
            wss.broadcast(card)
            return
        }
        wss.broadcast({"error": "Hittade inte eleven."})
    })
}

function findCard(uid) {
    uidList = uid.match(/.{1,2}/g)
    uidSorted = []
    for (var i = uidList.length - 1; i >= 0; i--) {
        uidSorted.push(uidList[i])
    }

    var id = parseInt(uidSorted.join(""), 16)

    var db = JSON.parse(fs.readFileSync("../hackathon/db.json", "utf8"))
    for (var row in db) {
        var data = db[row]
        if (data["Cardnumber"] == id) {
            if (image) {
                data.Image = true
            } else {
                data.Image = false

                data.ImageData = JSON.parse(fs.readFileSync("../schedule-parser/schedules/json/classes/"+ data.Class + ".json", "utf8"))
            }

            return data
        }
    }
    return
}

var app = express()

app.use(serveStatic(path.join(__dirname, 'static')))
app.use(serveStatic(path.join(__dirname, '../schedule-parser/schedules/images/classes')))
app.listen(8080)
