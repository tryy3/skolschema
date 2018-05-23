var metadata = require("./metadata.js")
var novasoftware = require("./novasoftware.js")
var scheduleParser = require('./schedule-parser.js');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var config = {
    'base_folder': 'schedules',
    'classes_folder': 'classes',
    'teacher_folder': 'teachers',
    'image_folder': 'images',
    'json_folder': 'json',
    'schoolID': 81620
}

async function init() {
    try {
        fs.readdir(config.base_folder, (err, files) => {
            if (err) throw err;
          
            for (const file of files) {
                rimraf(path.join(config.base_folder, file), err => {
                    if (err) throw err;
                });
            }
        });
        
        var meta = await metadata.fetch(config.schoolID)
        parseSchedules(meta)
    } catch(error) {
        throw error
    }
}

async function parseSchedules(meta) {
    var start = Date.now();
    
    try {
        for (let clazz of meta.classes) {
            console.log('Started', clazz)
            let schedule = await scheduleParser(config.schoolID, clazz)
            
            saveSchedule(schedule, config.classes_folder, clazz.name)
            saveImage(clazz, config.classes_folder)
            console.log('Finished', clazz)
        }
    } catch(error) {
        console.error(error)
        return
    }

    var elapsed = (Date.now() - start) / 1000;
    var rounded = Math.round(elapsed * 10) / 10;
    console.log('Done, took', rounded, 's');
}

async function saveImage(clazz, category) {
    try {
        var data = await novasoftware.schedulePng(config.schoolID, clazz.id)

        var dir = path.join(config.base_folder, config.image_folder, category)
        var file = path.join(dir, clazz.name + '.png')

        mkdirp(dir, (err) => {
            if (err) return console.error("Failed to create directory", dir)
    
            fs.writeFile(file, data, (err) => {
                if (err) console.error(err)
            })
        })
    } catch (error) {
        throw error
    }
    //fs.writeFileSync(path.join)
}

function saveSchedule(schedule, category, name) {
    var dir = path.join(config.base_folder, config.json_folder, category)
    var file = path.join(dir, name + '.json')

    mkdirp(dir, (err) => {
        if (err) return console.error("Failed to create directory", dir)

        fs.writeFile(file, JSON.stringify(schedule, null, '\t'), (err) => {
            if (err) console.error(err)
        })
    })
}

init()