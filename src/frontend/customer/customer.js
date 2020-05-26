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
const userSales = document.getElementById('userSales');
const userSalesList = document.getElementById('userSalesList');
const salesSwiper = document.getElementById('salesSwiper');
const salesSwiperPagination = salesSwiper.querySelector('.swiper-pagination');
const swiperEl = document.getElementById('swiper');
const swiperPagination = swiperEl.querySelector('.swiper-pagination');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalBody2 = document.getElementById('modalBody2');
const pincodeRow = document.getElementById('pincodeRow');
const pinPasswordInput = document.querySelector('#pinPasswordInput input');
const pincodeCircle = document.querySelector('#pinPasswordInput div');
const pinCodeCheckmark = pincodeCircle.querySelector('.checkmark');
const cardElement = document.getElementById('creditCard');
const waitingClientModal = `
    <div class="text-center"  style="padding-bottom: 40px; padding-top: 40px;">
        <h3>Ожидание клиента</h3>
    </div>
`;
let modalShown = false, swiper = null, userSalesSwiper = null, currentModalBody = null, itemsStorage = null, creditCardStyles = [];

$(() => {
    $(modal).on('show.bs.modal', () => {
        modalShown = true;
        moveModalBackground(modal);
    });
    $(pincodeRow).on('show.bs.modal', () => moveModalBackground(pincodeRow));
    $(modal).on('hidden.bs.modal', () => modalShown = false);
    renderModal(waitingClientModal);

    let eventListener = getCustomerEventListener();

    document.getElementById('cardLogo').src = server + 'resources/img/grand.png';

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

    userSalesSwiper = new Swiper(salesSwiper, {
        spaceBetween: 30,
        centeredSlides: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: salesSwiperPagination
        }
    });

    eventListener.on('client', client => {
        $(modal).modal('hide');
        userBalance.textContent = client.balance;
        userBalance.dataset.balance = client.balance;
        userName.textContent = showUserData(client);
        userCardType.textContent = client.cardName;
        userCardNumber.textContent = getSeparatedCardNumber(client.creditCard);
        taxSpan.textContent = `Налог: ${client.tax}%`;
        taxSpan.dataset.tax = client.tax;
        totalSum.textContent = 'Всего: 0 грандиков';
        withdraw.textContent = 'К снятию: 0 грандиков';
        cardElement.hidden = false;

        loadCreditCard(client.cardType);

        let sales = itemsStorage.reduce((acc, item) => {
            let sales = item.sales.filter(item => item.cardType === client.cardType);
            if (sales.length > 0) {
                let sale = sales[0];
                sale.barItem = item;
                acc.push(sale);
            }
            return acc;
        }, []);
        if (sales.length !== 0) {
            userSales.hidden = false;
            userSalesSwiper.autoplay.stop();
            userSalesList.innerHTML = '';

            let currentElement;
            for (let i = 0; i < sales.length; i++) {
                if (i % 5 === 0) {
                    userSalesList.insertAdjacentHTML('beforeend', '<div class="swiper-slide row" style="justify-content: center;"></div>');
                    currentElement = userSalesList.querySelector('.swiper-slide:last-child');
                }

                let item = sales[i];
                let price = item.barItem.price - (item.barItem.price * item.percent / 100);
                currentElement.insertAdjacentHTML('beforeend', `
                    <div class="card mr-1" style="width: 9rem;">
                        <div class="card-body text-center">
                            <h5 class="card-title">${item.barItem.name}</h5>
                            <div>
                                <small style="text-decoration: line-through;">${item.barItem.price} грандиков</small><br>
                                <span>${price} грандиков</span><br>
                                <small>Скидка: ${item.percent}%</small>
                            </div>
                        </div>
                    </div>
                `);
            }

            userSalesSwiper.update();
            userSalesSwiper.autoplay.start();
        } else {
            userSales.hidden = true;
        }
    });

    eventListener.on('cancelClient', () => {
        renderModal(waitingClientModal);
        itemsToBuyList.innerHTML = '';
        totalSum.textContent = '';
        taxSpan.textContent = '';
        withdraw.textContent = '';
        userSales.hidden = true;
        cardElement.hidden = true;
    });

    eventListener.on('itemsUpdate', ({ itemsHtml, totalPrice }) => {
        itemsToBuyList.innerHTML = itemsHtml;
        let tax = +taxSpan.dataset.tax;
        let taxSum = totalPrice * tax / 100;
        totalSum.textContent = `Всего: ${totalPrice} грандиков`;
        withdraw.textContent = `К снятию: ${totalPrice + taxSum} грандиков`;
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
            confetti.start();
            setTimeout(() => {
                $(pincodeRow).modal('hide');
                pinPasswordInput.value = '';
                pinPasswordInput.hidden = false;
                pincodeCircle.hidden = true;
                $(pincodeCircle).removeClass('load-error').removeClass('load-complete');
                $(pinCodeCheckmark).removeClass('error').addClass('draw').toggle();
                confetti.stop();
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
    eventListener.on('creditCardsSettings', settings => {
        settings.forEach(card => {
            fetch(server + card.style.substring(1))
                .then(response => response.json())
                .then(styles => {
                    creditCardStyles[card.codeName] = styles;
                    loadCardFont(styles);
                });
        });
    });

    eventListener.on('items', items => {
        itemsStorage = items;
        swiper.autoplay.stop();
        barItemsList.innerHTML = '';
        let currentElement;

        for (let i = 0; i < items.length; i++) {
            if (i % 8 === 0) {
                barItemsList.insertAdjacentHTML('beforeend', '<div class="swiper-slide row" style="justify-content: center;"></div>');
                currentElement = barItemsList.querySelector('.swiper-slide:last-child');
            }

            let item = items[i];
            let img = item.hasImage ? `<img src="${server}resource/bar/items/${item.id}" class="card-img-top" alt="">` : '';
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
                if (modalShown) {
                    renderModal(waitingClientModal);
                }
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
    }
}

function moveModalBackground() {
    let offsetHeight = `-${footer.offsetHeight + 3}px`;
    setTimeout(() => {
        $('.modal-backdrop').css({ top: offsetHeight });
    }, 40);
}

function loadCreditCard(cardCodeName) {
    let cardStyles = creditCardStyles[cardCodeName];
    cardElement.querySelector('.card__front').style.backgroundImage = `url("${server + cardStyles.frontImage.substring(1)}")`;

    if (cardStyles.styles !== undefined && cardStyles.styles.css !== undefined) {
        let styles = cardStyles.styles.css;
        for (let className in styles) {
            let settings = cardElement.querySelector('.' + className);
            for (let settingName in styles[className]) {
                settings.style[settingName] = styles[className][settingName];
            }
        }
    }

    if (cardStyles.setFonts !== undefined) {
        for (let className in cardStyles.setFonts) {
            let fontSettings = cardStyles.setFonts[className];
            let font = `'${fontSettings.fontFamily}'`;
            if (fontSettings.fontType !== undefined) {
                font += ', ' + fontSettings.fontType;
            }
            cardElement.querySelector('.' + className).style.fontFamily = font;
        }
    }
}

function loadCardFont(cardStyles) {
    if (cardStyles.loadFonts !== undefined) {
        cardStyles.loadFonts.forEach(font => {
            if (font.css === undefined) {
                return;
            }

            let fontLoaded = document.querySelector(`link[href="${font.css}"]`) !== null;
            if (!fontLoaded) {
                const head = document.querySelector('head');
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = server + font.css.substring(1);
                head.appendChild(link);
            }
        });
    }
}

function getSeparatedCardNumber(number) {
    let result = '';
    for (let i = 0; i < number.length; i++) {
        result += i % 4 === 0 ? ' ' + number[i] : number[i];
    }
    return result.trim();
}