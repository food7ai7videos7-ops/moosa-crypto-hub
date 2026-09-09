/**
 * Crypto Hub & Admin Panel Logic - Clean & Working Version
 */

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

const STORAGE_KEY = "crypto_hub_master_storage_v5";

// Generate Unique 8-Digit User ID
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
    loadPlatformData();

    // Listen for data updates across tabs/devices instantly
    window.addEventListener("storage", () => {
        loadPlatformData();
    });
    
    // Periodic refresh check
    setInterval(loadPlatformData, 2000);
});

function getPlatformData() {
    const defaultData = {
        config: { 
            trc20: "THzhJZx7ZGn3MKb8zBnzk5aNAH63wvZGzA", 
            details: "Easypaisa Number: 03155461841 (Misbah)", 
            fee: "0.1" 
        },
        deposits: [],
        withdrawals: []
    };
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : defaultData;
    } catch (e) {
        return defaultData;
    }
}

function savePlatformData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPlatformData() {
    const data = getPlatformData();

    // 1. Update Deposit Info on User Screen
    const instructionsEl = document.getElementById("depositInstructions");
    if (instructionsEl) {
        instructionsEl.innerHTML = `
            <strong class="text-yellow-400 block mb-1">USDT (TRC20) Address:</strong>
            <span class="text-white break-all select-all">${data.config.trc20 || 'Not set'}</span>
            <strong class="text-yellow-400 block mt-2 mb-1">EasyPaisa / JazzCash:</strong>
            <span class="text-white">${data.config.details || 'Not set'}</span>
        `;
    }

    // 2. Reflect in Admin Inputs (Only if not actively typing)
    const addrInput = document.getElementById("depositAddressInput");
    const detailsInput = document.getElementById("depositDetailsInput");
    const feeInput = document.getElementById("feeInput");

    if (addrInput && document.activeElement !== addrInput && !addrInput.value) addrInput.value = data.config.trc20 || '';
    if (detailsInput && document.activeElement !== detailsInput && !detailsInput.value) detailsInput.value = data.config.details || '';
    if (feeInput && document.activeElement !== feeInput) feeInput.value = data.config.fee || '0.1';

    // 3. Render Pending Deposits & Withdrawals strictly in Admin Panel
    const depContainer = document.getElementById("pendingDeposits");
    const withContainer = document.getElementById("pendingWithdrawals");

    if (depContainer) {
        depContainer.innerHTML = data.deposits && data.deposits.length > 0 
            ? data.deposits.map((d, index) => `
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
        withContainer.innerHTML = data.withdrawals && data.withdrawals.length > 0 
            ? data.withdrawals.map((w, index) => `
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

// Admin Action Functions
function saveDepositInfo() {
    const trc20 = document.getElementById("depositAddressInput").value.trim();
    const details = document.getElementById("depositDetailsInput").value.trim();

    const data = getPlatformData();
    data.config.trc20 = trc20;
    data.config.details = details;
    savePlatformData(data);
    alert("Deposit Info saved successfully!");
    loadPlatformData();
}

function saveFee() {
    const feeVal = document.getElementById("feeInput").value;
    const data = getPlatformData();
    data.config.fee = feeVal;
    savePlatformData(data);
    alert("Trading fee saved permanently!");
    loadPlatformData();
}

// User Action Functions
function submitDepositRequest() {
    const amount = document.getElementById("depositAmountInput").value;
    if (!amount || amount <= 0) { alert("Enter a valid deposit amount."); return; }

    const data = getPlatformData();
    data.deposits.push({
        amount: amount,
        userId: getOrCreateUserId(),
        time: new Date().toLocaleTimeString()
    });
    savePlatformData(data);

    alert("Deposit request submitted successfully!");
    closeDepositModal();
    loadPlatformData();
}

function submitWithdrawRequest() {
    const amount = document.getElementById("withdrawAddressInput").value;
    if (!amount) { alert("Enter withdrawal amount."); return; }

    const data = getPlatformData();
    data.withdrawals.push({
        amount: amount,
        userId: getOrCreateUserId(),
        time: new Date().toLocaleTimeString()
    });
    savePlatformData(data);

    alert("Withdrawal request sent to admin successfully!");
    closeWithdrawModal();
    loadPlatformData();
}

function approveDeposit(index) {
    const data = getPlatformData();
    data.deposits.splice(index, 1);
    savePlatformData(data);
    loadPlatformData();
    alert("Deposit approved!");
}

function rejectDeposit(index) {
    const data = getPlatformData();
    data.deposits.splice(index, 1);
    savePlatformData(data);
    loadPlatformData();
    alert("Deposit rejected.");
}

function approveWithdrawal(index) {
    const data = getPlatformData();
    data.withdrawals.splice(index, 1);
    savePlatformData(data);
    loadPlatformData();
    alert("Withdrawal approved!");
}

function rejectWithdrawal(index) {
    const data = getPlatformData();
    data.withdrawals.splice(index, 1);
    savePlatformData(data);
    loadPlatformData();
    alert("Withdrawal rejected.");
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
        loadPlatformData();
    } else {
        alert("Incorrect Password!");
    }
}
function closeAdminPanel() { document.getElementById("adminPanel").style.display = 'none'; }
async function withdrawAdminProfit() { alert("Profit withdrawal requested."); }
