require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Bitget API Credentials (.env file se uthayega)
const API_KEY = process.env.BITGET_API_KEY;
const SECRET_KEY = process.env.BITGET_SECRET_KEY;
const PASSPHRASE = process.env.BITGET_PASSPHRASE;
const BASE_URL = "https://api.bitget.com";

// Bitget V2 signature generation function
function sign(timestamp, method, requestPath, body = "") {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
}

// Balance check route
app.get('/api/balance', async (req, res) => {
    try {
        const timestamp = Date.now().toString();
        const method = "GET";
        const requestPath = "/api/v2/spot/account/assets";
        const signature = sign(timestamp, method, requestPath);

        const response = await axios.get(`${BASE_URL}${requestPath}`, {
            headers: {
                'ACCESS-KEY': API_KEY,
                'ACCESS-SIGN': signature,
                'ACCESS-PASSPHRASE': PASSPHRASE,
                'ACCESS-TIMESTAMP': timestamp,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// Real Trade place karne ka route
app.post('/api/trade', async (req, res) => {
    try {
        const { symbol, side, orderType, size, price } = req.body;
        const timestamp = Date.now().toString();
        const method = "POST";
        const requestPath = "/api/v2/spot/trade/place-order";
        
        const bodyData = JSON.stringify({
            symbol: symbol,
            productType: "spot",
            marginMode: "spot",
            side: side.toLowerCase(),
            orderType: orderType.toLowerCase(),
            size: size,
            price: price || undefined
        });

        const signature = sign(timestamp, method, requestPath, bodyData);

        const response = await axios.post(`${BASE_URL}${requestPath}`, bodyData, {
            headers: {
                'ACCESS-KEY': API_KEY,
                'ACCESS-SIGN': signature,
                'ACCESS-PASSPHRASE': PASSPHRASE,
                'ACCESS-TIMESTAMP': timestamp,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
