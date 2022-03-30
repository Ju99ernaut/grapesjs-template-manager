import { storageRemote } from '../consts';

export default (editor, opts = {}) => {
    const sm = editor.StorageManager;
    const storageName = storageRemote;
    const remote = sm.get('remote');

    // Add custom storage to the editor
    sm.add(storageName, {
        currentName: 'Default',
        currentId: 'uuidv4',
        currentThumbnail: '',
        isTemplate: false,
        description: 'No description',

        setId(id) {
            this.currentId = id;
        },

        setName(name) {
            this.currentName = name;
        },

        setThumbnail(thumbnail) {
            this.currentThumbnail = thumbnail;
        },

        setIsTemplate(isTemplate) {
            this.isTemplate = !!isTemplate;
        },

        setDescription(description) {
            this.description = description;
        },

        async load(keys) {
            const urlLoad = remote.get('urlLoad');
            const id = urlLoad.endsWith('/') ? this.currentId : `/${this.currentId}`;
            remote.set({ urlLoad: urlLoad + id });
            const projectData = await remote.load(keys);
            remote.set({ urlLoad });
            return projectData;
        },

        async loadAll() {
            return await remote.load({});
        },

        async store(data) {
            const urlStore = remote.get('urlStore');
            const id = urlStore.endsWith('/') ? this.currentId : `/${this.currentId}`;
            opts.uuidInPath && remote.set({ urlStore: urlStore + id });
            const projectData = await remote.store({
                id: this.currentId,
                name: this.currentName,
                template: this.isTemplate,
                thumbnail: this.currentThumbnail,
                description: this.description,
                updated_at: Date(),
                ...data
            });
            remote.set({ urlStore });
            return projectData;
        },

        async update(data) {
            const urlLoad = remote.get('urlLoad');
            let { id } = data;
            id = urlLoad.endsWith('/') ? id : `/${id}`;
            remote.set({ urlLoad: urlLoad + id });
            const res = await remote.load({});
            const body = { ...res, ...data };
            const method = 'post';
            const urlUpdate = remote.get('urlStore');
            id = data.id;
            id = urlUpdate.endsWith('/') ? id : `/${id}`;
            const projectData = await remote.request(urlUpdate + id, { method, body });
            remote.set({ urlLoad });
            return projectData;
        },

        async delete(index) {
            const urlDelete = remote.get('urlDelete');
            let id = index || this.currentId;
            id = urlDelete.endsWith('/') ? id : `/${id}`;
            const res = await remote.request(urlDelete + id, { method: 'delete' });
            return res;
        }
    });
}