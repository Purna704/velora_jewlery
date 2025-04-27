from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from io import BytesIO
import os

app = Flask(__name__)
CORS(app)

# Load ResNet50 model
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

@app.route('/extract', methods=['POST'])
def extract_features():
    file = request.files['image']
    img = image.load_img(BytesIO(file.read()), target_size=(224, 224))
    x = image.img_to_array(img)
    x = preprocess_input(np.expand_dims(x, axis=0))
    features = model.predict(x)[0].tolist()
    return jsonify({'features': features})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # <-- NEW: dynamic port from Render
    app.run(host='0.0.0.0', port=port)        # <-- NEW: bind to 0.0.0.0
