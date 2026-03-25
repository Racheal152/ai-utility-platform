from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os

app = Flask(__name__)
CORS(app)

def load_model(utility_type):
    model_path = f'models/{utility_type}_model.pkl'
    if not os.path.exists(model_path):
        return None
    with open(model_path, 'rb') as f:
        return pickle.load(f)

@app.route('/api/predict', methods=['POST'])
def predict_bill():
    data = request.json
    utility_type = data.get('utility_type', '').lower()
    next_month_index = data.get('month_index', 13) # Defaulting to month 13 representing the next month
    
    model = load_model(utility_type)
    
    if not model:
        return jsonify({'error': f'Model for {utility_type} not found. Please train models first.'}), 404
        
    prediction = model.predict([[next_month_index]])
    predicted_amount = round(float(prediction[0][0]), 2)
    
    return jsonify({
        'utility_type': utility_type,
        'predicted_amount': predicted_amount,
        'month_index': next_month_index
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'AI Prediction Microservice'})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
