#!/usr/bin/env python3
"""
yfinance microservice for stock data
Provides real-time stock quotes using Yahoo Finance API
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from datetime import datetime
import logging
import time
from functools import wraps

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting configuration
REQUEST_TIMESTAMPS = []
MAX_REQUESTS_PER_MINUTE = 30
DELAY_BETWEEN_REQUESTS = 0.5  # 500ms delay between requests

def rate_limit():
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            global REQUEST_TIMESTAMPS
            now = time.time()
            
            # Remove timestamps older than 1 minute
            REQUEST_TIMESTAMPS = [ts for ts in REQUEST_TIMESTAMPS if now - ts < 60]
            
            # Check if we've exceeded the limit
            if len(REQUEST_TIMESTAMPS) >= MAX_REQUESTS_PER_MINUTE:
                logger.warning(f'Rate limit exceeded: {len(REQUEST_TIMESTAMPS)} requests in last minute')
                return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
            
            # Add current timestamp
            REQUEST_TIMESTAMPS.append(now)
            
            # Add delay to avoid hitting Yahoo Finance too fast
            time.sleep(DELAY_BETWEEN_REQUESTS)
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

def fetch_quote_with_retry(symbol, max_retries=2):
    """Fetch quote with retry logic and progressive delays"""
    for attempt in range(max_retries):
        try:
            ticker = yf.Ticker(symbol.upper())
            
            # Try to get data with a longer period for better reliability
            history = ticker.history(period='1mo')
            
            if not history.empty:
                # Get the most recent data point
                current_price = float(history['Close'].iloc[-1])
                
                # Calculate change from previous close if available
                if len(history) > 1:
                    previous_close = float(history['Close'].iloc[-2])
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100) if previous_close else 0
                else:
                    change = 0
                    change_percent = 0
                
                volume = int(history['Volume'].iloc[-1]) if 'Volume' in history.columns else 0
                
                return {
                    'currentPrice': current_price,
                    'change24h': change,
                    'changePercentage': change_percent,
                    'volume': volume,
                    'success': True
                }
            
            # If no data, retry with delay
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Progressive backoff: 2s, 4s
                logger.warning(f'No data for {symbol}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})')
                time.sleep(wait_time)
            
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                logger.warning(f'Error fetching {symbol}: {str(e)}, retrying in {wait_time}s')
                time.sleep(wait_time)
            else:
                logger.error(f'Failed to fetch {symbol} after {max_retries} attempts: {str(e)}')
    
    return {'success': False, 'error': 'No data available after retries'}

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'yfinance'}), 200

@app.route('/quote/<symbol>', methods=['GET'])
@rate_limit()
def get_quote(symbol):
    """Get stock quote for a symbol"""
    try:
        logger.info(f'Fetching quote for {symbol}')
        result = fetch_quote_with_retry(symbol)
        
        if not result.get('success'):
            return jsonify({'error': result.get('error', 'Symbol not found or no data available')}), 404
        
        # Determine asset type
        asset_type = 'CRYPTO' if '-USD' in symbol.upper() else 'STOCK'
        
        quote = {
            'symbol': symbol.upper(),
            'assetType': asset_type,
            'currentPrice': result['currentPrice'],
            'change24h': result['change24h'],
            'changePercentage': result['changePercentage'],
            'volume': result['volume'],
            'marketCap': None,
            'lastUpdated': datetime.now().isoformat()
        }

        return jsonify(quote), 200

    except Exception as e:
        logger.error(f'Error in get_quote for {symbol}: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/quotes/batch', methods=['POST'])
@rate_limit()
def get_quotes_batch():
    """Get quotes for multiple symbols in batch"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({'error': 'No symbols provided'}), 400
        
        # Limit batch size to avoid overload
        max_batch_size = 20
        if len(symbols) > max_batch_size:
            logger.warning(f'Batch size {len(symbols)} exceeds limit {max_batch_size}, truncating')
            symbols = symbols[:max_batch_size]
        
        logger.info(f'Batch request for {len(symbols)} symbols: {symbols}')
        results = {}
        
        for i, symbol in enumerate(symbols):
            try:
                # Add progressive delay between symbols in batch
                if i > 0:
                    time.sleep(0.3)  # 300ms between each symbol
                
                result = fetch_quote_with_retry(symbol, max_retries=1)  # Fewer retries in batch
                
                if result.get('success'):
                    asset_type = 'CRYPTO' if '-USD' in symbol.upper() else 'STOCK'
                    
                    results[symbol.upper()] = {
                        'symbol': symbol.upper(),
                        'assetType': asset_type,
                        'currentPrice': result['currentPrice'],
                        'change24h': result['change24h'],
                        'changePercentage': result['changePercentage'],
                        'volume': result['volume'],
                        'marketCap': None
                    }
                else:
                    logger.warning(f'No data available for {symbol} in batch')
            except Exception as e:
                logger.error(f'Error fetching {symbol} in batch: {str(e)}')
        
        logger.info(f'Batch response: {len(results)}/{len(symbols)} symbols successful')
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f'Batch request error: {str(e)}')
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
