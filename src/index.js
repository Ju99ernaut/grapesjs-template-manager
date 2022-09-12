import TemplateManager, { PagesApp, SettingsApp } from './manager';
import commands from './commands';
import storage from './storage';
import en from './locale/en';

export default (editor, opts = {}) => {
    const options = {
        ...{
            // default options
            // Allow migration of projects using deprecated storage prefix
            legacyPrefix: '',
            // Database name
            dbName: 'gjs',

            // Collection name
            objectStoreName: 'projects',

            // Load first template in storage
            loadFirst: true,

            // Custom load
            customLoad: false,

            // Add uuid as path parameter to store path for rest-api
            uuidInPath: true,

            // Indexeddb version schema
            indexeddbVersion: 6,

            // Confirm delete project
            confirmDeleteProject() {
                return confirm('Are you sure to delete this project')
            },

            // Confirm delete page
            confirmDeletePage() {
                return confirm('Are you sure to delete this page')
            },

            // When template or page is deleted
            onDelete(res) {
                console.log('Deleted:', res)
            },

            // Handle promise from delete
            onDeleteAsync(del) {
                return del;
            },

            // Handle promise from update
            onUpdateAsync(up) {
                return up;
            },

            // Handle promise from screenshot
            onScreenshotAsync(shot) {
                return shot;
            },

            // On screenshot error
            onScreenshotError(err) {
                console.log(err)
            },

            // Handle built-in thumbnail generation
            // By default it just sets the url as the base64 encoded image which may be too large to store in a database
            // You might want to upload this somewhere
            onThumbnail(dataUrl, $input) {
                $input.val(dataUrl);
            },

            // Quality of screenshot image from 0 to 1, more quality increases the image size
            quality: .01,

            // Content for templates modal title
            mdlTitle: 'Project Manager',

            // Show when no pages yet pages
            nopages: '<div style="display:flex;align-items:center;padding:50px;margin:auto;">No Projects Yet</div>',

            // Firebase API key
            apiKey: '',

            // Firebase Auth domain
            authDomain: '',

            // Cloud Firestore project ID
            projectId: '',

            // Enable support for offline data persistence
            enableOffline: true,

            // Firebase app config
            firebaseConfig: {},

            // Database settings (https://firebase.google.com/docs/reference/js/firebase.firestore.Settings)
            settings: { timestampsInSnapshots: true },

            // Show estimated project statistics
            size: false,

            // Send feedback when open is clicked on current page
            currentPageOpen() {
                console.log('Current page already open')
            },

            i18n: {},
        },
        ...opts,
    };

    editor.I18n.addMessages({
        en,
        ...options.i18n,
    });

    // Init and add dashboard object to editor
    editor.TemplateManager = new TemplateManager(editor, options);
    editor.PagesApp = new PagesApp(editor, options);
    editor.SettingsApp = new SettingsApp(editor, options);

    // Load commands
    commands(editor, options);

    // Load storages
    storage(editor, options);

    // Load page with index zero
    editor.on('load', async () => {
        const cs = editor.Storage.getCurrentStorage();
        const { customLoad } = options;
        customLoad && typeof customLoad === 'function' && customLoad(editor, cs);
        if (!customLoad) {
            const res = await cs.loadAll();
            const firstPage = res[0];
            if (firstPage && options.loadFirst) {
                cs.setId(firstPage.id);
                cs.setName(firstPage.name);
                cs.setThumbnail(firstPage.thumbnail);
                cs.setIsTemplate(firstPage.template);
                editor.load();
            } else {
                cs.setId(editor.runCommand('get-uuidv4'));
                cs.setName(`Default-${cs.currentId.substr(0, 7)}`);
            }
        }
    });
};