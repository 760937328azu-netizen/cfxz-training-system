#!/usr/bin/env python3
"""
Remove baked-in checkerboard background from the 5 rice-water craft step icons
and save transparent PNGs to public/rice-steps/.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

BASE = Path("C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了")
CLIPBOARD = Path("C:/Users/HUAWEI/.workbuddy/clipboard-images")
OUT_DIR = BASE / "public" / "rice-steps"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Order matches craftSteps: 取米, 淘洗, 发酵, 检查, 提取
STEPS = {
    "qu-mi": CLIPBOARD / "clipboard-2026-07-22T10-06-06-930Z-214bdb05.jpg",
    "tao-xi": CLIPBOARD / "clipboard-2026-07-22T10-06-06-932Z-9383d97e.jpg",
    "fa-jiao": CLIPBOARD / "clipboard-2026-07-22T10-06-06-934Z-346f7e87.jpg",
    "jian-cha": CLIPBOARD / "clipboard-2026-07-22T10-06-06-936Z-76729664.jpg",
    "ti-qu": CLIPBOARD / "clipboard-2026-07-22T10-06-06-927Z-1148ee6a.jpg",
}


def circular_icon_mask(img_path: Path, output_path: Path, target_size: int = 512, margin: int = 8):
    """
    The icons are centered circular compositions on a checkerboard background.
    Instead of trying to color-segment the checkerboard, we crop to the inscribed
    circle (just inside the square edge) so the entire icon + its own decorative
    ring is kept and only the corner checkerboard is removed.
    """
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]

    cy, cx = h // 2, w // 2
    radius = min(h, w) // 2 - margin

    yy, xx = np.ogrid[:h, :w]
    mask = (yy - cy) ** 2 + (xx - cx) ** 2 <= radius ** 2

    alpha = arr[:, :, 3].copy()
    alpha[~mask] = 0
    arr[:, :, 3] = alpha

    # Crop to the bounding square of the circle, then resize for web use
    left = max(0, cx - radius)
    top = max(0, cy - radius)
    right = min(w, cx + radius)
    bottom = min(h, cy + radius)
    out = Image.fromarray(arr).crop((left, top, right, bottom))
    out = out.resize((target_size, target_size), Image.LANCZOS)
    out.save(output_path)
    print(f"saved {output_path} ({out.width}x{out.height})")


if __name__ == "__main__":
    for key, src in STEPS.items():
        if not src.exists():
            print(f"Missing source: {src}")
            continue
        circular_icon_mask(src, OUT_DIR / f"{key}.png")
    print("Done.")
