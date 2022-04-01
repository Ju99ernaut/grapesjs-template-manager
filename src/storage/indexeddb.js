import { storageIDB, helpers } from '../consts';

export default (editor, opts = {}) => {
    let db;
    const sm = editor.StorageManager;
    const storageName = storageIDB;
    const objsName = opts.objectStoreName;

    // Functions for DB retrieving
    const getDb = () => db;
    const getAsyncDb = () => {
        if (db) {
            return db;
        } else {
            const indexedDB = window.indexedDB || window.mozIndexedDB ||
                window.webkitIndexedDB || window.msIndexedDB;
            const request = indexedDB.open(opts.dbName, opts.indexeddbVersion);
            const onError = () => sm.onError(storageName, request.errorCode);
            request.onerror = onError;
            request.onsuccess = () => {
                db = request.result;
                db.onerror = onError;
            };
            request.onupgradeneeded = e => {
                const objs = e.currentTarget.result.createObjectStore(objsName, { keyPath: 'id' });
                objs.createIndex('name', 'name', { unique: false });
            };
            return db;
        }
    };

    // Functions for object store retrieving
    const getObjectStore = () => {
        return db.transaction([objsName], 'readwrite').objectStore(objsName);
    };
    const getAsyncObjectStore = () => {
        if (db) {
            return getObjectStore();
        } else {
            getAsyncDb();
            return getObjectStore();
        }
    };

    // Add custom storage to the editor
    sm.add(storageName, {
        ...helpers,
        getDb,

        getObjectStore,

        async load(keys) {
            return new Promise(
                function (resolve, reject) {
                    const objs = getAsyncObjectStore();
                    const request = objs.get(this.currentId);
                    request.onerror = () => reject(Error('Load error'));
                    request.onsuccess = () => {
                        resolve(request.result);
                    };
                }
            );
        },

        async loadAll() {
            return new Promise(
                function (resolve, reject) {
                    const objs = getAsyncObjectStore();
                    const request = objs.getAll();
                    request.onerror = () => reject(Error('Load error'));
                    request.onsuccess = () => {
                        resolve(request.result);
                    };
                }
            );
        },

        async store(data) {
            return new Promise(
                function (resolve, reject) {
                    const objs = getAsyncObjectStore();
                    const request = objs.put({
                        id: this.currentId,
                        name: this.currentName,
                        template: this.isTemplate,
                        thumbnail: this.currentThumbnail,
                        description: this.description,
                        updated_at: Date(),
                        ...data
                    });
                    request.onerror = () => reject(Error('Store error'));
                    request.onsuccess = () => {
                        resolve(request.result);
                    };
                }
            );
        },

        async update(data) {
            return new Promise(
                function (resolve, reject) {
                    const { id, ..._data } = data;
                    const objs = getAsyncObjectStore();
                    const request = objs.get(id);
                    request.onerror = () => reject(Error('Update error'));
                    request.onsuccess = () => {
                        objs.put({ id, ...request.result, ..._data });
                        resolve(request.result);
                    };
                }
            );
        },

        async delete(index) {
            return new Promise(
                function (resolve, reject) {
                    const objs = getAsyncObjectStore();
                    const request = objs.delete(index || this.currentId);
                    request.onerror = () => reject(Error('Delete error'));
                    request.onsuccess = () => {
                        resolve(request.result);
                    };;
                }
            );
        }
    });
}