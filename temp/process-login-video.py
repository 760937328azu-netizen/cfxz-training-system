import os
import numpy as np
from PIL import Image, ImageFilter
import imageio.v3 as iio

SRC = r"D:\Downloads\小瑶快乐跑动视频制作.mp4"
DST = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg.mp4"


def remove_watermark(frame: np.ndarray) -> np.ndarray:
    """Blur the bottom-right watermark region."""
    img = Image.fromarray(frame)
    w, h = img.size
    # Watermark appears in bottom-right corner, approximate region
    wm_w = int(w * 0.22)
    wm_h = int(h * 0.09)
    left = w - wm_w - int(w * 0.02)
    top = h - wm_h - int(h * 0.02)
    right = left + wm_w
    bottom = top + wm_h

    region = img.crop((left, top, right, bottom))
    region = region.filter(ImageFilter.GaussianBlur(radius=12))
    img.paste(region, (left, top))
    return np.array(img)


def process_frame(frame: np.ndarray) -> np.ndarray:
    """Light blur + subtle dark overlay."""
    img = Image.fromarray(frame)
    # Light overall blur so video remains recognizable
    img = img.filter(ImageFilter.GaussianBlur(radius=4))
    arr = np.array(img).astype(np.float32)

    # Subtle dark overlay: blend with dark color at ~14% opacity
    overlay = np.array([26, 18, 14], dtype=np.float32)
    alpha = 0.14
    arr = arr * (1 - alpha) + overlay * alpha
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return arr


def main():
    print("Reading video frames...")
    frames = iio.imread(SRC, plugin="pyav")
    print(f"Total frames: {len(frames)}")

    fps = iio.immeta(SRC, plugin="pyav").get("fps", 30)

    processed = []
    for i, frame in enumerate(frames):
        frame = remove_watermark(frame)
        frame = process_frame(frame)
        processed.append(frame)
        if (i + 1) % 60 == 0:
            print(f"Processed {i + 1}/{len(frames)} frames")

    print("Writing output video...")
    iio.imwrite(DST, processed, fps=fps, codec="libx264", quality=8)
    print(f"Saved to {DST}")


if __name__ == "__main__":
    main()
