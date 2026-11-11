# usage: python3 promote.py <sceneId>  - promote vetted candidate to keeper bake
import sys, os, json, shutil, re
sid = sys.argv[1]
canddir = f'bakesrc/cand/{sid}'
cprov = json.load(open(os.path.join(canddir, 'prov.json')))
assert os.path.exists(f'scenes-cand-{sid}.js'), 'no candidate bake'
shutil.move(f'scenes-cand-{sid}.js', f'scenes-bake-{sid}.js')
shutil.copy(cprov['src'], f'bakesrc/{sid}.jpg')
prov = json.load(open('bakesrc/prov.json')) if os.path.exists('bakesrc/prov.json') else {}
prov[sid] = {k: cprov[k] for k in ['title','creator','license','license_url','page']}
json.dump(prov, open('bakesrc/prov.json','w'), indent=1)
print('promoted', sid, '|', cprov['license'], '|', (cprov['title'] or '')[:40])
