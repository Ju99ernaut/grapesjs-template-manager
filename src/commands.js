import domtoimage from 'dom-to-image';

export default (editor, opts = {}) => {
    const cm = editor.Commands;
    const cs = editor.Storage.getCurrentStorage();
    const mdl = editor.Modal;
    const pfx = editor.getConfig('stylePrefix');
    const mdlClass = `${pfx}mdl-dialog-tml`;
    const mdlClassMd = `${pfx}mdl-dialog-md`;

    editor.domtoimage = domtoimage;

    cm.add('open-templates', {
        run(editor, sender) {
            const mdlDialog = document.querySelector(`.${pfx}mdl-dialog`);
            mdlDialog.classList.add(mdlClass);
            sender?.set && sender.set('active');
            mdl.setTitle(opts.mdlTitle);
            mdl.setContent(editor.TemplateManager.render());
            mdl.open();
            mdl.getModel().once('change:open', () => {
                mdlDialog.classList.remove(mdlClass);
            });
        }
    });

    cm.add('open-settings', {
        run(editor, sender) {
            const mdlDialog = document.querySelector(`.${pfx}mdl-dialog`);
            mdlDialog.classList.add(mdlClassMd);
            sender?.set && sender.set('active');
            mdl.setTitle(opts.mdlTitle);
            mdl.setContent(editor.SettingsApp.render());
            mdl.open();
            mdl.getModel().once('change:open', () => {
                mdlDialog.classList.remove(mdlClassMd);
            });
        }
    });

    cm.add('open-pages', {
        run(editor) {
            editor.PagesApp.showPanel();
        },
        stop(editor) {
            editor.PagesApp.hidePanel();
        }
    })

    //some magic from gist.github.com/jed/982883
    const uuidv4 = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );

    const getJpeg = async (node, options = {}, clb, clbErr) => {
        try {
            const dataUrl = await opts.onScreenshotAsync(domtoimage.toJpeg(node, options));
            clb && clb(dataUrl);
        } catch (err) {
            clbErr && clbErr(err)
        }
    };

    cm.add('get-uuidv4', () => {
        if (crypto) {
            return crypto.randomUUID ? crypto.randomUUID() : uuidv4();
        }
    });

    cm.add('take-screenshot', (editor, s, options = { clb(d) { return d } }) => {
        const el = editor.getWrapper().getEl();
        getJpeg(el, {
            quality: opts.quality,
            height: 1000,
            'cacheBust': true,
            style: {
                'background-color': 'white',
                ...editor.getWrapper().getStyle()
            },
        }, options.clb, opts.onScreenshotError);
    });

    cm.add('save-as-template', editor => {
        cs.setIsTemplate(true);
        editor.store();
    });

    cm.add('delete-template', async (editor) => {
        const res = await cs.delete();
        opts.onDelete(res);
    });
}