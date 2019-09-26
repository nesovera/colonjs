const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const rollup = require('rollup');
const terser = require('terser');

const builds = require('./config');

const getSize = (code)=> (code.length / 1024).toFixed(2) + 'kb';
const relative = (file) => path.relative(process.cwd(), file);
const blue = (str) => '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m';
const red = (str) => '\x1b[1m\x1b[31m' + str + '\x1b[39m\x1b[22m';
const asyncForEach = async (arr, callback) => {
    for (let i = 0; i < arr.length; i++) {
      await callback(arr[i], i, arr);
    }
};

const write = async (file, code, sourceMap) => {
    const report = (extra) => console.log(blue(relative(file)) + ' ' + getSize(code) + (extra || ''));
    fs.writeFileSync(file, code);
    if (sourceMap) {
        fs.writeFileSync(file+'.map', sourceMap);
        await new Promise((resolve)=>{
            zlib.gzip(code,(err,zipped)=>{resolve(zipped)});
        }).then(zipped=>{
            report(' (gzipped: '+getSize(zipped)+')');
        });
    }else{
        report();
    }
};

const start = async () => {
    await asyncForEach(builds, async (config) => {
        const dest = config.output.file;
        await rollup.rollup(config)
          .then(bundle => bundle.generate(config.output))
          .then((res) => {
            let code = res.output[0].code;
              if (/(min|prod)\.js$/.test(dest)) {
                  const minified = terser.minify(res.output[0].code, {
                      toplevel: true,
                      output: { ascii_only: true },
                      compress: { },
                      sourceMap: true,
                  });
                  const code = config.output.banner + minified.code;
                  const sourceMap = minified.map;
                  return write(dest, code, sourceMap );
              } else {
                  return write(dest, code)
              }
          })
          .catch((err)=>{
              console.log(red("Failed to build: "+relative(dest)),err);
          })
    });
}

start();