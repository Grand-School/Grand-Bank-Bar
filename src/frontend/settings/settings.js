const SerialPort = require('serialport');
const deskWindow = require('electron').remote.getCurrentWindow();
const { logout, loadSettings } = require('electron').remote.require('./app');
const settingsForm = document.getElementById('settingsForm');
let port = document.getElementById('port');
const logoutButton = document.getElementById('logoutButton');
const settingsRow = document.getElementById('settingsRow');
const fullscreen = document.getElementById('fullscreen');
const customerWindow = document.getElementById('customerWindow');
const consoleButton = document.getElementById('consoleButton');
const console = document.getElementById('console');
const customerWindowDisplay = document.getElementById('customerWindowDisplay');
const customerWindowSettings = document.getElementById('customerWindowSettings');
const customerWindowFullscreen = document.getElementById('customerWindowFullscreen');

$(() => {
    $(settingsRow).modal();
    $(settingsRow).modal({ keyboard: false });

    port.value = settings.get('port', '');
    customerWindowDisplay.value = settings.get('customer_window_display', 1);
    customerWindow.checked = settings.get('customer_window', false);

    fullscreen.querySelector(`option[value="${settings.get('fullscreen_app', 'false')}"]`).selected = true;
    customerWindowFullscreen.querySelector(`option[value="${settings.get('customer_window_fullscreen', false)}"]`).selected = true;

    settingsForm.addEventListener('submit', e => {
        e.preventDefault();

        if (port.value !== '') {
            settings.set('port', port.value);
        }
        if (customerWindowDisplay.value !== '') {
            settings.set('customer_window_display', +customerWindowDisplay.value);
        }
        settings.set('customer_window', customerWindow.checked);
        settings.set('customer_window_fullscreen', customerWindowFullscreen.value === 'true');
        settings.set('fullscreen_app', fullscreen.value === 'true');

        loadSettings(deskWindow);

        successNoty('Вы успешно сохранили настройки!');
    });

    if (isLoggedIn()) {
        logoutButton.hidden = false;
        logoutButton.addEventListener('click', e => {
            e.preventDefault();
            logout();
        });
    }

    SerialPort.list((error, list) => {
        let selectedPort = settings.get('port', '');

        let additionalSelect = '';
        let listContainsSelectedPort = list.filter(item => item.comName === selectedPort).length !== 0;
        if (!listContainsSelectedPort) {
            additionalSelect = `<option value="${selectedPort}" selected>${selectedPort}</option>`;
        }

        port.outerHTML = `
            <select id="port" name="port" class="form-control">
                ${additionalSelect}
                ${list.reduce((acc, item) => {
                    let selected = item.comName === selectedPort ? 'selected' : '';
                    return acc += `<option value="${item.comName}" ${selected}>${item.comName} - ${item.pnpId}</option>`
                }, '')}
            </select>
            <a href="#" id="typePortByHand" class="mr-1">Ввести порт вручную</a>
        `;
        port = document.getElementById('port');
        document.getElementById('typePortByHand')
            .addEventListener('click', e => {
                e.preventDefault();
                port.outerHTML = `<input type="text" name="port" id="port" class="form-control" value="${port.value}"/>`;
                e.target.hidden = true;
                port = document.getElementById('port');
            });
    });

    consoleButton.addEventListener('click', function showConsole(e) {
        e.preventDefault();
        console.hidden = false;
        console.innerHTML = getReader().getConsole()
            .reduce((acc, item) => acc += `<div>${item}</div>`, '');
        getReader().setOnConsole(data => console.insertAdjacentHTML('beforeend', `<div>${data}</div>`));

        consoleButton.removeEventListener('click', showConsole);
        consoleButton.addEventListener('click', function hideConsole(e) {
            e.preventDefault();
            console.hidden = true;
            consoleButton.removeEventListener('click', hideConsole);
            consoleButton.addEventListener('click', showConsole);
        });
    });

    loadCustomerWindowSettings();
    customerWindow.addEventListener('click', e => loadCustomerWindowSettings());
});

function loadCustomerWindowSettings() {
    customerWindowSettings.querySelectorAll('input, select')
        .forEach(item => item.disabled = !customerWindow.checked);
}