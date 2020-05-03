const $ = require('jquery');
const { getJwt, getReader, getCustomerEventListener, isLoggedIn, getServer } = require('electron').remote.require('./app');
const server = getServer();
const serverUrl = server + 'rest/';
const settings = require('electron-settings');
const Noty = require('noty');
const showUserData = user => user.name + ' ' + user.surname;
const getNormalText = text => text === undefined || text === null ? '' : text;
require('bootstrap/dist/js/bootstrap.min');
let failedNote;

$(() => {
    if (isLoggedIn()) {
        $(document).ajaxSend((e, xhr) => {
            let headers = getJwt().sign({}).headers;
            for (let name in headers) {
                xhr.setRequestHeader(name, headers[name]);
            }
        });
        $(document).ajaxError((event, jqXHR) => failNoty(jqXHR));
    }
});

function failNoty(jqXHR) {
    closeNoty();
    const errorInfo = JSON.parse(jqXHR.responseText);

    if (errorInfo.type === 'VALIDATION_ERROR') {
        let resultErrors = errorInfo.details;
        let fields = errorInfo.fields;
        for (let error in fields) {
            let element = document.querySelector(`input:not([type="hidden"])[name="${error}"]`);
            if (element === null || element === undefined) {
                resultErrors.push(`${error} - ${fields[error]}`)
            } else {
                showErrorOnInput(element, fields[error]);
            }
        }
        failNotyText(errorInfo.type + "<br>" + resultErrors.join("<br>"));
    } else {
        failNotyText(errorInfo.type + "<br>" + errorInfo.details.join("<br>"));
    }
}

function successNoty(msg) {
    closeNoty();
    new Noty({
        text: "<span class='fa fa-lg fa-check'></span> &nbsp;" + msg,
        type: 'success',
        layout: "bottomRight",
        timeout: 1000
    }).show();
}
function failNotyText(text, timeout = 2000) {
    failedNote = new Noty({
        text: "<span class='fa fa-lg fa-exclamation-circle'></span> &nbsp;" + text,
        type: "error",
        layout: "bottomRight",
        timeout
    }).show();
}

function closeNoty() {
    if (failedNote) {
        failedNote.close();
        failedNote = undefined;
    }
}

function showErrorOnInput(errorElement, errorText) {
    errorElement.classList.add('is-invalid');

    let errorInfoElement = null;
    let formGroup = errorElement.closest('.form-group');
    if (formGroup !== null) {
        errorInfoElement = formGroup.querySelector('.invalid-feedback');
        if (errorInfoElement !== null) {
            errorInfoElement.hidden = false;
            errorInfoElement.textContent = errorText;
        }
    }

    errorElement.addEventListener('input', e => {
        errorElement.classList.remove('is-invalid');
        if (errorInfoElement !== null) {
            errorInfoElement.hidden = true;
        }
    });
}