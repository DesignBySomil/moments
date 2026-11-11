import json, sys, glob, os
from PIL import Image, ImageDraw, ImageFont
files = sorted(glob.glob('/tmp/c-*.json'))
WC = 5
thumbs = []
for p in files:
    d = json.load(open(p))
    cells = d['cells']; rows = len(cells); cols = len(cells[0])
    hc = int(WC * 1.06)
    img = Image.new('RGB', (cols * WC, rows * hc), d['bg'])
    dr = ImageDraw.Draw(img)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', max(4, int(hc * 1.02)))
    ramp = d['ramp']
    for y, row in enumerate(cells):
        for x, (lvl, ink, a) in enumerate(row):
            if lvl == 0: continue
            col = d['inks'][ink]
            if a < 1:
                bg = d['bg'].lstrip('#'); fg = col.lstrip('#')
                col = '#%02x%02x%02x' % tuple(int(int(fg[i:i+2],16)*a + int(bg[i:i+2],16)*(1-a)) for i in (0,2,4))
            dr.text((x*WC + WC/2, y*hc + hc/2), ramp[lvl], font=font, fill=col, anchor='mm')
    name = os.path.basename(p)[len('c-'):].rsplit('-t',1)[0]
    dr2 = ImageDraw.Draw(img)
    thumbs.append((name, img))
cols_g = 6
tw, th = thumbs[0][1].size
rows_g = (len(thumbs)+cols_g-1)//cols_g
sheet = Image.new('RGB', (cols_g*tw, rows_g*(th+16)), '#222222')
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 11)
dr = ImageDraw.Draw(sheet)
for i,(name,img) in enumerate(thumbs):
    gx, gy = (i%cols_g)*tw, (i//cols_g)*(th+16)
    sheet.paste(img, (gx, gy))
    dr.text((gx+4, gy+th+2), name, font=f2, fill='#ffffff')
sheet.save(sys.argv[1])
print(sheet.size, len(thumbs))
