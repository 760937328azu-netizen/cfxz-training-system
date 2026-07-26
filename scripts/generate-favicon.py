"""Generate favicon and touch icon files from the company logo."""
from PIL import Image
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_LOGO = os.path.join(BASE_DIR, "public", "logo", "cfxz-flat-logo.png")
OUT_DIR = os.path.join(BASE_DIR, "public", "logo")
ICO_PATH = os.path.join(BASE_DIR, "public", "favicon.ico")

img = Image.open(SRC_LOGO).convert("RGBA")

# Trim transparent borders to find the actual logo bounds
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Determine square canvas size based on max dimension
w, h = img.size
size = max(w, h)

# Center the logo on a square transparent canvas
square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
offset = ((size - w) // 2, (size - h) // 2)
square.paste(img, offset, img)

# Add a small padding so the logo doesn't touch the edges
padding_ratio = 0.06
padded_size = int(size * (1 + padding_ratio * 2))
padded = Image.new("RGBA", (padded_size, padded_size), (0, 0, 0, 0))
offset = ((padded_size - size) // 2, (padded_size - size) // 2)
padded.paste(square, offset, square)
base = padded

# Save multi-size ICO
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_imgs = [base.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_imgs[0].save(ICO_PATH, format="ICO", sizes=ico_sizes)

# Save PNG touch icons
png_configs = [
    (32, 32, "favicon-32x32.png"),
    (180, 180, "apple-touch-icon.png"),
    (192, 192, "android-chrome-192x192.png"),
    (512, 512, "android-chrome-512x512.png"),
]

for width, height, filename in png_configs:
    resized = base.resize((width, height), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, filename), format="PNG")

print("Favicon files generated successfully:")
for _, _, name in png_configs:
    print(f"  - public/logo/{name}")
print(f"  - public/favicon.ico")
