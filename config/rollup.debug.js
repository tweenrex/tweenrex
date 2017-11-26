
import typescript from 'rollup-plugin-typescript'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

module.exports = {
  input: 'src/debug.ts',
  name: 'tweenrex',
  exports: 'none',
  output: {
    file: 'dist/tweenrex-debug.js',
    format: 'iife'
  },
  plugins: [
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
    }),
    commonjs({}),
    nodeResolve({
      module: true,
      jsnext: true,
      main: true,
      browser: true,
      extensions: [ '.js', '.json' ],
      preferBuiltins: false,
    })
  ]
}
