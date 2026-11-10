"""Shrinks the screenshots: 256 colours without dithering (needs Pillow). Usage: optimize.py <folder> [file ...] (only these files)."""
import sys
from pathlib import Path

from PIL import Image

paths = [Path(a) for a in sys.argv[2:]] or sorted(Path(sys.argv[1]).rglob("*.png"))
for path in paths:
    image = Image.open(path).convert("RGB")
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, optimize=True)
    print(path, path.stat().st_size // 1024, "KB")
