
import typescript from 'rollup-plugin-typescript';
import nodeResolve from 'rollup-plugin-node-resolve';

module.exports = {
  input: 'src/all.ts',
  name: 'tweenrex',
  exports: 'none',
  externals: [],
  output: {
    file: 'dist/tweenrex-all.js',
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
    nodeResolve({
      module: true,
      jsnext: true,
      main: true,
      browser: true,
      extensions: [ '.js', '.json' ],
      preferBuiltins: false
    })
  ]
}
