const chooseUserRow = document.getElementById('chooseUserRow');
const itemsToBuy = document.getElementById('itemsToBuy');
const creditCardInput = document.getElementById('creditCardInput');
const userName = document.getElementById('userName');
const userBalance = document.getElementById('userBalance');
const tax = document.getElementById('taxSpan');
const itemsToBuyList = document.getElementById('itemsToBuyList');
const totalSum = document.getElementById('totalSum');
const nameSurnameInput = document.getElementById('nameSurnameInput');
const withdrawSpan = document.getElementById('withdraw');
const pincodeButtons = document.getElementById('pincodeButtons');
const pincodeBox = document.querySelector('.pincode-box');
const pincodeRow = document.getElementById('pincodeRow');
const pincodeCircle = document.querySelector('.circle-loader');
const pincodeCheckmark = document.querySelector('.checkmark');
const pincodeSound = new Audio('../pincode-succes.mp3');
const barImgUrl = server + 'resources/img/bar/';
const showUserData = user => user.name + ' ' + user.surname;
const cancel = () => {
    $(chooseUserRow).modal();
    setTimeout(() => creditCardInput.focus(), 500);
};
let creditCards, barItemsStorage, selectedUser, chooseUserHideAble = false;

$(() => {
    $(chooseUserRow).on('hide.bs.modal', e => chooseUserHideAble);
    $(chooseUserRow).modal();

    $.ajax(serverUrl + 'api/creditcard')
        .done(response => {
            creditCards = response;
            renderBuyItems();
        });

    creditCardInput.addEventListener('input', e => {
        let creditCard = creditCardInput.value;
        if (creditCard.length !== 12) {
            return;
        }

        $.ajax(serverUrl + 'bar/' + creditCard)
            .done(response => loadUser(response));
    });

    $(nameSurnameInput).typeahead({
        source: (input, callback) => {
            if (input.match(/^[0-9]+$/)) {
                callback([]);
                return;
            }

            $.ajax(serverUrl + 'users/find?user=' + input)
                .done(response => callback(response));
        },
        displayText: user => {
            return {
                name: showUserData(user),
                card: user.creditCard
            }
        },
        matcher: user => user.creditCard !== undefined,
        highlighter: user => {
            let query = nameSurnameInput.value;
            let name = user.name.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>'
            });
            return `
                <li class="pl-2 pr-2">
                    <a role="option">${name}</a>
                    <span class="text-muted">${user.card}</span>
                </li>
            `;
        },
        afterSelect: user => {
            nameSurnameInput.value = showUserData(user);
            loadUser(user);
        },
        sorter: users => users,
        minLength: 2
    });

    itemsToBuy.addEventListener('click', e => {
        let target = e.target.closest('.card');
        if (target === null) {
            return;
        }

        let discount = target.dataset.discount;
        let price = target.dataset.price;
        if (discount !== undefined) {
            let percent = price * discount / 100;
            price -= percent;
            price = price <= 10 ? Math.round(price) : Math.round(price * 100.0) / 100.0;
        }

        let discountDiv = discount === undefined ? '' : `<span class="badge badge-success badge-pill">-${discount}%</span>`;

        itemsToBuyList.insertAdjacentHTML('beforeend', `
            <li class="list-group-item d-flex justify-content-between align-items-center" data-id="${target.dataset.id}" data-price="${price}">
                ${target.dataset.name}
                <span class="badge badge-primary badge-pill">${price}</span>
                ${discountDiv}
            </li>
        `);
        updatePrice();
    });

    itemsToBuyList.addEventListener('click', e => {
        let target = e.target.closest('li');
        itemsToBuyList.removeChild(target);
        updatePrice();
    });

    pincodeButtons.addEventListener('click', e => {
        e.preventDefault();
        if (e.target.nodeName !== 'INPUT') {
            return;
        }

        let value = e.target.value;
        addNumber(value);
    });

    pincodeBox.addEventListener('keydown', e => {
        let input = e.key;
        if (!'1234567890'.includes(input) && input !== 'Backspace') {
            e.preventDefault();
            return;
        }

        let value = e.target.value + input;
        if (value.length === 4) {
            buy(value);
        }
    });
});

