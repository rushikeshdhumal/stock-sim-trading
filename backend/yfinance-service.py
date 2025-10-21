#!/usr/bin/env python3
"""
yfinance microservice for stock data
Provides real-time stock quotes using Yahoo Finance API
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'yfinance'}), 200

@app.route('/quote/<symbol>', methods=['GET'])
def get_quote(symbol):
    """Get stock quote for a symbol"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        history = ticker.history(period='1d')

        if history.empty or 'regularMarketPrice' not in info:
            return jsonify({'error': 'Symbol not found'}), 404

        current_price = info.get('regularMarketPrice', info.get('currentPrice', 0))
        previous_close = info.get('previousClose', 0)
        change = current_price - previous_close if previous_close else 0
        change_percent = (change / previous_close * 100) if previous_close else 0

        quote = {
            'symbol': symbol.upper(),
            'assetType': 'STOCK',
            'currentPrice': float(current_price),
            'change24h': float(change),
            'changePercentage': float(change_percent),
            'volume': int(info.get('volume', 0)),
            'marketCap': int(info.get('marketCap', 0)) if info.get('marketCap') else None,
            'lastUpdated': datetime.now().isoformat()
        }

        return jsonify(quote), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search/<query>', methods=['GET'])
def search(query):
    """Search for stocks"""
    try:
        # For now, just try to get the quote for the symbol
        # Yahoo Finance doesn't have a great search API
        ticker = yf.Ticker(query.upper())
        info = ticker.info

        if 'regularMarketPrice' not in info and 'currentPrice' not in info:
            return jsonify([]), 200

        current_price = info.get('regularMarketPrice', info.get('currentPrice', 0))
        previous_close = info.get('previousClose', 0)
        change = current_price - previous_close if previous_close else 0

        result = {
            'symbol': query.upper(),
            'name': info.get('longName', query.upper()),
            'assetType': 'STOCK',
            'currentPrice': float(current_price),
            'change24h': float(change)
        }

        return jsonify([result]), 200

    except Exception as e:
        return jsonify([]), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
