const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const rollup = require('rollup')
const typescript = require('rollup-plugin-typescript')
const uglify = require('rollup-plugin-uglify')
const uglifyEs = require('uglify-es')

// prettier-ignore
const config = ({
    input,
    name = 'tweenrex',
    minify = false,
    target = 'es5',
    commonJS = false
}) => {
    const options = {
        input,
        name,
        exports: 'none',
        plugins: []
    }

    // add typescript compiler
    options.plugins.push(
        typescript({
            allowJs: true,
            tsconfig: false,
            target: 'es5',
            rootDir: 'src',
            module: 'es2015',
            preserveConstEnums: false,
            removeComments: true,
            declaration: false,
            typescript: require('typescript')
        })
    )

    if (commonJS) {
        // add common js to 2015 converter
        options.plugins.push(commonjs({}))
    }

    // add node resolver
    options.plugins.push(
        nodeResolve({
            module: true,
            jsnext: true,
            main: true,
            browser: true,
            extensions: ['.js', '.json'],
            preferBuiltins: false
        })
    )

    if (minify) {
        // optional minify
        options.plugins.push(uglify({}, uglifyEs.minify))
    }

    return options
}

/** handles writing out statuses and writing bundle */
const write = (bundle, options) => {
    return bundle
        .write(options)
        .then(
            r => console.log('\u2713 ' + options.file),
            e => console.error('X ' + options.file + ': ' + JSON.stringify(e))
        )
}

// core bundle
rollup.rollup(config({ input: 'src/core.ts' })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex.js',
        format: 'iife'
    })
})

// core minified bundle
rollup.rollup(config({ input: 'src/core.ts', minify: true })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex.min.js',
        format: 'iife'
    })
})

// render bundle
rollup.rollup(config({ input: 'src/render.ts' })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-render.js',
        format: 'iife'
    })
})

// render minified bundle
rollup.rollup(config({ input: 'src/render.ts', minify: true })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-render.min.js',
        format: 'iife'
    })
})

// render bundle
rollup.rollup(config({ input: 'src/recurve.ts' })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-recurve.js',
        format: 'iife'
    })
})

// render minified bundle
rollup.rollup(config({ input: 'src/recurve.ts', minify: true })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-recurve.min.js',
        format: 'iife'
    })
})

// all bundle
rollup.rollup(config({ input: 'src/all.ts' })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-all.js',
        format: 'iife'
    })
})

// all minified bundle
rollup.rollup(config({ input: 'src/all.ts', minify: true })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-all.min.js',
        format: 'iife'
    })
})

// debug bundle
rollup.rollup(config({ input: 'src/debug.ts', commonJS: true })).then(bundle => {
    write(bundle, {
        commonJS: true,
        file: 'dist/tweenrex-debug.js',
        format: 'iife'
    })
})

// debug minified bundle
rollup.rollup(config({ input: 'src/debug.ts', minify: true, commonJS: true })).then(bundle => {
    write(bundle, {
        file: 'dist/tweenrex-debug.min.js',
        format: 'iife'
    })
})
