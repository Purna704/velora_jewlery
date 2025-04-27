import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from io import BytesIO
import sys
import json
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load ResNet50 model
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

@app.route('/extract', methods=['POST'])
def extract_features():
    try:
        file = request.files['image']
        if not file:
            app.logger.error("No file part in the request")
            return jsonify({'error': 'No file part in the request'}), 400
        try:
            img = image.load_img(BytesIO(file.read()), target_size=(224, 224))
        except Exception as e:
            app.logger.error(f"Error loading image: {e}")
            return jsonify({'error': f"Invalid image file: {e}"}), 400
        x = image.img_to_array(img)
        x = preprocess_input(np.expand_dims(x, axis=0))
        features = model.predict(x)[0].tolist()
        return jsonify({'features': features})
    except Exception as e:
        app.logger.error(f"Error in /extract: {e}")
        return jsonify({'error': str(e)}), 500

def extract_features_cli(image_path):
    try:
        img = image.load_img(image_path, target_size=(224, 224))
        x = image.img_to_array(img)
        x = preprocess_input(np.expand_dims(x, axis=0))
        features = model.predict(x)[0].tolist()
        print(json.dumps({'features': features}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # CLI mode
        extract_features_cli(sys.argv[1])
    else:
        # Run Flask app binding to 0.0.0.0 to be accessible externally
        app.run(host='0.0.0.0', port=5001)
