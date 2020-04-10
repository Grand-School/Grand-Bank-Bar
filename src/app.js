const { app, BrowserWindow } = require('electron');
const settings = require('electron-settings');
const { loadServer } = require('./backend/server');
const { Reader } = require('./backend/reader');
let userJwt = null, reader = null;

exports.getJwt = () => userJwt;
exports.getReader = () => reader;
exports.setReader = port => reader = new Reader(port);
app.allowRendererProcessReuse = true;

if (settings.has('port')) {
    let port = settings.get('port');
    if (port !== '') {
        reader = new Reader(port);
    }
}

app.whenReady()
    .then(() => {
        let window = new BrowserWindow({
            show: false,

            webPreferences: {
                nodeIntegration: true,
                webSecurity: false
            }
        });

        let serverLoaded = () => {};
        loadServer({
            done: () => {
                console.log('Start server on port 3000');
                serverLoaded();
            },
            token: (token) => {
                userJwt = token;
                window.loadFile('./frontend/bar/bar.html');
            },
            settings: () => window.loadFile('./frontend/settings/settings.html'),
            server: settings.get('server_url')
        });

        if (userJwt !== null && settings.has('server_url')) {
            window.loadFile('./frontend/bar/bar.html')
                .then(() => loadWindow(window));
        } else {
            if (!settings.has('server_url')) {
                window.loadFile('./frontend/settings/settings.html')
                    .then(() => loadWindow(window));
            } else {
                serverLoaded = () => {
                    window.loadURL('http://localhost:3000')
                        .then(() => loadWindow(window));
                };
            }
        }
    });

function loadWindow(window) {
    window.maximize();
    window.show();
}