import { BLOT_TEXT_NAME,BLOT_IMAGE_NAME } from "./constant";
import ModuleEmoji from "./module-emoji";


export default (Quill) => {
    const className = 'faz-emoji';

    // blot emoji text
    const Embed = Quill.import('blots/embed');
    class TextEmoji extends Embed {
        static create(value) {
            let node = super.create(value);
            node.innerHTML = value.text;
            return node;
        }
    }

    TextEmoji.blotName = BLOT_TEXT_NAME;
    TextEmoji.className = className;
    TextEmoji.tagName = 'span';

    Quill.register(`formats/${BLOT_TEXT_NAME}`, TextEmoji, true);


    // blot emoji image
    const Image = Quill.import('formats/image');
    class ImageEmoji extends Image {
        static create(value) {
            let node = super.create(value);

            if (value.src) node.setAttribute('src', value.src);

            if (value.alt) node.setAttribute('alt', value.alt);

            return node;
        }
    }

    ImageEmoji.blotName = BLOT_IMAGE_NAME;
    ImageEmoji.className = className;

    Quill.register(`formats/${BLOT_IMAGE_NAME}`, ImageEmoji, true);

    // 
    Quill.register("modules/fazEmoji", ModuleEmoji, true);
};