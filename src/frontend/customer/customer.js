const userName = document.getElementById('userName');
const userBalance = document.getElementById('userBalance');
const userCardType = document.getElementById('userCardType');
const userCardNumber = document.getElementById('userCardNumber');
const itemsToBuyList = document.getElementById('itemsToBuyList');
const totalSum = document.getElementById('totalSum');
const taxSpan = document.getElementById('taxSpan');
const withdraw = document.getElementById('withdraw');
const footer = document.getElementById('footer');
const barItemsList = document.getElementById('barItemsList');
const swiperEl = document.getElementById('swiper');
const swiperPagination = swiperEl.querySelector('.swiper-pagination');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalBody2 = document.getElementById('modalBody2');
const pincodeRow = document.getElementById('pincodeRow');
const pinPasswordInput = document.querySelector('#pinPasswordInput input');
const pincodeCircle = document.querySelector('#pinPasswordInput div');
const pinCodeCheckmark = pincodeCircle.querySelector('.checkmark');
const waitingClientModal = `
    <div class="text-center"  style="padding-bottom: 40px; padding-top: 40px;">
        <h3>Ожидание клиента</h3>
    </div>
`;
let modalShown = false, swiper = null, currentModalBody = null;

$(() => {
    $(modal).on('show.bs.modal', () => moveModalBackground(modal));
    $(pincodeRow).on('show.bs.modal', () => moveModalBackground(pincodeRow));
    $(modal).on('hidden.bs.modal', () => modalShown = false);
    renderModal(waitingClientModal);

    let eventListener = getCustomerEventListener();

    swiper = new Swiper(swiperEl, {
        spaceBetween: 30,
        centeredSlides: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: swiperPagination
        }
    });

    eventListener.on('client', client => {
        $(modal).modal('hide');
        modalShown = false;
        userBalance.innerHTML = `Баланс: <span class="balance-span">${client.balance} грандик(ов)</span>`;
        userBalance.dataset.balance = client.balance;
        userName.textContent = showUserData(client);
        userCardType.textContent = `Тип карты: ${client.cardName}`;
        userCardNumber.textContent = `Номер карты: ${client.creditCard}`;
        taxSpan.textContent = `Налог: ${client.tax}%`;
        taxSpan.dataset.tax = client.tax;
        totalSum.textContent = 'Всего: 0 грандиков';
        withdraw.textContent = 'К снятию: 0 грандиков';
    });

    eventListener.on('cancelClient', () => {
        renderModal(waitingClientModal);
        userBalance.innerHTML = '';
        userName.textContent = '';
        userCardNumber.textContent = '';
        userCardType.textContent = '';
        itemsToBuyList.innerHTML = '';
        totalSum.textContent = '';
        taxSpan.textContent = '';
        withdraw.textContent = '';
    });

    eventListener.on('itemsUpdate', ({ itemsHtml, totalPrice }) => {
        itemsToBuyList.innerHTML = itemsHtml;
        let tax = +taxSpan.dataset.tax;
        let taxSum = totalPrice * tax / 100;
        totalSum.textContent = `Всего: ${totalPrice} грандиков`;
        withdraw.textContent = `К снятию: ${totalPrice + taxSum} грандиков`;
        if (+userBalance.dataset.balance < totalPrice + taxSum) {
            userBalance.querySelector('.balance-span').style.color = 'red';
        } else {
            userBalance.querySelector('.balance-span').style.color = 'unset';
        }
    });

    eventListener.on('pinCode', status => {
        if (status === 'show') {
            pinPasswordInput.value = '';
            pinPasswordInput.hidden = false;
            pincodeCircle.hidden = true;
            $(pincodeRow).modal();
        } else if (status === 'hide') {
            $(pincodeRow).modal('hide');
        } else if (status === 'loading') {
            pinPasswordInput.hidden = true;
            pincodeCircle.hidden = false;
        } else if (status === 'success') {
            $(pincodeCircle).removeClass('load-error').toggleClass('load-complete');
            $(pinCodeCheckmark).removeClass('error').addClass('draw').toggle();
            successNoty("Товары были успешны куплены!");
            setTimeout(() => {
                $(pincodeRow).modal('hide');
                pinPasswordInput.value = '';
                pinPasswordInput.hidden = false;
                pincodeCircle.hidden = true;
                $(pincodeCircle).removeClass('load-error').removeClass('load-complete');
                $(pinCodeCheckmark).removeClass('error').addClass('draw').toggle();
            }, 1000);
        } else if (status === 'error') {
            $(pincodeCircle).removeClass('load-complete').toggleClass('load-error');
            $(pinCodeCheckmark).removeClass('draw').addClass('error').toggle();
            setTimeout(() => {
                pinPasswordInput.value = '';
                pinPasswordInput.hidden = false;
                pincodeCircle.hidden = true;
                $(pincodeCircle).removeClass('load-error').removeClass('load-complete');
                $(pinCodeCheckmark).removeClass('error').addClass('draw').toggle();
            }, 1000);
        }
    });

    eventListener.on('pinCodeInput', value => pinPasswordInput.value = value);

    eventListener.on('items', items => {
        swiper.autoplay.stop();
        barItemsList.innerHTML = '';
        let currentElement;

        for (let i = 0; i < items.length; i++) {
            if (i % 8 === 0) {
                barItemsList.insertAdjacentHTML('beforeend', '<div class="swiper-slide row" style="justify-content: center;"></div>');
                currentElement = barItemsList.querySelector('.swiper-slide:last-child');
            }

            let item = items[i];
            let img = item.hasImage ? `<img src="${serverUrl}bar/items/${item.id}/image" class="card-img-top" alt="">` : '';
            currentElement.insertAdjacentHTML('beforeend', `
                <div class="col-sm-1 mb-2 bar-item">
                    <div class="card" style="width: 9rem;" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                        ${img}
                        <div class="card-body text-center">
                            <h5 class="card-title">
                                ${item.name}
                                <span class="badge badge-primary badge-pill item-select-count" data-count="0">0</span>
                            </h5>
                            <div>
                                <span>${item.price} грандиков</span>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            if (img !== '') {
                currentElement.querySelector('.bar-item:last-child img')
                    .addEventListener('load', e => moveModalBackground());
            }
        }

        swiper.update();
        swiper.autoplay.start();
        moveModalBackground();
    });

    let lastType, timeout;
    eventListener.on('userType', ({ type, value }) => {
        if (type === 'focusOut' && modalShown) {
            renderModal(waitingClientModal);
        } else if (lastType === type && (type === 'text' || type === 'card')) {
            if (currentModalBody !== null) {
                let input = currentModalBody.querySelector('input');
                if (input !== null) {
                    input.value = value
                }
            }

            updateTimeout();
        } else {
            renderModal(`
                <div class="center" style="flex-flow: row wrap; height: 100%;">
                    <span class="text-muted">Поиск по ${type === 'text' ? 'имени/фамиилии' : 'номеру карты'}</span>
                    <div class="center">
                        <input type="text" class="beautiful-input" style="width: 100%" value="${value}">
                    </div>
                </div>
            `);
            updateTimeout();
        }

        lastType = type;

        function updateTimeout() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                lastType = null;
                renderModal(waitingClientModal);
            }, 5000);
        }
    });
});

function renderModal(body) {
    let firstElement = modalBody.style.display === 'none' ? modalBody : modalBody2;
    let secondElement = modalBody.style.display === 'none' ? modalBody2 : modalBody;

    $(secondElement).fadeOut();

    firstElement.innerHTML = body;
    currentModalBody = firstElement;
    $(firstElement).fadeIn();

    if (!modalShown) {
        $(modal).modal();
        modalShown = true;
    }
}

function moveModalBackground() {
    let offsetHeight = `-${footer.offsetHeight + 3}px`;
    setTimeout(() => {
        $('.modal-backdrop').css({ top: offsetHeight });
    }, 40);
}