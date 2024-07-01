import { BLOT_IMAGE_NAME, BLOT_TEXT_NAME } from "./constant";
import emojisNativeList from "./native-emoji-list";
import emojiCategories from "./emoji-categories";
import icons from "./icons";
import templateHTML from "./html/template.html";

const EmojiCore = class EmojisWrapper {

    /**
     * 
     * @param {Object} options 
     * @param {string} [options.collection=''] 
     * @param {() => void} [options.rewriteCDNURL=()=>{}] 
     * @param {null} [options.popper=null] 
     * @param {{}|null} [options.popperOptions=null]  
     */
    constructor(quill, options) {

        const allowedCollections = ['native', 'openmoji', 'twemoji', 'noto', 'fluent-emoji', 'fluent-emoji-flat', 'fluent-emoji-high-contrast', 'noto-v1', 'emojione', 'emojione-monotone', 'emojione-v1', 'fxemoji', 'streamline-emojis'];
        const collection = options?.collection || 'native';
        if (!allowedCollections.includes(collection)) {
            console.error('Emoji collection not found', { collection });
        }

        this.options = { ...options, collection };
        this.quill = quill;
        this.toolbar = quill.getModule('toolbar');
        const classNamePrefix = 'faz-quill-emoji';
        this.CSS = {
            prefix: classNamePrefix,
            emojiItem: `${classNamePrefix}-item`
        }
        this.dropdown = null;
        this.loader = {
            element: null,
            toggle(force = null) {
                const style = this.element?.style;

                if (!style) return;

                const show = force === null ? style.display != 'none' : force;
                style.display = show ? '' : 'none';
            }
        }
        this.tabGroup = [];
        this.itemsPerPage = 36;
        this.popper = null;

        if (typeof this.toolbar !== 'undefined') {
            const handlerName = 'faz-emoji';
            const handlerValue = this.toolbar.handlers[handlerName];
            const handlerIsFunction = typeof handlerValue === 'function';
            const handlerIsUndefined = typeof handlerValue === 'undefined';

            if (!handlerIsUndefined && !handlerIsFunction) {
                this.toolbar.addHandler(handlerName, () => {
                    this.openDropdown();
                    // console.log("call handler");
                });
            }

            const emojiBtns = this.toolbar.container.getElementsByClassName('ql-faz-emoji');
            if (emojiBtns) {
                [].slice.call(emojiBtns).forEach((emojiBtn) => {

                    if (!emojiBtn.innerHTML) {
                        emojiBtn.innerHTML = icons.button;
                    }

                    if (handlerIsUndefined) {
                        emojiBtn.addEventListener("click", () => {
                            this.openDropdown();
                            // console.log("call click");
                        });
                    }

                    // emojiBtn.click();
                });
            }
        }
    }

    /**
     * Start or open the drop-down menu
     */
    openDropdown() {
        if (!this.dropdown) {
            const collectionName = this.options.collection;

            const dropdown = this.makeElement('div', {
                styles: {
                    left: 0,
                    top: 0,
                    position: 'absolute',
                    'z-index': 1000,
                    visibility: 'hidden',
                    'pointer-events': 'none'
                },
                className: ['dropdown', collectionName]
            });
            dropdown.innerHTML = templateHTML;

            const element = {
                templateTab: dropdown.querySelector('template#tab'),
                templateTabPanel: dropdown.querySelector('template#tab-panel'),

                tabPlaceholder: dropdown.querySelector('.tab-placeholder'),
                listPlaceholder: dropdown.querySelector('.list-placeholder'),
                listItemPlaceholder: dropdown.querySelector('.item-placeholder'),

                loader: dropdown.querySelector(`.loader`),
                tabList: dropdown.querySelector(`.tab-list`),
                tabPanels: dropdown.querySelector(`.tab-panels`),
                scroll: dropdown.querySelector(`.scroll`),
            }
            const scrollEl = element.scroll;
            const tabListEl = element.tabList;

            element.loader.innerHTML = icons.loading;
            this.loader.element = element.loader;

            // create placeholder
            Array.from({ length: 6 }, () => {
                const placeholder = element.tabPlaceholder;
                const clone = placeholder.cloneNode();
                placeholder.parentElement.appendChild(clone);
            });
            Array.from({ length: 29 }, () => {
                const placeholder = element.listItemPlaceholder;
                const clone = placeholder.cloneNode();
                placeholder.parentElement.appendChild(clone);
            });

            this.getEmojisByCategory(collectionName).then((tabs) => {
                const fragmentTabList = document.createDocumentFragment();
                const fragmentTabPanels = document.createDocumentFragment();

                this.tabGroup = tabs.map((item) => {
                    const { name, icon, categoriesOr } = item;

                    const templateTab = element.templateTab;
                    const tabEl = templateTab.content.cloneNode(true).firstElementChild;
                    tabEl.innerHTML = icon;
                    tabEl.setAttribute('data-emoji-category', name);
                    tabEl.setAttribute('data-emoji-category-or', String(categoriesOr || ''));
                    fragmentTabList.appendChild(tabEl);

                    const templateTabPanel = element.templateTabPanel;
                    const tabPanelEl = templateTabPanel.content.cloneNode(true).firstElementChild;
                    tabPanelEl.setAttribute('data-emoji-category', name);
                    fragmentTabPanels.appendChild(tabPanelEl);

                    const emojiListEl = tabPanelEl.querySelector(`.list`);
                    const boxSearchEl = tabPanelEl.querySelector(`.box-search`);
                    const result = {
                        ...item,
                        tabElement: tabEl,
                        tabPanelElement: tabPanelEl,
                        emojiListElement: emojiListEl
                    }


                    // search box
                    if (name == 'all') {
                        const searchInputEl = boxSearchEl.querySelector(`input`);

                        const searchIconEl = this.makeElement('span', { html: icons.search });
                        searchInputEl.parentElement.prepend(searchIconEl);

                        result.searchInputElement = searchInputEl;

                        let timeoutId = null;
                        searchInputEl.addEventListener('input', (e) => {
                            clearTimeout(timeoutId);
                            timeoutId = setTimeout(() => {

                                emojiListEl.innerHTML = '';
                                this.loadEmojisInActiveTab('first', true);

                            }, 300);
                        });

                    } else {
                        boxSearchEl.remove();
                    }


                    tabEl.addEventListener('click', async (e) => {

                        this.tabGroup.forEach((e) => {
                            e.tabElement.classList.remove('active');
                            e.tabPanelElement.style.display = 'none';
                        });
                        tabEl.classList.add('active');
                        tabPanelEl.style.display = '';

                        await this.loadEmojisInActiveTab('first');

                        // Reset the scroll bar
                        const st = scrollEl.scrollTop;
                        scrollEl.scrollTop = st > 18 ? st - 18 : st;
                    });

                    return result
                });

                this.rewriteClassNames(fragmentTabList);
                this.rewriteClassNames(fragmentTabPanels);

                tabListEl.innerHTML = '';
                scrollEl.innerHTML = '';

                tabListEl.appendChild(fragmentTabList);
                scrollEl.appendChild(fragmentTabPanels);

                let timeoutId = undefined;
                let lastScrollTop = 0;
                const scrollHandle = (evt) => {
                    clearTimeout(timeoutId);

                    timeoutId = setTimeout(() => {
                        const target = scrollEl;

                        // !! detecting end of scroll in a div @see https://stackoverflow.com/questions/67549676/detecting-end-of-scroll-in-a-div @see https://stackoverflow.com/questions/31223341/detecting-scroll-direction
                        const st = target.scrollTop;
                        // downscroll code
                        if (st > lastScrollTop) {
                            const c1 = st + target.offsetHeight;
                            const c2 = target.scrollHeight;
                            const isEnd = Math.round(c1) + 5 >= c2;

                            if (isEnd) {
                                this.loadEmojisInActiveTab('next');
                            }

                        }
                        // upscroll code
                        else if (st < lastScrollTop) {

                        }
                        lastScrollTop = st <= 0 ? 0 : st;

                    }, 50);

                };
                const heightTabList = element.tabList.offsetHeight;
                scrollEl.style.height = `${heightTabList}px`;


                scrollHandle();
                scrollEl.addEventListener('scroll', scrollHandle)
                this.tabGroup[0].tabElement.click();
            });

            this.rewriteClassNames(dropdown);

            // remove template
            element.templateTab.remove();
            element.templateTabPanel.remove();

            // this.quill.container.appendChild(fragment);
            this.quill.container.appendChild(dropdown);
            this.dropdown = dropdown;

            this.setStyle(dropdown, {
                display: 'none',
                visibility: '',
                'pointer-events': ''
            });

            // update the position drop-down menu when scrolling
            document.addEventListener('scroll', (e) => {
                    const { target } = e;
                    const menu = this.dropdown;

                    if (!menu) return;
        
                    const inside = menu.contains(target);
        
                    if (inside || target === menu) return;
        
                    const isOpen = menu.classList.contains('show');

                    if (isOpen) {
                        this.positioningEngineDropdown();
                    }
            }, true);
        }

        this.setStyle(this.dropdown, { display: '' });
        this.dropdown.classList.add('show');

        this.positioningEngineDropdown();
        this.attachOrRemoveClickOutside();
    }

    /**
     * Close the drop-down menu
     */
    closeDropdown() {
        const menu = this.dropdown;
        if (menu) {
            this.setStyle(menu, { display: 'none' });
            menu.classList.remove('show');
            this.attachOrRemoveClickOutside(true);
            this.loader.toggle(false);
        }
    }

    /**
     * The position of the drop-down menu is calculated
     */
    positioningEngineDropdown() {
        const quill = this.quill;
        const dropdown = this.dropdown;
        const selection = quill.getSelection();
        const editorBounds = quill.container.getBoundingClientRect();
        const selectionBounds = quill.getBounds(selection ? selection.index : 0);

        const _Popper = this.options.popper;
        if (_Popper) {
            const generateGetBoundingClientRect = (obj = {}) => {
                return () => ({
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    ...obj
                });
            };

            if (!this.popper) {
                const virtualElement = {
                    getBoundingClientRect: generateGetBoundingClientRect()
                };
                const defaultOptions = {
                    placement: 'bottom-start',
                    modifiers: [
                        {
                            name: 'flip',
                            enabled: true,
                        },
                        {
                            name: 'offset',
                            options: {
                                offset: [8, 8],
                            },
                        },
                        {
                            name: 'preventOverflow',
                            options: {
                                mainAxis: true,
                            }
                        },
                        {
                            name: 'computeStyles',
                            options: {
                              gpuAcceleration: true
                            },
                          },
                    ],
                };
                const popperOptions = this.options.popperOptions || defaultOptions;

                this.popper = {
                    instance: _Popper.createPopper(virtualElement, this.dropdown, popperOptions),
                    virtualElement
                };
            }

            this.popper.instance.update();
            this.popper.virtualElement.getBoundingClientRect = generateGetBoundingClientRect({
                left: editorBounds.left + selectionBounds.left,
                right: editorBounds.right + selectionBounds.right,
                top: editorBounds.top + selectionBounds.top,
                bottom: editorBounds.bottom + selectionBounds.bottom,
                width: selectionBounds.width,
                height: selectionBounds.height,
            });

        } else {

            const paletteWidthAndHeight = 350;
            const selectionCenter = (selectionBounds.left + selectionBounds.right) / 2;
            const selectionMiddle = (selectionBounds.top + selectionBounds.bottom) / 2;
            const paletteLeft = editorBounds.left + selectionCenter + paletteWidthAndHeight <= document.documentElement.clientWidth ? selectionCenter : editorBounds.left - paletteWidthAndHeight;
            const paletteTop = editorBounds.top + selectionMiddle + paletteWidthAndHeight + 10 <= document.documentElement.clientHeight ? selectionMiddle + 10 :
                editorBounds.top + selectionMiddle - paletteWidthAndHeight - 10 >= 0 ? selectionMiddle - paletteWidthAndHeight - 10 :
                    document.documentElement.clientHeight - paletteWidthAndHeight - editorBounds.top;

            this.setStyle(dropdown, {
                left: `${paletteLeft}px`,
                top: `${paletteTop}px`
            });

        }

    }

    /**
     * Set CSS styles on the element
     * @param {Element} [element] 
     * @param {Object} [styles={}] 
     */
    setStyle(element, styles = {}) {
        Object.entries(styles).forEach(([name, value]) => {
            element.style[name] = value;
        });
    }

    /**
     * Group and sort emojis by category
     * @param {String} [name='native'] 
     * @returns {Array}
     */
    async getEmojisByCategory(name = "native") {
        const groupBy = (emojisByCategory = {}, prefix = '') => {
            const emojisByCategoryArr = Object.entries(emojisByCategory);

            const getCategory = (arr, value) =>
                arr.find((c) => {
                    const concat = c.otherNames.concat(c.name);
                    return concat.map((c) => c.toLowerCase()).includes(value.toLowerCase())
                });

            const categories = emojisByCategoryArr.reduce((ac, v) => {
                const [categoryName] = v;

                const item = getCategory(emojiCategories, categoryName);

                if (!item) {
                    console.warn('Category not found in the list:', { categoryName, prefix });
                } else {
                    const exists = getCategory(ac, categoryName);
                    if (!exists) {
                        ac.push({ ...item, currentPage: 0, categoriesOr: [categoryName] });
                    } else {
                        exists.categoriesOr.push(categoryName);
                    }
                }

                return ac;
            }, []).sort((a, b) => a.order - b.order);

            let emojiId = 0;
            const allEmojis = emojisByCategoryArr.flatMap((v) => {
                const [categoryName, emojis] = v;
                const category = getCategory(categories, categoryName);
                const calcOrder = (emName) => {
                    emName = emName.toLowerCase();
                    const Keywoards = ['face', 'loudly', 'crying', 'tears', 'joy', 'rolling', 'floor', 'laughing', 'smiling', 'heart-eyes', 'heart-shaped'];
                    const count = Keywoards.length;
                    const results = Keywoards.map((k) => emName.indexOf(k) > -1 ? 1 : 0);
                    const sum = results.reduce((a, b) => a + b, 0);
                    return sum > 0 ? count / sum : count + 1;
                };

                if (!category) {
                    console.warn('The emojis category not found', { categoryName, emojis });
                }

                return emojis
                    .map((em) => {
                        emojiId++;
                        const obj = typeof em === 'string' ? { name: em } : em;

                        return {
                            ...obj,
                            id: emojiId,
                            collection: prefix,
                            order: calcOrder(obj.name),
                            category: category?.name,
                            categoryOrder: category?.order || 5000,
                        }
                    });
            });


            const all = { name: 'all', allEmojis, icon: icons.latest, currentPage: 0 };

            return [all].concat(categories);
        };

        let result = [];
        if (name == "native") {
            result = groupBy(emojisNativeList);

        } else {
            const collection = name;
            try {
                const res = await fetch(`https://api.iconify.design/collection?prefix=${collection}`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                let data = await res.json();

                result = groupBy(data.categories, collection);
            } catch (error) {
                console.error(error);
            }
        }

        return result;
    }

    /**
     * Attach or remove listener to hide drop-down menu when clicked outside
     * @param {Boolean} [remove=true] 
     */
    attachOrRemoveClickOutside(remove = false) {
        const handler = (e) => {
            const { target } = e;
            const menu = this.dropdown;

            if (!menu) return;

            const inside = menu.contains(target);

            if (inside || target === menu) return;

            this.closeDropdown();
        };
        if (remove) {
            document.removeEventListener("click", handler, true);
        } else {
            document.addEventListener("click", handler, true);
        }
    }

    /**
     * Filter, load, and paginate emojis for the active tab
     * @param {null|'first'|'next'} [pageString=null] 
     * @param {boolean} [reset=false] 
     * @returns 
     */
    async loadEmojisInActiveTab(pageString = null, reset = false) {
        const active = this.tabGroup.find((t) => t.tabElement.classList.contains('active'));
        if (!active) return;

        let { currentPage, name, searchInputElement } = active;
        const value = searchInputElement?.value;
        const main = name == 'all' ? active : this.tabGroup.find((t) => t.name == 'all');

        const leakedEmojis = main.allEmojis.reduce((ac, em) => {
            let bool = true;
            const { name, category } = em;

            if (active.name == 'all') {

                if (value) {
                    const r = value.trim().split(' ').map((v) => name.toUpperCase().indexOf(v.toUpperCase()) > -1);
                    bool = r.every((v) => v);
                }

            } else {
                bool = category && category == active.name;
            }

            if (bool) {
                ac.push({ ...em })
            }

            return ac;
        }, []).sort((a, b) => Number(`${a.categoryOrder}${a.order}`) - Number(`${b.categoryOrder}${b.order}`));

        if (!leakedEmojis.length) return;

        let _page = null;

        if (reset) currentPage = 0;

        if (pageString == 'first') _page = currentPage < 2 ? 1 : null;

        if (pageString == 'next') _page = currentPage + 1;

        if (!_page) return;

        const perPage = this.itemsPerPage;
        const skip = currentPage * perPage;
        const end = skip + perPage;
        const emojis = leakedEmojis.slice(skip, end);

        if (!emojis.length) return;

        active.currentPage = _page;

        await this.renderEmojis(emojis, active.emojiListElement);

        return active;
    }

    /**
     * Append emoji to the container
     * @param {null|Array} emojis 
     * @param {null|Element} appendTo 
     * @returns 
     */
    async renderEmojis(emojis = null, appendTo = null) {
        if (!emojis) return;

        const timeout = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        const promises = [timeout(400)];
        const frag = document.createDocumentFragment();

        this.loader.toggle(true);
        for (const em of emojis) {
            const { code_decimal, name, collection } = em;

            const buttonIcon = this.makeElement('div', {
                className: this.CSS.emojiItem
            });
            if (code_decimal) {
                const ico = code_decimal;
                // buttonIcon.textContent = String.fromCodePoint(parseInt(ico.replace('&#', '').replace(';', '')));
                buttonIcon.innerHTML = ico;
                buttonIcon.setAttribute("data-emoji-hex", ico);
            } else {
                // !!! cdn @see doc https://iconify.design/docs/api/img.html
                const ico = this.makeElement('img');
                ico.setAttribute('src', `https://api.iconify.design/${collection}/${name}.svg`);
                ico.setAttribute('loading', 'lazy');
                ico.setAttribute('alt', name);
                buttonIcon.appendChild(ico);
            }

            buttonIcon.setAttribute('title', name.replaceAll('-', ' ').replaceAll('_', ' '));
            frag.appendChild(buttonIcon);
            buttonIcon.addEventListener('click', async (e) => {
                this.loader.toggle(true);

                const el = e.currentTarget;
                const { emojiHex } = el.dataset;
                const range = this.quill.getSelection(true);
                const index = range && range.index > -1 ? range.index : 0;

                const img = el.querySelector(':scope>img');
                let src = img?.getAttribute('src');
                const alt = img?.getAttribute('alt');

                if (emojiHex) {
                    this.quill.insertEmbed(index, BLOT_TEXT_NAME, { text: emojiHex }, 'user');
                }

                if (src) {
                    const rewrite = this.options.rewriteCDNURL;
                    if (typeof rewrite === 'function') {
                        src = await Promise.resolve(rewrite(src)); // allow function normal/promise
                    }

                    this.quill.insertEmbed(index, BLOT_IMAGE_NAME, { src, alt }, 'user');
                }

                this.loader.toggle(false);

                setTimeout(() => this.quill.setSelection(index + 1), 10);
                setTimeout(() => this.closeDropdown(), 0);

            });
        }

        if (frag.children.length) {
            appendTo.appendChild(frag);
        }

        await Promise.all(promises);
        this.loader.toggle(false);

    }

    /**
     * Make element
     * @param {String} tag 
     * @param {Object} atributes 
     * @returns 
     */
    makeElement(tag, atributes = {}) {
        let { styles, className, html, text, data } = atributes;
        const element = document.createElement(tag);

        if (styles) this.setStyle(element, styles);

        if (className) {
            className = typeof className === "string" ? className.split(" ") : className;
            element.classList.add(...className);
        }

        if (html) element.innerHTML = html;

        if (text) element.innerText = text;

        if (data) {
            Object.entries(data).forEach(([name, value]) => {
                element.setAttribute(`data-${name}`, value);
            });
        }

        return element;
    }


    /**
     * Rewrite all class names with prefix
     * @param {Element} [element] 
     */
    rewriteClassNames(element) {
        const prefix = this.CSS.prefix;
        const all = [...element.querySelectorAll('*')];
        [element].concat(all).forEach((el) => {
            if (!el.classList) return;

            const classNames = [...el.classList].map((cls) => {
                cls = cls.trim();

                if (!cls) return cls;

                return cls.startsWith(prefix) ? cls : `${prefix}-${cls}`;
            });
            el.setAttribute('class', classNames.join(' '));
        });
    }

}

export default class ModuleFazEmoji {

    constructor(quill, options) {
        const instance = new EmojiCore(quill, options);
        this.openMenu = () => {
            return instance.openDropdown();
        };
    }
}