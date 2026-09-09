/**
 * Crypto Hub & Admin Panel Logic - Final Clean & Fast Cloud Sync
 */

const BIN_ID = "6aa0e87fac6210685ab66184";        
const API_KEY = "$2a$10$pfdj3F.5SwxTIbB2AuilwOoQcYEVyhzkiED4s1dWQpaZlbawjcyg";    

const allMarketPairs = [
    { symbol: 'BTCUSDT', price: 78648.01, change: -0.34 },
    { symbol: 'ETHUSDT', price: 2488.91, change: +0.10 },
    { symbol: 'SOLUSDT', price: 184.50, change: +2.45 },
    { symbol: 'XRPUSDT', price: 2.14, change: +1.20 },
    { symbol: 'BNBUSDT', price: 749.56, change: +0.88 },
    { symbol: 'DOGEUSDT', price: 0.22, change: -1.15 },
    { symbol: 'PEPEUSDT', price: 0.000014, change: +5.40 },
    { symbol: 'ADAUSDT', price: 0.85, change: -0.45 },
    { symbol: 'TRXUSDT', price: 0.24, change: +0.15 }
];

function getOrCreateUserId() {
    let userId = localStorage.getItem("crypto_hub_unique_uid");
    if (!userId) {
        userId = "UID-" + Math.floor(10000000 + Math.random() * 90000000);
        localStorage.setItem("crypto_hub_unique_uid", userId);
    }
    return userId;
}

document.addEventListener("DOMContentLoaded", () => {
    getOrCreateUserId();
    renderMarketsList(allMarketPairs);
    setupMarketSearch();
    fetchCloudData();

    // Auto refresh data every 2 seconds for instant real-time sync
    setInterval(fetchCloudData, 2000);
});

// Fetch data from Cloud
async function fetchCloudData() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const result = await response.json();
        if (result && result.record) {
            updateUIWithState(result.record);
        }
    } catch (e) {
        console.error("Sync error", e);
    }
}

function updateUIWithState(data) {
    // 1. Update Deposit Info on User Screen
    const instructionsEl = document.getElementById("depositInstructions");
    if (instructionsEl) {
        instructionsEl.innerHTML = `
            <strong class="text-yellow-400 block mb-1">USDT (TRC20) Address:</strong>
            <span class="text-white break-all select-all">${data.config?.trc20 || 'Not set'}</span>
            <strong class="text-yellow-400 block mt-2 mb-1">EasyPaisa / JazzCash:</strong>
            <span class="text-white">${data.config?.details || 'Not set'}</span>
        `;
    }

    // 2. Reflect in Admin Inputs
    const addrInput = document.getElementById("depositAddressInput");
    const detailsInput = document.getElementById("depositDetailsInput");
    const feeInput = document.getElementById("feeInput");

    if (addrInput && document.activeElement !== addrInput && !addrInput.value) addrInput.value = data.config?.trc20 || '';
    if (detailsInput && document.activeElement !== detailsInput && !detailsInput.value) detailsInput.value = data.config?.details || '';
    if (feeInput && document.activeElement !== feeInput) feeInput.value = data.config?.fee || '0.1';

    // 3. Render Pending Lists in Admin Panel
    const depContainer = document.getElementById("pendingDeposits");
    const withContainer = document.getElementById("pendingWithdrawals");

    const deposits = data.deposits || [];
    const withdrawals = data.withdrawals || [];

    if (depContainer) {
        depContainer.innerHTML = deposits.length > 0 
            ? deposits.map((d, index) => `
                <div class="flex justify-between items-center py-2 border-b border-gray-800 text-[11px]">
                    <div>
                        <span class="text-white font-bold">${d.amount} USDT</span>
                        <span class="text-yellow-400 block text-[10px] font-mono">User ID: ${d.userId}</span>
                        <span class="text-gray-500 block text-[9px]">${d.time}</span>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="approveDeposit(${index})" class="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">Approve</button>
                        <button onclick="rejectDeposit(${index})" class="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">Reject</button>
                    </div>
                </div>`).join('')
            : `<span class="text-gray-500 text-[11px]">No pending deposits</span>`;
    }

    if (withContainer) {
        withContainer.innerHTML = withdrawals.length > 0 
            ? withdrawals.map((w, index) => `
                <div class="flex justify-between items-center py-2 border-b border-gray-800 text-[11px]">
                    <div>
                        <span class="text-white font-bold">${w.amount} USDT</span>
                        <span class="text-yellow-400 block text-[10px] font-mono">User ID: ${w.userId}</span>
                        <span class="text-gray-500 block text-[9px]">${w.time}</span>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="approveWithdrawal(${index})" class="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">Approve</button>
                        <button onclick="rejectWithdrawal(${index})" class="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-bold">Reject</button>
                    </div>
                </div>`).join('')
            : `<span class="text-gray-500 text-[11px]">No pending withdrawals</span>`;
    }
}

// Admin Actions
async function saveDepositInfo() {
    const trc20 = document.getElementById("depositAddressInput").value.trim();
    const details = document.getElementById("depositDetailsInput").value.trim();

    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        data.config.trc20 = trc20;
        data.config.details = details;

        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        alert("Deposit Info saved and synced globally!");
        fetchCloudData();
    } catch(e) { console.error(e); }
}

