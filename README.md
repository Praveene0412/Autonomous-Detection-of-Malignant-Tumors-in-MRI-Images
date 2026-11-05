# Autonomous Detection of Malignant Tumors in MRI Images 

## 📌 Project Overview

Brain tumors are among the serious medical conditions that require early and accurate diagnosis. Magnetic Resonance Imaging (MRI) plays an important role in identifying abnormalities in brain tissues. However, manual examination of MRI scans can be time-consuming and may require extensive medical expertise.

This project, **Autonomous Detection of Malignant Tumors in MRI Images Using Deep Learning**, aims to develop an automated brain tumor detection system using Convolutional Neural Networks (CNN).

The system processes brain MRI images, applies image preprocessing techniques, and uses a trained deep learning model to identify whether a tumor is present. A web-based application developed using Flask provides an interface for users to upload MRI images and obtain prediction results.

The project integrates deep learning, image processing, web technologies, and database management to provide an accessible prototype for automated brain MRI image classification.

## 🎯 Objectives

- Develop an automated brain tumor detection system using deep learning.
- Apply image preprocessing techniques to improve input consistency.
- Train a CNN model to classify brain MRI images.
- Provide a user-friendly web interface for MRI image uploads.
- Integrate Flask for backend processing and MongoDB for database management.
- Display prediction results through a web-based application.

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Programming Language | Python |
| Deep Learning | CNN, TensorFlow, Keras |
| Image Processing | OpenCV, NumPy |
| Backend | Flask |
| Frontend | HTML, CSS, JavaScript |
| Database | MongoDB |
| Package Management | pip, npm |
| Development Tools | VS Code, Git, GitHub |

## 🧠 Methodology

### 1. Dataset Collection

Brain MRI images are used to train and evaluate the deep learning model. The dataset contains images representing the relevant tumor and non-tumor classes.

### 2. Image Preprocessing

The input MRI images undergo preprocessing before being supplied to the model.

The preprocessing steps include:

- Image resizing to 64 × 64 pixels.
- Pixel normalization.
- Preparing images in a consistent format for model input.

### 3. CNN Model Development

A Convolutional Neural Network (CNN) is used for image classification.

The CNN architecture consists of the following major layers:

- **Convolutional Layers:** Extract relevant features from MRI images.
- **Max Pooling Layers:** Reduce spatial dimensions while retaining important features.
- **Flatten Layer:** Converts extracted feature maps into a one-dimensional representation.
- **Dense Layers:** Learn patterns for classification.
- **Dropout Layer:** Helps reduce overfitting.
- **Output Layer:** Produces the final classification prediction.

The model is trained using the prepared MRI image dataset.

### 4. Model Evaluation

The trained model is evaluated using classification performance measures, including:

- Accuracy
- Precision
- Recall
- F1-score
- Confusion Matrix

### 5. Web Application Development

A Flask-based web application is developed to provide an interface for interacting with the trained model.

Users can upload MRI images through the frontend. The backend processes the uploaded image, performs prediction using the trained model, and displays the result.

### 6. Database Integration

MongoDB is integrated with the application for database-related operations.

## 🏗️ System Architecture

```text
       User
        |
        v
  Web Application
 (HTML, CSS, JavaScript)
        |
        v
    Flask Backend
        |
        v
   Image Upload
        |
        v
 Image Preprocessing
 (Resize and Normalize)
        |
        v
   Trained CNN Model
        |
        v
  Tumor Classification
        |
        v
  Prediction Result
        |
        v
    User Interface

        |
        v
     MongoDB
(Database Operations)
```

## 📂 Project Structure

```text
Brain-Tumor-Detection/
│
├── public/
│   ├── index.html
│   ├── history.html
│   ├── script.js
│   ├── style.css
│   └── assets/
│
├── python/
│   └── Model and Python-related files
│
├── app.py
├── predict.py
├── fix_dates.py
│
├── server.js
├── package.json
├── package-lock.json
│
├── requirements.txt
├── confusion_matrix.png
├── training_plot.png
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following are installed:

- Python 3.x
- Node.js and npm
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Praveene0412/Brain-Tumor-Detection.git
```

### 2. Navigate to the Project Directory

```bash
cd Brain-Tumor-Detection
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install Node.js Dependencies

```bash
npm install
```

### 5. Configure MongoDB

Make sure MongoDB is running and configure the database connection using your local or deployed MongoDB connection string.

Keep credentials and secret keys in environment variables rather than committing them to GitHub.

### 6. Run the Application

Start the Flask application using the appropriate entry point:

```bash
python app.py
```

If the project uses `server.js` to start the frontend or Node.js server, start it separately using the command configured in `package.json`.

Open the local application address displayed in your terminal.

## 📊 Results and Performance

The model is evaluated using standard classification metrics.

The reported experimental results include approximately:

| Evaluation Metric | Reported Result |
|---|---:|
| Training Accuracy | 97.8% |
| Testing Accuracy | 97% |
| Precision | 94% |
| Recall | 96% |
| F1-Score | 95% |

*Note: These are the previously reported experimental results. Confirm them against the final model evaluation before treating them as the definitive results.*

### Training Performance

The repository includes visualizations of model performance:

- `training_plot.png` – Training performance visualization.
- `confusion_matrix.png` – Classification performance visualization.

## 🔬 Applications

- Automated analysis of brain MRI images.
- Deep learning-based medical image classification research.
- Computer-aided diagnostic research.
- Educational and academic research in medical image processing.

## ⚠️ Limitations

- Prediction performance depends on dataset quality and diversity.
- The system's output requires validation by qualified medical professionals.
- The application is a research prototype and is not intended to replace professional medical diagnosis.

## 🚀 Future Enhancements

- Explore advanced deep learning architectures to improve classification performance.
- Extend the system with tumor localization and segmentation.
- Improve model generalization using larger and more diverse datasets.
- Enhance application security and deployment capabilities.
- Develop additional visualization features for prediction results.

## 📄 Research Publication

**Research Paper:** Autonomous Detection of Malignant Tumors in Medical Images of Brain

**Published in:** International Journal of Research and Analytical Reviews (IJRAR)

**Volume:** 13, Issue 2, May 2026

**Publication Link:** https://ijrar.org/viewfull.php?&p_id=IJRAR26B2229

## 👨‍💻 Project Contributors

- Praveen E
- Pallavi S
- Swetha P
- Ume Kulsum

**Project Guide:** Dr. Hemalatha K L

**Department:** Computer Science and Engineering

**Institution:** Sri Krishna Institute of Technology, Bengaluru

---

## ⭐ Acknowledgement

We sincerely express our gratitude to our project guide, **Dr. Hemalatha K L**, for her continuous guidance, valuable suggestions, encouragement, and support throughout the development of this project and the associated research publication.

We also thank the Department of Computer Science and Engineering, Sri Krishna Institute of Technology, for providing the support and resources required to complete this project.

---

## 📜 License

This project is intended for academic and research purposes. Please contact the contributors before reusing project datasets, trained models, or other materials for external purposes.
