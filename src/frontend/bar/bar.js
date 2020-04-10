const userName = document.getElementById('userName');
const userBalance = document.getElementById('userBalance');
const chooseUserRow = document.getElementById('chooseUserRow');
const itemsToBuy = document.getElementById('itemsToBuy');
const itemsToBuyList = document.getElementById('itemsToBuyList');
const totalSpan = document.getElementById('totalSum');
const taxSpan = document.getElementById('taxSpan');
const withdrawSpan = document.getElementById('withdraw');
const pincodeButtons = document.getElementById('pincodeButtons');
const pincodeBox = document.querySelector('.pincode-box');
const pincodeRow = document.getElementById('pincodeRow');
const pincodeCircle = document.querySelector('.circle-loader');
const pincodeCheckmark = document.querySelector('.checkmark');
const pincodeSound = new Audio('../pincode-succes.mp3');
let barItemsStorage, buyPanel, creditCards, pincodeCallback = () => {};

$(() => {
    renderBarItems();

    buyPanel = new BuyPanel({
        chooseUserRow, itemsToBuy, itemsToBuyList, taxSpan, totalSpan, withdrawSpan, userName, userBalance,
        taxTypePlus: true,
        getUserData: cardNum => $.ajax(serverUrl + 'bar/' + cardNum),
        showDiscount: cardType => {
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
        },
        getUsersTax: cardType => {
            for (let card in creditCards) {
                if (creditCards[card].codeName === cardType) {
                    return creditCards[card].tax.purchase;
                }
            }
            return 0;
        },
        onBuy: data => {
            $(pincodeBox).on('shown.bs.modal', function focus() {
                $(pincodeBox).off('shown.bs.modal', focus);
                pincodeBox.focus();
            });
            $(pincodeRow).modal();
            pincodeCallback = pinCode => {
                pincodeBox.hidden = true;
                pincodeCircle.hidden = false;

                $.ajax({
                    url: serverUrl + `bar/?userId=${buyPanel.getUserID()}&pinCode=${pinCode}`,
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
                            $(pincodeCircle).removeClass('load-error').removeClass('load-complete');
                            $(pincodeCheckmark).removeClass('error').addClass('draw').toggle();
                            pincodeBox.focus();
                        }, 1000);
                    }
                }).done(response => {
                    renderBarItems();
                    pincodeSound.play();
                    $(pincodeCircle).removeClass('load-error').toggleClass('load-complete');
                    $(pincodeCheckmark).removeClass('error').addClass('draw').toggle();
                    successNoty("Товары были успешны куплены!");
                    setTimeout(() => {
                        $(pincodeRow).modal('hide');
                        pincodeBox.value = '';
                        buyPanel.cancel();
                        pincodeBox.hidden = false;
                        pincodeCircle.hidden = true;
                        $(pincodeCircle).removeClass('load-error').removeClass('load-complete');
                        $(pincodeCheckmark).removeClass('error').addClass('draw').toggle();
                    }, 1000);
                });
            }
        }
    });

    getReader().setOnCard(rfid => {
        if (buyPanel.isActive()) {
            return;
        }

        $.get(serverUrl + `bar/rfid/${rfid}`)
            .done(user => buyPanel.parseUser(user));
    });

    pincodeBox.addEventListener('keydown', e => {
        let input = e.key;
        if (!'1234567890'.includes(input) && input !== 'Backspace') {
            e.preventDefault();
            return;
        }

        let value = e.target.value + input;
        if (value.length === 4) {
            pincodeCallback(value);
        }
    });

    pincodeButtons.addEventListener('click', e => {
        e.preventDefault();
        if (e.target.nodeName !== 'INPUT') {
            return;
        }

        pincodeBox.value += e.target.value;
        if (pincodeBox.value.length === 4) {
            pincodeCallback(pincodeBox.value);
        }
    });
});

function renderBarItems() {
    $.get(serverUrl + 'bar/items?shown=true')
        .done(response => {
            barItemsStorage = response;
            itemsToBuy.innerHTML = '';
            response.forEach(item => {
                let img = item.hasImage ? `<img src="${serverUrl}bar/items/${item.id}/image" class="card-img-top" alt="${item.name}">` : '';
                itemsToBuy.insertAdjacentHTML('beforeend', `
                    <div class="col-sm-2">
                        <div class="card" style="width: 9rem;" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                            ${img}
                            <div class="card-body text-center">
                                <h5 class="card-title">
                                    ${item.name}
                                    <span class="badge badge-primary badge-pill item-select-count" data-count="0">0</span>
                                </h5>
                                <div>
                                    <span>${item.price} грандиков</span>
                                    <span>x${item.count}</span>
                                </div>
                                <div class="discount_div_${item.id}">
                                    <hr>
                                    <small class="text-muted"></small>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            })
        });
}

function getSaleByCardType(sales, cardType) {
    for (let item in sales) {
        if (sales[item].cardType === cardType) {
            return sales[item];
        }
    }
    return null;
}

function pinCodeBackspace() {
    let len = pincodeBox.value.length;
    pincodeBox.value = pincodeBox.value.substring(0, len - 1);
}