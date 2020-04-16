const electron = require('electron');
const { app, BrowserWindow, Menu, MenuItem } = electron;
const settings = require('electron-settings');
const { loadServer } = require('./backend/server');
const { CustomerEventListener } = require('./backend/customerEventListener');
const { Reader } = require('./backend/reader');
let reader = new Reader(), customerWindow = null, user = null, window;
let customerEventListener = new CustomerEventListener();

module.exports = {
    isLoggedIn: () => user !== null,
    getJwt: () => user.jwt,
    getReader: () => reader,
    getCustomerEventListener: () => customerEventListener,
    loadSettings, logout
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
            token: ({ jwt, profile }) => {
                user = { jwt, profile };
                window.loadFile('./frontend/bar/bar.html');
                loadMenu(window);
            },
            server: settings.get('server_url')
        });

        if (user !== null && settings.has('server_url')) {
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
    if (user === null) {
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
    if (user !== null) {
        menu.append(new MenuItem({
            label: 'Бар',
            click() {
                window.loadFile('./frontend/bar/bar.html')
                    .then(() => window.show())
            }
        }));
    }
    if (user !== null && user.profile !== undefined && (user.profile.role === 'ROLE_ADMIN' || user.profile.role === 'ROLE_RESPONSIBLE')) {
        menu.append(new MenuItem({
            label: 'Пользователи',
            click() {
                window.loadFile('./frontend/users/users.html')
                    .then(() => window.show())
            }
        }));
    }
    if (user !== null) {
        menu.append(new MenuItem({
            label: 'Выйти',
            click: () => logout()
        }));
    }
    Menu.setApplicationMenu(menu);
}

function loadSettings(window) {
    let fullscreen = settings.get('fullscreen_app', false);
    window.setFullScreen(fullscreen);
    window.maximize();

    const screen = electron.screen;
    let useCustomerWindow = settings.get('customer_window', false);
    if (useCustomerWindow) {
        let displayIndex = settings.get('customer_window_display', 1) - 1;
        let fullscreen = settings.get('customer_window_fullscreen', false);

        let displays = screen.getAllDisplays();
        let display = displays[displayIndex];

        let x = display === undefined ? 0 : display.bounds.x;
        let y = display === undefined ? 0 : display.bounds.y;

        if (customerWindow === null) {
            customerWindow = new BrowserWindow({
                show: false,
                autoHideMenuBar: true,
                fullscreen, x, y,
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
            customerWindow.setPosition(x, y);
            customerWindow.setFullScreen(fullscreen);
            customerWindow.maximize();
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

function logout() {
    user = null;
    window.loadURL('http://localhost:3000')
        .then(() => {
            window.show();
            loadMenu(window);
        });
}