#!/usr/bin/env python3
"""
Remove the baked-in cream/white circular background from the 5 rice-water
process icons using rembg's isnet-general-use model, and save transparent
PNGs to public/rice-steps/.
"""
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

BASE = Path("C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了")
CLIPBOARD = Path("C:/Users/HUAWEI/.workbuddy/clipboard-images")
OUT_DIR = BASE / "public" / "rice-steps"
OUT_DIR.mkdir(parents=True, exist_ok=True)

STEPS = {
    "qu-mi": CLIPBOARD / "clipboard-2026-07-22T10-06-06-930Z-214bdb05.jpg",
    "tao-xi": CLIPBOARD / "clipboard-2026-07-22T10-06-06-932Z-9383d97e.jpg",
    "fa-jiao": CLIPBOARD / "clipboard-2026-07-22T10-06-06-934Z-346f7e87.jpg",
    "jian-cha": CLIPBOARD / "clipboard-2026-07-22T10-06-06-936Z-76729664.jpg",
    "ti-qu": CLIPBOARD / "clipboard-2026-07-22T10-06-06-927Z-1148ee6a.jpg",
}


def process_icon(src_path: Path, output_path: Path, target_size: int = 512):
    img = Image.open(src_path).convert("RGBA")
    # rembg isnet-general-use removes both checkerboard and cream background.
    out = remove(img, session=SESSION)
    # Crop to centered square and resize for consistent web display
    w, h = out.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    out = out.crop((left, top, left + side, top + side))
    out = out.resize((target_size, target_size), Image.LANCZOS)
    out.save(output_path)
    print(f"saved {output_path} ({out.width}x{out.height})")


SESSION = new_session("isnet-general-use")

if __name__ == "__main__":
    for key, src in STEPS.items():
        if not src.exists():
            print(f"Missing source: {src}")
            continue
        process_icon(src, OUT_DIR / f"{key}.png")
    print("Done.")
