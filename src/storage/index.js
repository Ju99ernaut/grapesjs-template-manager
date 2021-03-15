import indexeddb from './indexeddb';
import remote from './remote';
import firestore from './firestore';

export default (editor, opts = {}) => {
    // Load indexeddb storage
    indexeddb(editor, opts);

    // Load remote storage
    remote(editor, opts);

    // Load firestore storage
    firestore(editor, opts);
}