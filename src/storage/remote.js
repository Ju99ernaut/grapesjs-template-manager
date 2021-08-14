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

        load(keys, clb, clbErr) {
            const urlLoad = remote.get('urlLoad');
            const id = urlLoad.endsWith("/") ? this.currentId : `/${this.currentId}`;
            remote.set({ urlLoad: urlLoad + id });
            remote.load(keys, clb, clbErr);
            remote.set({ urlLoad });
        },

        loadAll(clb, clbErr) {
            remote.load({}, clb, clbErr);
        },

        store(data, clb, clbErr) {
            const urlStore = remote.get('urlStore');
            const id = urlStore.endsWith("/") ? this.currentId : `/${this.currentId}`;
            opts.uuidInPath && remote.set({ urlStore: urlStore + id });
            remote.store({
                id: this.currentId,
                name: this.currentName,
                template: this.isTemplate,
                thumbnail: this.currentThumbnail,
                updated_at: Date(),
                ...data
            }, clb, clbErr);
            remote.set({ urlStore });
        },

        update(data, clb, clbErr) {
            const urlLoad = remote.get('urlLoad');
            let { id } = data;
            id = urlLoad.endsWith("/") ? id : `/${id}`;
            remote.set({ urlLoad: urlLoad + id });
            remote.load({}, res => {
                const body = { ...res, ...data };
                const method = 'post';
                const urlUpdate = remote.get('urlStore');
                id = urlUpdate.endsWith("/") ? id : `/${id}`;
                remote.request(urlUpdate + id, { method, body }, clb, clbErr);
            }, clbErr);
            remote.set({ urlLoad });
        },

        delete(clb, clbErr, index) {
            const urlDelete = remote.get('urlDelete');
            let id = index || this.currentId;
            id = urlDelete.endsWith("/") ? id : `/${id}`;
            const method = 'delete';
            remote.request(urlDelete + id, { method }, clb, clbErr);
        }
    });
}