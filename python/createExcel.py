import os
import pandas as pd

# Folders (update paths if needed)
tumor_folder = r"C:\Users\USER\Desktop\Pro\Datasets\yes"
no_tumor_folder = r"C:\Users\USER\Desktop\Pro\Datasets\no"

data = []

# Label 0 = Tumor
for file in os.listdir(tumor_folder):
    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
        data.append([file, 0])

# Label 1 = No Tumor
for file in os.listdir(no_tumor_folder):
    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
        data.append([file, 1])

# Create DataFrame
df = pd.DataFrame(data, columns=["filename", "label"])

# Save CSV file (no openpyxl needed)
csv_path = r"C:\Users\USER\Desktop\Pro\Datasets\dataset_labels.csv"
df.to_csv(csv_path, index=False)

print(f"CSV file created at: {csv_path}")
