const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const path = require('path');

const version = require('../package.json').version;

const banner = `/*!
 * ColonJs v${version}
 * (c) 2018-${new Date().getFullYear()} NesoVera (nesovera@gmail.com)
 * Released under the MIT License.
 */
`;

const builds = {
  // ES modules build
  'esm-dev': {
    entry: path.resolve(__dirname, '../src/Colon.js'),
    dest: path.resolve(__dirname, '../dist/colon.esm.js'),
    format: 'es',
    env: 'development',
  },
  // ES modules build
  'esm-prod': {
    entry: path.resolve(__dirname, '../src/Colon.js'),
    dest: path.resolve(__dirname, '../dist/colon.esm.min.js'),
    format: 'es',
    env: 'production',
  },
  // UMD development build (Browser)
  'umd-dev': {
    entry: path.resolve(__dirname, '../src/index.js'),
    dest: path.resolve(__dirname, '../dist/colon.js'),
    format: 'umd',
    env: 'development',
  },
  // UMD production build  (Browser)
  'umd-prod': {
    entry: path.resolve(__dirname, '../src/index.js'),
    dest: path.resolve(__dirname, '../dist/colon.min.js'),
    format: 'umd',
    env: 'production',
  },
}

module.exports = Object.keys(builds).map( name =>{
    const opts = builds[name]
    return config = {
      input: opts.entry,
      external: opts.external,
      output: {
        file: opts.dest,
        format: opts.format,
        banner: banner,
        name: 'Colon'
      },
      plugins: [
        resolve(),
        commonjs(),
        babel({
          ignore: [ 'node_modules' ],
          sourceType: "unambiguous",
          presets: [
            [
              "@babel/env",
              {
                loose: true,
                "targets": {
                  "browsers": ["last 2 versions", "IE >= 9","not dead"]
                },
              }
            ]
          ]
        }),
      ]
    }
});