const loginForm = document.getElementById('loginForm');
const updateSettingsButton = document.getElementById('updateSettingsButton');
const loginRow = document.getElementById('loginRow');
const $ = require('jquery');
let server, loginRowHideAble = false;
require('bootstrap/dist/js/bootstrap.min');

$(() => {
    $(loginRow).on('hide.bs.modal', e => loginRowHideAble);
    $(loginRow).modal();

    $.loadScript = function (url, callback) {
        $.ajax({
            url: url,
            dataType: 'script',
            success: callback,
            async: true
        });
    };

    $.ajax('/server')
        .done(response => {
            server = response;
            $.get(server + 'rest/api/recaptcha')
                .done(reCaptchaToken => {
                    $.loadScript('https://www.google.com/recaptcha/api.js?render=' + reCaptchaToken, () => {
                        grecaptcha.ready(() => {
                            grecaptcha.execute(reCaptchaToken, { action: 'login' })
                                .then(token => {
                                    document.querySelectorAll('input[name="reCaptchaResponse"]').forEach(el => el.value = token);
                                });
                        });
                    });
                });
        });

    loginForm.addEventListener('submit', e => {
        e.preventDefault();

        $.ajax({
            url: server + 'rest/login',
            method: 'POST',
            data: $(loginForm).serialize(),
            error: request => done(request),
            success: (data, status, request) => done(request)
        });

        function done(request) {
            let token = request.getResponseHeader('Authorization');
            if (token === null) {
                alert('Вы ввели неверный логин и пароль или не подтвердили капчу');
                return;
            }

            loginRowHideAble = true;
            $(loginRow).modal('hide');

            $.ajax({
                method: 'POST',
                url: '',
                data: { token }
            });
        }
    });

    updateSettingsButton.addEventListener('click', e => {
        e.preventDefault();
        loginRowHideAble = true;
        $(loginRow).modal('hide');
        $.ajax({
            method: 'POST',
            url: '/settings'
        });
    });
});