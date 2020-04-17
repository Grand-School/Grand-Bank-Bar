const classList = document.getElementById('classList');
const usersTable = document.getElementById('usersTable');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const saveButton = document.getElementById('saveButton');
const modalSpinner = document.getElementById('modalSpinner');
let currentClazz, creditCards;

$(() => {
    $.get(serverUrl + 'api/creditcard')
        .done(response => creditCards = response);

    $.get(serverUrl + 'api/classes')
        .done(classes => {
            classes.forEach(clazz => {
                classList.insertAdjacentHTML('beforeend', `
                    <li class="page-item custom-button" data-class="${clazz}">
                        <a class="page-link">${clazz}</a>
                    </li>
                `);
            });
            classList.children[0].classList.add('active');
            currentClazz = classes[0];
            renderTable();
        });

    classList.addEventListener('click', e => {
        e.preventDefault();
        let li = e.target.closest('li');
        if (li === null || li.dataset.class === undefined) {
            return;
        }

        currentClazz = li.dataset.class;
        classList.querySelector('.active').classList.remove('active');
        li.classList.add('active');

        renderTable();
    });

    getReader().reload();
    getReader().setOnCard(card => {
        let input = modalBody.querySelector('input[name="RFID"]');
        if (input === null) {
            return;
        }

        input.value = card;
        successNoty('Карта считана!');
    });
});

function renderTable(clazz = currentClazz) {
    $.get(serverUrl + `users?class=${clazz}`)
        .done(response => {
            usersTable.innerHTML = '';
            response.forEach(user => {
                usersTable.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.surname}</td>
                        <td>${user.username}</td>
                        <td>${user.balance}</td>
                        <td>${user.creditCard}</td>
                        <td class="fa fa-pencil custom-button" onclick="update(${user.id}, '${showUserData(user)}')"></td>
                    </tr>
                `);
            });
        });
}

function update(userId, userName) {
    $.get(serverUrl + `users/${userId}`)
        .done(user => {
            modalTitle.textContent = `Редактирование пользователя ${userName}`;
            modalBody.innerHTML = `
                <div class="form-group">
                    <label for="creditCard" class="col-form-label">Номер карты</label>
                    <input type="text" class="form-control" id="creditCard" name="creditCard" placeholder="Номер карты" value="${getNormalText(user.creditCard)}">
                    <div class="invalid-feedback" hidden></div>
                </div>
                
                <div class="form-group">
                    <label for="RFID" class="col-form-label">RFID</label>
                    <input type="text" class="form-control" id="RFID" name="RFID" placeholder="RFID" value="${getNormalText(user.RFID)}">
                    <div class="invalid-feedback" hidden></div>
                </div>
                
                <div class="form-group">
                    <label for="cardType" class="col-form-label">Тип кредитной карточки</label>
                    <select name="cardType" id="cardType" class="form-control">
                        ${
                            creditCards.reduce((acc, item) => {
                                let selected = user.cardType === item.codeName ? 'selected' : '';
                                return acc += `<option value="${item.codeName}" ${selected}>${item.name}</option>`;
                            }, '')
                        }
                    </select>
                </div>
            `;
            saveButton.onclick = () => {
                saveButton.disabled = true;
                modalSpinner.hidden = false;

                $.ajax({
                    url: serverUrl + 'bar/rfid/' + userId,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        creditCard: modalBody.querySelector('input[name="creditCard"]').value,
                        RFID: modalBody.querySelector('input[name="RFID"]').value,
                        cardType: modalBody.querySelector('select[name="cardType"]').value
                    }),
                    error() {
                        saveButton.disabled = false;
                        modalSpinner.hidden = true;
                    }
                }).done(() => {
                    renderTable();
                    saveButton.disabled = false;
                    modalSpinner.hidden = true;
                    successNoty('Вы успещно обновили пользователя!');
                    $(modal).modal('hide');
                });
            };
            $(modal).modal();
        });
}