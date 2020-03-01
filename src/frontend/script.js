const $ = require('jquery');
const server = require('electron-settings').get('server_url');
const serverUrl = server + 'rest/';
const { getJwt } = require('electron').remote.require('./app');
const settings = require('electron-settings');
require('bootstrap/dist/js/bootstrap.min');

$(() => {
    if (getJwt() !== null) {
        $(document).ajaxSend((e, xhr) => xhr.setRequestHeader(settings.get('jwt_prefix', 'Authorization'), getJwt()));
    }
});