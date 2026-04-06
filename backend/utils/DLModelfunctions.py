import cv2
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image



# ----------- Normalization (Equation 1 from paper) -----------
def normalize_image(img, nmin=0, nmax=255):
    img = img.astype(np.float32)
    min_val = np.min(img)
    max_val = np.max(img)
    if max_val - min_val == 0:
        return np.full_like(img, nmin, dtype=np.uint8)
    
    norm = (img - min_val) * ((nmax - nmin) / (max_val - min_val)) + nmin
    return norm.astype(np.uint8)


# ----------- CLAHE (applied on L channel in LAB space) -----------
def apply_clahe(img, clip_limit=2.0, tile_grid_size=(8, 8)):
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    cl = clahe.apply(l)
    merged = cv2.merge((cl, a, b))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)


# ----------- Resize to 256×256 with Nearest Neighbor -----------
def resize_image(img, size=(256, 256)):
    return cv2.resize(img, size, interpolation=cv2.INTER_NEAREST)


# ----------- Preprocessing Pipeline -----------
def preprocess_for_inference(img_path):
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    img = normalize_image(img, 0, 255)
    img = apply_clahe(img)
    img = resize_image(img, size=(256, 256))

    img = img.astype(np.float32) / 255.0  # scale for model inference
    img = np.expand_dims(img, axis=0)     # add batch dimension
    return img

# ----------- Leaf Detect Pre process Pipeline -----------
def leaf_preprocess(image_path, target_size=(128, 128)):
    import cv2
    import numpy as np
    img = cv2.imread(image_path)
    if img is None:
        img = Image.open(image_path)
        img = np.array(img)
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        elif img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
    img_resized = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
    img_normalized = img_resized.astype(np.float32) / 255.0
    return img_normalized
