import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'   # Hide TF logs

import cv2
import numpy as np
from PIL import Image
from keras.models import load_model

# ---------- CONFIG ----------
INPUT_SIZE = 64
model_path = r"C:\Users\USER\Desktop\Pro\python\BrainTumor_Model.keras"

#  Change this to the image you want to test
image_path = r"C:\Users\USER\Desktop\Pro\split_data\test\yes\Tr-me_0126.jpg"

# ---------- LOAD MODEL ----------
print("  Loading trained model...")
model = load_model(model_path)
print("  Model loaded successfully!")

# ---------- PREPROCESS IMAGE ----------
def preprocess_image(img_path):
    img = cv2.imread(img_path)
    if img is None:
        print(f"  Could not read image: {img_path}")
        return None
    img = Image.fromarray(img, 'RGB').resize((INPUT_SIZE, INPUT_SIZE))
    img = np.array(img) / 255.0          # normalize
    img = np.expand_dims(img, axis=0)    # shape (1,64,64,3)
    return img

# ---------- PREDICT ----------
if os.path.exists(image_path):
    img = preprocess_image(image_path)
    if img is not None:
        pred_prob = model.predict(img, verbose=0)[0][0]
        # Keep same mapping you used: pred_prob < 0.5 -> class 0 (Tumor)
        pred_class = 0 if pred_prob < 0.5 else 1   # 0=Tumor, 1=No Tumor
        label = "Tumor" if pred_class == 0 else "No Tumor"
        print(f"\n  Image: {os.path.basename(image_path)}")
        print(f"  Prediction: {label} (prob={pred_prob:.4f})")
else:
    print(f"  Image not found: {image_path}")
    
pred_prob = model.predict(img, verbose=0)[0][0]
pred_class = 0 if pred_prob < 0.5 else 1
label = "Tumor" if pred_class == 0 else "No Tumor"

# Calculate confidence (accuracy for this single prediction)
confidence = (1 - pred_prob) * 100 if pred_class == 0 else pred_prob * 100

print(f"\nPrediction: {label}")
print(f"Confidence: {confidence:.2f}%")
