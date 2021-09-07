import ago from '../utils/timeago';
import UI from '../utils/ui';
import { sortByDate, sortByName, matchText } from '../utils/sort';

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

    onRender() {
        const { setState, cs } = this;

        /* Set request loading state */
        setState({
            loading: true
        });

        /* Fetch sites from storage API */
        cs.loadAll(sites => {
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
        if (!projectId || projectId === cs.currentId) return;
        cs.setId(projectId);
        editor.load(res => {
            cs.setName(res.name);
            cs.setThumbnail(res.thumbnail || '');
            cs.setIsTemplate(res.template);
            cs.setDescription(res.description || 'No description');
            editor.Modal.close();
        });
    }

    handleCreate(e) {
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
        def[`${this.id}pages`] = '[{"name": "index"}]';
        def[`${this.id}styles`] = '[]';
        def[`${this.id}assets`] = '[]';
        if (!projectId) {
            cs.setId(id);
            cs.store(def, res => {
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
                cs.setId(id);
                cs.setName(name);
                cs.setThumbnail(res.thumbnail || '');
                cs.setDescription(res.description || 'No description');
                editor.Modal.close();
            });
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

    handleDelete(e) {
        const { cs, setState, opts } = this;
        cs.delete(res => {
            opts.onDelete(res);
            cs.loadAll(sites => setState({ sites }),
                err => console.log("Error", err));
        }, opts.onDeleteError, e.currentTarget.dataset.id);
    }

    renderSiteList() {
        const { sites, tab, filterText, loading, sortBy, sortOrder } = this.state;
        const { pfx, opts, cs } = this;

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
                    description,
                    thumbnail,
                    created_at,
                    updated_at
                } = site;
                const pages = JSON.parse(site[`${this.id}pages`]);
                const time = updated_at ? ago(new Date(updated_at).getTime()) : 'NA';
                const createdAt = created_at ? ago(new Date(created_at).getTime()) : 'NA';
                const pageNames = pages.map(page => page.name).join(', ');
                return `<div class="site-wrapper ${cs.currentId === id ? 'open' : ''}" key="${i}" data-id="${id}" title="Select to open site">
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
                        <div class="site-actions">
                            <i class="${pfx}caret-icon fa fa-hand-pointer-o edit" title="edit" data-id="${id}"></i>
                            ${!(cs.currentId === id) ? `<i class="${pfx}caret-icon fa fa-trash-o delete" title="delete" data-id="${id}"></i>` : ''}
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
        const { $, pfx, opts } = this;
        const { tab } = this.state

        // Do stuff on render
        this.onRender();
        this.$el?.remove();

        /* Show admin UI */
        const cont = $(`<div class="app">
                <div class="contents">
                    <div class="${pfx}tab">
                        <button id="pages" class="${pfx}tablinks ${tab === 'pages' ? 'active' : ''}">${opts.tabsText.pages}</button>
                        <button id="templates" class="${pfx}tablinks ${tab === 'templates' ? 'active' : ''}"">${opts.tabsText.templates}</button>
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