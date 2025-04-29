import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from io import BytesIO
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load ResNet50 model
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

@app.route('/extract', methods=['POST'])
def extract_features():
    app.logger.info(f"Request headers: {dict(request.headers)}")
    app.logger.info(f"Request files: {list(request.files.keys())}")
    try:
        file = request.files.get('image')
        if not file:
            app.logger.error("No file part in the request")
            return jsonify({'error': 'No file part in the request'}), 400

        # Check file extension for supported types
        filename = file.filename.lower()
        if not (filename.endswith('.jpg') or filename.endswith('.jpeg') or filename.endswith('.png')):
            app.logger.error(f"Unsupported file type: {filename}")
            return jsonify({'error': 'Kind of file not supported'}), 400

        # Read file content once
        file_content = file.read()

        try:
            img = image.load_img(BytesIO(file_content), target_size=(224, 224))
        except Exception as e:
            app.logger.error(f"Error loading image: {e}")
            return jsonify({'error': 'Illegal format not supported'}), 400
        x = image.img_to_array(img)
        x = preprocess_input(np.expand_dims(x, axis=0))
        features = model.predict(x)[0].tolist()
        return jsonify({'features': features})
    except Exception as e:
        app.logger.error(f"Error in /extract: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
