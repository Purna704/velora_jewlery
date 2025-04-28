import os
import sys
import json
import logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np

# Configure logging to stderr
logging.basicConfig(stream=sys.stderr, level=logging.INFO)

# Load ResNet50 model once
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

def extract_features(image_path):
    try:
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
