import commands from './commands';
import storage from './storage';
import modal from './modal';

export default (editor, opts = {}) => {
    const options = {
        ...{
            // default options
            // Database name
            dbName: 'gjs',

            // Collection name
            objectStoreName: 'templates',

            // Use built-in uuid
            uuidKey: true,

            // Indexeddb version schema
            indexeddbVersion: 4,

            // blank Template
            blankTemplate: {
                id: 'Blank',
                template: true,
                'gjs-html': '',
                'gjs-css': '',
            },

            // When template or page is deleted
            onDelete(res) {
                console.log('Deleted:', res)
            },

            // When error onDelete
            onDeleteError(err) {
                console.log(err)
            },

            // On screenshot error
            onScreenshotError(err) {
                console.log(err)
            },

            // Quality of screenshot image from 0 to 1, more quality increases the image size
            quality: .01,

            // Content for templates modal title
            mdlTitle: 'Template Manager',

            // Firebase API key
            apiKey: '',

            // Firebase Auth domain
            authDomain: '',

            // Cloud Firestore project ID
            projectId: '',

            // Enable support for offline data persistence
            enableOffline: true,

            // Database settings (https://firebase.google.com/docs/reference/js/firebase.firestore.Settings)
            settings: { timestampsInSnapshots: true },
        },
        ...opts
    };

    // Load commands
    commands(editor, options);

    // Load storages
    storage(editor, options);

    // Load page manager
    modal(editor, options);

    editor.on('load', () => {
        //TODO lood first page
    });
};