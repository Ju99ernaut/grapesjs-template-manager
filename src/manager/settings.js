import UI from '../utils/ui';

export default class SettingsApp extends UI {
    constructor(editor, opts = {}) {
        super(editor, opts);
        this.handleSave = this.handleSave.bind(this);
        this.handleThumbnail = this.handleThumbnail.bind(this);
        this.handleThumbnailInput = this.handleThumbnailInput.bind(this);

        /* Set initial app state */
        this.state = {
            tab: 'page',
            loading: false
        };
    }

    setTab(tab) {
        this.state.tab = tab;
    }

    update() {
        const { $el } = this;
        $el?.find('#settings').html(this.renderSettings());
        $el?.find('#generate').on('click', this.handleThumbnail);
        $el?.find('input#thumbnail').on('change', this.handleThumbnailInput);
    }

    onRender() {
        const { setState } = this;
        setState({
            loading: true
        });
        //? Setup code here 
        setState({
            loading: false
        });
    }

    handleSave(e) {
        const { $el, editor } = this;
        const { tab } = this.state;
        if (tab === 'page') {
            const id = editor.PagesApp.editableId;
            const name = $el?.find('input.name').val().trim();
            id && editor.PagesApp.editPage(id, name);
        } else {
            const id = editor.TemplateManager.editableId;
            const thumbnail = $el?.find('input.thumbnail').val().trim();
            const name = $el?.find('input.name').val().trim();
            const description = $el?.find('input.desc').val().trim();
            const template = $el?.find('input.template').get(0).checked;
            id && editor.TemplateManager.handleEdit({ id, thumbnail, name, description, template });
        }
        editor.Modal.close();
    }

    handleThumbnail(e) {
        const { editor, $el } = this;
        editor.runCommand('take-screenshot', {
            clb(dataUrl) {
                $el?.find('input.thumbnail').val(dataUrl);
                $el?.find('img').attr('src', dataUrl);
            }
        })
    }

    handleThumbnailInput(e) {
        this.$el?.find('img').attr('src', e.target.value.trim());
    }

    renderSettings() {
        const { tab, loading } = this.state;
        const { opts, pfx, pm, editor } = this;

        if (loading) return opts.loader || '<div>Loading settings...</div>';

        if (tab === 'page') {
            const page = pm.get(editor.PagesApp.editableId);
            const value = page?.get('name') || page?.id || '';
            return `<label for="name">
                    ${editor.I18n.t('grapesjs-project-manager.settings.labels.name')}
                </label>
                <div class="flex-row">
                    <input 
                        class="name tm-input" 
                        value="${value}" 
                        placeholder="${editor.I18n.t('grapesjs-project-manager.settings.placeholders.name')}"/>
                </div>`
        } else {
            const clb = site => site.id === editor.TemplateManager.editableId;
            const site = editor.TemplateManager.allSites.find(clb);
            return `<div class="${pfx}tip-about ${pfx}four-color">
                    ${editor.I18n.t('grapesjs-project-manager.settings.help')}
                </div>
                <label for="thumbnail">
                    ${editor.I18n.t('grapesjs-project-manager.settings.labels.thumbnail')}
                </label>
                <div class="flex-row">
                    <input 
                        id="thumbnail" 
                        class="thumbnail tm-input" 
                        value="${site?.thumbnail || ''}" 
                        placeholder="${editor.I18n.t('grapesjs-project-manager.settings.placeholders.thumbnail')}"
                    />
                </div>
                <div class="flex-row" style="margin-bottom:15px;">
                    <div class="site-screenshot">
                        <img src="${site?.thumbnail || ''}" alt="screenshot" />
                    </div>
                    <button id="generate" class="primary-button">
                        ${editor.I18n.t('grapesjs-project-manager.settings.generate')}
                    </button>
                </div>
                <label for="name">
                    ${editor.I18n.t('grapesjs-project-manager.settings.labels.name')}
                </label>
                <div class="flex-row">
                    <input 
                        id="name" 
                        class="name tm-input" 
                        value="${site?.name || ''}" 
                        placeholder="${editor.I18n.t('grapesjs-project-manager.settings.placeholders.name')}"
                    />
                </div>
                <label for="desc">
                    ${editor.I18n.t('grapesjs-project-manager.settings.labels.description')}
                </label>
                <div class="flex-row">
                    <input 
                        id="desc" 
                        class="desc tm-input" 
                        value="${site?.description || ''}" 
                        placeholder="${editor.I18n.t('grapesjs-project-manager.settings.placeholders.description')}"
                    />
                </div>
                <div class="flex-row group">
                    <input id="template" class="template" type="checkbox" ${site?.template ? 'checked' : ''}/>
                    <label for="template">
                        ${editor.I18n.t('grapesjs-project-manager.settings.labels.template')}
                    </label>
                </div>`
        }
    }

    render() {
        const { $, editor } = this;

        // Do stuff on render
        this.onRender();
        this.$el?.remove();

        const cont = $(`<div class="app">
                <div id="settings">
                    ${this.renderSettings()}
                </div>
                <div class="flex-row">
                    <button id="save" class="primary-button">
                        ${editor.I18n.t('grapesjs-project-manager.settings.save')}
                    </button>
                </div>
            </div>`);
        cont.find('#save').on('click', this.handleSave);
        cont.find('#generate').on('click', this.handleThumbnail);
        cont.find('input#thumbnail').on('change', this.handleThumbnailInput);

        this.$el = cont;
        return cont;
    }
}