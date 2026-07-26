import os
from PIL import Image, ImageFilter
import numpy as np

BASE_DIR = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了"
LOGO_DIR = os.path.join(BASE_DIR, "public", "logo")


def make_coin_transparent(input_path, output_path):
    """Remove black background from circular coin logo while preserving internal design."""
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # brightness = max channel value
    brightness = np.maximum(np.maximum(r, g), b)

    # Mask: pixels that are not very dark (belong to the coin)
    # Coin has dark red (R~80, G~10, B~15) which is above threshold.
    # Background is pure/near black.
    dark_threshold = 22
    mask = brightness > dark_threshold

    # Clean up: remove tiny noise by requiring connected components of reasonable size.
    from scipy import ndimage
    labeled, num_features = ndimage.label(mask)
    if num_features > 0:
        sizes = ndimage.sum(mask, labeled, range(1, num_features + 1))
        largest_label = np.argmax(sizes) + 1
        mask = labeled == largest_label

    # Dilate slightly to keep anti-aliased edges
    mask = ndimage.binary_dilation(mask, iterations=2)

    # Feather alpha at the edge for smoothness
    # Distance transform: inside mask, distance to nearest background pixel
    dist = ndimage.distance_transform_edt(mask)
    # Normalize distance: full opacity at >= 6px inside, fade over 6px
    alpha = np.clip(dist / 6.0, 0, 1) * 255
    alpha = alpha.astype(np.uint8)

    # Apply alpha
    arr[:, :, 3] = alpha
    result = Image.fromarray(arr)
    result.save(output_path, "PNG")
    print(f"Processed logo: {output_path}")


def process_logos():
    coin_logos = [
        "cfxz-3d-coin.png",
        "cfxz-logo-secondary.png",
        "cfxz-logo-primary.png",
        "logo2.png",
    ]
    for name in coin_logos:
        src = os.path.join(LOGO_DIR, name)
        if os.path.exists(src):
            make_coin_transparent(src, src)


if __name__ == "__main__":
    process_logos()
