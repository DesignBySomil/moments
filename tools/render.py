# usage: render.py out.png in1.json [in2.json ...]  (side by side, phone-ish cells)
import json, sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]; ins = sys.argv[2:]
WC = 9
imgs = []
for p in ins:
    d = json.load(open(p))
    cells = d['cells']; rows = len(cells); cols = len(cells[0])
    hc = int(WC * 1.06)
    img = Image.new('RGB', (cols * WC, rows * hc), d['bg'])
    dr = ImageDraw.Draw(img)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', int(hc * 1.02))
    ramp = d['ramp']
    for y, row in enumerate(cells):
        for x, (lvl, ink, a) in enumerate(row):
            if lvl == 0: continue
            col = d['inks'][ink]
            if a < 1:
                bg = d['bg'].lstrip('#'); fg = col.lstrip('#')
                col = '#%02x%02x%02x' % tuple(int(int(fg[i:i+2],16)*a + int(bg[i:i+2],16)*(1-a)) for i in (0,2,4))
            dr.text((x*WC + WC/2, y*hc + hc/2), ramp[lvl], font=font, fill=col, anchor='mm')
    imgs.append(img)
w = sum(i.width for i in imgs) + 8*(len(imgs)-1); h = max(i.height for i in imgs)
combo = Image.new('RGB', (w, h), '#111111')
x = 0
for i in imgs:
    combo.paste(i, (x, 0)); x += i.width + 8
combo.save(out)
print(out, combo.size)
