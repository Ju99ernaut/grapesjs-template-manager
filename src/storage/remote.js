import { storageRemote, helpers } from '../consts';

export default (editor, opts = {}) => {
    const sm = editor.StorageManager;
    const storageName = storageRemote;
    const remote = sm.get('remote');
    const stOpts = sm.getStorageOptions('remote');

    // Add custom storage to the editor
    sm.add(storageName, {
        ...helpers,

        async load(keys = {}) {
            const { urlLoad } = stOpts;
            const id = urlLoad.endsWith('/') ? this.currentId : `/${this.currentId}`;
            const projectData = await remote.load({
                ...stOpts,
                ...{ urlLoad: urlLoad + id },
                ...keys
            });
            return projectData;
        },

        async loadAll(keys = {}) {
            return await remote.load({ ...stOpts, ...keys });
        },

        async store(data, keys = {}) {
            const { urlStore } = stOpts;
            const id = urlStore.endsWith('/') ? this.currentId : `/${this.currentId}`;
            const projectData = await remote.store({
                id: this.currentId,
                name: this.currentName,
                template: this.isTemplate,
                thumbnail: this.currentThumbnail,
                description: this.description,
                updated_at: Date.now(),
                ...data
            }, {
                ...stOpts,
                ...{ urlStore: opts.uuidInPath ? urlStore + id : urlStore },
                ...keys
            });
            return projectData;
        },

        async update(data, keys = {}) {
            const { urlStore } = stOpts;
            let { id } = data;
            id = urlStore.endsWith('/') ? id : `/${id}`;
            const projectData = await remote.store(data, {
                ...stOpts,
                ...{ urlStore: urlStore + id },
                ...keys
            });
            return projectData;
        },

        async delete(index) {
            const { urlDelete } = stOpts;
            let id = index || this.currentId;
            id = urlDelete.endsWith('/') ? id : `/${id}`;
            const res = await remote.request(urlDelete + id, { method: 'delete' });
            return res;
        }
    });
}