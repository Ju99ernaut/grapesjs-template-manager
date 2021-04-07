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

            // Load first template in storage
            loadFirst: true,

            // Add uuid as path parameter to store path for rest-api
            uuidInPath: true,

            // Indexeddb version schema
            indexeddbVersion: 4,

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

            // Content for button text
            btnText: {
                new: 'New Page',
                edit: 'Edit Selected',
                create: 'Create',
                createBlank: 'Create Blank Template'
            },

            // Content for tabs
            tabsText: {
                pages: 'Pages',
                templates: 'Templates'
            },

            // Content for label
            nameLabel: 'Name',

            // Content for help message
            help: 'Select a template, enter page name, then click create. Use edit to modify the template.',

            // Show when no pages yet pages
            nopages: '<div style="display:flex;align-items:center;padding:50px;margin:auto;">No Pages Yet</div>',

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

    // Load page with index zero
    editor.on('load', () => {
        const cs = editor.Storage.getCurrentStorage();
        cs.loadAll(res => {
            const firstPage = res[0];
            if (firstPage && options.loadFirst) {
                cs.setId(firstPage.id);
                cs.setIdx(firstPage.idx);
                cs.setThumbnail(firstPage.thumbnail);
                cs.setIsTemplate(firstPage.template);
                editor.load();
            } else {
                cs.setIdx(editor.runCommand('get-uuidv4'));
            }
        });
    });
};