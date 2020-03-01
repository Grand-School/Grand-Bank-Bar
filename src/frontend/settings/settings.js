const deskWindow = require('electron').remote.getCurrentWindow();
const serverInput = document.getElementById('serverInput');
const jwtPrefixInput = document.getElementById('jwtPrefix');
const settingsForm = document.getElementById('settingsForm');

$(() => {
    $('#settingsRow').modal();

    serverInput.value = settings.get('server_url', '');
    jwtPrefixInput.value = settings.get('jwt_prefix', '');

    settingsForm.addEventListener('submit', e => {
        e.preventDefault();

        settings.set('server_url', serverInput.value);
        settings.set('jwt_prefix', jwtPrefixInput.value);

        $('#settingsRow').modal('hide');

        if (settings.has('jwt')) {
            deskWindow.loadFile('../bar/bar.html');
        } else {
            deskWindow.loadURL('http://localhost:3000');
        }
    });
});