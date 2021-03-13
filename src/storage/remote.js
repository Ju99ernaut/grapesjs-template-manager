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

        load(keys, clb, clbErr) {
            const urlLoad = remote.get('urlLoad');
            remote.set({ urlLoad: urlLoad + this.currentIdx });
            remote.load(keys, clb, clbErr);
            remote.set({ urlLoad });
        },

        loadAll(clb, clbErr) {
            remote.load(keys, clb, clbErr);
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

        delete(clb, clbErr, index) {
            const urlDelete = remote.get('urlDelete') + (index || this.currentIdx);
            const method = 'delete';
            remote.request(urlDelete, { method }, clb, clbErr);
        }

    });
}