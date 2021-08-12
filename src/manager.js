import ago from './utils/timeago';
import { sortByDate, sortByName, matchText } from './utils/sort';

export default class TemplateManager {
    constructor(editor, opts = {}) {
        this.editor = editor;
        this.$ = editor.$;
        this.pfx = editor.getConfig('stylePrefix');
        this.id = editor.Storage.getConfig().id || 'gjs-';
        this.opts = opts;
        this.onRender = this.onRender.bind(this);
        this.setState = this.setState.bind(this);
        this.handleTabs = this.handleTabs.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleFilterInput = this.handleFilterInput.bind(this);
        this.handleNameInput = this.handleNameInput.bind(this);

        /* Set initial app state */
        this.state = {
            currentProjectId: '',
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

    setState(state) {
        this.state = { ...this.state, ...state };
        this.update();
    }

    setStateSilent(state) {
        this.state = { ...this.state, ...state };
    }

    onRender() {
        const { editor, setState } = this;
        const sm = editor.StorageManager;

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
            filterText: e.target.value
        });
    }

    handleNameInput(e) {
        this.setStateSilent({
            nameText: e.target.value
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
        const { editor } = this;
        const { projectId } = this.state;
        const cs = editor.Storage.getCurrentStorage();
        cs.setIdx(projectId);
        editor.load(res => {
            editor.setComponents(res.components ? JSON.parse(res.components) : res.html);
            editor.setStyle(res.styles ? JSON.parse(res.styles) : res.css);
            cs.setThumbnail(res.thumbnail || '');
            cs.setIsTemplate(res.template);
            editor.Modal.close();
        });
    }

    handleCreate(e) {
        const { editor } = this;
        const { projectId, nameText } = this.state;
        const cs = editor.Storage.getCurrentStorage();
        // TODO if no projectId generate blank project
        // TODO if no nameText use uuid
        //const data = {};
        //data[`${id}html`] = '';
        //data[`${id}css`] = '';
        //cs.store({
        //    idx: editor.runCommand('get-uuidv4'),
        //    id: 'Blank',
        //    template: true,
        //    thumbnail: '',
        //    ...data
        //});
        cs.setIdx(projectId);
        cs.setIsTemplate(false);
        editor.load(res => {
            editor.setComponents(res.components ? JSON.parse(res.components) : res.html);
            editor.setStyle(res.styles ? JSON.parse(res.styles) : res.css);
            cs.setId(nameText);
            cs.setIdx(editor.runCommand('get-uuidv4'));
            cs.setThumbnail(res.thumbnail || '');
            editor.Modal.close();
        });
        // TODO reset sites
    }

    handleEdit(e) {
        const input = this.$el?.find('input.edit');
        this.editor.Storage.getCurrentStorage().update({
            idx: e.currentTarget.dataset.idx,
            id: input.val().trim(),
            description: '',
            thumbnail: '',
            template: '',
            updated_at: ''
        });
        // TODO reset sites
    }

    handleDelete(e) {
        const { editor, opts } = this;
        editor.Storage.getCurrentStorage()
            .delete(opts.onDelete, opts.onDeleteError, e.currentTarget.dataset.idx);
        // TODO reset sites
    }

    renderAutoThumb(html, css) {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="template-preview" viewBox="0 0 1300 1100" width="99%" height="220">
                <foreignObject width="100%" height="100%" style="pointer-events:none">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        ${html + '<style scoped>' + css + '</style>'}
                    </div>
                </foreignObject>
            </svg>`;
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

            const { id, idx, template } = site;
            if (
                (matchText(filterText, id) ||
                    matchText(filterText, idx)) &&
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
                    idx,
                    thumbnail,
                    created_at,
                    updated_at
                } = site;
                const time = updated_at ? ago(new Date(updated_at).getTime()) : 'NA';
                const createdAt = created_at ? ago(new Date(created_at).getTime()) : 'NA';
                const pageNames = ''//pages.map(page => page.n).join(', ');
                return `<div class="site-wrapper" key="${i}" data-id="${idx}" title="Select to open site">
                        <div class="site-screenshot">
                            <img src="${thumbnail}" alt="" />
                        </div>
                        <div class="site-info">
                            <h2>
                                ${id}
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
                            <i class="${pfx}caret-icon fa fa-hand-pointer-o" title="edit" data-idx="${idx}"></i>
                            <i class="${pfx}caret-icon fa fa-trash-o" title="delete" data-idx="${idx}"></i>
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