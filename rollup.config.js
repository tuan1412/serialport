import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy';

const isDev = process.env.BUILD === 'development';

export default {
  input: 'src/serialport.js',
  output: [
    {
      file: 'dist/serialport.js',
      format: 'umd',
      name: 'SerialPort',
      exports: 'default'
    },
    {
      file: 'dist/serialport.esm.js',
      format: 'es'
    }
  ],
  plugins: [
    nodeResolve(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env']
    }),
    isDev && copy({
      targets: [
        { src: 'test/index.html', dest: 'dist' }
      ]
    }),
    isDev && serve({
      open: true,
      contentBase: ['dist'],
      port: 3000
    }),
    isDev && livereload('dist')
  ].filter(Boolean)
}; 