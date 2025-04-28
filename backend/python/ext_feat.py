import os
import sys
import json
import logging

# Suppress TensorFlow logging before importing tensorflow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['KMP_WARNINGS'] = '0'

logging.basicConfig(stream=sys.stderr, level=logging.INFO)

from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np

# Load ResNet50 model once globally to avoid repeated downloads/logs
model = None

def load_model():
    global model
    if model is None:
        model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

def extract_features(image_path):
    try:
        load_model()
        img = image.load_img(image_path, target_size=(224, 224))
        x = image.img_to_array(img)
        x = preprocess_input(np.expand_dims(x, axis=0))
        features = model.predict(x)[0].tolist()
        return features
    except Exception as e:
        logging.error(f"Error extracting features: {e}")
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        logging.error("Usage: python ext_feat.py <image_path>")
        print(json.dumps({'error': 'Usage: python ext_feat.py <image_path>'}))
        sys.exit(1)
    image_path = sys.argv[1]
    features = extract_features(image_path)
    print(json.dumps({'features': features}))
