const userName = document.getElementById('userName');
const userBalance = document.getElementById('userBalance');
const itemsToBuyList = document.getElementById('itemsToBuyList');
const totalSum = document.getElementById('totalSum');
const taxSpan = document.getElementById('taxSpan');
const withdraw = document.getElementById('withdraw');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalHeader = document.getElementById('modalHeader');
const modalBody = document.getElementById('modalBody');
const pincodeRow = document.getElementById('pincodeRow');
const pinPasswordInput = document.querySelector('#pinPasswordInput input');
const pincodeCircle = document.querySelector('#pinPasswordInput div');
const pinCodeCheckmark = pincodeCircle.querySelector('.checkmark');
const waitingClientModal = {
    title: false,
    body: `
        <div class="text-center" style="padding-bottom: 40px; padding-top: 40px;">
            <h3>Ожидание клиента</h3>
        </div>
    `
};
let modalShown = false;

$(() => {
    $(modal).on('hidden.bs.modal', () => modalShown = false);
    renderModal(waitingClientModal);

    let eventListener = getCustomerEventListener();

    eventListener.on('client', client => {
        $(modal).modal('hide');
        userBalance.innerHTML = `Баланс: <span class="balance-span">${client.balance} грандик(ов)</span>`;
        userBalance.dataset.balance = client.balance;
        userName.textContent = showUserData(client);
        taxSpan.textContent = `Налог: ${client.tax}%`;
        taxSpan.dataset.tax = client.tax;
        totalSum.textContent = 'Всего: 0 грандиков';
        withdraw.textContent = 'К снятию: 0 грандиков';
    });

    eventListener.on('cancelClient', () => {
        renderModal(waitingClientModal);
        userBalance.innerHTML = '';
        userName.textContent = '';
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
});

function renderModal({ title, body }) {
    if (title === false) {
        modalHeader.hidden = true;
    } else {
        modalTitle.textContent = title;
        modalHeader.hidden = false;
    }
    modalBody.innerHTML = body;

    if (!modalShown) {
        $(modal).modal();
        modalShown = true;
    }
}