"""Shrinks the screenshots: 256 colours without dithering (needs Pillow)."""
import sys
from pathlib import Path

from PIL import Image

for path in sorted(Path(sys.argv[1]).rglob("*.png")):
    image = Image.open(path).convert("RGB")
    image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, optimize=True)
    print(path, path.stat().st_size // 1024, "KB")
