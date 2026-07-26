import cv2
import numpy as np

ORIG = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg-original.mp4"
CLEAN = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg.mp4"
WX, WY, WW, WH = 130, 25, 365, 120
WX2, WY2 = WX + WW, WY + WH

morph_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7))

def text_pixel_ratio(roi_gray):
    tophat = cv2.morphologyEx(roi_gray, cv2.MORPH_TOPHAT, morph_kernel)
    blackhat = cv2.morphologyEx(roi_gray, cv2.MORPH_BLACKHAT, morph_kernel)
    _, m1 = cv2.threshold(tophat, 12, 255, cv2.THRESH_BINARY)
    _, m2 = cv2.threshold(blackhat, 12, 255, cv2.THRESH_BINARY)
    mask = cv2.bitwise_or(m1, m2)
    return np.count_nonzero(mask) / mask.size

for label, path in [("ORIGINAL", ORIG), ("CLEANED", CLEAN)]:
    cap = cv2.VideoCapture(path)
    ratios = []
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    for fi in [0, total // 2, total - 1]:
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ret, f = cap.read()
        if not ret:
            continue
        roi = cv2.cvtColor(f[WY:WY2, WX:WX2], cv2.COLOR_BGR2GRAY)
        ratios.append(text_pixel_ratio(roi))
    cap.release()
    avg = np.mean(ratios) if ratios else 0
    print(f"{label}: text-pixel ratio per frame = {[f'{r:.4f}' for r in ratios]}, avg={avg:.4f}")

import os
print(f"\nFile sizes:")
print(f"  original: {os.path.getsize(ORIG)/1024:.0f} KB")
print(f"  cleaned:  {os.path.getsize(CLEAN)/1024:.0f} KB")
