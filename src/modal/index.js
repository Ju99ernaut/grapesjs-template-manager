import TemplateManager from './manager';

export default (editor, opts = {}) => {
    const { $ } = editor;
    const mdl = editor.Modal;
    const sm = editor.StorageManager;
    const pfx = editor.getConfig('stylePrefix');
    const mdlClass = `${pfx}mdl-dialog-tml`;
    let templateManager = null;

    editor.Commands.add('open-templates', {
        run(editor, sender) {
            const mdlDialog = document.querySelector(`.${pfx}mdl-dialog`);
            mdlDialog.classList.add(mdlClass);
            sender && sender.set && sender && sender.set('active');
            !templateManager && (templateManager = new TemplateManager(editor, opts))
            mdl.setTitle(opts.mdlTitle);
            mdl.setContent($('.lds-ellipsis').length ? $('.lds-ellipsis') : templateManager.loader());
            sm.getCurrentStorage().loadAll(res => {
                    let content = $('#pages');
                    content = content.length ? content : $(templateManager.render());
                    mdl.setContent(content);
                    const pages = content.find('#pages-container');
                    const templates = content.find('#templates-container');
                    pages.find(`.${pfx}templates-card-2`).remove();
                    templates.find(`.${pfx}templates-card-2`).remove();
                    pages.append(templateManager.update(res.filter(r => !r.template)));
                    templates.append(templateManager.update(res.filter(r => r.template), false));
                },
                err => console.log("Error", err));
            mdl.open();
            mdl.getModel().once('change:open', () => {
                mdlDialog.classList.remove(mdlClass);
            });
        }
    });
};