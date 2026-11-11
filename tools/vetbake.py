# usage: python3 vetbake.py <sceneId> <out.png>  (renders scenes-bake-<id>.js directly)
import sys, re
from PIL import Image, ImageDraw, ImageFont
sid, out = sys.argv[1], sys.argv[2]
src = open(f'scenes-bake-{sid}.js').read()
m = re.search(r'w:\s*(\d+),\s*h:\s*(\d+),\s*d:\s*"([0-9a-f]+)"', src)
w, h, d = int(m.group(1)), int(m.group(2)), m.group(3)
RAMP = ' .:-=+*x#%@'
CW, CH = 9, 9
img = Image.new('RGB', (w*CW, h*CH), (11, 11, 14))
dr = ImageDraw.Draw(img)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 11)
except: font = ImageFont.load_default()
for y in range(h):
    for x in range(w):
        v = int(d[y*w+x], 16) / 15.0
        if v <= 0.045: continue
        lvl = min(len(RAMP)-1, max(1, int(v*(len(RAMP)-1)+0.5)))
        g = int(40 + 215*v)
        dr.text((x*CW, y*CH), RAMP[lvl], fill=(g, g, g), font=font)
img.save(out)
print('ok', w, h)
