"""Genera index.html a partir de src/index.html.
Expande: <!--img:nombre|alt|sizes|clase|eager-->,
<!--sprite--> y <!--credits--> (desde assets/img/credits.json)."""
import json, math, re, html, os
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
# Variante de contacto con nombres (misma página, vendedoras con nombre; mismos números que VENDEDORES en main.js)
def variante_contacto(t):
    t = re.sub(r'((?:src|href|content|poster)=")(?=assets/|favicon)', r'\1../', t)
    t = re.sub(r'(srcset="[^"]*")', lambda m: re.sub(r'(^srcset="|,\s*)assets/', r'\1../assets/', m.group(1)), t)
    t = t.replace('<title>', '<title>Variante · Contacto con nombres · ', 1)
    t = t.replace('</head>', '<meta name="robots" content="noindex">\n<link rel="stylesheet" href="assets/variantes.css">\n</head>', 1)
    t = t.replace('<form class="form rv" id="contactForm"', '<form class="form rv" id="contactForm" data-vendedores="Yesi,Moni,Cami,Cintia,Maca" data-rol="Asesora de ventas"', 1)
    i = t.index('</header>', t.index('class="hdr"')) + len('</header>')
    bar = ('\n<div class="varbar" role="note"><a class="back" href="index.html">← Comparar variantes</a>'
           '<span class="name"><b>Contacto</b> Asesoras con nombre</span>'
           '<nav aria-label="Variantes"><a href="../#contacto">Original<span> · Vendedor 1–5</span></a>'
           '<a href="contacto-nombres.html#contacto" aria-current="page">Nombres<span> · Yesi, Moni…</span></a></nav>'
           '<button class="varbar-x" type="button" aria-label="Ocultar barra de variantes">×</button></div>')
    return t[:i] + bar + t[i:]
open(f'{ROOT}/variantes/contacto-nombres.html', 'w').write(variante_contacto(s))
VL = {os.path.basename(p): hashlib.sha1(open(p, 'rb').read()).hexdigest()[:10] for p in glob.glob(f'{ROOT}/variantes/assets/*.*')}
def bust_var(t):
    t = bust(t)
    for n, h in VL.items():
        t = re.sub(r'"assets/' + re.escape(n) + r'(\?v=[0-9a-f]+)?"', f'"assets/{n}?v={h}"', t)
    return t
for f in glob.glob(f'{ROOT}/variantes/*.html'):
    t = open(f).read(); u = bust_var(t)
    if u != t: open(f, 'w').write(u)
open(f'{ROOT}/index.html', 'w').write(s)
print('index.html generado,', len(s), 'bytes')
