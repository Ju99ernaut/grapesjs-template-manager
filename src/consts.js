export const storageIDB = 'indexeddb',
    storageRemote = 'rest-api',
    storageFireStore = 'firestore',
    helpers = {
        currentName: 'Default',
        currentId: 'uuidv4',
        currentThumbnail: '',
        isTemplate: false,
        description: 'No description',

        setId(id) {
            this.currentId = id;
        },

        setName(name) {
            this.currentName = name;
        },

        setThumbnail(thumbnail) {
            this.currentThumbnail = thumbnail;
        },

        setIsTemplate(isTemplate) {
            this.isTemplate = !!isTemplate;
        },

        setDescription(description) {
            this.description = description;
        },
    };