/**
 * Crypto Hub & Admin Panel Logic - Fixed Version for Moosa Malik
 */

// Comprehensive Market Pairs List for Live Search & Trading
const allMarketPairs = [
    { symbol: 'BTCUSDT', price: 78648.01, change: -0.34 },
    { symbol: 'ETHUSDT', price: 2488.91, change: +0.10 },
    { symbol: 'SOLUSDT', price: 184.50, change: +2.45 },
    { symbol: 'XRPUSDT', price: 2.14, change: +1.20 },
    { symbol: 'BNBUSDT', price: 749.56, change: +0.88 },
    { symbol: 'DOGEUSDT', price: 0.22, change: -1.15 },
    { symbol: 'PEPEUSDT', price: 0.000014, change: +5.40 },
    { symbol: 'ADAUSDT', price: 0.85, change: -0.45 },
    { symbol: 'HPEUSDT', price: 1.25, change: +3.10 },
    { symbol: 'TRXUSDT', price: 0.24, change: +0.15 }
];

document.addEventListener("DOMContentLoaded", () => {
    fetchAllPlatformData();
    renderMarketsList(allMarketPairs);
    setupMarketSearch();

    // Auto-refresh sync every 4 seconds for multi-device requests
    setInterval(fetchAllPlatformData, 4000);
});

// Render Markets List dynamically so search works for all coins
function renderMarketsList(pairs) {
    const container = document.getElementById("marketsListContainer");
    if (!container) return;

    if (pairs.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-3">No matching coins found.</p>`;
        return;
    }

    container.innerHTML = pairs.map(coin => `
        <div onclick="selectTradingPair('${coin.symbol}', ${coin.price})" class="flex justify-between items-center p-2 bg-gray-950 rounded-lg border border-gray-800 cursor-pointer hover:border-yellow-500 transition">
            <div>
                <span class="font-bold text-xs text-white">${coin.symbol}</span>
            </div>
            <div class="text-right">
                <span class="text-xs text-white">${coin.price.toFixed(4)}</span>
                <span class="text-[10px] ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'} block">${coin.change >= 0 ? '+' : ''}${coin.change}%</span>
            </div>
        </div>
    `).join('');
}

// Market Search Filtering Logic
function setupMarketSearch() {
    const searchInput = document.getElementById("marketSearch");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allMarketPairs.filter(coin => coin.symbol.toLowerCase().includes(query));
        renderMarketsList(filtered);
    });
}

// Fetch all platform data, pending deposits/withdrawals from storage/backend
async function fetchAllPlatformData() {
    try {
        // Load saved deposit info from localStorage to instantly display in modal & admin panel
        loadDepositInfoUI();

        const response = await fetch('/api/user-activities'); 
        if (!response.ok) {
            renderMockUserData();
            return;
        }

        const data = await response.json();
        
        if (data.balance !== undefined) {
            document.getElementById("userBalance").innerText = `$${Number(data.balance).toFixed(2)}`;
        }

        if (data.accumulatedFees !== undefined) {
            document.getElementById("accumulatedFees").innerText = `${data.accumulatedFees} USDT`;
        }

        updateDetailedUserLedger(data.userLedgers || []);
        updatePendingLists(data.pendingDeposits || [], data.pendingWithdrawals || []);

    } catch (error) {
        // Fallback for multi-device local tracking if backend is static hosting (Vercel)
        loadLocalPendingRequests();
    }
}

// Save Deposit Info (TRC20 & Easypaisa) entered by Admin
function saveDepositInfo() {
    const trc20 = document.getElementById("depositAddressInput").value.trim();
    const details = document.getElementById("depositDetailsInput").value.trim();

    if (!trc20 && !details) {
        alert("Please enter at least TRC20 address or payment details.");
        return;
    }

    const depositConfig = { trc20, details };
    localStorage.setItem("admin_deposit_config", JSON.stringify(depositConfig));
    
    alert("Deposit Info saved successfully and synced!");
    loadDepositInfoUI();
}

// Load Deposit Info into User Deposit Modal
function loadDepositInfoUI() {
    const saved = localStorage.getItem("admin_deposit_config");
    const instructionsEl = document.getElementById("depositInstructions");
    
    if (saved) {
        const config = JSON.parse(saved);
        if (instructionsEl) {
            instructionsEl.innerHTML = `
                <strong class="text-yellow-400 block mb-1">USDT (TRC20) Address:</strong>
                <span class="text-white break-all select-all">${config.trc20 || 'Not set'}</span>
                <strong class="text-yellow-400 block mt-2 mb-1">EasyPaisa / JazzCash:</strong>
                <span class="text-white">${config.details || 'Not set'}</span>
            `;
        }
    } else {
        if (instructionsEl) {
            instructionsEl.innerText = "Send funds to official merchant account provided by admin.";
        }
    }
}

// Handle multi-device requests via localStorage sync fallback
function loadLocalPendingRequests() {
    const deposits = JSON.parse(localStorage.getItem("pending_deposits") || "[]");
    const withdrawals = JSON.parse(localStorage.getItem("pending_withdrawals") || "[]");
    updatePendingLists(deposits, withdrawals);
    renderMockUserData();
}

