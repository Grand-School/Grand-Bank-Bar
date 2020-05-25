const { getCustomerEventListener, openOAuthWindow } = require('electron').remote.require('./app');
const loginDiv = document.getElementById('loginDiv');

document.addEventListener('DOMContentLoaded', () => {
    let eventListener = getCustomerEventListener();

    eventListener.on('loginStates', ({ loggedIn }) => {
        if (loggedIn) {
            loginDiv.querySelector('h2').textContent = 'Вы успешно авторизовались!';
            loginDiv.querySelector('.spinner').hidden = true;
        } else {
            loginDiv.querySelector('h2').textContent = 'Вы не авторизовались!';
            loginDiv.querySelector('.spinner').hidden = true;
            loginDiv.querySelector('.retry').hidden = false;
        }
    });

    loginDiv.querySelector('.retry a').addEventListener('click', e => {
        e.preventDefault();

        loginDiv.querySelector('h2').textContent = 'Идёт авторизация';
        loginDiv.querySelector('.spinner').hidden = false;
        loginDiv.querySelector('.retry').hidden = true;

        openOAuthWindow();
    });
});