import cv2
import numpy as np
import sys

video_path = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg.mp4"

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("ERROR: cannot open video")
    sys.exit(1)

w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"resolution: {w}x{h}, fps: {fps:.2f}, frames: {n}")

ret, frame = cap.read()
cap.release()
if not ret:
    print("ERROR: cannot read first frame")
    sys.exit(1)

# Save first frame for reference
cv2.imwrite(r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\scripts\login-bg-frame0.png", frame)

# Analyze top-left quadrant for watermark text
# Watermarks are usually high-contrast text. Detect via thresholding.
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

# Focus on top-left region (x: 0..40%w, y: 0..18%h)
rx2 = int(w * 0.40)
ry2 = int(h * 0.18)
roi = gray[0:ry2, 0:rx2]

# Adaptive: watermark text could be light-on-dark or dark-on-light.
# Use Otsu threshold to find text pixels.
_, bw = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Morphology to connect text strokes into blobs
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
closed = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, kernel)

# Find contours
contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

candidates = []
for c in contours:
    x, y, cw, ch = cv2.boundingRect(c)
    area = cw * ch
    # Watermark text band: wider than tall, reasonable size
    if cw > 60 and ch > 15 and area > 1500 and cw > ch:
        candidates.append((x, y, cw, ch, area))

# Also check the inverse (in case Otsu picked background)
_, bw2 = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
closed2 = cv2.morphologyEx(bw2, cv2.MORPH_CLOSE, kernel)
contours2, _ = cv2.findContours(closed2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for c in contours2:
    x, y, cw, ch = cv2.boundingRect(c)
    area = cw * ch
    if cw > 60 and ch > 15 and area > 1500 and cw > ch:
        candidates.append((x, y, cw, ch, area))

print(f"\nTop-left ROI: 0..{rx2} x 0..{ry2}")
print(f"Candidate watermark blobs ({len(candidates)}):")
for c in sorted(candidates, key=lambda t: -t[4])[:10]:
    print(f"  x={c[0]} y={c[1]} w={c[2]} h={c[3]} area={c[4]}")

# Draw candidates on a copy and save
vis = frame.copy()
for c in candidates:
    cv2.rectangle(vis, (c[0], c[1]), (c[0]+c[2], c[1]+c[3]), (0,0,255), 2)
cv2.imwrite(r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\scripts\login-bg-detect.png", vis)

# Compute union bbox of all candidates (if any) as the watermark mask region
if candidates:
    xs = [c[0] for c in candidates]
    ys = [c[1] for c in candidates]
    xe = [c[0]+c[2] for c in candidates]
    ye = [c[1]+c[3] for c in candidates]
    ux, uy = min(xs), min(ys)
    ux2, uy2 = max(xe), max(ye)
    # pad a bit
    pad = 8
    ux = max(0, ux - pad)
    uy = max(0, uy - pad)
    ux2 = min(w, ux2 + pad)
    uy2 = min(h, uy2 + pad)
    print(f"\nUnion watermark bbox: x={ux} y={uy} x2={ux2} y2={uy2} (w={ux2-ux} h={uy2-uy})")
else:
    print("\nNo candidates found. Will need manual coords.")
