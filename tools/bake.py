# usage: python3 bake.py <src> <sceneId> <cols> <rows> [black] [gamma]
# max-channel luminance, auto exposure (p97.5 -> 1.0), black clip, gamma, hex16 pack
import sys
import numpy as np
from PIL import Image, ImageOps
src, sid, cols, rows = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
black = float(sys.argv[5]) if len(sys.argv) > 5 else 0.085
gamma = float(sys.argv[6]) if len(sys.argv) > 6 else 1.05
im = Image.open(src).convert('RGB')
im = ImageOps.fit(im, (cols, rows), Image.LANCZOS)
a = np.asarray(im, dtype=np.float32).max(axis=2) / 255.0
gain = 1.0 / max(0.05, float(np.percentile(a, 97.5)))
a = np.clip(a * gain, 0, 1)
a = np.clip((a - black) / (1 - black), 0, 1) ** gamma
hexs = ''.join('0123456789abcdef'[min(15, int(v * 15.999))] if v > 0.045 else '0' for v in a.flat)
open(f'scenes-bake-{sid}.js', 'w').write(
    f'globalThis.__BAKE_{sid} = {{ w: {cols}, h: {rows}, d: "{hexs}" }};')
print(f'baked {sid} {cols}x{rows} gain={gain:.2f}')
