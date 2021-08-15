import ago from './utils/timeago';
import UI from './utils/ui';
import { sortByDate, sortByName, matchText } from './utils/sort';

export default class TemplateManager extends UI {
    constructor(editor, opts = {}) {
        super(editor, opts);
        this.handleSort = this.handleSort.bind(this);
        this.handleFilterInput = this.handleFilterInput.bind(this);
        this.handleNameInput = this.handleNameInput.bind(this);

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

    onRender() {
        const { setState, sm } = this;

        /* Set request loading state */
        setState({
            loading: true
        });

        /* Fetch sites from storage API */
        sm.getCurrentStorage().loadAll(sites => {
            /* Set sites and turn off loading state */
            setState({
                sites,
                loading: false
            });
        },
            err => console.log("Error", err));
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

    handleOpen(e) {
        const { editor, cs } = this;
        const { projectId } = this.state;
        cs.setId(projectId);
        editor.load(res => {
            cs.setThumbnail(res.thumbnail || '');
            cs.setIsTemplate(res.template);
            cs.setDescription(res.description || 'No description');
            editor.Modal.close();
        });
    }

    handleCreate(e) {
        const { editor, cs } = this;
        const { projectId, nameText } = this.state;
        const id = editor.runCommand('get-uuidv4').substr(0, 7);
        let name = nameText || id;
        if (!projectId) {
            cs.store({
                id,
                name,
                template: false,
                thumbnail: '',
                styles: '',
                description: 'No description',
                pages: [{
                    name: 'index',
                    component: ''
                }]
            }, res => {
                cs.setId(id);
                cs.setIsTemplate(false);
                editor.load(res => {
                    cs.setId(res.id);
                    cs.setName(res.name);
                    cs.setThumbnail(res.thumbnail || '');
                    cs.setDescription(res.description || 'No description');
                    editor.Modal.close();
                });
            });
        } else {
            cs.setId(projectId);
            cs.setIsTemplate(false);
            editor.load(res => {
                cs.setId(res.id);
                cs.setName(res.name);
                cs.setThumbnail(res.thumbnail || '');
                cs.setDescription(res.description || 'No description');
                editor.Modal.close();
            });
        }
    }


    openEdit(e) {
        this.setStateSilent({
            editableProjectId: e.currentTarget.dataset.id
        });
        this.editor.Modal.close();
        // TODO set project tab
        this.editor.runCommand('open-settings');
    }

    handleEdit(data) {
        this.cs.update({ ...data, updated_at: Date() });
        this.sm.getCurrentStorage().loadAll(sites => setState({ sites }),
            err => console.log("Error", err));
    }

    handleDelete(e) {
        const { cs, sm, opts } = this;
        cs.delete(opts.onDelete, opts.onDeleteError, e.currentTarget.dataset.id);
        sm.getCurrentStorage().loadAll(sites => setState({ sites }),
            err => console.log("Error", err));
    }

    renderSiteList() {
        const { sites, tab, filterText, loading, sortBy, sortOrder } = this.state;
        const { pfx, opts } = this;

        if (loading) return opts.loader || '<div>Loading sites...</div>';

        if (!sites.length) return opts.nosites || '<div>No Sites</div>';

        let order
        if (sortBy === 'id') {
            order = sortByName(sortBy, sortOrder);
        } else if (sortBy === 'updated_at' || sortBy === 'created_at') {
            order = sortByDate(sortBy, sortOrder);
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
                    thumbnail,
                    created_at,
                    updated_at
                } = site;
                const time = updated_at ? ago(new Date(updated_at).getTime()) : 'NA';
                const createdAt = created_at ? ago(new Date(created_at).getTime()) : 'NA';
                const pageNames = '';//pages.map(page => page.n).join(', ');
                return `<div class="site-wrapper" key="${i}" data-id="${id}" title="Select to open site">
                        <div class="site-screenshot">
                            <img src="${thumbnail}" alt="" />
                        </div>
                        <div class="site-info">
                            <h2>
                                ${name}
                            </h2>
                            <div class="site-meta">
                                Project description
                            </div>
                        </div>
                        <div class="site-update-time">${time}</div>
                        <div class="site-pages">
                            <div title="${pageNames || id}">
                                ${site.page?.length || 1}
                            </div>
                        </div>
                        <div class="site-create-time">${createdAt}</div>
                        <div class="site-actions">
                            <i class="${pfx}caret-icon fa fa-hand-pointer-o" title="edit" data-id="${id}"></i>
                            <i class="${pfx}caret-icon fa fa-trash-o" title="delete" data-id="${id}"></i>
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
        return this.state.tab === 'pages' ?
            `<div  class="flex-row"><input class="search tm-input" placeholder="Search for sites by name or id"/>
            <button id="open" class="primary-button">Open</button></div>` :
            `<div class="${this.pfx}tip-about ${this.pfx}four-color">${this.opts.help}</div>
            <div  class="flex-row"><input class="name tm-input" placeholder="Enter new page name"/>
            <button id="create" class="primary-button">Create</button></div>`;
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
    }

    render() {
        const { $, pfx, opts } = this;

        // Do stuff on render
        this.onRender();
        this.$el?.remove();

        /* Show admin UI */
        const cont = $(`<div class="app">
                <div class="contents">
                    <div class="${pfx}tab">
                        <button id="pages" class="${pfx}tablinks active">${opts.tabsText.pages}</button>
                        <button id="templates" class="${pfx}tablinks">${opts.tabsText.templates}</button>
                    </div>
                    <div id="tm-actions">
                        ${this.renderSiteActions()}
                    </div>
                    <div class="site-wrapper-header">
                        <div
                            class="site-screenshot-header header"
                            data-sort="id"
                            title="Click to sort by site name"
                        >
                            Site Info
                        </div>
                        <div
                            class="site-info header"
                            data-sort="id"
                        ></div>
                        <div
                            class="site-update-time header"
                            data-sort="updated_at"
                            title="Click to sort by last update date"
                        >
                            Last updated
                        </div>
                        <div
                            class="site-pages header"
                            data-sort="pages"
                            title="Click to sort by number of pages"
                        >
                            Pages
                        </div>
                        <div
                            class="site-create-time header"
                            data-sort="created_at"
                            title="Click to sort by site creation date"
                        >
                            Created At
                        </div>
                        <div
                            class="site-actions header"
                            data-sort="id"
                            title="Click to sort by site name"
                        >
                            Actions
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

export class PagesApp extends UI {
    constructor(editor, opts = {}) {
        super(editor, opts);
        this.addPage = this.addPage.bind(this);
        this.selectPage = this.selectPage.bind(this);
        this.removePage = this.removePage.bind(this);
        this.isSelected = this.isSelected.bind(this);
        this.handleNameInput = this.handleNameInput.bind(this);

        /* Set initial app state */
        this.state = {
            editablePageId: '',
            isShowing: true,
            nameText: '',
            pages: [],
            loading: false
        };
    }

    get editableId() {
        return this.state.editablePageId;
    }

    onRender() {
        const { pm, setState, editor } = this;
        setState({
            loading: true
        });
        setState({
            pages: [...pm.getAll()]
        });
        editor.on('page', () => {
            setState({
                pages: [...pm.getAll()]
            })
        });
        setState({
            loading: false
        });
    }

    isSelected(page) {
        return this.pm.getSelected().id === page.id;
    }

    selectPage(e) {
        this.pm.select(e.currentTarget.dataset.key);
        this.update();
    }

    removePage(e) {
        this.pm.remove(e.currentTarget.dataset.key);
        this.update();
    }

    openEdit(e) {
        this.setStateSilent({
            editablePageId: e.currentTarget.dataset.key
        });
        this.editor.Modal.close();
        // TODO set page tab
        this.editor.runCommand('open-settings');
    }

    editPage(id, name) {
        const currentPage = this.pm.get(id);
        currentPage?.set('name', name);
        this.update()
    }

    addPage() {
        const { pm } = this;
        const { nameText } = this.state
        if (!nameText) return;
        pm.add({
            name: nameText,
            component: ''
        });
        this.update();
    }

    handleNameInput(e) {
        this.setStateSilent({
            nameText: e.target.value.trim()
        })
    }

    renderPagesList() {
        const { pages, loading } = this.state;
        const { opts, isSelected } = this;

        if (loading) return opts.loader || '<div>Loading pages...</div>';

        return pages.map((page, i) => `<div 
                data-id="${i}" 
                data-key="${page.id}"  
                class="page ${isSelected(page) ? 'selected' : ''}"
            >
                ${page.get('name') || page.id}
                <span class="page-edit" data-key="${page.id}"><i class="fa fa-pencil"></i></span>
                ${isSelected(page) ? '' : '<span class="page-close" data-key="${page.id}">&Cross;</span>'}
            </div>`).join("\n");
    }

    update() {
        this.$el?.find('.pages').html(this.renderPagesList());
        this.$el?.find('.page').on('click', this.selectPage);
        this.$el?.find('.page-edit').on('click', this.openEdit);
        this.$el?.find('.page-close').on('click', this.removePage);
    }

    render() {
        const { $ } = this;

        // Do stuff on render
        this.onRender();
        this.$el?.remove();

        const cont = $(`<div style="display: ${this.state.isShowing ? 'flex' : 'none'};" class="pages-wrp">
                <div class="pages">
                    ${this.renderPagesList()}
                </div>
                <div  class="flex-row">
                    <input class="tm-input sm" type="text" placeholder="page name" />
                </div>
                <div class="add-page">New Page</div>
            </div>`);
        cont.find('.add-page').on('click', this.addPage);
        cont.find('input').on('change', this.handleNameInput);

        this.$el = cont;
        return cont;
    }

    get findPanel() {
        return this.editor.Panels.getPanel('views-container');
    }

    showPanel() {
        this.state.isShowing = true;
        this.findPanel?.set('appendContent', this.render()).trigger('change:appendContent');
    }

    hidePanel() {
        this.state.isShowing = false;
        this.render();
    }
}

export class SettingsApp extends UI {
    constructor(editor, opts = {}) {
        super(editor, opts);
        this.handleSave = this.handleSave.bind(this);
        this.handleThumbnail = this.handleThumbnail.bind(this);

        /* Set initial app state */
        this.state = {
            tab: 'page',
            pageData: {},
            projectData: {},
            loading: false
        };
    }

    setTab(tab) {
        this.state.tab = tab;
    }

    update() {
        this.$el?.find('#settings').html(this.renderSettings());
        this.$el?.find('#save').on('click', this.handleSave);
    }

    onRender() {
        const { setState } = this;
        setState({
            loading: true
        });
        // TODO Setup
        setState({
            loading: false
        });
    }

    handleTabs(e) {
        const { target } = e;
        const { $el, pfx, $ } = this;
        $el.find(`.${pfx}tablinks`).removeClass('active');
        $(target).addClass('active');
        if (target.id === 'page') {
            this.setState({ tab: 'page' });
        } else {
            this.setState({ tab: 'project' });
        }
    }

    handleSave(e) {
        // TODO check tab, get id, if id, run related update
    }

    handleThumbnail(e) { }

    renderSettings() {
        const { tab, loading } = this.state;
        const { opts, pfx } = this;

        if (loading) return opts.loader || '<div>Loading settings...</div>';

        if (tab === 'page') {
            return `<div class="flex-row">
                <input class="name tm-input" placeholder="Current page name"/>
            </div>`
        } else {
            return `<div class="${pfx}tip-about ${pfx}four-color">Enter url, select from asset manager or generate thumbnail.</div>
            <div class="flex-row">
                <input class="thumbnail tm-input" placeholder="Project thumbnail"/>
            </div>
            <div class="flex-row">
                <button id="assets" class="primary-button">Assets</button>
                <button id="generate" class="primary-button">Generate</button>
            </div>
            <div class="flex-row">
                <input class="name tm-input" placeholder="Project name"/>
            </div>
            <div class="flex-row">
                <input class="desc tm-input" placeholder="Project description"/>
            </div>
            <div class="flex-row">
                <input class="template" type="checkbox"/>
            </div>`
        }
    }

    render() {
        const { $, pfx } = this;

        // Do stuff on render
        this.onRender();
        this.$el?.remove();

        const cont = $(`<div class="app">
                <div class="${pfx}tab">
                    <button id="page" class="${pfx}tablinks active">Page</button>
                    <button id="project" class="${pfx}tablinks">Project</button>
                </div>
                <div id="settings">
                    ${this.renderSettings()}
                </div>
                <div class="flex-row">
                    <button id="save" class="primary-button">Save</button>
                </div>
            </div>`);
        cont.find('#page, #project').on('click', this.handleTabs);

        this.$el = cont;
        return cont;
    }
}