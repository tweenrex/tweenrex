'use strict'
const fs = require('fs')
const path = require('path')

const ENCODING = 'utf-8'

const readJSON = fileName => JSON.parse(fs.readFileSync(fileName), ENCODING)
const version = readJSON(path.resolve(__dirname, './package.json')).version

// prettier-ignore
fs.readdirSync('packages')
    .forEach(pkg => {
        // read package json
        const jsonFile = path.resolve(__dirname, './packages', pkg, 'package.json')
        const json = readJSON(jsonFile)

        // update version
        json.version = version

        // rewrite back to file
        fs.writeFileSync(jsonFile, JSON.stringify(json, null, '  ') + '\n', ENCODING)
        console.log('\u2713 updated ' + pkg)
    })

fs.writeFileSync(versionFile, versionFileContents, ENCODING)

console.log('updated all versions')
