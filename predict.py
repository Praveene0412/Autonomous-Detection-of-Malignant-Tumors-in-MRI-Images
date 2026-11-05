import sys
import json
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# -------------------------------------------
# Default paths (for manual testing only)
# -------------------------------------------
DEFAULT_IMAGE_PATH = r"C:\Users\USER\Desktop\Pro\split_data\test\yes\Te-pi_0050.jpg"
DEFAULT_MODEL_PATH = r"C:\Users\USER\Desktop\Pro\python\BrainTumor_Model.keras"

# -------------------------------------------
# Input size (must match training)
# -------------------------------------------
INPUT_SIZE = 64  # or whatever your trainMain.py used

def predict_tumor(img_path, model_path):
    # Load trained Keras model
    model = load_model(model_path)

    # Load and preprocess image (RGB, normalized)
    img = image.load_img(img_path, target_size=(INPUT_SIZE, INPUT_SIZE), color_mode='rgb')
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Model prediction
    pred = model.predict(img_array, verbose=0)[0][0]

    # ✅ FIXED LOGIC: model outputs 1 = No Tumor, 0 = Tumor
    tumor_detected = pred < 0.5
    confidence = (1 - pred) * 100 if tumor_detected else pred * 100

    # Clean result output
    result_message = "Tumor Detected" if tumor_detected else "No Tumor Detected"

    return {
        "tumorDetected": bool(tumor_detected),
        "confidence": round(float(confidence), 2),
        "message": result_message
    }

if __name__ == "__main__":
    try:
        # Use command-line args if available, else fallback to defaults
        if len(sys.argv) == 3:
            image_path = sys.argv[1]
            model_path = sys.argv[2]
        else:
            image_path = DEFAULT_IMAGE_PATH
            model_path = DEFAULT_MODEL_PATH

        result = predict_tumor(image_path, model_path)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))