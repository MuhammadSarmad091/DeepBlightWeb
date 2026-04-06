def preprocess_single_image(image_path, target_size=(128, 128)):
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            # Try PIL as fallback
            img = Image.open(image_path)
            img = np.array(img)
            if len(img.shape) == 2:  # Grayscale
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            elif img.shape[2] == 4:  # RGBA
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

        # Resize to target size
        img_resized = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)

        # Normalize to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0

        return img_normalized
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

print("Preprocessing function defined.")
print("=" * 60)
print("Usage:")
print("  1. Upload your image to Google Drive")
print("  2. Update 'image_path' below with the full path")
print("  3. Run the cell to get predictions")
print("=" * 60)

# Example inference on a test image
print("\nPerforming inference on a test image from the test set...")
print("=" * 60)

# Select a random test image
test_idx = np.random.randint(0, len(X_test))
test_img = X_test[test_idx]
true_label = y_test[test_idx]
true_label_name = "Leaf" if true_label == 0 else "Non-Leaf"

# Make prediction
prediction = model.predict(np.expand_dims(test_img, axis=0), verbose=0)
pred_label = int(prediction[0, 0] > 0.5)
pred_label_name = "Leaf" if pred_label == 0 else "Non-Leaf"
confidence = prediction[0, 0] if pred_label == 1 else 1 - prediction[0, 0]