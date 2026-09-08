const API_URL = "https://publicApi.bitget.com/api/v2/spot/market/tickers?symbol=BTCUSDT";

async function fetchMarketData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            const ticker = data.data[0];
            const price = parseFloat(ticker.lastPr).toFixed(2);
            const high = parseFloat(ticker.high24h).toFixed(2);
            const low = parseFloat(ticker.low24h).toFixed(2);

            document.getElementById('live-price').innerText = `$${price}`;
            document.getElementById('high-price').innerText = `$${high}`;
            document.getElementById('low-price').innerText = `$${low}`;

            // Quick Calculator Logic
            const payAmount = document.getElementById('pay-amount').value;
            if (payAmount && price > 0) {
                const receive = (payAmount / price).toFixed(6);
                document.getElementById('receive-amount').value = `${receive} BTC`;
            }
        }
    } catch (error) {
        console.error("Error fetching market data:", error);
    }
}

// Event listener for live calculation update
document.getElementById('pay-amount').addEventListener('input', fetchMarketData);

// Button click action
document.getElementById('trade-btn').addEventListener('click', () => {
    alert('Order simulated successfully via Bitget live public feed!');
});

// Run immediately and then poll every 3 seconds
fetchMarketData();
setInterval(fetchMarketData, 3000);
