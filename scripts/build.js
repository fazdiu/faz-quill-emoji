import * as esbuild from 'esbuild'
import { minifyTemplates, writeFiles } from 'esbuild-minify-templates';

const name = 'faz-quill-emoji';

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

// autoregister
build({
    entryPoints: ['src/autoregister.js'],
    platform: 'browser',
    outfile: `dist/autoregister/${name}.iife.js`
});

build({
    entryPoints: ['src/autoregister.js'],
    platform: 'neutral',
    outfile: `dist/autoregister/${name}.esm.js`,
    mainFields: ['main', 'module'],
});

build({
    entryPoints: ['src/autoregister.js'],
    platform: 'node',
    outfile: `dist/autoregister/${name}.cjs.js`
});

// Manual Registration
build({
    platform: 'neutral',
    outfile: `dist/${name}.esm.js`,
    mainFields: ['main', 'module'],
});

build({
    platform: 'node',
    outfile: `dist/${name}.cjs.js`
});

async function build(options) {
    const licenseText = `/*!
    * Faz quill emoji 0.1.0
    * Licensed under MIT, https://opensource.org/licenses/MIT/
    * Please visit https://github.com/fazdiu/faz-quill-emoji for details.
    */`;
    return await esbuild.build({
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
        plugins: [minifyTemplates(), writeFiles()],
        write: false, // <-- important!
        ...options
    })
}