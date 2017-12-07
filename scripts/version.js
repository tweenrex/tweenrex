const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process');

const ENCODING = 'utf-8'

const readJSON = fileName => JSON.parse(fs.readFileSync(fileName), ENCODING)
const version = readJSON(path.resolve(__dirname, '../package.json')).version

// update version in all branches
try {
    execSync('git submodule foreach "npm version ' + version + '"')
} catch (err) {
    console.log(err)
    process.exit(1)
}

console.log('updated all versions')
