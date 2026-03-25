import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import pickle
import os

def generate_synthetic_data():
    """Generate dummy historical billing data for training."""
    # Month index 1 to 12
    months = np.array(range(1, 13)).reshape(-1, 1)
    
    # Slight upward trend with noise
    electricity = 1500 + (months * 50) + np.random.normal(0, 100, (12, 1))
    water = 500 + (months * 10) + np.random.normal(0, 20, (12, 1))
    internet = np.full((12, 1), 3000) # Fixed
    
    return months, electricity, water, internet

def train_and_save_models():
    months, electricity, water, internet = generate_synthetic_data()
    
    # Train Electricity Model
    elec_model = LinearRegression()
    elec_model.fit(months, electricity)
    
    # Train Water Model
    water_model = LinearRegression()
    water_model.fit(months, water)
    
    # Internet is fixed so no complex model needed, but we'll train one for consistency
    int_model = LinearRegression()
    int_model.fit(months, internet)
    
    os.makedirs('models', exist_ok=True)
    with open('models/electricity_model.pkl', 'wb') as f:
        pickle.dump(elec_model, f)
    with open('models/water_model.pkl', 'wb') as f:
        pickle.dump(water_model, f)
    with open('models/internet_model.pkl', 'wb') as f:
        pickle.dump(int_model, f)

    print("Models trained and saved in ./models/")

if __name__ == '__main__':
    train_and_save_models()
