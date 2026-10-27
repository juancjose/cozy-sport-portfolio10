#!/usr/bin/env python3
"""Genera las páginas de prueba en variantes/ a partir del index.html ya construido.
Cada variante reemplaza solo la animación del ciclista del hero; el resto (header,
hero, marquesina, sección Nosotros) es el sitio real, con rutas corregidas."""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = ROOT / 'variantes'
html = (ROOT / 'index.html').read_text(encoding='utf-8')

def fix(s):
    s = re.sub(r'(src|href|srcset|imagesrcset|content)="(?!https?:|#|mailto:|tel:|data:|\.\./)([^"]*)"',
               lambda m: f'{m.group(1)}="{fix_list(m.group(2))}"', s)
    s = re.sub(r'(<a\b[^>]*?)href="#(?!top"|nosotros"|main")', r'\1href="../#', s)
    return s

def fix_list(v):
    if not v or v.startswith('/'):
        return v
    parts = [p.strip() for p in v.split(',')]
    out = []
    for p in parts:
        if re.match(r'^(assets/|favicon)', p):
            p = '../' + p
        out.append(p)
    return ', '.join(out)

head = html[:html.index('</head>')]
head = re.sub(r'<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)
head = re.sub(r'<link rel="preload"[^>]*>', '', head)
head = re.sub(r'<meta property="og:[^>]*>|<meta name="twitter:[^>]*>|<link rel="canonical"[^>]*>', '', head)
progress = re.search(r'<div class="progress".*?</svg>\s*</div>\n', html, re.S).group(0)
sprite = re.search(r'<svg width="0" height="0".*?</svg>\n', html, re.S).group(0)
header = re.search(r'<header class="hdr".*?</header>\n<nav class="mnav".*?</nav>\n', html, re.S).group(0)
hero = re.search(r'<section class="hero".*?</section>\n', html, re.S).group(0)
hero = re.sub(r'\s*<div class="ride" aria-hidden="true">.*?</svg></div>\n  </div>', '\n  <!--VARIANTE-->', hero, flags=re.S)
marquee = re.search(r'<div class="marquee" aria-hidden="true">.*?</div></div>\n', html, re.S).group(0)
nosotros = re.search(r'<section class="sec light" id="nosotros".*?</section>\n', html, re.S).group(0)

PAGES = {
    'a-silueta': ('A', 'Silueta realista', 'Ciclista dibujado a mano en SVG, pedaleando en posición aero.'),
    'b-ruta': ('B', 'Ruta y altimetría', 'Una línea de ruta que se dibuja con el scroll y el isotipo Z como ciclista.'),
    'c-video': ('C', 'Video real', 'Clip de ciclismo real con el color de la marca.'),
}
NAV = ''.join(f'<a href="{k}.html"{{cur_{k}}}>{v[0]}<span> · {v[1]}</span></a>' for k, v in PAGES.items())

for key, (letter, name, desc) in PAGES.items():
    frag = (V / 'src' / f'{key[0]}.html').read_text(encoding='utf-8')
    nav = NAV
    for k in PAGES:
        nav = nav.replace('{cur_' + k + '}', ' aria-current="page"' if k == key else '')
    h = head.replace(re.search(r'<title>.*?</title>', head).group(0),
                     f'<title>Variante {letter} · {name} · Cozy Sport</title>')
    h = fix(h) + f'<meta name="robots" content="noindex">\n<link rel="stylesheet" href="assets/variantes.css">\n<link rel="stylesheet" href="assets/{key[0]}.css">\n'
    body = (f'<body class="var var-{key[0]}">\n' + fix(sprite) + progress + fix(header) +
            f'<div class="varbar" role="note"><a class="back" href="index.html">← Comparar variantes</a><span class="name"><b>Variante {letter}</b> {name}</span><nav aria-label="Variantes">{nav}</nav></div>\n' +
            '<main id="main">\n' + fix(hero).replace('<!--VARIANTE-->', frag) + fix(marquee) + fix(nosotros) + '</main>\n' +
            f'<footer class="varfoot"><div class="wrap"><p>Página de prueba · Variante {letter}: {desc} El sitio principal no cambia hasta que elijas una.</p><p><a href="index.html">Ver las tres variantes</a> · <a href="../">Volver al sitio</a></p></div></footer>\n' +
            f'<script src="../assets/js/main.js" defer></script>\n<script src="assets/{key[0]}.js" defer></script>\n</body>\n</html>\n')
    (V / f'{key}.html').write_text(h + '</head>\n' + body, encoding='utf-8')
    print('variantes/%s.html' % key)
