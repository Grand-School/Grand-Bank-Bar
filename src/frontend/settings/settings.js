const deskWindow = require('electron').remote.getCurrentWindow();
const serverInput = document.getElementById('serverInput');
const jwtPrefixInput = document.getElementById('jwtPrefix');
const settingsForm = document.getElementById('settingsForm');
const port = document.getElementById('port');

$(() => {
    $('#settingsRow').modal();

    serverInput.value = settings.get('server_url', '');
    jwtPrefixInput.value = settings.get('jwt_prefix', '');
    jwtPrefixInput.value = settings.get('port', '');

    settingsForm.addEventListener('submit', e => {
        e.preventDefault();

        if (settings.get('port') !== port.value) {
            setReader(port.value);
        }

        if (serverInput.value !== '') {
            settings.set('server_url', serverInput.value);
        }
        if (jwtPrefixInput.value !== '')) {
            settings.set('jwt_prefix', jwtPrefixInput.value);
        }
        if (port.value !== '')) {
            settings.set('port', port.value);
        }

        $('#settingsRow').modal('hide');

        if (settings.has('jwt')) {
            deskWindow.loadFile('../bar/bar.html');
        } else {
            deskWindow.loadURL('http://localhost:3000');
        }
    });
});