'use strict'
const fs = require('fs')
const path = require('path')

const ENCODING = 'utf-8'

const readJSON = fileName => JSON.parse(fs.readFileSync(fileName), ENCODING)
const version = readJSON(path.resolve(__dirname, '../package.json')).version

// prettier-ignore
fs.readdirSync(path.resolve(__dirname, '../packages'))
    .forEach(pkg => {
        const dir = path.resolve(__dirname, '../packages', pkg)
        if (!fs.lstatSync(dir).isDirectory()) {
            // ignore files
            return
        }

        // read package json
        const jsonFile = path.resolve(dir, 'package.json')
        const json = readJSON(jsonFile)

        // update version
        json.version = version

        // rewrite back to file
        fs.writeFileSync(jsonFile, JSON.stringify(json, null, '  ') + '\n', ENCODING)
        console.log('\u2713 updated ' + pkg)
    })

console.log('updated all versions')
