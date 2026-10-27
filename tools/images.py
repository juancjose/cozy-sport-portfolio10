# Descarga fotos de Pexels y genera variantes responsive (webp) para srcset.
import json, subprocess, io, os, urllib.request
from PIL import Image
M = json.load(open('assets/img/credits.json'))
os.makedirs('assets/img', exist_ok=True)
for it in M:
    if it.get('w0') and all(os.path.exists(f"assets/img/{it['name']}-{w}.webp") for w in (640, 1280, 1920)):
        continue  # ya generada (p. ej. la foto de la máquina de coser)
    url = f"https://images.pexels.com/photos/{it['id']}/pexels-photo-{it['id']}.jpeg?auto=compress&cs=tinysrgb&w=2400"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req).read()
    im = Image.open(io.BytesIO(data)).convert('RGB')
    it['w0'], it['h0'] = im.size
    for w in (640, 1280, 1920):
        if w > im.width: w = im.width
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(f"assets/img/{it['name']}-{w if w in (640,1280,1920) else 1920}.webp", 'WEBP', quality=78, method=6)
    print(it['name'], im.size)
json.dump(M, open('assets/img/credits.json', 'w'), ensure_ascii=False, indent=1)
