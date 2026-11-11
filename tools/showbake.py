# render a baked grid to PNG with the same ramp/glyph style as render.py
import sys, json
from PIL import Image, ImageDraw, ImageFont
b = json.load(open(sys.argv[1])); cols, rows, data = b['cols'], b['rows'], b['data']
RAMP = ' .:-=+*x#%@'
CW, CH = 9, 9
img = Image.new('RGB', (cols*CW, rows*CH), (11, 11, 14))
d = ImageDraw.Draw(img)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 11)
except: font = ImageFont.load_default()
ink = (255, 83, 71)
for y in range(rows):
    for x in range(cols):
        v = data[y*cols+x]
        if v <= 0.045: continue
        lvl = min(9, max(1, int(v*9+0.5)))
        d.text((x*CW+1, y*CH-1), RAMP[lvl], font=font, fill=tuple(int(c*(0.25+0.75*v)) for c in ink))
img.save(sys.argv[2]); print(sys.argv[2], img.size)
