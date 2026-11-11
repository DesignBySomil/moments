# usage: python3 img2scene.py <src> <cols> <rows> <outJson> [gamma] [boost]
# Converts an image to a dense ASCII level grid (bake data for engine scenes).
import sys, json
from PIL import Image, ImageOps
src, cols, rows, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
gamma = float(sys.argv[5]) if len(sys.argv) > 5 else 1.1
im = Image.open(src).convert('L')
# cover-crop to target aspect (cells are ~2x tall visually, but data is per-cell)
im = ImageOps.fit(im, (cols, rows), Image.LANCZOS)
im = ImageOps.autocontrast(im, cutoff=1)
px = list(im.getdata())
lv = []
for v in px:
    x = (v / 255.0) ** gamma
    lv.append(round(x, 3))
json.dump({'cols': cols, 'rows': rows, 'data': lv}, open(out, 'w'))
print('baked', cols, rows, 'min', min(lv), 'max', max(lv))
