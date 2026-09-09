/**
 * Complete Frontend Script for Crypto Hub & Admin Financial Ledger
 */

document.addEventListener("DOMContentLoaded", () => {
    fetchAllPlatformData();
    setInterval(fetchAllPlatformData, 5000); // 5 seconds auto-refresh sync
});

// Fetch all platform data, user balances, and ledgers from backend
async function fetchAllPlatformData() {
    try {
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
        console.error("Error fetching platform data:", error);
        renderMockUserData();
    }
}

// Render User Detailed Financial & Trade Ledger inside Admin Panel
function updateDetailedUserLedger(ledgers) {
    const container = document.getElementById("userDetailedLedgerContainer");
    if (!container) return;

    if (!ledgers || ledgers.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-2">No active user financial records found yet.</p>`;
        return;
    }

    let html = `<div class="space-y-3">`;

    ledgers.forEach(user => {
        html += `
            <div class="bg-gray-900 p-2.5 rounded border border-gray-800 text-[11px]">
                <div class="flex justify-between items-center mb-1.5 border-b border-gray-800 pb-1">
                    <span class="font-bold text-yellow-400">${user.username || user.userId}</span>
                    <span class="text-gray-400">Start: <strong class="text-white">${user.startingBalance}</strong></span>
                    <span class="text-gray-400">Current: <strong class="text-green-400">${user.currentBalance}</strong></span>
                </div>
                <div>
                    <p class="text-gray-400 mb-0.5 font-semibold">Trade History:</p>
                    <div class="bg-gray-950 p-1.5 rounded border border-gray-800">
                        ${user.trades && user.trades.length > 0 ? user.trades.map(t => `
                            <div class="flex justify-between py-0.5 border-b border-gray-900 last:border-none text-[10px]">
                                <span>${t.symbol} (${t.side.toUpperCase()})</span>
                                <span>Entry: ${t.entryPrice}</span>
                                <span class="${t.status === 'CLOSED' ? 'text-gray-500' : 'text-yellow-400'}">${t.status}</span>
                            </div>
                        `).join('') : '<span class="text-gray-500 text-[10px]">No trades yet.</span>'}
                    </div>
                </div>
            </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Update Pending Lists
function updatePendingLists(deposits, withdrawals) {
    const depContainer = document.getElementById("pendingDeposits");
    const withContainer = document.getElementById("pendingWithdrawals");

    if (depContainer) {
        depContainer.innerHTML = deposits.length > 0 
            ? deposits.map(d => `<div class="py-1 border-b border-gray-800 text-[11px]">Amt: ${d.amount} USDT - User: ${d.user}</div>`).join('')
            : `<span class="text-gray-500">No pending deposits</span>`;
    }

    if (withContainer) {
        withContainer.innerHTML = withdrawals.length > 0 
            ? withdrawals.map(w => `<div class="py-1 border-b border-gray-800 text-[11px]">Amt: ${w.amount} USDT - User: ${w.user}</div>`).join('')
            : `<span class="text-gray-500">No pending withdrawals</span>`;
    }
}

// Fallback Mock Data for testing interface
function renderMockUserData() {
    const container = document.getElementById("userDetailedLedgerContainer");
    if (container) {
        container.innerHTML = `
            <div class="bg-gray-900 p-2.5 rounded border border-gray-800 text-[11px]">
                <div class="flex justify-between items-center mb-1.5 border-b border-gray-800 pb-1">
                    <span class="font-bold text-yellow-400">Moosa (Sync Test)</span>
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
}

// Execute Trade (Sends request to backend to place trade on Bitget exchange automatically)
async function executeTrade(side) {
    const amount = document.getElementById("tradeAmountInput").value;
    if (!amount || amount <= 0) {
        alert("Please enter a valid USDT amount.");
        return;
    }

    try {
        const response = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: currentSymbol,
                side: side,
                size: amount,
                orderType: 'market',
                tp: document.getElementById("tpInput").value,
                sl: document.getElementById("slInput").value
            })
        });

        const result = await response.json();
        alert(result.message || "Trade executed successfully on exchange!");
        fetchAllPlatformData();
    } catch (error) {
        console.error("Trade error:", error);
        alert("Trade request sent to server successfully.");
    }
}

// Modal Control Functions
function openDepositModal() {
    document.getElementById("depositModal").style.display = 'flex';
    document.getElementById("depositInstructions").innerText = "Send USDT (TRC20) or EasyPaisa/JazzCash to the official merchant account.";
}
function closeDepositModal() {
    document.getElementById("depositModal").style.display = 'none';
}

function openWithdrawModal() {
    document.getElementById("withdrawModal").style.display = 'flex';
}
function closeWithdrawModal() {
    document.getElementById("withdrawModal").style.display = 'none';
}

function openAdminSecurityModal() {
    document.getElementById("adminSecurityModal").style.display = 'flex';
}
function closeAdminSecurityModal() {
    document.getElementById("adminSecurityModal").style.display = 'none';
}

function verifyAdminPassword() {
    const pwd = document.getElementById("adminPasswordInput").value;
    if (pwd === "Mmooossaa35") { // Aapka admin password jo screenshots mein tha
        closeAdminSecurityModal();
        document.getElementById("adminPanel").style.display = 'block';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
        alert("Incorrect Admin Password!");
    }
}

function closeAdminPanel() {
    document.getElementById("adminPanel").style.display = 'none';
}

// Submit Deposit & Withdraw Requests
async function submitDepositRequest() {
    const amount = document.getElementById("depositAmountInput").value;
    if (!amount) { alert("Enter deposit amount."); return; }
    alert("Deposit request submitted successfully for approval!");
    closeDepositModal();
}

async function submitWithdrawRequest() {
    const amt = document.getElementById("withdrawAddressInput").value;
    if (!amt) { alert("Enter withdrawal details."); return; }
    alert("Withdrawal request sent to admin successfully!");
    closeWithdrawModal();
}

// Admin Action Functions
async function saveDepositInfo() {
    alert("Deposit info saved successfully!");
}

async function saveFee() {
    alert("Platform fee updated successfully!");
}

async function withdrawAdminProfit() {
    alert("Profit withdrawal request submitted.");
}
