const electron = require('electron');
const { app, BrowserWindow, Menu, MenuItem, dialog, session } = electron;
const settings = require('electron-settings');
const { serverPort, baseUrl, cookies } = require(__dirname + '/config');
const { loadServer } = require(__dirname + '/backend/server');
const { CustomerEventListener } = require(__dirname + '/backend/customerEventListener');
const { Reader } = require(__dirname + '/backend/reader');
const rolesArr = ['ROLE_ADMIN', 'ROLE_RESPONSIBLE', 'ROLE_TEACHER', 'ROLE_BARMEN', 'ROLE_USER'];
const hasAccess = (minRole, actualRole) => rolesArr.indexOf(minRole) >= rolesArr.indexOf(actualRole);
let reader = new Reader(), customerWindow = null, user = null, window, authWindow;
let customerEventListener = new CustomerEventListener();

module.exports = {
    getServer: () => baseUrl,
    isLoggedIn: () => user !== null,
    getJwt: () => user.jwt,
    getReader: () => reader,
    getCustomerEventListener: () => customerEventListener,
    loadSettings, logout, openOAuthWindow
};

app.allowRendererProcessReuse = true;

app.whenReady()
    .then(() => {
        window = new BrowserWindow({
            show: false,
            icon: __dirname + '/icon.ico',

            webPreferences: {
                nodeIntegration: true,
                webSecurity: false
            }
        });

        loadSettings(window);
        loadMenu(window);

        loadServer({
            onDone: () => {
                console.log(`Start server on port ${serverPort}`);
                loginPage();
            },
            token: data => {
                user = { jwt: data, profile: data.data.user };
                cookies.forEach(cookie => session.defaultSession.cookies.remove(baseUrl, cookie));
                loginSuccess();
                loadMenu(window);
            },
            loginCanceled: () => {
                customerEventListener.send('loginStates', { loggedIn: false });
                authWindow.close();
            }
        });

        if (user !== null) {
            window.loadFile(__dirname + '/frontend/bar/bar.html')
                .then(() => window.show());
        }
    });

function loginPage() {
    openOAuthWindow();
    window.loadFile(__dirname + '/frontend/authorization/authorization.html')
        .then(() => window.show());
}

function openOAuthWindow() {
    authWindow = new BrowserWindow({
        show: false,
        icon: __dirname + '/icon.ico',
        alwaysOnTop: true,

        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });

    authWindow.loadURL(`http://localhost:${serverPort}`)
        .then(() => authWindow.show());
}

function loginSuccess() {
    customerEventListener.send('loginStates', { loggedIn: true });
    window.loadFile(__dirname + '/frontend/bar/bar.html');
    authWindow.close();
}

function loadMenu(window) {
    let menu = new Menu();
    if (user === null) {
        menu.append(new MenuItem({
            label: 'Войти',
            click: () => loginPage()
        }));
    }
    menu.append(new MenuItem({
        label: 'Настройки',
        click() {
            window.loadFile(__dirname + '/frontend/settings/settings.html')
                .then(() => window.show())
        }
    }));
    if (user !== null && user.profile !== undefined && hasAccess('ROLE_BARMEN', user.profile.role)) {
        menu.append(new MenuItem({
            label: 'Бар',
            click() {
                window.loadFile(__dirname + '/frontend/bar/bar.html')
                    .then(() => window.show())
            }
        }));
    }
    if (user !== null && user.profile !== undefined && hasAccess('ROLE_RESPONSIBLE', user.profile.role)) {
        menu.append(new MenuItem({
            label: 'Пользователи',
            click() {
                window.loadFile(__dirname + '/frontend/users/users.html')
                    .then(() => window.show())
            }
        }));
    }
    if (user !== null && user.profile !== undefined) {
        let subMenu = new Menu();
        subMenu.append(new MenuItem({
            label: 'Выйти',
            click: () => logout()
        }));
        subMenu.append(new MenuItem({
            label: 'Завершить',
            click: () => app.quit()
        }));

        menu.append(new MenuItem({
            label: user.profile.name + ' ' + user.profile.surname,
            submenu: subMenu
        }));
    }
    if (user === null || user.profile === undefined) {
        menu.append(new MenuItem({
            label: 'Завершить',
            click: () => app.quit()
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
                icon: __dirname + '/icon.ico',
                fullscreen, x, y,
                webPreferences: {
                    nodeIntegration: true,
                    webSecurity: false
                }
            });

            customerWindow.maximize();
            customerWindow.removeMenu();
            customerWindow.loadFile(__dirname + '/frontend/customer/customer.html')
                .then(() => customerWindow.show());
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
    loginPage();
    loadMenu(window);
}