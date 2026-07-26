"""
逐帧去除 login-bg.mp4 左上角 "BAILE" 水印。
策略：在水印 ROI 内用 top-hat/black-hat 提取文字像素，膨胀后用 TELEA inpainting 修复，
再通过管道输出 raw frames 给 ffmpeg 编码为 H264 mp4。
"""
import cv2
import numpy as np
import subprocess
import sys
import os

FFMPEG = r"C:\Users\HUAWEI\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
IN = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg-original.mp4"
OUT = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg.mp4"
OUT_TMP = OUT + ".tmp.mp4"

# Watermark ROI (x, y, w, h) — from detection, slightly padded
WX, WY, WW, WH = 130, 25, 365, 120

cap = cv2.VideoCapture(IN)
if not cap.isOpened():
    print("ERROR: cannot open input"); sys.exit(1)

w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Input: {w}x{h} @ {fps}fps, {n} frames")

# Clamp ROI
WX2 = min(WX + WW, w)
WY2 = min(WY + WH, h)
WX = max(0, WX)
WY = max(0, WY)
print(f"Watermark ROI: ({WX},{WY})-({WX2},{WY2})")

# ffmpeg encoder: raw bgr24 -> libx264 yuv420p
proc = subprocess.Popen(
    [
        FFMPEG, "-y",
        "-f", "rawvideo",
        "-pixel_format", "bgr24",
        "-video_size", f"{w}x{h}",
        "-framerate", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "slow",
        "-crf", "17",
        "-movflags", "+faststart",
        OUT_TMP,
    ],
    stdin=subprocess.PIPE,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.PIPE,
)

morph_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7))
dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))

frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame_idx += 1

    roi = frame[WY:WY2, WX:WX2].copy()
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    # top-hat catches bright text; black-hat catches dark text
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, morph_kernel)
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, morph_kernel)

    _, m1 = cv2.threshold(tophat, 12, 255, cv2.THRESH_BINARY)
    _, m2 = cv2.threshold(blackhat, 12, 255, cv2.THRESH_BINARY)
    mask = cv2.bitwise_or(m1, m2)

    # Denoise small specks
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))
    # Dilate so inpainting covers edges of glyphs
    mask = cv2.dilate(mask, dilate_kernel, iterations=1)

    inpainted = cv2.inpaint(roi, mask, 5, cv2.INPAINT_TELEA)
    frame[WY:WY2, WX:WX2] = inpainted

    proc.stdin.write(frame.tobytes())

    if frame_idx % 50 == 0 or frame_idx == n:
        print(f"  processed {frame_idx}/{n} frames")

cap.release()
proc.stdin.close()
err = proc.communicate(timeout=120)[1]
if proc.returncode != 0:
    print("FFMPEG ERROR:\n", err.decode("utf-8", "replace"))
    sys.exit(1)

# Replace original with cleaned version
os.replace(OUT_TMP, OUT)
print(f"\nDone. Cleaned video saved to {OUT}")

# Also save a cleaned poster frame (first frame)
cap2 = cv2.VideoCapture(OUT)
ret, f0 = cap2.read()
cap2.release()
if ret:
    poster = r"C:\Users\HUAWEI\WorkBuddy\新的一版培训系统 最后一版了\public\assets\login-bg-poster.jpg"
    cv2.imwrite(poster, f0, [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(f"Poster updated: {poster}")
