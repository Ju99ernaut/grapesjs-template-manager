# Grapesjs Project Manager

> Requires GrapesJS v0.17.3 or higher.

Project, template and page manager for grapesjs. This version makes use of the [`PageManager`](#), the previous version which doesn't make use of the `PageManager` can be found [here](#).

| Project | Project settings | Pages | Page settings |
|---------|------------------|-------|---------------|\
| | | | |

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<link href="https://unpkg.com/grapesjs-project-manager/dist/grapesjs-project-manager.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/grapesjs-project-manager"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  fromElement: true,
  pageManager: true, // This should be set to tru
  storageManager:  {
    type: 'indexeddb',
    // ...
  },
  plugins: ['grapesjs-project-manager'],
});

// Running commands from panels
const pn = editor.Panels;
pn.addButton('options', {
    id: 'open-templates',
    className: 'fa fa-folder-o',
    attributes: {
        title: 'Open projects and templates'
    },
    command: 'open-templates', //Open modal 
});
pn.addButton('views', {
    id: 'open-pages',
    className: 'fa fa-file-o',
    attributes: {
        title: 'Take Screenshot'
    },
    command: 'open-pages',
    togglable: false
});
```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}
```


## Summary

* Plugin name: `grapesjs-project-manager`
* Commands
    * `open-templates`
    * `open-pages`
    * `open-settings`
    * `get-uuidv4`
    * `take-screenshot`
    * `save-as-template`
    * `delete-template`
* Storages
    * `indexeddb`
    * `firestore`
    * `rest-api`

## Options

| Option | Description | Default |
|-|-|-
| `dbName` | Database name | `gjs` |
| `objectStoreName` | Collection name | `templates` |
| `loadFirst` | Load first template in storage | `true` |
| `components` | Default components since `fromElement` is not supported | `undefined` |
| `style` | Default style since `fromElement` is not supported | `undefined` |
| `indexeddbVersion` | IndexedDB schema version | `5` |
| `onDelete` | On successful template deletion | `Function(Check source)` |
| `onDeleteError` | On error template deletion | `Function(Check source)` |
| `onScreenShotError` | On error capturing screenshot | `Function(Check source)` |
| `quality` | Generated screenshot quality | `.01` |
| `mdlTitle` | Modal title | `Project Manager` |
| `apiKey` | `Firebase` API key | `` |
| `authDomain` | `Firebase` Auth domain | `` |
| `projectId` | `Cloud Firestore` project ID | `` |
| `firebaseConfig` | Extra firebase app credentials | `{}` |
| `enableOffline` | Enable `Firestore` support for offline data persistence | `true` |
| `settings` | `Firestore` database settings | `{ timestampsInSnapshots: true }` |
| `uuidInPath` | Add uuid as path parameter on store for `rest-api`(useful for validation) | `true` |

* Setting `loadFirst` to `false` prevents overwritting the contents of the editor with the contents of the first template in storage.
* Only use options for `Firebase` when using `Cloud Firestore` storage.
* `dbName` and `indexeddbVersion` only apply to `indexddb` storage.
* `objectStoreName` acts as collection name for both `firestore` and ` indexeddb`.
* When `uuidInPath` is set to `false` the store request will be `http://endpoint/store/` instead of `http://endpoint/store/{uuid}`

## Local/IndexedDB

```js
window.editor = grapesjs.init({
  container: '#gjs',
  // ...
  pageManager: true,
  storageManager:  {
    type: 'indexeddb'
  },
  plugins: ['grapesjs-project-manager'],
  pluginsOpts: {
    'grapesjs-project-manager': { /* Options */ }
  }
});
```

## Firestore

Configure firestore access rules for your app.
Add libraries to `head` of document:

```html
<!-- The core Firebase JS SDK is always required and must be listed first -->
<script src="https://www.gstatic.com/firebasejs/8.3.1/firebase-app.js"></script>
<!-- TODO: Add SDKs for Firebase products that you want to use
https://firebase.google.com/docs/web/setup#available-libraries -->
<script src="https://www.gstatic.com/firebasejs/8.3.1/firebase-firestore.js"></script>
```

Add credentials:

```js
window.editor = grapesjs.init({
  container: '#gjs',
  // ...
  pageManager: true,
  storageManager:  {
    type: 'firestore'
  },
  plugins: ['grapesjs-project-manager'],
  pluginsOpts: {
    'grapesjs-project-manager': { 
      // Firebase API key
      apiKey: 'FIREBASE_API_KEY',
      // Firebase Auth domain
      authDomain: 'app-id-00a00.firebaseapp.com',
      // Cloud Firestore project ID
      projectId: 'app-id-00a00',
    }
  }
});
```

## Remote/REST-API

Example backend https://github.com/Ju99ernaut/gjs-api

```js
window.editor = grapesjs.init({
  container: '#gjs',
  // ...
  pageManager: true,
  storageManager:  {
    type: 'rest-api',
    // the URIs below can be the same depending on your API design 
    urlStore: 'https://endpoint/store/',// POST
    urlLoad: 'https://endpoint/load/',// GET
    urlDelete: 'https://endpoint/delete/',// DELETE
    params: { _some_token: '...' },
    headers: { Authorization: 'Basic ...' }
  },
  plugins: ['grapesjs-project-manager'],
  pluginsOpts: {
    'grapesjs-project-manager': { /* options */ }
  }
});
```

## Download

* CDN
  * `https://unpkg.com/grapesjs-project-manager`
* NPM
  * `npm i grapesjs-project-manager`
* GIT
  * `git clone https://github.com/Ju99ernaut/grapesjs-template-manager.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<link href="https://unpkg.com/grapesjs-project-manager/dist/grapesjs-project-manager.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/grapesjs-project-manager.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      pageManager: true,
      storageManager:  {
        type: 'indexeddb',
        // ...
      },
      plugins: ['grapesjs-project-manager'],
      pluginsOpts: {
        'grapesjs-project-manager': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from 'grapesjs-project-manager';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapesjs-project-manager/dist/grapesjs-project-manager.min.css';

const editor = grapesjs.init({
  container : '#gjs',
  // ...
  pageManager: true,
  storageManager:  {
    type: 'indexeddb',
    // ...
  },
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: { /* options */ }
  }
  // or
  plugins: [
    editor => plugin(editor, { /* options */ }),
  ],
});
```



## Development

Clone the repository

```sh
$ git clone https://github.com/Ju99ernaut/grapesjs-template-manager.git
$ cd grapesjs-template-manager
```

Install dependencies

```sh
$ npm i
```

Build css or watch scss

```sh
$ npm run build:css
```

`OR`

```
$ npm run watch:scss
```

Start the dev server

```sh
$ npm start
```

Build the source

```sh
$ npm run build
```



## License

MIT
