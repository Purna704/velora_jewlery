from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from io import BytesIO

app = Flask(__name__)
CORS(app)

# Load ResNet50 model
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

@app.route('/extract', methods=['POST'])
def extract_features():
    try:
        file = request.files['image']
        img = image.load_img(BytesIO(file.read()), target_size=(224, 224))
        x = image.img_to_array(img)
        x = preprocess_input(np.expand_dims(x, axis=0))
        features = model.predict(x)[0].tolist()
        return jsonify({'features': features})
    except Exception as e:
        app.logger.error(f"Error in /extract: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
