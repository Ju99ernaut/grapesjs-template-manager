import domtoimage from 'dom-to-image';

export default (editor, opts = {}) => {
    const cm = editor.Commands;

    editor.domtoimage = domtoimage;

    //some magic from gist.github.com/jed/982883
    const uuidv4 = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );

    const getJpeg = (node, opts = {}, clb, clbErr) => {
        domtoimage.toJpeg(node, opts)
            .then(dataUrl => clb && clb(dataUrl))
            .catch(err => clbErr && clbErr(err))
    };

    cm.add('get-uuidv4', () => uuidv4());

    cm.add('take-screenshot', editor => {
        const el = editor.getWrapper().getEl();
        const clb = dataUrl => editor.Storage.getCurrentStorage().setThumbnail(dataUrl);
        getJpeg(el, {
            quality: opts.quality,
            height: 1000,
            'cacheBust': true,
            style: {
                'background-color': 'white',
                ...editor.getWrapper().getStyle()
            },
        }, clb, opts.onScreenshotError);
    });

    cm.add('save-as-template', editor => {
        editor.Storage.getCurrentStorage()
            .setIsTemplate(true);
        editor.store();
    });

    cm.add('delete-template', editor => {
        editor.Storage.getCurrentStorage()
            .delete(opts.onDelete, opts.onDeleteError);
    });
}