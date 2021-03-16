import TemplateManager from './components';

export default (editor, opts = {}) => {
    const { $ } = editor;
    const mdl = editor.Modal;
    const sm = editor.StorageManager;
    const mdlClass = `${pfx}mdl-dialog-tml`;
    let templateManager = null;

    cm.add('open-pages', {
        run(editor, sender) {
            const mdlDialog = document.querySelector(`.${pfx}mdl-dialog`);
            mdlDialog.classList.add(mdlClass);
            sender && sender.set && sender && sender.set('active');
            !templateManager && (templateManager = new TemplateManager)
            mdl.setTitle(opts.mdlTitle);
            mdl.setContent($('.lds-ellipsis').length ? $('.lds-ellipsis') : templateManager.loader());
            sm.get(sm.getCurrent()).loadAll(res => {
                    let content = $('#pages');
                    content = content.length ? content : $(templateManager.render());
                    mdl.setContent(content);
                    const pages = content.find('#pages-container');
                    const templates = content.find('#templates-container');
                    pages.remove(`${this.pfx}templates-card`);
                    templates.remove(`${this.pfx}templates-card`);
                    pages.append(templateManager.update(res.filter(r => !r.template)));
                    templates.append(templateManager.update(res.filter(r => r.template)), false);
                },
                err => console.log("Error", err));
            mdl.open();
            mdl.getModel().once('change:open', () => {
                mdlDialog.classList.remove(mdlClass);
            });
        },
        stop(editor) {
            mdl.close();
        }
    });
};