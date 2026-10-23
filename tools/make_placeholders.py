"""Рисует картинки-заглушки для демонстрационных экспонатов (SVG)."""
import math, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'media', 'exhibits')

def frame(body, bg=('#d9d8d2', '#b9b8b1')):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
<defs>
 <radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="{bg[0]}"/><stop offset="1" stop-color="{bg[1]}"/></radialGradient>
 <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
 <filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
 <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="16"/></filter>
 <filter id="wear"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.08" numOctaves="4" seed="11"/><feColorMatrix values="0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.85  0 0 0 -2.2 1.3"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>
<rect width="800" height="800" fill="url(#bg)"/>
{body}
<rect width="800" height="800" fill="#000" filter="url(#grain)" opacity="0.9"/>
<g font-family="monospace" font-size="18" fill="#55534c"><text x="40" y="770">ДЕМО · ЗАМЕНИТЕ ФОТОГРАФИЕЙ</text></g>
</svg>'''

def octagon(cx, cy, r):
    pts = []
    for i in range(8):
        a = math.pi/8 + i*math.pi/4
        pts.append(f'{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}')
    return ' '.join(pts)

def tile_octagon():
    s = 520; x0 = 140; y0 = 120
    cells = []
    n = 2; c = s/n; r = c/2/math.cos(math.pi/8)
    for i in range(n):
        for j in range(n):
            cx = x0 + c*i + c/2; cy = y0 + c*j + c/2
            cells.append(f'<polygon points="{octagon(cx, cy, r*0.995)}" fill="#c9893f" stroke="#e8dcc4" stroke-width="5"/>')
            cells.append(f'<polygon points="{octagon(cx, cy, r*0.62)}" fill="#a5512f" opacity=".9"/>')
            cells.append(f'<circle cx="{cx}" cy="{cy}" r="{c*0.13}" fill="#e8dcc4"/>')
    ins = []
    k = c*math.tan(math.pi/8)/2/math.sqrt(2)*1.02
    for i in range(n+1):
        for j in range(n+1):
            px = x0 + c*i; py = y0 + c*j
            ins.append(f'<rect x="{px-k}" y="{py-k}" width="{2*k}" height="{2*k}" transform="rotate(45 {px} {py})" fill="#1c1b1a"/>')
    body = f'''<rect x="{x0+20}" y="{y0+40}" width="{s}" height="{s}" rx="6" fill="#000" opacity=".35" filter="url(#shadow)"/>
<g filter="url(#rough)"><rect x="{x0}" y="{y0}" width="{s}" height="{s}" rx="5" fill="#e8dcc4"/>
<clipPath id="c"><rect x="{x0}" y="{y0}" width="{s}" height="{s}" rx="5"/></clipPath>
<g clip-path="url(#c)">{''.join(cells)}{''.join(ins)}<rect x="{x0}" y="{y0}" width="{s}" height="{s}" fill="#fff" filter="url(#wear)" opacity=".55"/></g></g>'''
    return frame(body)

def tile_back():
    x0, y0, s = 140, 120, 520
    ribs = ''.join(f'<rect x="{x0+30+i*58}" y="{y0+30}" width="26" height="{s-60}" rx="4" fill="#a99a8a"/>' for i in range(8))
    body = f'''<rect x="{x0+20}" y="{y0+40}" width="{s}" height="{s}" rx="6" fill="#000" opacity=".35" filter="url(#shadow)"/>
<g filter="url(#rough)"><rect x="{x0}" y="{y0}" width="{s}" height="{s}" rx="5" fill="#bcae9d"/>{ribs}
<circle cx="400" cy="380" r="120" fill="#bcae9d" stroke="#8f8172" stroke-width="10"/>
<circle cx="400" cy="380" r="92" fill="none" stroke="#8f8172" stroke-width="4"/>
<text x="400" y="372" text-anchor="middle" font-family="Georgia, serif" font-size="38" letter-spacing="4" fill="#7d7062">METTLACH</text>
<text x="400" y="418" text-anchor="middle" font-family="Georgia, serif" font-size="22" letter-spacing="3" fill="#7d7062">· · ·</text>
<rect x="{x0}" y="{y0}" width="{s}" height="{s}" fill="#fff" filter="url(#wear)" opacity=".35"/></g>'''
    return frame(body)

def tile_border():
    x0, y0, w, h = 110, 250, 580, 290
    # меандр
    u = 36; path = []
    sx = x0 + 22; sy = y0 + 70
    d = f'M{sx},{sy+4*u} '
    x = sx
    for i in range(4):
        d += f'L{x},{sy} L{x+3*u},{sy} L{x+3*u},{sy+3*u} L{x+u},{sy+3*u} L{x+u},{sy+u} L{x+2*u},{sy+u} L{x+2*u},{sy+2*u} '
        x += 4*u
        d += f'M{x},{sy+4*u} '
    body = f'''<rect x="{x0+20}" y="{y0+40}" width="{w}" height="{h}" rx="6" fill="#000" opacity=".35" filter="url(#shadow)"/>
