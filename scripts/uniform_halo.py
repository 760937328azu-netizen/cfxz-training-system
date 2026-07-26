from PIL import Image

# 以第三张乌龙盘发为基准，根据光环视觉大小设定缩放比例
# 第一张光环偏大 -> 缩小，第二张光环偏小 -> 放大
SCALES = {
    "guizhongxiu": 1.12,
    "luosifa": 1.14,
    "wulongpanfa": 1.0,
}

CANVAS = 600

for name, scale in SCALES.items():
    src = f"C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/hairstyles/{name}.png"
    img = Image.open(src).convert("RGBA")

    # 裁剪透明边距
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # 按光环目标比例缩放
    new_w = max(1, int(img.width * scale))
    new_h = max(1, int(img.height * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # 居中放到统一画布
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x = (CANVAS - img.width) // 2
    y = (CANVAS - img.height) // 2
    canvas.paste(img, (x, y), img)

    out = f"C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/hairstyles/{name}-uniform.png"
    canvas.save(out)
    print(f"saved {out} ({img.width}x{img.height})")
