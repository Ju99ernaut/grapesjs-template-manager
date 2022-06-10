export default class UI {
    constructor(editor, opts = {}) {
        this.editor = editor;
        this.$ = editor.$;
        this.pfx = editor.getConfig('stylePrefix');
        this.opts = opts;
        this.setState = this.setState.bind(this);
        this.setStateSilent = this.setStateSilent.bind(this);
        this.onRender = this.onRender.bind(this);
        this.handleTabs = this.handleTabs.bind(this);
    }

    setState(state) {
        this.state = { ...this.state, ...state };
        this.update();
    }

    setStateSilent(state) {
        this.state = { ...this.state, ...state };
    }

    get sm() {
        return this.editor.Storage;
    }

    get cs() {
        return this.editor.Storage.getCurrentStorage();
    }

    get pm() {
        return this.editor.Pages;
    }

    onRender() { }

    handleTabs() { }
}