<g filter="url(#rough)"><rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="5" fill="#1f1d1b"/>
<rect x="{x0}" y="{y0+18}" width="{w}" height="14" fill="#9b3d2a"/><rect x="{x0}" y="{y0+h-32}" width="{w}" height="14" fill="#9b3d2a"/>
<path d="{d}" fill="none" stroke="#c8a76a" stroke-width="16" stroke-linecap="square"/>
<line x1="{sx}" y1="{sy+4*u}" x2="{x0+w-22}" y2="{sy+4*u}" stroke="#c8a76a" stroke-width="16"/>
<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="#fff" filter="url(#wear)" opacity=".4"/></g>'''
    return frame(body)

def brick(shaped=False, stamp=None):
    # изометрический кирпич: верх (постель), фронт (ложок), торец
    L, W, H = 470, 230, 120
    ox, oy = 150, 330
    dx, dy = W*0.62, -W*0.42
    top = f'{ox},{oy} {ox+L},{oy} {ox+L+dx},{oy+dy} {ox+dx},{oy+dy}'
    front = f'{ox},{oy} {ox+L},{oy} {ox+L},{oy+H} {ox},{oy+H}'
    if shaped:
        end = f'M{ox+L},{oy} L{ox+L+dx},{oy+dy} L{ox+L+dx},{oy+dy+H*0.35} Q{ox+L+dx},{oy+dy+H} {ox+L+dx*0.4},{oy+H+dy*0.45} L{ox+L},{oy+H} Z'
        front = f'{ox},{oy} {ox+L},{oy} {ox+L},{oy+H} {ox},{oy+H}'
    else:
        end = f'M{ox+L},{oy} L{ox+L+dx},{oy+dy} L{ox+L+dx},{oy+dy+H} L{ox+L},{oy+H} Z'
    st = ''
    if stamp:
        cx, cy = ox + L/2 + dx/2, oy + dy/2
        st = f'''<g transform="translate({cx} {cy}) skewX(-55) scale(1 0.42)"><rect x="-110" y="-70" width="220" height="140" rx="8" fill="#8a3d27" stroke="#6e2d1b" stroke-width="6"/>
<text x="0" y="38" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="110" fill="#6b2a19">{stamp}</text></g>'''
    body = f'''<ellipse cx="{ox+L/2+dx/2}" cy="{oy+H+30}" rx="{L*0.62}" ry="46" fill="#000" opacity=".4" filter="url(#shadow)"/>
<g filter="url(#rough)"><polygon points="{top}" fill="#b5583a"/><polygon points="{front}" fill="#94432a"/><path d="{end}" fill="#7d3622"/>{st}
<polygon points="{top}" fill="#fff" filter="url(#wear)" opacity=".35"/><polygon points="{front}" fill="#fff" filter="url(#wear)" opacity=".25"/></g>'''
    return frame(body)

def roof_tile():
    x0, y0, w, h = 230, 90, 340, 560
    ch = ''.join(f'<rect x="{x0+40+i*130}" y="{y0+80}" width="70" height="{h-130}" rx="35" fill="#a44f30"/><rect x="{x0+52+i*130}" y="{y0+80}" width="46" height="{h-130}" rx="23" fill="#c46a43"/>' for i in range(2))
    body = f'''<rect x="{x0+24}" y="{y0+40}" width="{w}" height="{h}" rx="10" fill="#000" opacity=".35" filter="url(#shadow)"/>
<g filter="url(#rough)"><rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="10" fill="#b85d38"/>
<rect x="{x0}" y="{y0}" width="{w}" height="60" rx="10" fill="#9c4a2c"/>
<rect x="{x0+w-30}" y="{y0}" width="30" height="{h}" fill="#9c4a2c"/>{ch}
<circle cx="{x0+w/2-15}" cy="{y0+30}" r="20" fill="none" stroke="#7a3820" stroke-width="5"/>
<path d="M{x0+w/2-15},{y0+16} l4,9 10,1 -8,6 3,10 -9,-6 -9,6 3,-10 -8,-6 10,-1z" fill="#7a3820"/>
<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="#fff" filter="url(#wear)" opacity=".3"/></g>'''
    return frame(body)

def nail():
    body = '''<ellipse cx="410" cy="430" rx="300" ry="30" fill="#000" opacity=".45" filter="url(#shadow)"/>
<g filter="url(#rough)" transform="rotate(-18 400 400)">
<polygon points="150,370 210,362 210,438 150,430" fill="#3b3733"/>
<polygon points="150,370 210,362 200,352 140,360" fill="#55504a"/>
<polygon points="210,382 640,396 680,400 640,404 210,418" fill="#4a4540"/>
<polygon points="210,382 640,396 680,400 210,392" fill="#6b655d"/>
<polygon points="210,382 640,396 680,400 640,404 210,418" fill="#a0522d" filter="url(#wear)" opacity=".5"/>
</g>'''
    return frame(body)

files = {
 'tile-octagon.svg': tile_octagon(), 'tile-back.svg': tile_back(), 'tile-border.svg': tile_border(),
 'brick-kb.svg': brick(stamp='К.Б.'), 'brick-shaped.svg': brick(shaped=True), 'roof-tile.svg': roof_tile(), 'nail.svg': nail(),
}
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s)
print('ok', len(files))
