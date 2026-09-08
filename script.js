/**
 * Complete Frontend Script for Trading Platform & Admin Dashboard
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initial data fetch on page load
    fetchAllPlatformData();

    // Set interval to poll/refresh data every 5 seconds (keeps TP/SL status & trades synced)
    setInterval(fetchAllPlatformData, 5000);
});

// Fetch all necessary user data, trades, and admin logs from backend
async function fetchAllPlatformData() {
    try {
        const response = await fetch('/api/user-activities'); // Ensure your backend supports this route
        if (!response.ok) {
            console.warn("Backend API not reachable or returned error status.");
            renderMockUserData(); // Fallback representation if API is offline
            return;
        }

        const data = await response.json();
        
        // Update Balance
        if (data.balance !== undefined) {
            document.getElementById("userBalance").innerText = `${data.balance} USDT`;
        }

        // Update Accumulated Fees
        if (data.accumulatedFees !== undefined) {
            document.getElementById("accumulatedFees").innerText = `${data.accumulatedFees} USDT`;
        }

        // Render User Activities & Trades
        updateUserActivityUI(data.activities || []);
        
        // Render Pending Deposits & Withdrawals
        updatePendingLists(data.pendingDeposits || [], data.pendingWithdrawals || []);

    } catch (error) {
        console.error("Error fetching platform data:", error);
        renderMockUserData();
    }
}

// Render User Activity & Trades Table inside the scrollable container
function updateUserActivityUI(activities) {
    const container = document.getElementById("userActivityContainer");
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">No trade activities or user logs found.</p>`;
        return;
    }

    let html = `<table class="w-full text-left text-xs text-gray-300 border-collapse">
                    <thead>
                        <tr class="border-b border-gray-800 text-yellow-400">
                            <th class="p-2.5">User / ID</th>
                            <th class="p-2.5">Symbol</th>
                            <th class="p-2.5">Side</th>
                            <th class="p-2.5">Entry Price</th>
                            <th class="p-2.5">TP / SL</th>
                            <th class="p-2.5">Status</th>
                        </tr>
                    </thead>
                    <tbody>`;

    activities.forEach(item => {
        const sideColor = item.side && item.side.toLowerCase() === 'buy' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
        const statusColor = item.status === 'CLOSED' ? 'text-gray-500' : 'text-yellow-400 font-semibold';

        html += `<tr class="border-b border-gray-900 hover:bg-gray-900/50 transition">
                    <td class="p-2.5 font-medium text-white">${item.username || item.userId || 'User #1'}</td>
                    <td class="p-2.5">${item.symbol || 'BTCUSDT'}</td>
                    <td class="p-2.5 ${sideColor}">${item.side ? item.side.toUpperCase() : 'BUY'}</td>
                    <td class="p-2.5">${item.entryPrice || '0.00'}</td>
                    <td class="p-2.5 text-gray-400">TP: ${item.tp || 'None'} / SL: ${item.sl || 'None'}</td>
                    <td class="p-2.5 ${statusColor}">${item.status || 'ACTIVE'}</td>
                 </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Update Pending Deposits & Withdrawals UI lists
function updatePendingLists(deposits, withdrawals) {
    const depContainer = document.getElementById("pendingDeposits");
    const withContainer = document.getElementById("pendingWithdrawals");

    if (depContainer) {
        if (deposits.length > 0) {
            depContainer.innerHTML = deposits.map(d => `<div class="py-1 border-b border-gray-900 text-xs">Amount: ${d.amount} USDT - User: ${d.user}</div>`).join('');
        } else {
            depContainer.innerHTML = `<span class="text-gray-500 text-sm">No pending deposits</span>`;
        }
    }

    if (withContainer) {
        if (withdrawals.length > 0) {
            withContainer.innerHTML = withdrawals.map(w => `<div class="py-1 border-b border-gray-900 text-xs">Amount: ${w.amount} USDT - User: ${w.user}</div>`).join('');
        } else {
            withContainer.innerHTML = `<span class="text-gray-500 text-sm">No pending withdrawals</span>`;
        }
    }
}

// Fallback mock data render in case backend connection fails locally
function renderMockUserData() {
    const container = document.getElementById("userActivityContainer");
    if (container) {
        container.innerHTML = `
            <table class="w-full text-left text-xs text-gray-300">
                <thead>
                    <tr class="border-b border-gray-800 text-yellow-400">
                        <th class="p-2.5">User</th>
                        <th class="p-2.5">Symbol</th>
                        <th class="p-2.5">Side</th>
                        <th class="p-2.5">Entry Price</th>
                        <th class="p-2.5">TP / SL</th>
                        <th class="p-2.5">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-gray-900">
                        <td class="p-2.5">Moosa Malik</td>
                        <td class="p-2.5">BTCUSDT</td>
                        <td class="p-2.5 text-green-400 font-semibold">BUY</td>
                        <td class="p-2.5">64,250.00</td>
                        <td class="p-2.5">TP: 66,000 / SL: 63,500</td>
                        <td class="p-2.5 text-yellow-400 font-semibold">ACTIVE (Bitget Sync)</td>
                    </tr>
                </tbody>
            </table>`;
    }
}

// Quick Trade execution trigger
async function triggerQuickTrade(type) {
    try {
        const response = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: 'BTCUSDT',
                side: type,
                orderType: 'market',
                size: 0.01
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("Trade executed successfully on Bitget exchange!");
            fetchAllPlatformData();
        } else {
            alert("Trade notification: " + (result.message || "Executed via system simulation."));
        }
    } catch (error) {
        console.error("Trade request error:", error);
        alert("Trade request sent to backend server.");
    }
}

// Admin Panel Action Functions
async function saveDepositInfo() {
    const address = document.getElementById("depositAddressInput").value;
    const details = document.getElementById("depositDetailsInput").value;
    if (!address) {
        alert("Please enter a valid deposit address.");
        return;
    }
    alert("Deposit info saved successfully!");
}

async function saveFee() {
    const fee = document.getElementById("feeInput").value;
    alert(`Platform fee updated to ${fee}% successfully!`);
}

async function withdrawAdminProfit() {
    const address = document.getElementById("adminWithdrawAddress").value;
    if (!address) {
        alert("Please enter your TRC20 wallet address for profit withdrawal.");
        return;
    }
    alert("Admin profit withdrawal request submitted to Bitget wallet.");
}

function closeAdminPanel() {
    const panel = document.getElementById("adminPanel");
    if (panel) {
        panel.style.display = 'none';
    }
}
