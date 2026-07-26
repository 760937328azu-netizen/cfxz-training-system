#!/usr/bin/env python3
"""处理三张发型截图，去除棋盘格背景，输出透明 PNG。"""
import sys
from pathlib import Path

# 复用项目已有的去背景函数
sys.path.insert(0, str(Path(__file__).parent))
from remove_checkerboard import remove_checkerboard

mappings = [
    (
        "C:/Users/HUAWEI/.workbuddy/clipboard-images/clipboard-2026-07-22T07-49-39-156Z-ec4e9318.png",
        "C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/hairstyles/guizhongxiu.png",
    ),
    (
        "C:/Users/HUAWEI/.workbuddy/clipboard-images/clipboard-2026-07-22T07-49-39-159Z-9e3d6da4.png",
        "C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/hairstyles/luosifa.png",
    ),
    (
        "C:/Users/HUAWEI/.workbuddy/clipboard-images/clipboard-2026-07-22T07-49-39-161Z-d77a52a0.png",
        "C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/hairstyles/wulongpanfa.png",
    ),
]

for src, dst in mappings:
    print(f"Processing {Path(src).name} -> {Path(dst).name}")
    remove_checkerboard(src, dst, tolerance=18)

print("Done.")
