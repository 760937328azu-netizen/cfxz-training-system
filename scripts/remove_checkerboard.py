#!/usr/bin/env python3
"""
Remove baked-in checkerboard background from PNG images and replace with true transparency.
"""
import os
import sys
from pathlib import Path

from PIL import Image
import numpy as np


def remove_checkerboard(img_path: str, output_path: str, tolerance: int = 18):
    """
    Detect and remove checkerboard background by:
    1. Sampling corner pixels to identify the two checkerboard colors
    2. Creating a mask for pixels matching either color
    3. Expanding mask slightly along edges for cleaner cutout
    4. Writing alpha channel
    """
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3].copy()

    # Sample corners to find background colors (checkerboard pattern)
    corner_size = min(h, w) // 8
    corners = []
    corners.append(rgb[0:corner_size, 0:corner_size].reshape(-1, 3))
    corners.append(rgb[0:corner_size, w - corner_size:w].reshape(-1, 3))
    corners.append(rgb[h - corner_size:h, 0:corner_size].reshape(-1, 3))
    corners.append(rgb[h - corner_size:h, w - corner_size:w].reshape(-1, 3))
    all_corners = np.vstack(corners)

    # Find two dominant background colors (white and light gray)
    # Use color quantization on corner samples
    colors = all_corners.astype(np.float32)

    # Simple k-means-like approach for 2 clusters
    # White cluster: high RGB values
    white_mask = np.all(colors > 230, axis=1)
    if np.any(white_mask):
        white_color = np.median(colors[white_mask], axis=0)
    else:
        white_color = np.array([255, 255, 255], dtype=np.float32)

    # Gray cluster: mid-high RGB values, not white
    gray_mask = np.all(colors > 180, axis=1) & np.all(colors < 245, axis=1)
    if np.any(gray_mask):
        gray_color = np.median(colors[gray_mask], axis=0)
    else:
        gray_color = np.array([210, 210, 210], dtype=np.float32)

    # Create mask for pixels matching either background color
    dist_white = np.linalg.norm(rgb.astype(np.float32) - white_color, axis=2)
    dist_gray = np.linalg.norm(rgb.astype(np.float32) - gray_color, axis=2)
    dist_both = np.minimum(dist_white, dist_gray)

    bg_mask = dist_both < tolerance

    # Also include near-white pixels that might not match exactly
    near_white = np.all(rgb > 245, axis=2)
    bg_mask = bg_mask | near_white

    # Refinement: for pixels near background, also check if they are on boundary
    # A pixel is likely background if it's surrounded by background pixels
    from scipy import ndimage
    # Dilate background mask to catch edge artifacts
    dilated = ndimage.binary_dilation(bg_mask, iterations=1)
    # Only expand where the pixel color is also somewhat close to bg
    edge_expand = dilated & (dist_both < tolerance * 2.5) & ~bg_mask
    bg_mask = bg_mask | edge_expand

    # Set alpha to 0 for background
    alpha[bg_mask] = 0

    # Also set RGB to 0 for fully transparent pixels (cleaner)
    rgb[bg_mask] = [0, 0, 0]

    arr[:, :, 3] = alpha
    result = Image.fromarray(arr)
    result.save(output_path)
    print(f"Saved: {output_path}")


def main():
    src_dir = Path("C:/Users/HUAWEI/WorkBuddy/新的一版培训系统 最后一版了/public/xiaoyao")
    out_dir = src_dir / "transparent"
    out_dir.mkdir(exist_ok=True)

    files = sorted(src_dir.glob("*.png"))
    if not files:
        print("No PNG files found.")
        sys.exit(1)

    for f in files:
        if f.parent.name == "transparent":
            continue
        out_path = out_dir / f.name
        print(f"Processing {f.name} ...")
        remove_checkerboard(str(f), str(out_path))

    print("Done.")


if __name__ == "__main__":
    main()
