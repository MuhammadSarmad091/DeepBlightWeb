import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import os

INSECT_DETECTOR_PATH = "models/pretrained_models/insect_vs_noninsect_densenet201.h5"
PEST_CLASSIFIER_PATH = "models/pretrained_models/DenseNet201_PotatoPest.h5"

def load_models():
    detector_model = load_model(INSECT_DETECTOR_PATH, compile=False)
    classifier_model = load_model(PEST_CLASSIFIER_PATH, compile=False)
    
    print("Both models loaded successfully!")
    return detector_model, classifier_model

PEST_CLASS_NAMES = [
    'Agrotis ipsilon (Hufnagel)',
    'Amrasca devastans (Distant)',
    'Aphis gossypii Glover',
    'Bemisia tabaci (Gennadius)', 
    'Brachytrypes portentosus Lichtenstein',
    'Epilachna vigintioctopunctata (Fabricius)',
    'Myzus persicae (Sulzer)',
    'Phthorimaea operculella (Zeller)'
]

BINARY_CLASS_NAMES = ['insect', 'noninsect']  

def preprocess_image(img_path, target_size=(224, 224)):
    img = image.load_img(img_path, target_size=target_size)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    return img_array


def detect_insect(detector_model, img_array):
    preds = detector_model.predict(img_array, verbose=0)
    probs = preds[0]
    class_idx = int(np.argmax(probs))
    confidence = float(probs[class_idx])
    label = BINARY_CLASS_NAMES[class_idx]
    return label, confidence, probs.tolist()

def classify_pest(classifier_model, img_array):
    preds = classifier_model.predict(img_array, verbose=0)
    probs = preds[0]
    class_idx = int(np.argmax(probs))
    confidence = float(probs[class_idx])
    label = PEST_CLASS_NAMES[class_idx]
    return label, confidence, probs.tolist()

def predict_insect(img_path, detector_model, classifier_model):
    
    # Preprocess once (same input size for both models)
    img_array_low_dim = preprocess_image(img_path,target_size=(150,150))
    
    # ---- Stage 1: Detect Insect ----
    label, confidence, _ = detect_insect(detector_model, img_array_low_dim)
    
    print(f"[Detection] Prediction: {label}")
    print(f"[Detection] Confidence: {confidence*100:.2f}%")
    
    # If NOT insect → stop here
    if label == 'noninsect':
        print("\nResult: No insect detected in image.")
        return
    
    # ---- Stage 2: Classify Pest ----
    img_array_high_dim = preprocess_image(img_path,target_size=(224,224))
    pest_label, pest_conf, _ = classify_pest(classifier_model, img_array_high_dim)
    
    print("\n[Classification] Pest Type:", pest_label)
    print(f"[Classification] Confidence: {pest_conf*100:.2f}%")

if __name__ == "__main__":
    
    detector_model, classifier_model = load_models()
    
    img_path = "./Sample_Images/zeller_insect.jpg"
    
    predict_insect(img_path, detector_model, classifier_model)