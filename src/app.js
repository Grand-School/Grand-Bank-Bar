const { app, BrowserWindow, Menu, MenuItem } = require('electron');
const settings = require('electron-settings');
const { loadServer } = require('./backend/server');
const { CustomerEventListener } = require('./backend/customerEventListener');
const { Reader } = require('./backend/reader');
let userJwt = null, reader = new Reader(), profile = null, customerWindow = null, window;
let customerEventListener = new CustomerEventListener();

exports.getJwt = () => userJwt;
exports.getReader = () => reader;
exports.getCustomerEventListener = () => customerEventListener;
exports.setReader = port => reader.loadPort(port);
exports.loadSettings = loadSettings;
exports.logout = () => {
    userJwt = null;
    loadMenu(window);
    window.loadURL('http://localhost:3000')
        .then(() => window.show());
};
app.allowRendererProcessReuse = true;

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
    if (userJwt === null) {
        menu.append(new MenuItem({
            label: 'Войти',
            click() {
                window.loadURL('http://localhost:3000')
                    .then(() => window.show());
            }
        }));
    }
    menu.append(new MenuItem({
        label: 'Настройки',
        click() {
            window.loadFile('./frontend/settings/settings.html')
                .then(() => window.show())
        }
    }));
    if (userJwt !== null) {
        menu.append(new MenuItem({
            label: 'Бар',
            click() {
                window.loadFile('./frontend/bar/bar.html')
                    .then(() => window.show())
            }
        }));
    }
    if (profile !== null && (profile.role === 'ROLE_ADMIN' || profile.role === 'ROLE_RESPONSIBLE')) {
        menu.append(new MenuItem({
            label: 'Пользователи',
            click() {
                window.loadFile('./frontend/users/users.html')
                    .then(() => window.show())
            }
        }));
    }
    Menu.setApplicationMenu(menu);
}

function loadSettings(window) {
    let fullscreen = settings.get('fullscreen_app', false);
    window.setFullScreen(fullscreen);
    window.maximize();

    let useCustomerWindow = settings.get('customer_window', false);
    if (useCustomerWindow) {
        if (customerWindow === null) {
            customerWindow = new BrowserWindow({
                show: false,
                autoHideMenuBar: true,
                // fullscreen: true,
                webPreferences: {
                    nodeIntegration: true,
                    webSecurity: false
                }
            });
            customerWindow.maximize();
            customerWindow.removeMenu();
            customerWindow.loadFile('./frontend/customer/customer.html')
                .then(() => customerWindow.show());
            customerWindow.webContents.openDevTools();
        } else {
            customerWindow.show();
        }
    } else if (customerWindow !== null) {
        customerWindow.hide();
    }


    if (settings.has('port')) {
        let port = settings.get('port');
        if (port !== '') {
            reader.loadPort(port);
        }
    }
}