import * as esbuild from 'esbuild'
import { minifyTemplates, writeFiles } from 'esbuild-minify-templates';
import esbuildGlobal from 'esbuild-plugin-external-global';

const licenseText = `/*!
* Faz quill emoji 0.1.1
* Licensed under MIT, https://opensource.org/licenses/MIT/
* Please visit https://github.com/fazdiu/faz-quill-emoji for details.
*/`;
const config = {
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
    external: ['quill'],
    plugins: [minifyTemplates(), writeFiles()],
    write: false
}

build({
    ...config,
    entryPoints: ['src/css/faz.quill.emoji.css'],
    outfile: `dist/faz.quill.emoji.css`,
    target: [
        'chrome58',
        'edge16',
        'firefox57',
        'safari11',
    ]
});


const auto ='autoregister';
// autoregister - iife
build({
    ...config,
    entryPoints: ['src/autoregister.js'],
    platform: 'browser',
    outfile: `dist/${auto}.iife.js`,
    plugins: [
        ...config.plugins,
        esbuildGlobal.externalGlobalPlugin({
            'quill': 'window.Quill',
        })
    ]
});

// autoregister - esm
build({
    ...config,
    entryPoints: ['src/autoregister.js'],
    platform: 'neutral',
    outfile: `dist/${auto}.esm.js`,
    mainFields: ['main', 'module']
});

// autoregister - cjs
build({
    ...config,
    entryPoints: ['src/autoregister.js'],
    platform: 'node',
    outfile: `dist/${auto}.cjs.js`
});

const index = 'index';
// esm
build({
    ...config,
    platform: 'neutral',
    outfile: `dist/${index}.esm.js`,
    mainFields: ['main', 'module'],
});

// cjs
build({
    ...config,
    platform: 'node',
    outfile: `dist/${index}.cjs.js`
});

async function build(options) {
    return await esbuild.build({ ...options })
}