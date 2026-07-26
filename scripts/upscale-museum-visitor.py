"""将用户提供的科技馆参观图片高清放大并保存到 public/assets/museum/visitor/"""
import os
from pathlib import Path
from PIL import Image, ImageFilter

SRC_DIR = Path("C:/Users/HUAWEI/.workbuddy/clipboard-images")
DST_DIR = Path("C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/assets/museum/visitor")
DST_DIR.mkdir(parents=True, exist_ok=True)

# (源文件名, 目标文件名, 缩放倍数)
ITEMS = [
    ("clipboard-2026-07-24T09-36-12-503Z-256467de.jpg", "01-prologue.jpg",            2.0),
    ("clipboard-2026-07-24T09-36-12-505Z-4b494202.jpg", "02-hongyao-women.jpg",       2.0),
    ("clipboard-2026-07-24T09-36-12-507Z-aa6e340e.jpg", "03-hairstyles.jpg",          2.0),
    ("clipboard-2026-07-24T09-36-12-509Z-51650f49.jpg", "04-ancient-china.jpg",       2.0),
    ("clipboard-2026-07-24T09-36-12-511Z-d4b7ea63.jpg", "05-rice-water-craft.jpg",    2.0),
    ("clipboard-2026-07-24T09-36-12-514Z-d15ba9ff.jpg", "06-microscopic.jpg",         2.0),
    # 解密长发：用户未提供图片，下面用占位文字；本流程跳过
    ("clipboard-2026-07-24T09-36-12-516Z-264b3eae.jpg", "08-bifida-yeast.jpg",        2.0),
    ("clipboard-2026-07-24T09-36-12-518Z-6baf268b.jpg", "09-national-brand.jpg",      2.0),
]

for src_name, dst_name, scale in ITEMS:
    src = SRC_DIR / src_name
    if not src.exists():
        print(f"SKIP (missing): {src_name}")
        continue
    img = Image.open(src).convert("RGB")
    w, h = img.size
    new_w, new_h = int(w * scale), int(h * scale)
    # LANCZOS 上采样
    upscaled = img.resize((new_w, new_h), Image.LANCZOS)
    # 轻量锐化
    sharp = upscaled.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=2))
    out = DST_DIR / dst_name
    sharp.save(out, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"OK  {src_name}  ({w}x{h} -> {new_w}x{new_h})  ->  {out.name}")
print("done")
