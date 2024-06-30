import "quill/dist/quill.snow.css";
import '../src/css/faz.quill.emoji.css';

import Quill from 'quill';
import RegisterFazQuillEmoji from "../src";

RegisterFazQuillEmoji(Quill);

// Custom button, or override the svg icons on toolbar @see https://github.com/slab/quill/issues/1099
// const icons = Quill.import('ui/icons');
// icons['faz-emoji'] = 'new icon';

const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: {
            container: ['bold', 'italic', 'underline', 'strike', 'faz-emoji'],
            handlers: {
                'faz-emoji': true //  To avoid the warning message: 'logger.ts:8 quill:toolbar ignoring attaching to nonexistent format faz-emoji' 
            },
        },
        fazEmoji: {
            collection: 'native', // 'native', 'openmoji', 'twemoji', 'noto', 'fluent-emoji', 'fluent-emoji-flat', 'fluent-emoji-high-contrast', 'noto-v1', 'emojione', 'emojione-monotone', 'emojione-v1', 'fxemoji', 'streamline-emojis'
        }
    }
});

// const module = quill.getModule("fazEmoji");
// module.openMenu();

const quill2 = new Quill('#editor-popper', {
    theme: 'snow',
    modules: {
        toolbar: {
            container: ['bold', 'italic', 'underline', 'strike', 'faz-emoji'],
            handlers: {
                'faz-emoji': true //  To avoid the warning message: 'logger.ts:8 quill:toolbar ignoring attaching to nonexistent format faz-emoji' 
            },
        },
        fazEmoji: {
            collection: 'fluent-emoji',
            rewriteCDNURL(url) {
                return url;
            },
            popperOptions: null,
            popper: window.Popper
        }
    }
});

const quill3 = new Quill('#editor-twemoji', {
    theme: 'snow',
    modules: {
        toolbar: {
            container: ['bold', 'italic', 'underline', 'strike', 'faz-emoji'],
            handlers: {
                'faz-emoji': true //  To avoid the warning message: 'logger.ts:8 quill:toolbar ignoring attaching to nonexistent format faz-emoji' 
            },
        },
        fazEmoji: {
            collection: 'twemoji',
            popper: window.Popper
        }
    }
});

const quill4 = new Quill('#editor-open-menu-outside', {
    theme: 'snow',
    modules: {
        toolbar: {
            container: ['bold', 'italic', 'underline', 'strike', 'faz-emoji'],
            handlers: {
                'faz-emoji': true //  To avoid the warning message: 'logger.ts:8 quill:toolbar ignoring attaching to nonexistent format faz-emoji' 
            },
        },
        fazEmoji: {
            collection: 'twemoji',
            popper: window.Popper
        }
    }
});

document.querySelector('#open-menu').addEventListener('click', () => {
    const module = quill4.getModule("fazEmoji");
    module.openMenu();
});


const quill5 = new Quill('#editor-openmoji', {
    theme: 'snow',
    modules: {
        toolbar: {
            container: ['bold', 'italic', 'underline', 'strike', 'faz-emoji'],
            handlers: {
                'faz-emoji': true //  To avoid the warning message: 'logger.ts:8 quill:toolbar ignoring attaching to nonexistent format faz-emoji' 
            },
        },
        fazEmoji: {
            collection: 'openmoji',
            popper: window.Popper
        }
    }
});
