const deskWindow = require('electron').remote.getCurrentWindow();
const { logout, loadSettings } = require('electron').remote.require('./app');
const serverInput = document.getElementById('serverInput');
const jwtPrefixInput = document.getElementById('jwtPrefix');
const settingsForm = document.getElementById('settingsForm');
const port = document.getElementById('port');
const logoutButton = document.getElementById('logoutButton');
const settingsRow = document.getElementById('settingsRow');
const fullscreen = document.getElementById('fullscreen');
const customerWindow = document.getElementById('customerWindow');
let hideable = false;

$(() => {
    $(settingsRow).modal();
    $(settingsRow).on('hide.bs.modal', () => hideable);
    $(settingsRow).modal({ keyboard: false });

    serverInput.value = settings.get('server_url', '');
    jwtPrefixInput.value = settings.get('jwt_prefix', '');
    port.value = settings.get('port', '');
    customerWindow.checked = settings.get('customer_window', false);

    fullscreen.querySelector(`option[value="${settings.get('fullscreen_app', 'false')}"]`).selected = true;

    settingsForm.addEventListener('submit', e => {
        e.preventDefault();

        if (settings.get('port') !== port.value) {
            setReader(port.value);
        }

        if (serverInput.value !== '') {
            settings.set('server_url', serverInput.value);
        }
        if (jwtPrefixInput.value !== '') {
            settings.set('jwt_prefix', jwtPrefixInput.value);
        }
        if (port.value !== '') {
            settings.set('port', port.value);
        }
        settings.set('customer_window', customerWindow.checked);
        settings.set('fullscreen_app', fullscreen.value === 'true');

        loadSettings(deskWindow);

        if (getJwt() !== null) {
            successNoty('Вы успешно сохранили настройки!');
            return;
        }

        hideable = true;
        $(settingsRow).modal('hide');

        if (settings.has('jwt')) {
            deskWindow.loadFile('../bar/bar.html');
        } else {
            deskWindow.loadURL('http://localhost:3000');
        }
    });

    if (getJwt() !== null) {
        logoutButton.hidden = false;
        logoutButton.addEventListener('click', e => {
            e.preventDefault();
            logout();
        });
    }
});