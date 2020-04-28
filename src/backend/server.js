const express = require('express');
const http = require('http');
const ClientOAuth2 = require('client-oauth2');
const port = 3000;

function loadServer({ onDone, token, serverUrl }) {
    const client = new ClientOAuth2({
        clientId: '',
        clientSecret: '',
        accessTokenUri: serverUrl + 'oauth/token',
        authorizationUri: serverUrl + 'oauth/authorize',
        userInfoUrl: serverUrl + 'rest/users/profile',
        redirectUri: `http://localhost:${port}/login/callback`,
        scopes: ['user_info']
    });

    let app = express();
    let server = http.createServer(app);

    app.get('', (req, resp) => {
        resp.redirect(client.code.getUri());
    });

    app.get('/login/callback', (req, resp) => {
        client.code.getToken(req.originalUrl)
            .then(data => {
                token({ jwt: data });
            })
            .catch(error => {
                console.log(error);
            });
    });

    server.listen(port, () => onDone());
}

module.exports = { loadServer };