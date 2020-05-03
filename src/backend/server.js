const express = require('express');
const http = require('http');
const ClientOAuth2 = require('client-oauth2');
const port = 3000;

function loadServer({ onDone, token, loginCanceled, serverUrl }) {
    const client = new ClientOAuth2({
        clientId: '',
        clientSecret: '',
        accessTokenUri: serverUrl + 'oauth/token',
        authorizationUri: serverUrl + 'oauth/authorize',
        userInfoUrl: serverUrl + 'rest/users/profile',
        redirectUri: `http://localhost:${port}/login/callback`,
        scopes: ['user_info', 'pages:bar', 'pages:users']
    });

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

    server.listen(port, () => onDone());
}

module.exports = { loadServer };