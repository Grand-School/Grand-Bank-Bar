module.exports = {
    serverPort: 3000, // port of server, that hosted by this app
    baseUrl: 'http://localhost:8080/', // base url of Grand Bank server (should end with '/')
    oAuth: {
        clientId: '', // oAuth client id. should be taken from Grand Bank server (/settings/oauth page)
        clientSecret: '',  // oAuth client secret. should be taken from Grand Bank server (/settings/oauth page, shown only once after create)
        accessTokenUri: 'http://localhost:8080/oauth/token', // default access token uri of Grand Bank server
        authorizationUri: 'http://localhost:8080/oauth/authorize', // default authorize uri of Grand Bank server
        redirectUri: `http://localhost:3000/login/callback`, // uri, where Grand Bank server will redirect after login. on server should be the same. servlet path should be '/login/callback'
        scopes: ['user_info', 'pages:bar', 'pages:users'] // scopes, with which this app will work. on server you need set access to all THIS scopes
    },
    cookies: ['JSESSIONID', 'remember'] // cookies, that should be deleted after user logged in
};