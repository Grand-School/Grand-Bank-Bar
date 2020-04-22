const loginForm = document.getElementById('loginForm');
const loginRow = document.getElementById('loginRow');
let currentServer;

$(() => {
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
            currentServer = response;
            $.get(currentServer + 'rest/api/recaptcha')
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
            url: currentServer + 'rest/login',
            method: 'POST',
            data: $(loginForm).serialize(),
            error: response => {
                let errorInfo = response.responseJSON;
                failNotyText(errorInfo.message ? 'Ошибка: ' + errorInfo.message : 'Ошибка авторизации');
            },
        }).done((data, status, response) => {
            let headerName = settings.get('jwt_prefix', 'Authorization');
            let token = response.getResponseHeader(headerName);

            $(loginRow).modal('hide');

            let headers = {};
            headers[headerName] = token;

            $.ajax({
                url: currentServer + 'rest/users/profile',
                headers
            }).done(user => {
                $.ajax({
                    url: '',
                    method: 'POST',
                    mediaType: 'application/json',
                    data: user,
                    headers
                });
            });
        });
    });
});