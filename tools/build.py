"""Genera index.html a partir de src/index.html.
Expande: <!--img:nombre|alt|sizes|clase|eager-->, <!--wheel:clase-->, <!--chainring-->,
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

def wheel(m):
    spokes = ''.join(f'<line x1="50" y1="50" x2="{50+44*math.cos(a):.1f}" y2="{50+44*math.sin(a):.1f}"/>'
                     for a in [i * math.pi / 12 for i in range(24)])
    return (f'<svg class="{m.group(1)}" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">'
            f'<circle cx="50" cy="50" r="46" stroke-width="4"/><circle cx="50" cy="50" r="41" stroke-width="1.2"/>'
            f'<g stroke-width=".7">{spokes}</g><circle cx="50" cy="50" r="6" stroke-width="3"/></svg>')

def chainring(_):
    arms = ''.join(f'<path d="M100 100 L{100+70*math.cos(a):.1f} {100+70*math.sin(a):.1f}" />'
                   for a in [i * 2 * math.pi / 5 - math.pi / 2 for i in range(5)])
    return ('<svg class="chainring" viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true">'
            '<circle cx="100" cy="100" r="93" stroke-width="10" stroke-dasharray="5.5 4.2"/>'
            '<circle cx="100" cy="100" r="84" stroke-width="3"/><circle cx="100" cy="100" r="66" stroke-width="1.5"/>'
            f'<g stroke-width="12" stroke-linecap="round">{arms}</g><circle cx="100" cy="100" r="18" stroke-width="6"/></svg>')

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
s = re.sub(r'<!--wheel:([\w-]+)-->', wheel, s)
s = s.replace('<!--chainring-->', chainring(None)).replace('<!--sprite-->', SPRITE).replace('<!--credits-->', credits(None))
open(f'{ROOT}/index.html', 'w').write(s)
print('index.html generado,', len(s), 'bytes')
