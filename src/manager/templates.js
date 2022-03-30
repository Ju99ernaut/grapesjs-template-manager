import ago from '../utils/timeago';
import UI from '../utils/ui';
import objSize from '../utils/objsize';
import { sortByDate, sortByName, sortByPages, sortBySize, matchText } from '../utils/sort';

export default class TemplateManager extends UI {
    constructor(editor, opts = {}) {
        super(editor, opts);
        this.handleSort = this.handleSort.bind(this);
        this.handleFilterInput = this.handleFilterInput.bind(this);
        this.handleNameInput = this.handleNameInput.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleCreate = this.handleCreate.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.openEdit = this.openEdit.bind(this);

        /* Set initial app state */
        this.state = {
            editableProjectId: '',
            projectId: '',
            tab: 'pages',
            sites: [],
            nameText: '',
            filterText: '',
            loading: false,
            sortBy: 'published_at',
            sortOrder: 'desc'
        };
    }

    get editableId() {
        return this.state.editableProjectId;
    }

    get allSites() {
        return this.state.sites;
    }

    get allSitesSize() {
        return objSize(this.state.sites);
    }

    async onRender() {
        const { setState, cs } = this;

        /* Set request loading state */
        setState({
            loading: true
        });

        /* Fetch sites from storage API */
        const sites = await cs.loadAll();
        /* Set sites and turn off loading state */
        setState({
            sites,
            loading: false
        });
    }

    handleFilterInput(e) {
        this.setState({
            filterText: e.target.value.trim()
        });
    }

    handleNameInput(e) {
        this.setStateSilent({
            nameText: e.target.value.trim()
        })
    }

    handleSort(e) {
        const { sortOrder } = this.state;
        if (e.target && e.target.dataset) {
            this.setState({
                sortBy: e.target.dataset.sort,
                // invert sort order
                sortOrder: sortOrder === 'desc' ? 'asc' : 'desc'
            });
        }
    }

    handleTabs(e) {
        const { target } = e;
        const { $el, pfx, $ } = this;
        $el.find(`.${pfx}tablinks`).removeClass('active');
        $(target).addClass('active');
        if (target.id === 'pages') {
            this.setState({ tab: 'pages' });
        } else {
            this.setState({ tab: 'templates' });
        }
    }

    async handleOpen(e) {
        const { editor, cs } = this;
        const { projectId } = this.state;
        if (!projectId || projectId === cs.currentId) {
            this.opts.currentPageOpen()
            return;
        }
        cs.setId(projectId);
        const res = await editor.load();
        cs.setName(res.name);
        cs.setThumbnail(res.thumbnail || '');
        cs.setIsTemplate(res.template);
        cs.setDescription(res.description || 'No description');
        editor.Modal.close();
    }

    async handleCreate(e) {
        const { editor, cs } = this;
        const { projectId, nameText } = this.state;
        const id = editor.runCommand('get-uuidv4');
        const name = nameText || 'New-' + id.substr(0, 8);
        const def = {
            id,
            name,
            template: false,
            thumbnail: '',
            styles: '[]',
            description: 'No description',
        };
        def[`${this.id}pages`] = `[{"id": "${crypto.randomUUID().substr(0, 8)}", "name": "index"}]`;
        def[`${this.id}styles`] = '[]';
        def[`${this.id}assets`] = '[]';
        if (!projectId) {
            cs.setId(id);
            await cs.store(def);
            cs.setIsTemplate(false);
            const res = await editor.load();
            cs.setId(res.id);
            cs.setName(res.name);
            cs.setThumbnail(res.thumbnail || '');
            cs.setDescription(res.description || 'No description');
            editor.Modal.close();
        } else {
            cs.setId(projectId);
            cs.setIsTemplate(false);
            const res = await editor.load();
            cs.setId(id);
            cs.setName(name);
            cs.setThumbnail(res.thumbnail || '');
            cs.setDescription(res.description || 'No description');
            editor.Modal.close();
        }
    }

    openEdit(e) {
        const { editor, setStateSilent } = this;
        setStateSilent({
            editableProjectId: e.currentTarget.dataset.id
        });
        editor.Modal.close();
        editor.SettingsApp.setTab('project');
        editor.runCommand('open-settings');
    }

    handleEdit(data) {
        this.cs.update({ ...data, updated_at: Date() });
    }

