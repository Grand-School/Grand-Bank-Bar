const express = require('express');
const http = require('http');
const appSettings = require('electron-settings');
const port = 3000;

function loadServer(settings) {
    let app = express();
    let server = http.createServer(app);

    app.get('', (req, resp) => {
        resp.sendFile(__dirname + '/login/login.html');
    });

    app.use(express.static(__dirname + '/login'));
    app.use(express.static(__dirname + '/../../node_modules/bootstrap/dist/css'));
    app.use(express.static(__dirname + '/../../node_modules/noty/lib'));
    app.use(express.static(__dirname + '/../../node_modules/font-awesome'));
    app.use(express.static(__dirname + '/../frontend'));
    app.use(express.urlencoded());

    app.post('', (req, resp) => {
        let headerName = appSettings.get('jwt_prefix', 'Authorization');
        let jwt = req.headers[headerName.toLowerCase()];
        settings.token({ jwt, profile: req.body });
    });
    app.get('/server', (req, resp) => resp.send(settings.server));

    server.listen(port, () => settings.done());
}

module.exports = { loadServer };