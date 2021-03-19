export default class TemplateManager {
    constructor(editor, opts = {}) {
        this.editor = editor;
        this.$ = editor.$;
        this.pfx = editor.getConfig('stylePrefix');
        this.id = editor.Storage.getConfig('id') || 'gjs-';
        this.opts = opts;
    }

    _createPage() {
        const { editor, templateIdx, page } = this;
        const cs = editor.Storage.getCurrentStorage();
        cs.setIdx(templateIdx);
        cs.setIsTemplate(false);
        this.page && editor.load(res => {
            editor.setComponents(res.components ? JSON.parse(res.components) : res.html);
            editor.setStyle(res.styles ? JSON.parse(res.styles) : res.css);
            cs.setId(page);
            cs.setIdx(editor.runCommand('uuidv4'));
            cs.setThumbnail(res.thumbnail || '');
            editor.Modal.close();
        });
    };

    _openTemplate() {
        const { editor, templateIdx } = this;
        const cs = editor.Storage.getCurrentStorage();
        cs.setIdx(templateIdx);
        cs.setIsTemplate(true);
        editor.load(res => {
            cs.setThumbnail(res.thumbnail || '');
            editor.setComponents(res.components ? JSON.parse(res.components) : res.html);
            editor.setStyle(res.styles ? JSON.parse(res.styles) : res.css);
            editor.Modal.close();
        });
    };

    _selectTemplate(e) {
        const target = e.currentTarget
        this.templateIdx = target.dataset.idx;
        this.$(`.${pfx}templates-card`).each((i, elm) => {
            elm.classList.remove(`${pfx}templates-card-active`)
        });
        target.parentElement.classList.add(`${pfx}templates-card-active`);
    };

    _openPage(e) {
        const { editor } = this;
        const cs = editor.Storage.getCurrentStorage();
        cs.setIdx(e.currentTarget.dataset.idx);
        cs.setIsTemplate(false);
        editor.load(res => {
            cs.setId(res.id);
            cs.setThumbnail(res.thumbnail || '');
            editor.setComponents(res.components ? JSON.parse(res.components) : res.html);
            editor.setStyle(res.styles ? JSON.parse(res.styles) : res.css);
            editor.Modal.close();
        });
    }

    _editName(e) {
        const $el = this.$(e.currentTarget.parentElement);
        const lbl = $el.children().first();
        const inputCont = $el.find(`.${this.pfx}field`);
        const input = inputCont.find('input');
        if (inputCont.get(0).style.display === 'block') {
            lbl.text(input.val());
            inputCont.hide();
            //TODO reset name and store; 
        } else {
            input.val(lbl.text().trim());
            lbl.text('...');
            inputCont.show();
        }
    }

    _deletePage(e) {
        const { editor, opts } = this;
        editor.Storage.getCurrentStorage()
            .delete(opts.onDelete, opts.onDeleteError, e.currentTarget.dataset.idx);
        e.currentTarget.parentElement
            .parentElement.style.display = 'none';
    }

    _thumbs(idx, thumb) {
        return `<div class="${this.pfx}templates-card" data-idx="${idx}">
                ${thumb}
            </div>`;
    }

    _thumbsCont(thumbs) {
        const content = this.$(`<div class="${this.pfx}templates-card-2">
                ${thumbs}
            </div>`);
        content.find('i.fa.fa-i-cursor').on('click', e => this._editName(e));
        content.find('i.fa.fa-trash-o').on('click', e => this._deletePage(e));
        return content;
    }

    _pages(thumbs) {
        const { pfx } = this;
        const cs = this.editor.Storage.getCurrentStorage();
        const content = this._thumbsCont(thumbs);
        content.find(`.${pfx}templates-card`)
            .filter((i, elm) => elm.getAttribute('data-idx') == cs.currentIdx)
            .addClass(`${pfx}templates-card-active`)
            .find('i.fa')
            .hide();
        content.find(`.${this.pfx}thumb-select`).on('click', e => this._openPage(e));
        return content;
    }

    _templates(thumbs) {
        const { pfx } = this;
        const content = this._thumbsCont(thumbs);
        content.find(`.${pfx}templates-card`)
            .filter((i, elm) => elm.getAttribute('data-idx') == this.templateIdx)
            .addClass(`${pfx}templates-card-active`)
            .find('i.fa')
            .hide();
        content.find(`.${pfx}thumb-select`).on('click', e => this._selectTemplate(e));
        return content;
    }

    _tabs() {
        const { pfx, $, opts } = this;
        const content = $(`<div class="${pfx}tab">
                <button class="${pfx}tablinks active">${opts.tabsText.pages}</button>
                <button class="${pfx}tablinks">${opts.tabsText.templates}</button>
            </div>`);
        content.find('button').on('click', e => {
            const target = e.currentTarget;
            content.find(`.${pfx}tablinks`).removeClass('active');
            $(target).addClass('active');
            if (target.innerHTML.toLowerCase() === 'pages') {
                $('.templates-tab').hide();
                $('.pages-tab').show();
            } else {
                $('.templates-tab').show();
                $('.pages-tab').hide();
            }
        });
        return content;
    }

    loader() {
        return '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
    }

    render() {
        const { pfx, $, opts } = this;
        const tabs = this._tabs();
        const content = $(`<div id="pages" class="${pfx}templates ${pfx}one-bg ${pfx}two-color">
            <div class="${pfx}templates-overlay"></div>
            <div class="${pfx}templates-cont">
                <div class="${pfx}fonts templates-tab" style="display:none">
                    <div class="${pfx}tip-about ${pfx}four-color">${opts.help}</div>
                    <label class="${pfx}field-label" for="page-name">${opts.nameLabel}</label>
                    <div class="${pfx}field">
                        <input type="text" name="pageName" id="page-name">
                    </div>
                    <span>
                        <button class="${pfx}btn-prim ${pfx}btn-wide" id="template-edit">
                            ${opts.btnText.edit}
                        </button>
                    </span>
                    <span>
                        <button class="${pfx}btn-prim ${pfx}btn-wide" id="page-create">
                            ${opts.btnText.create}
                        </button>
                    </span>
                </div>
                <div id="pages-container" class="pages-tab">
                    <button class="${pfx}btn-prim ${pfx}btn-wide" id="templates-tab">
                        ${opts.btnText.new}
                    </button>
                </div>
                <div id="templates-container" class="templates-tab" style="display:none"></div>
            </div>
        </div>`);
        content.find('#templates-tab').on('click', () => {
            const tablinks = tabs.find(`.${pfx}tablinks`);
            tablinks.removeClass('active');
            $(tablinks.get(1)).addClass('active');
            $('.templates-tab').show();
            $('.pages-tab').hide();
        });
        content.find('#page-name').on('keyup', e => this.page = e.currentTarget.value);
        content.find('#page-create').on('click', () => this._createPage());
        content.find('#template-edit').on('click', () => this._openTemplate());
        content.find(`.${pfx}templates-cont`).prepend(tabs);
        return content;
    }

    update(data, pages = true) {
        let thumbnailsEl = '';
        const { pfx, id } = this;

        data.forEach(el => {
            const dataSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="template-preview" viewBox="0 0 1300 1100" width="99%" height="220">
                    <foreignObject width="100%" height="100%" style="pointer-events:none">
                    <div xmlns="http://www.w3.org/1999/xhtml" ${el[`${id}html`] ? '' : 'padding-top:100%'}">
                    ${el[`${id}html`] + '<style scoped>' + el[`${id}css`] + '</style>'}
                    </div>
                    </foreignObject>
                </svg>`;
            let thumbnailEl = el.thumbnail ? `<div class="${pfx}thumbnail-cont">
                    <img class="template-preview" src="${el.thumbnail}" alt="${el.id}">
                </div>` : dataSvg;
            thumbnailEl = `<div class="${pfx}thumb-select" data-idx="${el.idx}">
                    ${thumbnailEl}
                </div>
                <div class="label">
                    <div>${el.id}</div>
                    <div class="${pfx}field" style="display:none;" >
                        <input type="text" placeholder="page name" data-idx="${el.idx}">
                    </div>
                    <i class="${pfx}caret-icon fa fa-i-cursor" title="rename" data-idx="${el.idx}"></i>
                    <i class="${pfx}caret-icon fa fa-trash-o" title="delete" data-idx="${el.idx}"></i>
                </div>`;

            thumbnailsEl += this._thumbs(el.idx, thumbnailEl);
        });

        return pages ? this._pages(thumbnailsEl) : this._templates(thumbnailsEl);
    }
}