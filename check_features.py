import joblib
try:
    features = joblib.load('features.pkl')
    print(f"Features: {features}")
except Exception as e:
    print(f"Error loading features.pkl: {e}")
