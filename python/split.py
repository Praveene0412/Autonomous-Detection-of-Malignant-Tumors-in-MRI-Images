import os
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

# ---------- STEP 0: Paths ----------
dataset_dir = r"C:\Users\USER\Desktop\Pro\Datasets"
csv_path = os.path.join(dataset_dir, "dataset_labels.csv")
output_dir = r"C:\Users\USER\Desktop\Pro\split_data"
splits_csv_dir = os.path.join(output_dir, "csv_splits")

# ---------- STEP 1: Load CSV ----------
df = pd.read_csv(csv_path)
print(f"  Loaded {len(df)} records from CSV")

# ---------- STEP 2: Split into Train+Val and Test ----------
train_val_df, test_df = train_test_split(
    df, test_size=0.30, stratify=df["label"], random_state=0
)

# Now split train_val into Train and Validation
train_df, val_df = train_test_split(
    train_val_df, test_size=0.142857,  # ~10% of original dataset
    stratify=train_val_df["label"], random_state=0
)

print(f"Train: {len(train_df)}, Validation: {len(val_df)}, Test: {len(test_df)}")

# ---------- STEP 3: Prepare output folders ----------
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
    print("  Old split_data folder removed")

folders = [
    os.path.join(output_dir, "train", "yes"),
    os.path.join(output_dir, "train", "no"),
    os.path.join(output_dir, "val", "yes"),
    os.path.join(output_dir, "val", "no"),
    os.path.join(output_dir, "test", "yes"),
    os.path.join(output_dir, "test", "no"),
]

for f in folders:
    os.makedirs(f, exist_ok=True)

# ---------- STEP 4: Copy images ----------
def copy_images(dataframe, split_name):
    for _, row in dataframe.iterrows():
        file = row["filename"]
        label = row["label"]

        #  Mapping if needed
        label_folder = "yes" if label == 0 else "no"

        src = os.path.join(dataset_dir, label_folder, file)
        dst = os.path.join(output_dir, split_name, label_folder, file)

        if os.path.exists(src):
            shutil.copy(src, dst)
        else:
            print(f"  Warning: {src} does not exist and was skipped")

copy_images(train_df, "train")
copy_images(val_df, "val")
copy_images(test_df, "test")

print("  Dataset split completed from CSV !!")

# ---------- STEP 5: Save split info into CSVs ----------
os.makedirs(splits_csv_dir, exist_ok=True)
train_df.to_csv(os.path.join(splits_csv_dir, "train_split.csv"), index=False)
val_df.to_csv(os.path.join(splits_csv_dir, "val_split.csv"), index=False)
test_df.to_csv(os.path.join(splits_csv_dir, "test_split.csv"), index=False)
print(f"  Saved split CSVs inside {splits_csv_dir}")

# ---------- STEP 6: Print class-wise counts ----------
print("\n  Class distribution:")
for split, data in [("Train", train_df), ("Validation", val_df), ("Test", test_df)]:
    print(f"{split}: Tumor={sum(data['label']==0)}, No-Tumor={sum(data['label']==1)}")
