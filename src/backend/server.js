const express = require('express');
const http = require('http');
const ClientOAuth2 = require('client-oauth2');
const { serverPort, oAuth } = require('../config');

function loadServer({ onDone, token, loginCanceled }) {
    const client = new ClientOAuth2(oAuth);

    let app = express();
    let server = http.createServer(app);

    app.get('', (req, resp) => {
        resp.redirect(client.code.getUri());
    });

    app.get('/login/callback', (req, resp) => {
        client.code.getToken(req.originalUrl)
            .then(data => token(data))
            .catch(error => loginCanceled());
    });

    server.listen(serverPort, () => onDone());
}

module.exports = { loadServer };