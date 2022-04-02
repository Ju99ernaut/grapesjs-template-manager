import { storageFireStore, helpers } from '../consts';

export default (editor, opts = {}) => {
    const sm = editor.StorageManager;
    const storageName = storageFireStore;

    let db;
    let doc;
    let collection;
    const { apiKey, authDomain, projectId } = opts;
    const dbSettings = opts.settings;
    const onError = err => sm.onError(storageName, err.code || err);

    const getDoc = () => doc;

    const getAsyncCollection = () => {
        if (collection) return collection;
        if (!firebase.apps.length) {
            firebase.initializeApp({ apiKey, authDomain, projectId, ...opts.firebaseConfig });
            db = firebase.firestore();
            db.settings(dbSettings);
        }
        else {
            firebase.app();
            db = firebase.firestore();
            db.settings(dbSettings);
        }

        if (opts.enableOffline) {
            db.enablePersistence().catch(onError);
        }

        collection = db.collection(opts.objectStoreName);
        return collection;
    };

    const getAsyncDoc = () => {
        const cll = getAsyncCollection();
        const cs = editor.Storage.getCurrentStorage();
        doc = cll.doc(cs.currentId);
        return doc;
    };

    sm.add(storageName, {
        ...helpers,
        getDoc,

        setDocId(id) {
            this.currentId = id;
        },

        async load(keys) {
            const _doc = getAsyncDoc();
            const doc = await _doc.get();
            if (doc.exists) return doc.data();
            else return {};
        },

        async loadAll() {
            const cll = getAsyncCollection();
            const docs = await cll.get();
            const data = [];
            docs.forEach(doc => data.push(doc.data()));
            return data;
        },

        async store(data) {
            const cll = getAsyncCollection();
            const doc = await cll.doc(data.id || this.currentId).set({
                id: this.currentId,
                name: this.currentName,
                template: this.isTemplate,
                thumbnail: this.currentThumbnail,
                description: this.description,
                updated_at: Date.now(),
                ...data
            });
            return doc.data();
        },

        async update(data) {
            const { id, ..._data } = data;
            const cll = getAsyncCollection();
            const doc = await cll.doc(id).set(_data, { merge: true });
            return doc.data();
        },

        async delete(index) {
            if (!index) {
                const _doc = getAsyncDoc();
                const doc = await _doc.delete();
                return doc.data();
            } else {
                const cll = getAsyncCollection();
                const doc = await cll.doc(index).delete();
                return doc.data();
            }
        }
    });
}