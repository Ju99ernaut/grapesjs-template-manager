import { storageFireStore } from '../consts';

export default (editor, opts = {}) => {
    const sm = editor.StorageManager;
    const storageName = storageFireStore;

    let db;
    let doc;
    let collection;
    const apiKey = opts.apiKey;
    const authDomain = opts.authDomain;
    const projectId = opts.projectId;
    const dbSettings = opts.settings;
    const onError = err => sm.onError(storageName, err.code || err);

    const getDoc = () => doc;

    const getAsyncCollection = (clb) => {
        if (collection) return clb(collection);
        firebase.initializeApp({ apiKey, authDomain, projectId });
        const fs = firebase.firestore();
        fs.settings(dbSettings);

        const callback = () => {
            db = firebase.firestore();
            collection = db.collection(opts.objectStoreName);
            clb(collection);
        }

        if (opts.enableOffline) {
            fs.enablePersistence().then(callback).catch(onError);
        } else {
            callback();
        }
    };

    const getAsyncDoc = (clb) => {
        getAsyncCollection(cll => {
            doc = cll.doc(this.currentIdx);
            clb(doc);
        });
    };

    sm.add(storageName, {
        currentId: 'Default',
        currentIdx: 'uuidv4',
        currentThumbnail: '',
        isTemplate: false,
        getDoc,

        setDocId(id) {
            this.currentIdx = id;
        },

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

        load(keys, clb, clbError) {
            getAsyncDoc(doc => {
                doc.get()
                    .then(doc => doc.exists && clb(doc.data()))
                    .catch(clbError);
            });
        },

        loadAll(clb, clbError) {
            getAsyncCollection(cll => {
                cll.get()
                    .then(docs => {
                        docs.map(doc => doc.data());
                        clb(docs);
                    })
                    .catch(clbError);
            });
        },

        store(data, clb, clbError) {
            getAsyncDoc(doc => {
                doc.set({
                        idx: this.currentIdx,
                        id: this.currentId,
                        template: this.isTemplate,
                        thumbnail: this.currentThumbnail,
                        ...data
                    })
                    .then(clb)
                    .catch(clbError);
            });
        },

        delete(clb, clbError, index) {
            if (!index) {
                getAsyncDoc(doc => {
                    doc.delete()
                        .then(clb)
                        .catch(clbError);
                });
            } else {
                getAsyncCollection(cll => {
                    cll.doc(index).delete()
                        .then(clb)
                        .catch(clbError);
                })
            }
        }
    });
}