async function saveFee() {
    const feeVal = document.getElementById("feeInput").value;
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        data.config.fee = feeVal;

        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        alert("Trading fee saved permanently!");
        fetchCloudData();
    } catch(e) { console.error(e); }
}

// User Actions (Fixed & Fast)
async function submitDepositRequest() {
    const amount = document.getElementById("depositAmountInput").value;
    if (!amount || amount <= 0) { alert("Enter a valid deposit amount."); return; }

    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        if (!data.deposits) data.deposits = [];

        data.deposits.push({
            amount: amount,
            userId: getOrCreateUserId(),
            time: new Date().toLocaleTimeString()
        });

        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });

        alert("Deposit request sent to admin successfully!");
        closeDepositModal();
        document.getElementById("depositAmountInput").value = '';
        fetchCloudData();
    } catch (e) {
        alert("Error sending request. Try again.");
        console.error(e);
    }
}

async function submitWithdrawRequest() {
    const amount = document.getElementById("withdrawAddressInput").value;
    if (!amount) { alert("Enter withdrawal amount."); return; }

    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        if (!data.withdrawals) data.withdrawals = [];

        data.withdrawals.push({
            amount: amount,
            userId: getOrCreateUserId(),
            time: new Date().toLocaleTimeString()
        });

        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });

        alert("Withdrawal request sent to admin successfully!");
        closeWithdrawModal();
        document.getElementById("withdrawAddressInput").value = '';
        fetchCloudData();
    } catch (e) {
        alert("Error sending request. Try again.");
        console.error(e);
    }
}

async function approveDeposit(index) {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        data.deposits.splice(index, 1);
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        fetchCloudData();
        alert("Deposit approved!");
    } catch(e) { console.error(e); }
}

async function rejectDeposit(index) {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        data.deposits.splice(index, 1);
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        fetchCloudData();
        alert("Deposit rejected.");
    } catch(e) { console.error(e); }
}

async function approveWithdrawal(index) {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        data.withdrawals.splice(index, 1);
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        fetchCloudData();
        alert("Withdrawal approved!");
    } catch(e) { console.error(e); }
}

async function rejectWithdrawal(index) {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': API_KEY } });
        const json = await res.json();
        let data = json.record;

        data.withdrawals.splice(index, 1);
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        fetchCloudData();
        alert("Withdrawal rejected.");
    } catch(e) { console.error(e); }
}

// Markets & Trading
function renderMarketsList(pairs) {
    const container = document.getElementById("marketsListContainer");
    if (!container) return;
    container.innerHTML = pairs.map(coin => `
        <div onclick="selectTradingPair('${coin.symbol}', ${coin.price})" class="flex justify-between items-center p-2 bg-gray-950 rounded-lg border border-gray-800 cursor-pointer hover:border-yellow-500 transition">
            <div><span class="font-bold text-xs text-white">${coin.symbol}</span></div>
            <div class="text-right">
                <span class="text-xs text-white">${coin.price.toFixed(4)}</span>
                <span class="text-[10px] ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'} block">${coin.change >= 0 ? '+' : ''}${coin.change}%</span>
            </div>
        </div>
    `).join('');
}

function setupMarketSearch() {
    const searchInput = document.getElementById("marketSearch");
    if (!searchInput) return;
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allMarketPairs.filter(coin => coin.symbol.toLowerCase().includes(query));
        renderMarketsList(filtered);
    });
}

let currentSymbol = 'BTCUSDT';
let currentPrice = 78648.01;
function selectTradingPair(symbol, price) {
    currentSymbol = symbol;
    currentPrice = price;
    document.getElementById("activeTradingSymbol").innerText = symbol;
    document.getElementById("activeTradingPrice").innerText = `$${price.toFixed(4)}`;
}

function executeTrade(side) {
    const amount = document.getElementById("tradeAmountInput").value;
    if (!amount || amount <= 0) { alert("Enter amount."); return; }
    alert(`Trade (${side.toUpperCase()}) executed for User ID: ${getOrCreateUserId()}`);
}

// Modals
function openDepositModal() { document.getElementById("depositModal").style.display = 'flex'; }
function closeDepositModal() { document.getElementById("depositModal").style.display = 'none'; }
function openWithdrawModal() { document.getElementById("withdrawModal").style.display = 'flex'; }
function closeWithdrawModal() { document.getElementById("withdrawModal").style.display = 'none'; }
function openAdminSecurityModal() { document.getElementById("adminSecurityModal").style.display = 'flex'; }
function closeAdminSecurityModal() { document.getElementById("adminSecurityModal").style.display = 'none'; }

function verifyAdminPassword() {
    const pwd = document.getElementById("adminPasswordInput").value;
    if (pwd === "Mmooossaa35") {
        closeAdminSecurityModal();
        document.getElementById("adminPanel").style.display = 'block';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
        alert("Incorrect Password!");
    }
}
function closeAdminPanel() { document.getElementById("adminPanel").style.display = 'none'; }
async function withdrawAdminProfit() { alert("Profit withdrawal requested."); }
