const { app, BrowserWindow, Menu, MenuItem, LoadFileOptions } = require('electron');
const settings = require('electron-settings');
const { loadServer } = require('./backend/server');
const { Reader } = require('./backend/reader');
let userJwt = null, reader = null, profile = null, window;

exports.getJwt = () => userJwt;
exports.getReader = () => reader;
exports.setReader = port => reader = new Reader(port);
exports.loadSettings = loadSettings;
exports.logout = () => {
    userJwt = null;
    loadMenu(window);
    window.loadURL('http://localhost:3000')
        .then(() => window.show());
};
app.allowRendererProcessReuse = true;

if (settings.has('port')) {
    let port = settings.get('port');
    if (port !== '') {
        reader = new Reader(port);
    }
}

app.whenReady()
    .then(() => {
        window = new BrowserWindow({
            show: false,

            webPreferences: {
                nodeIntegration: true,
                webSecurity: false
            }
        });

        window.webContents.openDevTools();

        loadSettings(window);
        loadMenu(window);

        let serverLoaded = () => {};
        loadServer({
            done: () => {
                console.log('Start server on port 3000');
                serverLoaded();
            },
            token: ({ token, user }) => {
                userJwt = token;
                profile = user;
                window.loadFile('./frontend/bar/bar.html');
                loadMenu(window);
            },
            settings: () => window.loadFile('./frontend/settings/settings.html'),
            server: settings.get('server_url')
        });

        if (userJwt !== null && settings.has('server_url')) {
            window.loadFile('./frontend/bar/bar.html')
                .then(() => window.show());
        } else {
            if (!settings.has('server_url')) {
                window.loadFile('./frontend/settings/settings.html')
                    .then(() => window.show());
            } else {
                serverLoaded = () => {
                    window.loadURL('http://localhost:3000')
                        .then(() => window.show());
                };
            }
        }
    });

function loadMenu(window) {
    let menu = new Menu();
    menu.append(new MenuItem({
        label: 'Настройки',
        click() {
            window.loadFile('./frontend/settings/settings.html', )
                .then(() => window.show())
        }
    }));
    if (userJwt !== null) {
        menu.append(new MenuItem({
            label: 'Бар',
            click() {
                window.loadFile('./frontend/bar/bar.html', )
                    .then(() => window.show())
            }
        }));
    }
    if (profile !== null && (profile.role === 'ROLE_ADMIN' || profile.role === 'ROLE_RESPONSIBLE')) {
        menu.append(new MenuItem({
            label: 'Пользователи',
            click() {
                window.loadFile('./frontend/users/users.html', )
                    .then(() => window.show())
            }
        }));
    }
    Menu.setApplicationMenu(menu);
}

function loadSettings(window) {
    let fullscreen = settings.get('fullscreen_app', 'false') === 'true';
    window.setFullScreen(fullscreen);
    window.maximize();
}