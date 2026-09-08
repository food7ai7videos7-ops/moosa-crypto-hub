let usdtBalance = parseFloat(localStorage.getItem('usdt_balance')) || 1000.00;
let adminFeeBalance = parseFloat(localStorage.getItem('admin_fee')) || 0.00;
let activePair = "BTCUSDT";
let currentPrice = 65000.00;
let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
let pendingDeposits = JSON.parse(localStorage.getItem('pending_deposits')) || [];
let pendingWithdrawals = JSON.parse(localStorage.getItem('pending_withdrawals')) || [];
let marketDataList = [];

const BITGET_API_URL = "https://publicApi.bitget.com/api/v2/spot/market/tickers";

async function fetchBitgetMarkets() {
    try {
        const response = await fetch(BITGET_API_URL);
        const result = await response.json();
        
        if (result && result.data && result.data.length > 0) {
            marketDataList = result.data.map(item => ({
                symbol: item.symbol,
                price: parseFloat(item.lastPr || item.close || 0),
                change: (parseFloat(item.priceChangePercent || 0) >= 0 ? "+" : "") + parseFloat(item.priceChangePercent || 0).toFixed(2) + "%"
            })).filter(item => item.symbol.endsWith("USDT"));

            renderMarkets(document.getElementById('market-search').value);
            
            const current = marketDataList.find(m => m.symbol === activePair);
            if (current && current.price > 0) {
                currentPrice = current.price;
                document.getElementById('selected-price').innerText = currentPrice.toFixed(2);
                calculateTrade();
            }
        }
    } catch (error) {
        console.error("Error fetching Bitget API data:", error);
    }
}

function initApp() {
    updateUI();
    fetchBitgetMarkets();
    renderActiveTrades();
    setInterval(fetchBitgetMarkets, 4000);
}

function updateUI() {
    document.getElementById('usdt-balance').innerText = usdtBalance.toFixed(2);
    localStorage.setItem('usdt_balance', usdtBalance);
    localStorage.setItem('admin_fee', adminFeeBalance);
}

function renderMarkets(filter = "") {
    const container = document.getElementById('market-list-container');
    if (marketDataList.length === 0) {
        container.innerHTML = `<p class="no-trades">Loading Bitget live markets...</p>`;
        return;
    }
    
    container.innerHTML = "";
    marketDataList.forEach(item => {
        if(item.symbol.toLowerCase().includes(filter.toLowerCase())) {
            const isSelected = item.symbol === activePair ? "active" : "";
            const changeColor = item.change.includes("+") ? "text-green" : "color: #f6465d;";
            container.innerHTML += `
                <div class="market-item ${isSelected}" onclick="selectPair('${item.symbol}', ${item.price})">
                    <strong>${item.symbol}</strong>
                    <span>$${item.price.toFixed(2)}</span>
                    <span class="${changeColor}">${item.change}</span>
                </div>
            `;
        }
    });
}

function filterMarkets() {
    const val = document.getElementById('market-search').value;
    renderMarkets(val);
}

function selectPair(symbol, price) {
    activePair = symbol;
    currentPrice = price;
    document.getElementById('selected-pair-title').innerText = `Trading: ${symbol}`;
    document.getElementById('selected-price').innerText = price.toFixed(2);
    renderMarkets(document.getElementById('market-search').value);
    calculateTrade();
}

function calculateTrade() {
    const amount = parseFloat(document.getElementById('trade-amount').value) || 0;
    if(currentPrice > 0) {
        const qty = amount / currentPrice;
        document.getElementById('est-qty').innerText = qty.toFixed(6);
    }
}

async function executeTrade(type) {
    const amount = parseFloat(document.getElementById('trade-amount').value) || 0;
    if(amount <= 0 || amount > usdtBalance) {
        alert('Insufficient USDT Balance or Invalid Amount!');
        return;
    }

    const qty = amount / currentPrice;

    try {
        const response = await fetch('/api/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                symbol: activePair,
                side: type,
                orderType: 'market',
                size: qty.toFixed(4)
            })
        });

        const result = await response.json();

        if (response.ok) {
            usdtBalance -= amount;
            const fee = amount * 0.001;
            adminFeeBalance += fee;
            const netAmount = amount - fee;

            const trade = {
                id: Date.now(),
                symbol: activePair,
                type: type,
                entryPrice: currentPrice,
                qty: qty,
                amount: netAmount
            };

            activeTrades.push(trade);
            localStorage.setItem('active_trades', JSON.stringify(activeTrades));
            updateUI();
            renderActiveTrades();
            
            alert(`SUCCESS! ${type} Order Executed on Real Bitget Account for ${activePair}!`);
        } else {
            console.error("Bitget API Error:", result);
            alert(`Exchange Error: ${result.error?.msg || JSON.stringify(result.error) || 'Failed to execute'}`);
        }
    } catch (error) {
        console.error("Network Error:", error);
        alert('Network connection error while executing trade on exchange.');
    }
}