    async handleDelete(e) {
        const { cs, setState, opts } = this;
        const res = await cs.delete(e.currentTarget.dataset.id);
        opts.onDelete(res);
        const sites = await cs.loadAll();
        setState({ sites })
    }

    renderSiteList() {
        const { sites, tab, filterText, loading, sortBy, sortOrder } = this.state;
        const { pfx, opts, cs, editor } = this;

        if (loading) return opts.loader || '<div>Loading sites...</div>';

        if (!sites.length) return opts.nosites || '<div>No Sites</div>';

        let order
        if (sortBy === 'id') {
            order = sortByName(sortBy, sortOrder);
        } else if (sortBy === 'updated_at' || sortBy === 'created_at') {
            order = sortByDate(sortBy, sortOrder);
        } else if (sortBy === 'pages') {
            order = sortByPages(this.id + sortBy, sortOrder);
        } else if (sortBy === 'size') {
            order = sortBySize(sortOrder);
        }

        const sortedSites = sites.sort(order);

        let matchingSites = sortedSites.filter(site => {
            // No search query. Show all
            if (!filterText && tab === 'pages') {
                return true;
            }

            const { id, name, template } = site;
            if (
                (matchText(filterText, id) ||
                    matchText(filterText, name)) &&
                tab === 'pages'
            ) {
                return true;
            }

            if (tab === 'templates' && template) {
                return true;
            }

            // no match!
            return false;
        })
            .map((site, i) => {
                const {
                    id,
                    name,
                    description,
                    thumbnail,
                    created_at,
                    updated_at
                } = site;
                const size = objSize(site);
                const pages = JSON.parse(site[`${this.id}pages`]);
                const time = updated_at ? ago(new Date(updated_at).getTime()) : 'NA';
                const createdAt = created_at ? ago(new Date(created_at).getTime()) : 'NA';
                const pageNames = pages.map(page => page.name).join(', ');
                return `<div 
                    class="site-wrapper ${cs.currentId === id ? 'open' : ''}" 
                    key="${i}" 
                    data-id="${id}" 
                    title="${editor.I18n.t('grapesjs-project-manager.templates.titles.open')}">
                        <div class="site-screenshot">
                            <img src="${thumbnail}" alt="" />
                        </div>
                        <div class="site-info">
                            <h2>
                                ${name}
                            </h2>
                            <div class="site-meta">
                                ${description}
                            </div>
                        </div>
                        <div class="site-update-time">${time}</div>
                        <div class="site-pages">
                            <div title="${pageNames || id}">
                                ${pages.length || 1}
                            </div>
                        </div>
                        <div class="site-create-time">${createdAt}</div>
                        ${opts.size ? `<div class="site-size" title="${size} KB">
                            ${size.toFixed(2)} KB
                        </div>` : ''}
                        <div class="site-actions">
                            <i class="${pfx}caret-icon fa fa-hand-pointer-o edit" title="${editor.I18n.t('grapesjs-project-manager.templates.titles.edit')}" data-id="${id}"></i>
                            ${!(cs.currentId === id) ? `<i class="${pfx}caret-icon fa fa-trash-o delete" title="${editor.I18n.t('grapesjs-project-manager.templates.titles.delete')}" data-id="${id}"></i>` : ''}
                        </div>
                    </div>`;
            }).join('\n');

        if (!matchingSites.length) {
            if (tab === 'templates') return opts.nosites || '<div>No Templates Available.</div>';
            matchingSites = `<div>
                    <h3>
                        No '${filterText}' examples found. Clear your search and try again.
                    </h3>
                </div>`;
        }
        return matchingSites;
    }

    renderSiteActions() {
        const { editor } = this;

        return this.state.tab === 'pages' ?
            `<div  class="flex-row">
                <input 
                    class="search tm-input" 
                    placeholder="${editor.I18n.t('grapesjs-project-manager.templates.search')}"
                />
                <button id="open" class="primary-button">
                    ${editor.I18n.t('grapesjs-project-manager.templates.open')}
                </button>
            </div>` :
            `<div class="${this.pfx}tip-about ${this.pfx}four-color">
                ${editor.I18n.t('grapesjs-project-manager.templates.help')}
            </div>
            <div class="flex-row">
                <input 
                    class="name tm-input" 
                    placeholder="${editor.I18n.t('grapesjs-project-manager.templates.new')}"
                />
                <button id="create" class="primary-button">
                    ${editor.I18n.t('grapesjs-project-manager.templates.create')}
                </button>
            </div>`;
    }

