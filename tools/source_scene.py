# usage: python3 source_scene.py <sceneId> <query> [invert] [cols] [rows]
# Finds a CC-licensed (by/by-sa/cc0/pdm) image via Openverse.
# CANDIDATE-ONLY: writes bakesrc/cand/<id>/ and scenes-cand-<id>.js, never touching
# keeper files (bakesrc/<id>.jpg, scenes-bake-<id>.js, prov.json).
# Promote a vetted candidate with: python3 tools/promote.py <id>
import sys, json, subprocess, time
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont
sid, query = sys.argv[1], sys.argv[2]
invert = len(sys.argv) > 3 and sys.argv[3] == 'invert'
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 96
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 104
q = query.replace(' ', '%20')
api = f'https://api.openverse.org/v1/images/?q={q}&license=by,by-sa,cc0,pdm&page_size=8'
d = None
for attempt in range(4):
    raw = subprocess.run(['curl', '-s', '-m', '30', '-H', 'User-Agent: moments-ascii/1.0', api], capture_output=True, text=True).stdout
    try:
        d = json.loads(raw); break
    except Exception:
        time.sleep(3)
if d is None: print('APIFAIL', sid); sys.exit(1)
results = [r for r in d.get('results', []) if (r.get('width') or 0) >= 700]
if not results: results = d.get('results', [])
if not results: print('NORESULT', sid); sys.exit(1)
import os, time as _t
canddir = f'/tmp/moments/bakesrc/cand/{sid}'
os.makedirs(canddir, exist_ok=True)
cand = os.path.join(canddir, f'src-{int(_t.time())}.jpg')
src = None
for r in results:
    rc = subprocess.run(['curl', '-sL', '-m', '40', r['url'], '-o', cand], capture_output=True)
    try:
        Image.open(cand).convert('RGB'); src = (cand, r); break
    except Exception: continue
if not src: print('NODOWNLOAD', sid); sys.exit(1)
p, r = src
im = Image.open(p).convert('RGB')
im = ImageOps.fit(im, (cols, rows), Image.LANCZOS)
a = np.asarray(im, dtype=np.float32).max(axis=2) / 255.0
if invert: a = 1.0 - a
gain = 1.0 / max(0.05, float(np.percentile(a, 97.5)))
a = np.clip(a * gain, 0, 1)
a = np.clip((a - 0.085) / 0.915, 0, 1) ** 1.05
hexs = ''.join('0123456789abcdef'[min(15, int(v * 15.999))] if v > 0.045 else '0' for v in a.flat)
open(f'scenes-cand-{sid}.js', 'w').write(f'globalThis.__BAKE_{sid} = {{ w: {cols}, h: {rows}, d: "{hexs}" }};')
# candidate provenance row (kept out of shipped prov.json until promoted)
cprov = {'title': r.get('title'), 'creator': r.get('creator'), 'license': r.get('license'),
         'license_url': r.get('license_url'), 'page': r.get('foreign_landing_url'), 'src': cand}
json.dump(cprov, open(os.path.join(canddir, 'prov.json'), 'w'), indent=1)
print('OK', sid, '|', r.get('license'), '|', (r.get('title') or '')[:40], '|', r.get('creator'), '| candidate only')
