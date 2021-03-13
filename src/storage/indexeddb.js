import { storageIDB } from '../consts';

export default (editor, opts = {}) => {
    let db;
    const sm = editor.StorageManager;
    const storageName = storageIDB;
    const objsName = opts.objectStoreName;

    // Functions for DB retrieving
    const getDb = () => db;
    const getAsyncDb = (clb) => {
        if (db) {
            clb(db);
        } else {
            const indexedDB = window.indexedDB || window.mozIndexedDB ||
                window.webkitIndexedDB || window.msIndexedDB;
            const request = indexedDB.open(options.dbName, options.indexeddbVersion);
            const onError = () => sm.onError(storageName, request.errorCode);
            request.onerror = onError;
            request.onsuccess = () => {
                db = request.result;
                db.onerror = onError;
                clb(db);
            };
            request.onupgradeneeded = e => {
                const objs = e.currentTarget.result.createObjectStore(objsName, { keyPath: 'idx' });
                objs.createIndex('id', 'id', { unique: false });
            };
        }
    };

    // Functions for object store retrieving
    const getObjectStore = () => {
        return db.transaction([objsName], 'readwrite').objectStore(objsName);
    };
    const getAsyncObjectStore = clb => {
        if (db) {
            clb(getObjectStore());
        } else {
            getAsyncDb(db => clb(getObjectStore()))
        }
    };

    // Add custom storage to the editor
    sm.add(storageName, {
        currentId: 'Default',
        currentIdx: 'uuidv4',
        currentThumbnail: '',
        isTemplate: false,
        getDb,

        getObjectStore,

        load(keys, clb, clbErr) {
            getAsyncObjectStore(objs => {
                const request = objs.get(idx);
                request.onerror = clbErr;
                request.onsuccess = () => {
                    clb(request.result);
                };
            });
        },

        loadAll(clb, clbErr) {
            getAsyncObjectStore(objs => {
                const request = objs.getAll();
                request.onerror = clbErr;
                request.onsuccess = () => {
                    clb(request.result);
                };
            });
        },

        store(data, clb, clbErr) {
            getAsyncObjectStore(objs => {
                const request = objs.put({
                    idx: this.currentIdx,
                    id: this.currentId,
                    template: this.isTemplate,
                    thumbnail: this.currentThumbnail,
                    ...data
                });
                request.onerror = clbErr;
                request.onsuccess = clb;
            });
        },

        delete(clb, clbErr, index) {
            getAsyncObjectStore(objs => {
                const request = objs.delete(index || idx);
                request.onerror = clbErr;
                request.onsuccess = clb;
            });
        }

    });
}