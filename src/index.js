import en from './locale/en';

export default (editor, opts = {}) => {
    const options = {
        ...{
            i18n: {},
            // default options
            // Database name
            dbName: 'gjs',

            // Collection name
            objectStoreName: 'templates',

            // Use built-in uuid
            uuidKey: true,

            // Indexeddb version schema
            indexeddbVersion: 4,

            // Default page id
            defaultPage: 'Default',

            // Default template id
            defaultTemplate: 'Blank',

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

            // Custom onload function used only when storage isn't indexeddb
            onload() {},

            // Custom on edit function used to edit the page name if storage isn't indexeddb
            onedit() {},

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

    // Load i18n files
    editor.I18n && editor.I18n.addMessages({
        en,
        ...options.i18n,
    });

    //TODO Build the ui

    editor.on('load', () => {
        //TODO lood first page
    });
};