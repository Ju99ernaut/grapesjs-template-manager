import { storageRemote } from '../consts';

export default (editor, opts = {}) => {
    const sm = editor.StorageManager;
    const storageName = storageRemote;
    const remote = sm.get('remote');

    // Add custom storage to the editor
    sm.add(storageName, {
        currentId: 'Default',
        currentIdx: 'uuidv4',
        currentThumbnail: '',
        isTemplate: false,

        setId(id) {
            this.currentId = id;
        },

        setIdx(idx) {
            this.currentIdx = idx;
        },

        setThumbnail(thumbnail) {
            this.currentThumbnail = thumbnail;
        },

        setIsTemplate(isTemplate) {
            this.isTemplate = !!isTemplate;
        },

        load(keys, clb, clbErr) {
            const urlLoad = remote.get('urlLoad');
            remote.set({ urlLoad: urlLoad + this.currentIdx });
            remote.load(keys, clb, clbErr);
            remote.set({ urlLoad });
        },

        loadAll(clb, clbErr) {
            remote.load({}, clb, clbErr);
        },

        store(data, clb, clbErr) {
            const urlStore = remote.get('urlStore');
            remote.set({ urlStore: urlStore + this.currentIdx });
            remote.store({
                idx: this.currentIdx,
                id: this.currentId,
                template: this.isTemplate,
                thumbnail: this.currentThumbnail,
                ...data
            }, clb, clbErr);
            remote.set({ urlStore });
        },

        update(data, clb, clbErr) {
            const { idx, ...body } = data;
            const urlUpdate = remote.get('urlStore') + idx;
            remote.fetch(urlUpdate, { body }, clb, clbErr);
        },

        delete(clb, clbErr, index) {
            const urlDelete = remote.get('urlDelete') + (index || this.currentIdx);
            const method = 'delete';
            remote.request(urlDelete, { method }, clb, clbErr);
        }
    });
}