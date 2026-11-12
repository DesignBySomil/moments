#!/usr/bin/env python3
# Render dumped scene frames to PNGs that mimic the engine output.
# usage: render.py frames.json outdir [scale]
import json, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

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
        bloom = fr.get('bloom')
        W, H = 390, 844  # phone CSS size
        cw = W / cols
        ch = H / rows
        fs0 = ch * 0.98
        fonts = {}
        def font_for(lvl):
            sc = (0.70 + 0.06 * lvl) if bloom else 1.0
            key = int(round(fs0 * sc))
            if key not in fonts:
                fonts[key] = ImageFont.truetype(FONT, max(1, key))
            return fonts[key]
        img = Image.new('RGB', (W, H), hex2rgb(fr['bg']))
        glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)) if bloom else None
        gd = ImageDraw.Draw(glow_layer) if bloom else None
        d = ImageDraw.Draw(img)
        inks = [hex2rgb(c) for c in fr['inks']]
        if bloom:
            inks.append((255, 255, 255))
        bg = hex2rgb(fr['bg'])
        for y, row in enumerate(fr['cells']):
            for x, cell in enumerate(row):
                if not cell:
                    continue
                lvl, ink, a = cell[0], cell[1], cell[2]
                raw_i = cell[3] if len(cell) > 3 else None
                col = inks[min(ink, len(inks) - 1)]
                if a < 1:
                    col = tuple(int(round(bg[i] + (col[i] - bg[i]) * a)) for i in range(3))
                fnt = font_for(lvl)
                fsx = fnt.size
                cxp, cyp = (x + 0.5) * cw, (y + 0.5) * ch + fsx * 0.02
                if bloom and lvl >= 5:
                    gd.text((cxp, cyp), RAMP[lvl], font=fnt, fill=col + (255,), anchor='mm')
                if bloom and lvl >= 8:
                    d.text((cxp, cyp), RAMP[lvl], font=fnt, fill=col, anchor='mm')
                d.text((cxp, cyp), RAMP[lvl], font=fnt, fill=col, anchor='mm')
                if bloom and raw_i and raw_i > 1:
                    wl = min(raw_i - 1, 1) * (a if a < 1 else 1)
                    wcol = tuple(int(round(bg[i] + (255 - bg[i]) * wl)) for i in range(3))
                    d.text((cxp, cyp), RAMP[lvl], font=fnt, fill=wcol, anchor='mm')
        if bloom:
            glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(2.2))
            base = img.convert('RGBA')
            base.alpha_composite(glow_layer)
            img = Image.alpha_composite(base, img.convert('RGBA')).convert('RGB') if False else Image.blend(base, Image.alpha_composite(base, glow_layer), 1.0).convert('RGB')
            # simpler: glow under glyphs -> paste glyphs again? approximate: screen composite
            from PIL import ImageChops
            img = ImageChops.screen(img, glow_layer.convert('RGB'))
        name = f"{fr['id']}_{str(fr['phase']).replace('.', 'p')}.png"
        img.save(os.path.join(outdir, name))

if __name__ == '__main__':
    main()
