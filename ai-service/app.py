from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'service': 'CoinNova AI Prediction Service'})

@app.route('/predict/<coin_symbol>', methods=['GET'])
def predict_price(coin_symbol):
    try:
        # Simple moving average prediction (placeholder for more complex ML models)
        days = request.args.get('days', 7, type=int)
        
        # Fetch historical data from CoinGecko
        coin_map = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum', 
            'SOL': 'solana',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'LINK': 'chainlink',
            'LTC': 'litecoin',
            'XLM': 'stellar'
        }
        
        coin_id = coin_map.get(coin_symbol.upper())
        if not coin_id:
            return jsonify({'error': 'Unsupported coin'}), 400
            
        # Get historical prices
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {'vs_currency': 'usd', 'days': '30'}
        
        response = requests.get(url, params=params)
        data = response.json()
        
        prices = [price[1] for price in data['prices']]
        
        # Simple prediction using moving averages
        prediction = simple_moving_average_prediction(prices, days)
        
        return jsonify({
            'coin': coin_symbol.upper(),
            'current_price': prices[-1],
            'predicted_price': prediction,
            'confidence': 0.65,  # Placeholder confidence score
            'prediction_days': days,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def simple_moving_average_prediction(prices, forecast_days=7):
    """Simple moving average prediction"""
    if len(prices) < 10:
        return prices[-1]  # Return last price if not enough data
    
    # Calculate different moving averages
    ma_5 = np.mean(prices[-5:])
    ma_10 = np.mean(prices[-10:])
    ma_20 = np.mean(prices[-20:]) if len(prices) >= 20 else ma_10
    
    # Simple trend analysis
    recent_trend = (prices[-1] - prices[-5]) / 5 if len(prices) >= 5 else 0
    
    # Weighted prediction
    prediction = (ma_5 * 0.5 + ma_10 * 0.3 + ma_20 * 0.2) + (recent_trend * forecast_days * 0.1)
    
    return round(prediction, 2)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)