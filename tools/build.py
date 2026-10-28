"""Genera index.html a partir de src/index.html.
Expande: <!--img:nombre|alt|sizes|clase|eager-->,
<!--sprite--> y <!--credits--> (desde assets/img/credits.json)."""
import json, math, re, html
ROOT = __file__.rsplit('/tools/', 1)[0]
M = {i['name']: i for i in json.load(open(f'{ROOT}/assets/img/credits.json'))}

def img(m):
    name, alt, sizes, cls, eager = (m.group(1).split('|') + [''] * 5)[:5]
    it = M[name]; w = 1920; h = round(it['h0'] * w / it['w0'])
    src = ', '.join(f'assets/img/{name}-{x}.webp {x}w' for x in (640, 1280, 1920))
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    c = f' class="{cls}"' if cls else ''
    return (f'<img{c} src="assets/img/{name}-1280.webp" srcset="{src}" sizes="{sizes or "100vw"}" '
            f'width="{w}" height="{h}" alt="{html.escape(alt)}" {load} decoding="async">')

SPRITE = open(f'{ROOT}/tools/sprite.svg').read()

def credits(_):
    out = []
    seen = set()
    for it in M.values():
        if it['id'] in seen: continue
        seen.add(it['id'])
        by = f" · {html.escape(it['by'])}" if it['by'] != 'Pexels' else ''
        out.append(f'<li><a href="https://www.pexels.com/photo/{it["id"]}/" target="_blank" rel="noopener">{html.escape(it["title"])}{by}</a></li>')
    return ''.join(out)

s = open(f'{ROOT}/src/index.html').read()
s = re.sub(r'<!--img:([^>]*?)-->', img, s)
s = s.replace('<!--sprite-->', SPRITE).replace('<!--credits-->', credits(None))
# cache-busting: ?v=<hash del contenido> en CSS/JS (index y variantes) para no mezclar versiones viejas
import hashlib, glob
def ver(p): return hashlib.sha1(open(f'{ROOT}/{p}', 'rb').read()).hexdigest()[:10]
V = {p: ver(p) for p in ('assets/css/styles.css', 'assets/js/main.js')}
def bust(t):
    for p, h in V.items():
        t = re.sub(r'((?:\.\./)?' + re.escape(p) + r')(\?v=[0-9a-f]+)?"', lambda m: f'{m.group(1)}?v={h}"', t)
    return t
s = bust(s)
for f in glob.glob(f'{ROOT}/variantes/*.html'):
    t = open(f).read(); u = bust(t)
    if u != t: open(f, 'w').write(u)
open(f'{ROOT}/index.html', 'w').write(s)
print('index.html generado,', len(s), 'bytes')