function renderBuyItems() {
    $.ajax(serverUrl + 'bar/items?shown=true')
        .done(response => {
            barItemsStorage = response;
            itemsToBuy.innerHTML = '';
            response.forEach(item => {
                let img = '';
                if (item.image !== undefined && item.image !== '') {
                    img = `<img src="${barImgUrl + item.image}" class="card-img-top" alt="${item.name}">`;
                }
                itemsToBuy.insertAdjacentHTML('beforeend', `
                    <div class="col-sm-2">
                        <div class="card" style="width: 9rem;" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                            ${img}
                            <div class="card-body">
                                <h5 class="card-title text-center">
                                    ${item.name}
                                    <span class="badge badge-primary badge-pill">${item.price}</span>
                                    <span class="badge badge-secondary badge-pill">${item.count}</span>
                                </h5>
                                <div class="discount_div_${item.id} text-center">
                                    <hr>
                                    <small class="text-muted"></small>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
}

function buy(pinCode) {
    let data = getBuyData();

    pincodeBox.hidden = true;
    pincodeCircle.hidden = false;

    $.ajax({
        url: serverUrl + `bar/?userId=${selectedUser.id}&pinCode=${pinCode}`,
        method: 'POST',
        data: JSON.stringify(data.items),
        contentType: "application/json; charset=utf-8",
        error: data => {
            $(pincodeCircle).removeClass('load-complete').toggleClass('load-error');
            $(pincodeCheckmark).removeClass('draw').addClass('error').toggle();
            setTimeout(() => {
                pincodeBox.value = '';
                pincodeBox.hidden = false;
                pincodeCircle.hidden = true;
                setDefaultPinLoader();
                pincodeBox.focus();
            }, 1000);
        }
    }).done(response => {
        renderBuyItems();
        $(pincodeCircle).removeClass('load-error').toggleClass('load-complete');
        $(pincodeCheckmark).removeClass('error').addClass('draw').toggle();
        pincodeSound.play();
        successNoty("Товарвы были успешны куплены!");
        setTimeout(() => {
            $(pincodeRow).modal('hide');
            pincodeBox.value = '';
            $(chooseUserRow).modal();
            setTimeout(() => creditCardInput.focus(), 500);
            pincodeBox.hidden = false;
            pincodeCircle.hidden = true;
            setDefaultPinLoader();
        }, 1000);
        selectedUser = null;
    });
}

function loadUser(user) {
    selectedUser = user;
    userName.textContent = user.name + ' ' + user.surname;
    userBalance.textContent = user.balance + ' грандиков';
    let userTax = getCreditCardTax(user.cardType);
    tax.textContent = `Налог: ${userTax}%`;
    tax.dataset.tax = userTax;

    chooseUserHideAble = true;
    $(chooseUserRow).modal('hide');
    chooseUserHideAble = false;

    totalSum.textContent = 'Всего: 0';
    itemsToBuyList.innerHTML = '';
    creditCardInput.value = '';
    nameSurnameInput.value = '';
    withdrawSpan.textContent = 'К снятию: 0';
    showDiscount(user.cardType);
}

function getCreditCardTax(cardType) {
    for (let card in creditCards) {
        if (creditCards[card].codeName === cardType) {
            return creditCards[card].tax.purchase;
        }
    }
    return 0;
}

function showDiscount(cardType) {
    for (let itemIndex in barItemsStorage) {
        let item = barItemsStorage[itemIndex];
        let sale = getSaleByCardType(item.sales, cardType);

        let div = document.querySelector(`.discount_div_${item.id}`);
        div.hidden = sale === null;
        div.querySelector('small').textContent = sale === null ? '' : `Скидка ${sale.percent}%`;

        if (sale !== null) {
            div.closest('.card').dataset.discount = sale.percent;
        }
    }
}

function getSaleByCardType(sales, cardType) {
    for (let item in sales) {
        if (sales[item].cardType === cardType) {
            return sales[item];
        }
    }
    return null;
}

function updatePrice() {
    let buyData = getBuyData();
    let totalPrice = buyData.totalPrice;
    let userTax = +tax.dataset.tax;

    totalSum.textContent = 'Всего: ' + totalPrice;
    withdrawSpan.textContent = `К снятию: ${totalPrice + (totalPrice * userTax / 100)}`;
    userBalance.style.color = selectedUser.balance - totalPrice < 0 ? 'red' : 'black';
}

function getBuyData() {
    let totalPrice = 0;
    let items = [];
    itemsToBuyList.childNodes.forEach(el => {
        if (el.nodeName !== 'LI') {
            return;
        }

        totalPrice += +el.dataset.price;
        items.push(+el.dataset.id);
    });
    return { totalPrice, items };
}

function pinCodeBackspace() {
    let value = pincodeBox.value;
    pincodeBox.value = value.substring(0, value.length - 1);
}

function addNumber(num) {
    pincodeBox.value = pincodeBox.value + num;
    checkForPincodeDone();
}

function checkForPincodeDone() {
    if (pincodeBox.value.length === 4) {
        buy(pincodeBox.value);
    }
}

function showPincode() {
    $(pincodeRow).modal();
    setTimeout(() => pincodeBox.focus(), 500);
}

function setDefaultPinLoader() {
    $(pincodeCircle).removeClass('load-error').removeClass('load-complete');
    $(pincodeCheckmark).removeClass('error').addClass('draw').toggle();
}