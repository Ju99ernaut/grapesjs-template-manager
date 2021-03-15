export class TemplateManager {
    constructor(editor, opts = {}) {
        this.editor = editor;
        this.$ = editor.$;
        this.pfx = editor.getConfig('stylePrefix');
        this.opts = opts;
    }

    _createPage() {
        const { editor, templateIdx } = this;
        const sm = editor.Storage;
        sm.get(sm.getCurrent()).set({ idx: templateIdx, template: false });
        this.page && editor.load(res => {
            sm.get(sm.getCurrent()).set({
                id: this.page,
                idx: editor.runCommand('uuidv4'),
                thumbnail: res.thumbnail || ''
            });
            editor.setComponents(res.components ? JSON.parse(res.components) : res.html);
            editor.setStyle(res.styles ? JSON.parse(res.styles) : res.css);
            editor.Modal.close();
        });
    };

    _openTemplate() {
        const { editor, templateIdx } = this;
        const sm = editor.Storage;
        sm.get(sm.getCurrent()).set({ idx: templateIdx, template: true });
        editor.load(res => {
            sm.get(sm.getCurrent()).set({ thumbnail: res.thumbnail || '' });
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
        const sm = editor.Storage;
        const idx = e.currentTarget.dataset.idx;
        sm.get(sm.getCurrent()).set({ idx, template: false });
        editor.load(res => {
            sm.get(sm.getCurrent()).set({ id: res.id, thumbnail: res.thumbnail || '' });
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
        const sm = editor.Storage;
        sm.get(sm.getCurrent())
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
        const sm = this.editor.Storage;
        const content = this.$(`<div class="${this.pfx}templates-card-2">
                ${thumbs}
            </div>`);
        content.find(`.${pfx}templates-card`)
            .filter((i, elm) => elm.getAttribute('data-idx') == sm.get(sm.getCurrent()).get('idx'))
            .addClass(`${pfx}templates-card-active`)
            .find('i.fa')
            .hide();
        content.find(`.${this.pfx}thumb-select`).on('click', e => this._openPage(e));
        content.find('i.fa.fa-i-cursor').on('click', e => this._editName(e));
        content.find('i.fa.fa-trash-o').on('click', e => this._deletePage(e));
        return content;
    }

    loader() {
        return '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
    }

    render() {
        const { pfx } = this;
        return `<div id="pages" class="${pfx}templates ${pfx}one-bg ${pfx}two-color">
            <div class="${pfx}templates-overlay"></div>
            <div class="${pfx}templates-cont">
                <div class="${pfx}fonts">
                    <label class="${pfx}field-label" for="page-name">Name</label>
                    <div class="${pfx}field">
                        <input type="text" name="pageName" id="page-name">
                    </div>
                    <span>
                        <button class="${pfx}btn-prim ${pfx}btn-wide" id="template-edit">
                            Edit Selected
                        </button>
                    </span>
                    <span>
                        <button class="${pfx}btn-prim ${pfx}btn-wide" id="page-create">
                            Create
                        </button>
                    </span>
                </div>
                <div class="${pfx}templates-header2">
                    Your Pages
                </div>
                <div id="pages-container"></div>
            </div>
        </div>`;
    }

    update(data) {
        let thumbnailsEl = '';

        data.forEach(el => {
            const dataSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="template-preview" viewBox="0 0 1300 1100" width="99%" height="220">
                    <foreignObject width="100%" height="100%" style="pointer-events:none">
                    <div xmlns="http://www.w3.org/1999/xhtml" ${el['gjs-html'] ? '' : 'padding-top:100%'}">
                    ${el['gjs-html'] + '<style scoped>' + el['gjs-css'] + '</style>'}
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

        return this._thumbsCont(thumbnailsEl);
    }
}