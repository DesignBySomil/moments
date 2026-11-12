#!/usr/bin/env python3
# Render dumped scene frames to PNGs that mimic the engine output.
# usage: render.py frames.json outdir [scale]
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

RAMP = ' .:-=+*x#%@'
FONT = '/usr/share/fonts/truetype/liberation2/LiberationMono-Bold.ttf'

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def main():
    frames = json.load(open(sys.argv[1]))
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    for fr in frames:
        cols, rows = fr['cols'], fr['rows']
        W, H = 390, 844  # phone CSS size
        cw = W / cols
        ch = H / rows
        fs = ch * 0.98
        font = ImageFont.truetype(FONT, int(round(fs)))
        img = Image.new('RGB', (W, H), hex2rgb(fr['bg']))
        d = ImageDraw.Draw(img)
        inks = [hex2rgb(c) for c in fr['inks']]
        for y, row in enumerate(fr['cells']):
            for x, cell in enumerate(row):
                if not cell:
                    continue
                lvl, ink, a = cell
                col = inks[min(ink, len(inks) - 1)]
                if a < 1:
                    bg = hex2rgb(fr['bg'])
                    col = tuple(int(round(bg[i] + (col[i] - bg[i]) * a)) for i in range(3))
                d.text(((x + 0.5) * cw, (y + 0.5) * ch + fs * 0.02), RAMP[lvl],
                       font=font, fill=col, anchor='mm')
        name = f"{fr['id']}_{str(fr['phase']).replace('.', 'p')}.png"
        img.save(os.path.join(outdir, name))
        print(name)

if __name__ == '__main__':
    main()