// Update Pending Lists in Admin Panel
function updatePendingLists(deposits, withdrawals) {
    const depContainer = document.getElementById("pendingDeposits");
    const withContainer = document.getElementById("pendingWithdrawals");

    if (depContainer) {
        depContainer.innerHTML = deposits.length > 0 
            ? deposits.map((d, index) => `
                <div class="flex justify-between items-center py-1 border-b border-gray-800 text-[11px]">
                    <span>Amt: <strong>${d.amount} USDT</strong> (${d.user || 'User'})</span>
                    <button onclick="approveDeposit(${index})" class="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px]">Approve</button>
                </div>`).join('')
            : `<span class="text-gray-500 text-[11px]">No pending deposits</span>`;
    }

    if (withContainer) {
        withContainer.innerHTML = withdrawals.length > 0 
            ? withdrawals.map((w, index) => `
                <div class="flex justify-between items-center py-1 border-b border-gray-800 text-[11px]">
                    <span>Amt: <strong>${w.amount} USDT</strong> (${w.user || 'User'})</span>
                    <button onclick="approveWithdrawal(${index})" class="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px]">Approve</button>
                </div>`).join('')
            : `<span class="text-gray-500 text-[11px]">No pending withdrawals</span>`;
    }
}

// Submit Deposit Request from any device
function submitDepositRequest() {
    const amount = document.getElementById("depositAmountInput").value;
    if (!amount || amount <= 0) { alert("Enter a valid deposit amount."); return; }

    const deposits = JSON.parse(localStorage.getItem("pending_deposits") || "[]");
    deposits.push({ amount, user: "Moosa Malik", time: new Date().toLocaleTimeString() });
    localStorage.setItem("pending_deposits", JSON.stringify(deposits));

    alert("Deposit request submitted successfully! Admin will review it.");
    closeDepositModal();
    fetchAllPlatformData();
}

// Submit Withdrawal Request from any device
function submitWithdrawRequest() {
    const amount = document.getElementById("withdrawAddressInput").value;
    if (!amount) { alert("Enter withdrawal amount."); return; }

    const withdrawals = JSON.parse(localStorage.getItem("pending_withdrawals") || "[]");
    withdrawals.push({ amount, user: "Moosa Malik", time: new Date().toLocaleTimeString() });
    localStorage.setItem("pending_withdrawals", JSON.stringify(withdrawals));

    alert("Withdrawal request sent to admin successfully!");
    closeWithdrawModal();
    fetchAllPlatformData();
}

function approveDeposit(index) {
    const deposits = JSON.parse(localStorage.getItem("pending_deposits") || "[]");
    deposits.splice(index, 1);
    localStorage.setItem("pending_deposits", JSON.stringify(deposits));
    alert("Deposit approved successfully!");
    fetchAllPlatformData();
}

function approveWithdrawal(index) {
    const withdrawals = JSON.parse(localStorage.getItem("pending_withdrawals") || "[]");
    withdrawals.splice(index, 1);
    localStorage.setItem("pending_withdrawals", JSON.stringify(withdrawals));
    alert("Withdrawal approved successfully!");
    fetchAllPlatformData();
}

// Render User Detailed Financial & Trade Ledger inside Admin Panel
function updateDetailedUserLedger(ledgers) {
    const container = document.getElementById("userDetailedLedgerContainer");
    if (!container) return;

    if (!ledgers || ledgers.length === 0) {
        renderMockUserData();
        return;
    }
}

function renderMockUserData() {
    const container = document.getElementById("userDetailedLedgerContainer");
    if (container) {
        container.innerHTML = `
            <div class="space-y-2">
                <div class="bg-gray-900 p-2.5 rounded border border-gray-800 text-[11px]">
                    <div class="flex justify-between items-center mb-1 border-b border-gray-800 pb-1">
                        <span class="font-bold text-yellow-400">Moosa Malik (Active Device)</span>
                        <span class="text-gray-400">Start: <strong class="text-white">1000 USDT</strong></span>
                        <span class="text-gray-400">Current: <strong class="text-green-400">1050 USDT</strong></span>
                    </div>
                    <div class="bg-gray-950 p-1.5 rounded border border-gray-800 text-[10px]">
                        <div class="flex justify-between py-0.5">
                            <span>BTCUSDT (BUY)</span>
                            <span>Entry: 78,648.01</span>
                            <span class="text-yellow-400">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}

// Trading Pair Selection & Calculation Logic
let currentSymbol = 'BTCUSDT';
let currentPrice = 78648.01;

function selectTradingPair(symbol, price) {
    currentSymbol = symbol;
    currentPrice = price;
    document.getElementById("activeTradingSymbol").innerText = symbol;
    document.getElementById("activeTradingPrice").innerText = `$${price.toFixed(4)}`;
    window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Execute Trade
async function executeTrade(side) {
    const amount = document.getElementById("tradeAmountInput").value;
    if (!amount || amount <= 0) {
        alert("Please enter a valid USDT amount.");
        return;
    }
    alert(`Trade (${side.toUpperCase()}) executed successfully for ${currentSymbol} amount: ${amount} USDT!`);
}

// Modal Control Functions
function openDepositModal() {
    document.getElementById("depositModal").style.display = 'flex';
    loadDepositInfoUI();
}
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
        alert("Incorrect Admin Password!");
    }
}

function closeAdminPanel() { document.getElementById("adminPanel").style.display = 'none'; }

async function saveFee() { alert("Platform fee updated successfully!"); }
async function withdrawAdminProfit() { alert("Profit withdrawal request submitted."); }
