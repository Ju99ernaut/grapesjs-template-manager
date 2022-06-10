import { storageIDB, helpers } from '../consts';

export default (editor, opts = {}) => {
    let db;
    const sm = editor.StorageManager;
    const storageName = storageIDB;
    const objsName = opts.objectStoreName;

    // Functions for DB retrieving
    const getDb = () => db;
    const getAsyncDb = () => new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
        } else {
            const indexedDB = window.indexedDB || window.mozIndexedDB ||
                window.webkitIndexedDB || window.msIndexedDB;
            const request = indexedDB.open(opts.dbName, opts.indexeddbVersion);
            request.onerror = reject;
            request.onsuccess = () => {
                db = request.result;
                db.onerror = reject;
                resolve(db);
            };
            request.onupgradeneeded = e => {
                const objs = request.result.createObjectStore(objsName, { keyPath: 'id' });
                objs.createIndex('name', 'name', { unique: false });
            };
        }
    });

    // Functions for object store retrieving
    const getObjectStore = () => {
        return db.transaction([objsName], 'readwrite').objectStore(objsName);
    };
    const getAsyncObjectStore = async () => {
        if (db) {
            return getObjectStore();
        } else {
            await getAsyncDb();
            return getObjectStore();
        }
    };

    // Add custom storage to the editor
    sm.add(storageName, {
        ...helpers,
        getDb,

        getObjectStore,

        async load(keys) {
            const objs = await getAsyncObjectStore();
            return new Promise(
                (resolve, reject) => {
                    const request = objs.get(this.currentId);
                    request.onerror = reject;
                    request.onsuccess = () => {
                        resolve(request.result || {});
                    };
                }
            );
        },

        async loadAll() {
            const objs = await getAsyncObjectStore();
            return new Promise(
                (resolve, reject) => {
                    const request = objs.getAll();
                    request.onerror = reject;
                    request.onsuccess = () => {
                        resolve(request.result || []);
                    };
                }
            );
        },

        async store(data) {
            const objs = await getAsyncObjectStore();
            return new Promise(
                (resolve, reject) => {
                    const request = objs.put({
                        id: this.currentId,
                        name: this.currentName,
                        template: this.isTemplate,
                        thumbnail: this.currentThumbnail,
                        description: this.description,
                        updated_at: Date.now(),
                        ...data
                    });
                    request.onerror = reject;
                    request.onsuccess = () => {
                        resolve(request.result);
                    };
                }
            );
        },

        async update(data) {
            const { id, ..._data } = data;
            const objs = await getAsyncObjectStore();
            return new Promise(
                (resolve, reject) => {
                    const request = objs.get(id);
                    request.onerror = reject;
                    request.onsuccess = () => {
                        objs.put({ id, ...request.result, ..._data });
                        resolve(request.result);
                    };
                }
            );
        },

        async delete(index) {
            const objs = await getAsyncObjectStore();
            return new Promise(
                (resolve, reject) => {
                    const request = objs.delete(index || this.currentId);
                    request.onerror = reject;
                    request.onsuccess = () => {
                        resolve(request.result);
                    };;
                }
            );
        }
    });
}