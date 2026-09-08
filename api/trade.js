const crypto = require('crypto');
const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { symbol, side, orderType, size } = req.body;
        
        const API_KEY = process.env.BITGET_API_KEY;
        const SECRET_KEY = process.env.BITGET_SECRET_KEY;
        const PASSPHRASE = process.env.BITGET_PASSPHRASE;
        const BASE_URL = "https://api.bitget.com";

        const timestamp = Date.now().toString();
        const method = "POST";
        const requestPath = "/api/v2/spot/trade/place-order";
        
        let parsedSize = parseFloat(size);
        if (parsedSize < 0.001) parsedSize = 0.001;

        const bodyData = JSON.stringify({
            symbol: symbol,
            productType: "spot",
            marginMode: "spot",
            side: side.toLowerCase(),
            orderType: orderType.toLowerCase(),
            size: parsedSize.toFixed(4)
        });

        const message = timestamp + method.toUpperCase() + requestPath + bodyData;
        const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');

        const response = await axios.post(`${BASE_URL}${requestPath}`, bodyData, {
            headers: {
                'ACCESS-KEY': API_KEY,
                'ACCESS-SIGN': signature,
                'ACCESS-PASSPHRASE': PASSPHRASE,
                'ACCESS-TIMESTAMP': timestamp,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.response?.data || error.message });
    }
};
