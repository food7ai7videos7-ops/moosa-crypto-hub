let usdtBalance = parseFloat(localStorage.getItem('usdt_balance')) || 0.00;
let adminFeeBalance = parseFloat(localStorage.getItem('admin_fee')) || 0.00;
let platformFeePercent = parseFloat(localStorage.getItem('platform_fee_percent')) || 0.1; // Default 0.1%
let activePair = "BTCUSDT";
let currentPrice = 65000.00;
let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
let pendingDeposits = JSON.parse(localStorage.getItem('pending_deposits')) || [];
let pendingWithdrawals = JSON.parse(localStorage.getItem('pending_withdrawals')) || [];
let marketDataList = [];

// Audio alert for trade execution success
function playTradeSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

async function fetchLiveMarkets() {
    try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            marketDataList = data
                .filter(item => item.symbol.endsWith("USDT"))
                .map(item => ({
                    symbol: item.symbol,
                    price: parseFloat(item.lastPrice || 0),
                    change: (parseFloat(item.priceChangePercent || 0) >= 0 ? "+" : "") + parseFloat(item.priceChangePercent || 0).toFixed(2) + "%"
                }));

            renderMarkets(document.getElementById('market-search')?.value || "");
            
            const current = marketDataList.find(m => m.symbol === activePair);
            if (current && current.price > 0) {
                currentPrice = current.price;
                const priceEl = document.getElementById('selected-price');
                if(priceEl) priceEl.innerText = currentPrice.toFixed(4);
                calculateTrade();
            }
        }
    } catch (error) {
        console.error("Error fetching live markets:", error);
    }
}

function initApp() {
    updateUI();
    fetchLiveMarkets();
    renderActiveTrades();
    setInterval(fetchLiveMarkets, 4000);
}

function updateUI() {
    const balanceEl = document.getElementById('usdt-balance');
    if(balanceEl) balanceEl.innerText = usdtBalance.toFixed(2);
    localStorage.setItem('usdt_balance', usdtBalance);
    localStorage.setItem('admin_fee', adminFeeBalance);
    localStorage.setItem('platform_fee_percent', platformFeePercent);
}