    renderThumbnail(thumbnail, page) {
        const def = `<img src="${thumbnail}" alt="" />`;
        if (thumbnail) return def;
        else if (page.html) return `<svg xmlns="http://www.w3.org/2000/svg" class="template-preview" viewBox="0 0 1300 1100" width="99%" height="220">
                <foreignObject width="100%" height="100%" style="pointer-events:none">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        ${page.html + '<style scoped>' + page.css + '</style>'}
                    </div>
                </foreignObject>
            </svg>`;
        return def;
    }

    update() {
        this.$el?.find('#site-list').html(this.renderSiteList());
        this.$el?.find('#tm-actions').html(this.renderSiteActions());
        const sites = this.$el?.find('.site-wrapper');
        const search = this.$el?.find('input.search');
        const name = this.$el?.find('input.name');
        this.setStateSilent({ projectId: '' });
        if (sites) {
            sites.on('click', e => {
                sites.removeClass('selected');
                this.$(e.currentTarget).addClass('selected');
                this.setStateSilent({ projectId: e.currentTarget.dataset.id });
            });
        }
        if (search) {
            search.val(this.state.filterText);
            search.on('change', this.handleFilterInput);
        }
        if (name) {
            name.val(this.state.nameText);
            name.on('change', this.handleNameInput);
        }
        this.$el?.find('#open').on('click', this.handleOpen);
        this.$el?.find('#create').on('click', this.handleCreate);
        this.$el?.find('i.edit').on('click', this.openEdit);
        this.$el?.find('i.delete').on('click', this.handleDelete);
    }

    render() {
        const { $, pfx, opts, editor } = this;
        const { tab } = this.state

        // Do stuff on render
        this.onRender();
        this.$el?.remove();

        /* Show admin UI */
        const cont = $(`<div class="app">
                <div class="contents">
                    <div class="${pfx}tab">
                        <button id="pages" class="${pfx}tablinks ${tab === 'pages' ? 'active' : ''}">
                            ${editor.I18n.t('grapesjs-project-manager.templates.all')}
                        </button>
                        <button id="templates" class="${pfx}tablinks ${tab === 'templates' ? 'active' : ''}"">
                            ${editor.I18n.t('grapesjs-project-manager.templates.templates')}
                        </button>
                    </div>
                    <div id="tm-actions">
                        ${this.renderSiteActions()}
                    </div>
                    <div class="site-wrapper-header">
                        <div
                            class="site-screenshot-header header"
                            data-sort="id"
                            title="${editor.I18n.t('grapesjs-project-manager.templates.titles.info')}"
                        >
                            ${editor.I18n.t('grapesjs-project-manager.templates.info')}
                        </div>
                        <div
                            class="site-info header"
                            data-sort="id"
                        ></div>
                        <div
                            class="site-update-time header"
                            data-sort="updated_at"
                            title="${editor.I18n.t('grapesjs-project-manager.templates.titles.updated')}"
                        >
                            ${editor.I18n.t('grapesjs-project-manager.templates.updated')}
                        </div>
                        <div
                            class="site-pages header"
                            data-sort="pages"
                            title="${editor.I18n.t('grapesjs-project-manager.templates.titles.pages')}"
                        >
                            ${editor.I18n.t('grapesjs-project-manager.templates.pages')}
                        </div>
                        <div
                            class="site-create-time header"
                            data-sort="created_at"
                            title="${editor.I18n.t('grapesjs-project-manager.templates.titles.created')}"
                        >
                            ${editor.I18n.t('grapesjs-project-manager.templates.created')}
                        </div>
                        ${opts.size ? `<div
                            class="site-size header"
                            data-sort="size"
                            title="${editor.I18n.t('grapesjs-project-manager.templates.titles.size')}"
                        >
                            ${editor.I18n.t('grapesjs-project-manager.templates.size')}
                        </div>` : ''}
                        <div
                            class="site-actions header"
                            data-sort="id"
                            title="${editor.I18n.t('grapesjs-project-manager.templates.titles.actions')}"
                        >
                            ${editor.I18n.t('grapesjs-project-manager.templates.actions')}
                        </div>
                    </div>
                    <div id="site-list">
                        ${this.renderSiteList()}
                    </div>
                </div>
            </div>`);
        cont.find('.header').on('click', this.handleSort);
        cont.find('#pages, #templates').on('click', this.handleTabs);

        this.$el = cont;
        return cont;
    }
}