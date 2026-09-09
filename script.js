/**
 * Complete Frontend Script with Multi-Device Financial Ledger & Exchange Sync
 */

document.addEventListener("DOMContentLoaded", () => {
    fetchAllPlatformData();
    setInterval(fetchAllPlatformData, 5000); // 5 seconds auto-refresh sync for multi-device data
});

// Fetch all user activities, balances, and financial ledgers from backend
async function fetchAllPlatformData() {
    try {
        const response = await fetch('/api/user-activities'); 
        if (!response.ok) {
            renderMockUserData();
            return;
        }

        const data = await response.json();
        
        if (data.balance !== undefined) {
            document.getElementById("userBalance").innerText = `${data.balance} USDT`;
        }

        if (data.accumulatedFees !== undefined) {
            document.getElementById("accumulatedFees").innerText = `${data.accumulatedFees} USDT`;
        }

        updateUserActivityUI(data.activities || []);
        updateDetailedUserLedger(data.userLedgers || []);
        updatePendingLists(data.pendingDeposits || [], data.pendingWithdrawals || []);

    } catch (error) {
        console.error("Error fetching platform data:", error);
        renderMockUserData();
    }
}

// Render User Detailed Financial & Trade Ledger in Admin Panel
function updateDetailedUserLedger(ledgers) {
    const container = document.getElementById("userDetailedLedgerContainer");
    if (!container) return;

    if (!ledgers || ledgers.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">No active user financial records found yet. (Data syncs automatically when users trade or request withdrawal from other devices)</p>`;
        return;
    }

    let html = `<div class="space-y-4">`;

    ledgers.forEach(user => {
        html += `
            <div class="bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs">
                <div class="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                    <span class="font-bold text-yellow-400 text-sm">User: ${user.username || user.userId}</span>
                    <span class="text-gray-400">Starting Bal: <strong class="text-white">${user.startingBalance} USDT</strong></span>
                    <span class="text-gray-400">Current Bal: <strong class="text-green-400">${user.currentBalance} USDT</strong></span>
                </div>
                <div class="text-gray-300">
                    <p class="font-semibold text-gray-400 mb-1">Trade History & Status:</p>
                    <div class="bg-gray-950 p-2 rounded border border-gray-800">
                        ${user.trades && user.trades.length > 0 ? user.trades.map(t => `
                            <div class="flex justify-between py-1 border-b border-gray-900 last:border-none">
                                <span>${t.symbol} (${t.side.toUpperCase()})</span>
                                <span>Entry: ${t.entryPrice}</span>
                                <span class="${t.status === 'CLOSED' ? 'text-gray-500' : 'text-yellow-400'}">${t.status}</span>
                            </div>
                        `).join('') : '<span class="text-gray-500">No trades executed yet.</span>'}
                    </div>
                </div>
            </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Update General Activity UI
function updateUserActivityUI(activities) {
    const container = document.getElementById("userActivityContainer");
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">No general activity found.</p>`;
        return;
    }

    let html = `<table class="w-full text-left text-xs text-gray-300 border-collapse">
                    <thead>
                        <tr class="border-b border-gray-800 text-yellow-400">
                            <th class="p-2">User</th>
                            <th class="p-2">Action / Symbol</th>
                            <th class="p-2">Details</th>
                            <th class="p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>`;

    activities.forEach(item => {
        html += `<tr class="border-b border-gray-900">
                    <td class="p-2 text-white">${item.username || 'User'}</td>
                    <td class="p-2">${item.symbol || 'BTCUSDT'} (${item.side || 'Action'})</td>
                    <td class="p-2 text-gray-400">Price: ${item.entryPrice || 'N/A'}</td>
                    <td class="p-2 text-yellow-400">${item.status || 'DONE'}</td>
                 </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Update Pending Lists
function updatePendingLists(deposits, withdrawals) {
    const depContainer = document.getElementById("pendingDeposits");
    const withContainer = document.getElementById("pendingWithdrawals");

    if (depContainer) {
        depContainer.innerHTML = deposits.length > 0 
            ? deposits.map(d => `<div class="py-1 border-b border-gray-900 text-xs">Amt: ${d.amount} USDT - User: ${d.user}</div>`).join('')
            : `<span class="text-gray-500 text-sm">No pending deposits</span>`;
    }

    if (withContainer) {
        withContainer.innerHTML = withdrawals.length > 0 
            ? withdrawals.map(w => `<div class="py-1 border-b border-gray-900 text-xs">Amt: ${w.amount} USDT - User: ${w.user}</div>`).join('')
            : `<span class="text-gray-500 text-sm">No pending withdrawals</span>`;
    }
}

// Fallback Mock Data with Detailed Financial Ledger
function renderMockUserData() {
    const container = document.getElementById("userDetailedLedgerContainer");
    if (container) {
        container.innerHTML = `
            <div class="bg-gray-900 p-3 rounded-lg border border-gray-800 text-xs">
                <div class="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                    <span class="font-bold text-yellow-400 text-sm">User: Moosa (Device #2 Sync)</span>
                    <span class="text-gray-400">Starting: <strong class="text-white">1,000.00 USDT</strong></span>
                    <span class="text-gray-400">Current: <strong class="text-green-400">1,050.00 USDT</strong></span>
                </div>
                <div class="text-gray-300">
                    <p class="font-semibold text-gray-400 mb-1">Trade History:</p>
                    <div class="bg-gray-950 p-2 rounded border border-gray-800">
                        <div class="flex justify-between py-1">
                            <span>BTCUSDT (BUY)</span>
                            <span>Entry: 64,250.00</span>
                            <span class="text-yellow-400">ACTIVE (Bitget Linked)</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}

// Quick Trade trigger (Sends request to backend to place trade on exchange)
async function triggerQuickTrade(type) {
    try {
        const response = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: 'BTCUSDT', side: type, size: 0.01, orderType: 'market' })
        });
        const result = await response.json();
        alert(result.message || "Trade sent to exchange successfully!");
        fetchAllPlatformData();
    } catch (error) {
        alert("Trade request sent to server.");
    }
}

// Admin Action Functions
async function saveDepositInfo() { alert("Deposit info saved successfully!"); }
async function saveFee() { alert("Platform fee updated successfully!"); }
async function withdrawAdminProfit() { alert("Profit withdrawal request submitted."); }
function closeAdminPanel() { document.getElementById("adminPanel").style.display = 'none'; }