function renderMarkets(filter = "") {
    const container = document.getElementById('market-list-container');
    if (!container) return;
    if (marketDataList.length === 0) {
        container.innerHTML = `<p class="no-trades">Loading live markets...</p>`;
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
                    <span>$${item.price.toFixed(4)}</span>
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
    const titleEl = document.getElementById('selected-pair-title');
    const priceEl = document.getElementById('selected-price');
    if(titleEl) titleEl.innerText = `Trading: ${symbol}`;
    if(priceEl) priceEl.innerText = price.toFixed(4);
    renderMarkets(document.getElementById('market-search')?.value || "");
    calculateTrade();
}

function calculateTrade() {
    const amountInput = document.getElementById('trade-amount');
    const estQtyEl = document.getElementById('est-qty');
    if(!amountInput || !estQtyEl) return;
    const amount = parseFloat(amountInput.value) || 0;
    if(currentPrice > 0) {
        const qty = amount / currentPrice;
        estQtyEl.innerText = qty.toFixed(6);
    }
}

async function executeTrade(type) {
    const amountInput = document.getElementById('trade-amount');
    const amount = parseFloat(amountInput?.value) || 0;
    if(amount <= 0 || amount > usdtBalance) {
        showCustomPopup("Insufficient Balance", "Please deposit funds to start trading.");
        return;
    }

    const qty = amount / currentPrice;

    try {
        const response = await fetch('/api/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            const fee = amount * (platformFeePercent / 100);
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
            
            playTradeSound();
            showCustomPopup("Trade Successful! 🚀", `${type} Order Executed Successfully for ${activePair}!\nAmount: $${amount.toFixed(2)}`);
        } else {
            console.error("API Error:", result);
            showCustomPopup("Execution Error", `${result.error?.msg || JSON.stringify(result.error) || 'Failed to execute order'}`);
        }
    } catch (error) {
        console.error("Network Error:", error);
        showCustomPopup("Connection Error", "Network connection error while executing trade.");
    }
}

// Custom Professional Popup Notification
function showCustomPopup(title, message) {
    let existing = document.getElementById('custom-popup-box');
    if(existing) existing.remove();

    const box = document.createElement('div');
    box.id = 'custom-popup-box';
    box.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#1e2329; color:#fff; border:1px solid #f0b90b; padding:15px 20px; border-radius:8px; z-index:99999; box-shadow:0 4px 15px rgba(0,0,0,0.5); min-width:300px; text-align:center; font-family:sans-serif;";
    box.innerHTML = `
        <h4 style="margin:0 0 8px 0; color:#f0b90b; font-size:1rem;">${title}</h4>
        <p style="margin:0 0 12px 0; font-size:0.85rem; color:#eaecef; line-height:1.4;">${message}</p>
        <button onclick="this.parentElement.remove()" style="background:#f0b90b; border:none; padding:6px 15px; font-weight:bold; border-radius:4px; cursor:pointer; color:#000;">OK</button>
    `;
    document.body.appendChild(box);
    setTimeout(() => { if(box) box.remove(); }, 5000);
}

function renderActiveTrades() {
    const container = document.getElementById('active-trades-container');
    if(!container) return;
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
                    Entry: $${t.entryPrice.toFixed(4)} | Qty: ${t.qty.toFixed(4)}
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

function openModal(id) {
    const el = document.getElementById(id);
    if(el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
}

function submitDeposit() {
    const input = document.getElementById('deposit-input');
    const amt = parseFloat(input?.value);
    if(!amt || amt <= 0) { showCustomPopup("Invalid Amount", "Please enter a valid deposit amount."); return; }
    pendingDeposits.push({ id: Date.now(), amount: amt });
    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
    input.value = "";
    showCustomPopup("Request Submitted", "Deposit request submitted! Waiting for Admin approval.");
    closeModal('deposit-modal');
}

function submitWithdrawal() {
    const input = document.getElementById('withdraw-amount-input');
    const amt = parseFloat(input?.value);
    if(!amt || amt <= 0 || amt > usdtBalance) { showCustomPopup("Invalid Amount", "Invalid or insufficient withdrawal amount."); return; }
    usdtBalance -= amt;
    pendingWithdrawals.push({ id: Date.now(), amount: amt, userBalance: usdtBalance + amt });
    localStorage.setItem('pending_withdrawals', JSON.stringify(pendingWithdrawals));
    updateUI();
    input.value = "";
    showCustomPopup("Request Submitted", "Withdrawal request submitted successfully!");
    closeModal('withdraw-modal');
}

// Professional Admin Login Modal Trigger
function openAdminLogin() {
    let existing = document.getElementById('admin-login-modal');
    if(existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'admin-login-modal';
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:99999;";
    modal.innerHTML = `
        <div style="background:#1e2329; padding:25px; border-radius:10px; width:90%; max-width:320px; text-align:center; border:1px solid #363c4e; color:#fff;">
            <h3 style="margin-top:0; color:#f0b90b;">Admin Security</h3>
            <p style="font-size:0.8rem; color:#848e9c; margin-bottom:15px;">Enter admin password to access control panel.</p>
            <input type="password" id="admin-pwd-input" placeholder="Password" style="width:100%; padding:10px; background:#2b313a; border:1px solid #474d57; color:#fff; border-radius:5px; margin-bottom:15px; box-sizing:border-box;">
            <button onclick="verifyAdminPassword()" style="width:100%; padding:10px; background:#f0b90b; border:none; font-weight:bold; border-radius:5px; cursor:pointer; color:#000;">Login</button>
            <button onclick="document.getElementById('admin-login-modal').remove()" style="width:100%; padding:8px; background:transparent; border:none; color:#848e9c; margin-top:8px; cursor:pointer;">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function verifyAdminPassword() {
    const pwd = document.getElementById('admin-pwd-input').value;
    if(pwd === "Mmooossaa35#") {
        document.getElementById('admin-login-modal').remove();
        openModal('admin-modal');
        loadAdminData();
    } else {
        showCustomPopup("Access Denied", "Incorrect Admin Password!");
    }
}

function loadAdminData() {
    const feeBalanceEl = document.getElementById('admin-fee-balance');
    if(feeBalanceEl) feeBalanceEl.innerText = `${adminFeeBalance.toFixed(2)} USDT`;

    const feePercentInput = document.getElementById('admin-fee-percent-input');
    if(feePercentInput) feePercentInput.value = platformFeePercent;
    
    // Deposits List with Approve / Reject
    const depContainer = document.getElementById('admin-deposits-list');
    if(depContainer) {
        depContainer.innerHTML = pendingDeposits.length === 0 ? "<p style='color:#848e9c; font-size:0.75rem; text-align:center;'>No pending deposits</p>" : "";
        pendingDeposits.forEach((d, idx) => {
            depContainer.innerHTML += `
                <div class="admin-req-item" style="display:flex; justify-content:space-between; align-items:center; background:#181a20; padding:8px; border-radius:5px; margin-bottom:5px; font-size:0.8rem;">
                    <span>+${d.amount} USDT</span>
                    <div>
                        <button onclick="approveDeposit(${idx})" style="background:#0ecb81; border:none; color:#fff; padding:4px 8px; border-radius:3px; cursor:pointer; margin-right:4px;">Approve</button>
                        <button onclick="rejectDeposit(${idx})" style="background:#f6465d; border:none; color:#fff; padding:4px 8px; border-radius:3px; cursor:pointer;">Reject</button>
                    </div>
                </div>
            `;
        });
    }

    // Withdrawals List with User Balance info and Approve / Reject
    const wContainer = document.getElementById('admin-withdrawals-list');
    if(wContainer) {
        wContainer.innerHTML = pendingWithdrawals.length === 0 ? "<p style='color:#848e9c; font-size:0.75rem; text-align:center;'>No pending withdrawals</p>" : "";
        pendingWithdrawals.forEach((w, idx) => {
            wContainer.innerHTML += `
                <div class="admin-req-item" style="background:#181a20; padding:8px; border-radius:5px; margin-bottom:6px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span>-${w.amount} USDT</span><br>
                        <small style="color:#848e9c;">User Bal: $${(w.userBalance || 0).toFixed(2)}</small>
                    </div>
                    <div>
                        <button onclick="approveWithdrawal(${idx})" style="background:#0ecb81; border:none; color:#fff; padding:4px 8px; border-radius:3px; cursor:pointer; margin-right:4px;">Approve</button>
                        <button onclick="rejectWithdrawal(${idx})" style="background:#f6465d; border:none; color:#fff; padding:4px 8px; border-radius:3px; cursor:pointer;">Reject</button>
                    </div>
                </div>
            `;
        });
    }
}

function updatePlatformFee() {
    const input = document.getElementById('admin-fee-percent-input');
    const val = parseFloat(input?.value);
    if(isNaN(val) || val < 0) { showCustomPopup("Error", "Enter valid percentage"); return; }
    platformFeePercent = val;
    updateUI();
    showCustomPopup("Updated", `Platform Fee successfully updated to ${platformFeePercent}%`);
}

function approveDeposit(idx) {
    const d = pendingDeposits[idx];
    usdtBalance += d.amount;
    pendingDeposits.splice(idx, 1);
    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
    updateUI();
    loadAdminData();
    showCustomPopup("Approved", "Deposit approved and added to user balance.");
}

function rejectDeposit(idx) {
    pendingDeposits.splice(idx, 1);
    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
    loadAdminData();
    showCustomPopup("Rejected", "Deposit request rejected.");
}

function approveWithdrawal(idx) {
    pendingWithdrawals.splice(idx, 1);
    localStorage.setItem('pending_withdrawals', JSON.stringify(pendingWithdrawals));
    loadAdminData();
    showCustomPopup("Approved", "Withdrawal request approved.");
}

function rejectWithdrawal(idx) {
    const w = pendingWithdrawals[idx];
    usdtBalance += w.amount; // Refund amount back to user balance on rejection
    pendingWithdrawals.splice(idx, 1);
    localStorage.setItem('pending_withdrawals', JSON.stringify(pendingWithdrawals));
    updateUI();
    loadAdminData();
    showCustomPopup("Rejected", "Withdrawal rejected and refunded to user balance.");
}

// Admin profit real withdrawal to personal crypto address
function withdrawAdminProfit() {
    const addressInput = document.getElementById('admin-withdraw-address');
    const address = addressInput?.value.trim();
    if(!address) { showCustomPopup("Error", "Please enter your destination Crypto Address."); return; }
    if(adminFeeBalance <= 0) { showCustomPopup("Error", "No profit fee balance available to withdraw."); return; }

    const withdrawnAmount = adminFeeBalance;
    adminFeeBalance = 0;
    updateUI();
    loadAdminData();
    if(addressInput) addressInput.value = "";
    
    showCustomPopup("Profit Withdrawn! 💸", `Successfully transferred $${withdrawnAmount.toFixed(2)} to your crypto address:\n${address}`);
}

window.onload = initApp;
