import os
import cv2
import numpy as np
from PIL import Image
from keras.utils import normalize
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import matplotlib.pyplot as plt
import pandas as pd
import time
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns

# ---------- PATHS ----------
dataset_dir      = r"C:\Users\USER\Desktop\Pro\Datasets"
splits_csv_dir   = r"C:\Users\USER\Desktop\Pro\split_data\csv_splits"

train_csv = os.path.join(splits_csv_dir, "train_split.csv")
val_csv   = os.path.join(splits_csv_dir, "val_split.csv")
test_csv  = os.path.join(splits_csv_dir, "test_split.csv")

# Save locations
save_model_path = r"C:\Users\USER\Desktop\Pro\python\BrainTumor_Model.keras"
save_plot_path  = r"C:\Users\USER\Desktop\Pro\training_plot.png"
cm_plot_path    = r"C:\Users\USER\Desktop\Pro\confusion_matrix.png"

INPUT_SIZE = 64

# ---------- LOAD DATA FROM CSV ----------
def load_from_csv(csv_file):
    df = pd.read_csv(csv_file)
    data, labels = [], []
    for _, row in df.iterrows():
        file = row["filename"]
        label = row["label"]

        # Mapping: 0 = tumor (yes), 1 = no tumor (no)
        label_folder = "yes" if label == 0 else "no"

        img_path = os.path.join(dataset_dir, label_folder, file)
        if not os.path.exists(img_path):
            print(f"  Missing file: {img_path}")
            continue

        img = cv2.imread(img_path)
        if img is None:
            print(f"  Could not read: {img_path}")
            continue

        img = Image.fromarray(img, 'RGB').resize((INPUT_SIZE, INPUT_SIZE))
        data.append(np.array(img))
        labels.append(label)

    return np.array(data), np.array(labels)

# ---------- LOAD SPLITS ----------
x_train, y_train = load_from_csv(train_csv)
x_val, y_val     = load_from_csv(val_csv)
x_test, y_test   = load_from_csv(test_csv)

print(f"Training images: {len(x_train)}, Validation images: {len(x_val)}, Test images: {len(x_test)}")

# Normalize
x_train = normalize(x_train, axis=1)
x_val   = normalize(x_val, axis=1)
x_test  = normalize(x_test, axis=1)

# ---------- BUILD CNN ----------
model = Sequential([
    Conv2D(32, (3,3), input_shape=(INPUT_SIZE, INPUT_SIZE, 3), activation='relu'),
    MaxPooling2D((2,2)),
    Conv2D(32, (3,3), activation='relu'),
    MaxPooling2D((2,2)),
    Conv2D(64, (3,3), activation='relu'),
    MaxPooling2D((2,2)),
    Flatten(),
    Dense(64, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')   # Binary classification
])

model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# ---------- CALLBACKS ----------
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=3,
    restore_best_weights=True,
    verbose=1
)

checkpoint = ModelCheckpoint(
    filepath=save_model_path,
    monitor='val_loss',
    save_best_only=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.2,         # reduce learning rate by 20%
    patience=2,         # if val_loss doesn't improve for 2 epochs
    min_lr=1e-6,
    verbose=1
)

# ---------- TRAIN MODEL ----------
start_time = time.time()

history = model.fit(
    x_train, y_train,
    batch_size=16,
    epochs=25,
    validation_data=(x_val, y_val),
    verbose=1,
    callbacks=[early_stop, checkpoint, reduce_lr]
)

end_time = time.time()
elapsed_time = end_time - start_time
print(f"\nTraining completed in {elapsed_time:.2f} seconds")

# ---------- FINAL ACCURACY ----------
test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
print(f"\n✅ Final Test Accuracy: {test_acc * 100:.2f}%")


# ---------- EVALUATE ----------
y_pred = model.predict(x_test)
y_pred = (y_pred > 0.5).astype("int32")

cm = confusion_matrix(y_test, y_pred)
cr = classification_report(y_test, y_pred, digits=4)

print("\n=== CNN Results ===")
print("Confusion Matrix:")
print(cm)
print("\nClassification Report:")
print(cr)

# ---------- SAVE PLOTS ----------
plt.figure(figsize=(12,5))

# Accuracy plot
plt.subplot(1,2,1)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Val Accuracy')
plt.title("Accuracy")
plt.xlabel("Epochs")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(True)

# Loss plot
plt.subplot(1,2,2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title("Loss")
plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig(save_plot_path)
print(f"Training plots saved as {save_plot_path}")

# ---------- CONFUSION MATRIX HEATMAP ----------
plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=True,
            xticklabels=["No Tumor", "Tumor"],
            yticklabels=["No Tumor", "Tumor"])
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.savefig(cm_plot_path)
plt.close()
print(f"Confusion Matrix plot saved as {cm_plot_path}")
