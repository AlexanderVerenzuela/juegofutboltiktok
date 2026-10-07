from PIL import Image
import os

img_path = r"C:\Users\Usuario\.gemini\antigravity-ide\brain\e19910ef-04b4-4a40-94b0-f49c9de4d6af\media__1791406373169.png"
img = Image.open(img_path)
width, height = img.size
print(f"Image dimensions: {width} x {height}")

# In the screenshot (e.g., 1024x576 or 1280x720 or similar):
# The bottom-right card "Mbappe 91 ST" is located approximately:
# x: from 51% to 69% of width
# y: from 51% to 88% of height

box = (
    int(width * 0.51),
    int(height * 0.51),
    int(width * 0.69),
    int(height * 0.89)
)

cropped = img.crop(box)
dest_path = r"c:\Users\Usuario\Downloads\Anime-Live-Detector-v2\Anime-Live-Detector\public\uploads\mbappe_card_exact.png"
cropped.save(dest_path)
print(f"Saved cropped Mbappé card to {dest_path} (size: {cropped.size})")
