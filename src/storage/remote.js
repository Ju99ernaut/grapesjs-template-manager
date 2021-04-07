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
            const idx = urlLoad.endsWith("/") ? this.currentIdx : `/${this.currentIdx}`;
            remote.set({ urlLoad: urlLoad + idx });
            remote.load(keys, clb, clbErr);
            remote.set({ urlLoad });
        },

        loadAll(clb, clbErr) {
            remote.load({}, clb, clbErr);
        },

        store(data, clb, clbErr) {
            const urlStore = remote.get('urlStore');
            const idx = urlStore.endsWith("/") ? this.currentIdx : `/${this.currentIdx}`;
            opts.uuidInPath && remote.set({ urlStore: urlStore + idx });
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
            const urlLoad = remote.get('urlLoad');
            let { idx } = data;
            idx = urlLoad.endsWith("/") ? idx : `/${idx}`;
            remote.set({ urlLoad: urlLoad + idx });
            remote.load({}, res => {
                const body = { ...res, ...data };
                const method = 'post';
                const urlUpdate = remote.get('urlStore');
                idx = urlUpdate.endsWith("/") ? idx : `/${idx}`;
                remote.request(urlUpdate + idx, { method, body }, clb, clbErr);
            }, clbErr);
            remote.set({ urlLoad });
        },

        delete(clb, clbErr, index) {
            const urlDelete = remote.get('urlDelete');
            let idx = index || this.currentIdx;
            idx = urlDelete.endsWith("/") ? idx : `/${idx}`;
            const method = 'delete';
            remote.request(urlDelete + idx, { method }, clb, clbErr);
        }
    });
}