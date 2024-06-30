import * as esbuild from 'esbuild'

const name = 'faz-quill-emoji';
build({
    platform: 'browser',
    outfile: `dist/${name}.iife.js`
});

build({
    platform: 'neutral',
    outfile: `dist/${name}.esm.js`,
    mainFields: ['main', 'module'],
});

build({
    platform: 'node',
    outfile: `dist/${name}.cjs.js`
});

build({
    entryPoints: ['src/css/faz.quill.emoji.css'],
    outfile: `dist/${name}.css`,
    target: [
        'chrome58',
        'edge16',
        'firefox57',
        'safari11',
    ]
});

function build(options) {
    const licenseText = `/*!
    * Faz quill emoji 0.1.0
    * Licensed under MIT, https://opensource.org/licenses/MIT/
    * Please visit https://github.com/fazdiu/faz-quill-emoji for details.
    */`;
    return esbuild.buildSync({
        entryPoints: ['src/index.js'],
        bundle: true,
        minify: true,
        loader: {
            '.html': 'text',
        },
        banner: {
            js: licenseText,
            css: licenseText,
        },
        target: [
            'es2016',
            // 'node12'
        ],
        ...options
    })
}