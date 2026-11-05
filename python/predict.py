import sys
import json
import os
import numpy as np
from keras.models import load_model
from keras.preprocessing import image

# Model + Input config
INPUT_SIZE = 64
DEFAULT_MODEL_PATH = r"C:\Users\USER\Desktop\Pro\python\BrainTumor_Model.keras"
DEFAULT_IMAGE_PATH = r"C:\Users\USER\Desktop\Pro\split_data\test\yes\Tr-me_0126.jpg"


def predict_tumor(img_path, model_path):
    if not os.path.exists(img_path):
        return {"error": f"Image file not found: {img_path}"}
    if not os.path.exists(model_path):
        return {"error": f"Model file not found: {model_path}"}

    print("🔹 Loading model...")
    model = load_model(model_path, compile=False)

    print("🔹 Preprocessing image...")
    img = image.load_img(img_path, target_size=(INPUT_SIZE, INPUT_SIZE))
    img_arr = image.img_to_array(img) / 255.0
    img_arr = np.expand_dims(img_arr, axis=0)

    pred = model.predict(img_arr, verbose=0)

    # Sigmoid single output
    prob = float(pred[0][0])
    tumor_detected = prob < 0.5
    confidence = (1 - prob) * 100 if tumor_detected else prob * 100

    return {
        "tumorDetected": bool(tumor_detected),
        "confidence": round(confidence, 2),
        "message": "Tumor Detected" if tumor_detected else "No Tumor Detected"
    }


if __name__ == "__main__":
    # CLI Safe Argument Handling
    image_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_IMAGE_PATH
    model_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_MODEL_PATH

    result = predict_tumor(image_path, model_path)
    print(json.dumps(result))