function renderActiveTrades() {
    const container = document.getElementById('active-trades-container');
    if(activeTrades.length === 0) {
        container.innerHTML = `<p class="no-trades">No active positions</p>`;
        return;
    }
    container.innerHTML = "";
    activeTrades.forEach((t, index) => {
        container.innerHTML += `
            <div style="background:#181a20; padding:8px; border-radius:6px; margin-bottom:6px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${t.symbol}</strong> (${t.type})<br>
                    Entry: $${t.entryPrice.toFixed(2)} | Qty: ${t.qty.toFixed(4)}
                </div>
                <button class="close-all-btn" onclick="closeTrade(${index})">Close</button>
            </div>
        `;
    });
}

function closeTrade(index) {
    const t = activeTrades[index];
    const currentMarketPrice = marketDataList.find(m => m.symbol === t.symbol)?.price || t.entryPrice;
    const diff = currentMarketPrice - t.entryPrice;
    const pnl = t.type === 'BUY' ? diff * t.qty : -diff * t.qty;
    
    usdtBalance += (t.amount + pnl);
    activeTrades.splice(index, 1);
    localStorage.setItem('active_trades', JSON.stringify(activeTrades));
    updateUI();
    renderActiveTrades();
}

function closeAllTrades() {
    activeTrades.forEach(t => {
        const currentMarketPrice = marketDataList.find(m => m.symbol === t.symbol)?.price || t.entryPrice;
        const diff = currentMarketPrice - t.entryPrice;
        const pnl = t.type === 'BUY' ? diff * t.qty : -diff * t.qty;
        usdtBalance += (t.amount + pnl);
    });
    activeTrades = [];
    localStorage.setItem('active_trades', JSON.stringify(activeTrades));
    updateUI();
    renderActiveTrades();
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function submitDeposit() {
    const amt = parseFloat(document.getElementById('deposit-input').value);
    if(!amt || amt <= 0) { alert('Enter valid amount'); return; }
    pendingDeposits.push({ id: Date.now(), amount: amt });
    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
    alert('Deposit request submitted! Waiting for Admin approval.');
    closeModal('deposit-modal');
}

function submitWithdrawal() {
    const amt = parseFloat(document.getElementById('withdraw-amount-input').value);
    if(!amt || amt <= 0 || amt > usdtBalance) { alert('Invalid withdrawal amount'); return; }
    usdtBalance -= amt;
    pendingWithdrawals.push({ id: Date.now(), amount: amt });
    localStorage.setItem('pending_withdrawals', JSON.stringify(pendingWithdrawals));
    updateUI();
    alert('Withdrawal request submitted!');
    closeModal('withdraw-modal');
}

function openAdminLogin() {
    const pwd = prompt("Enter Admin Password:");
    if(pwd === "Mmooossaa35#") {
        openModal('admin-modal');
        loadAdminData();
    } else if(pwd !== null) {
        alert('Incorrect Admin Password!');
    }
}

function loadAdminData() {
    document.getElementById('admin-fee-balance').innerText = `${adminFeeBalance.toFixed(2)} USDT`;
    
    const depContainer = document.getElementById('admin-deposits-list');
    depContainer.innerHTML = pendingDeposits.length === 0 ? "<p style='color:#848e9c; font-size:0.75rem; text-align:center;'>No pending deposits</p>" : "";
    pendingDeposits.forEach((d, idx) => {
        depContainer.innerHTML += `
            <div class="admin-req-item">
                <span>+${d.amount} USDT</span>
                <button class="approve-btn" onclick="approveDeposit(${idx})">Approve</button>
            </div>
        `;
    });

    const wContainer = document.getElementById('admin-withdrawals-list');
    wContainer.innerHTML = pendingWithdrawals.length === 0 ? "<p style='color:#848e9c; font-size:0.75rem; text-align:center;'>No pending withdrawals</p>" : "";
    pendingWithdrawals.forEach((w, idx) => {
        wContainer.innerHTML += `
            <div class="admin-req-item">
                <span>-${w.amount} USDT</span>
                <button class="approve-btn" onclick="approveWithdrawal(${idx})">Approve</button>
            </div>
        `;
    });
}

function approveDeposit(idx) {
    const d = pendingDeposits[idx];
    usdtBalance += d.amount;
    pendingDeposits.splice(idx, 1);
    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
    updateUI();
    loadAdminData();
}

function approveWithdrawal(idx) {
    pendingWithdrawals.splice(idx, 1);
    localStorage.setItem('pending_withdrawals', JSON.stringify(pendingWithdrawals));
    loadAdminData();
}

window.onload = initApp;
