const deskWindow = require('electron').remote.getCurrentWindow();
const { logout } = require('electron').remote.require('./app');
const serverInput = document.getElementById('serverInput');
const jwtPrefixInput = document.getElementById('jwtPrefix');
const settingsForm = document.getElementById('settingsForm');
const port = document.getElementById('port');
const logoutButton = document.getElementById('logoutButton');
const settingsRow = document.getElementById('settingsRow');
let hideable = false;

$(() => {
    $(settingsRow).modal();
    $(settingsRow).on('hide.bs.modal', () => hideable);
    $(settingsRow).modal({ keyboard: false });

    serverInput.value = settings.get('server_url', '');
    jwtPrefixInput.value = settings.get('jwt_prefix', '');
    port.value = settings.get('port', '');

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