"""Собирает предпросмотр сайта в папку (то же, что делает GitHub Pages: экспонаты -> data/*.json)."""
import os, re, sys, json, shutil, glob, datetime
import yaml, markdown
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1]

def read(path):
    s = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n?(.*)$', s, re.S)
    meta = yaml.safe_load(m.group(1)) or {}
    meta = {k: (v.isoformat() if isinstance(v, (datetime.date,)) else v) for k, v in meta.items()}
    meta['id'] = os.path.splitext(os.path.basename(path))[0]
    meta['body'] = markdown.markdown(m.group(2).strip())
    return meta

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(os.path.join(OUT, 'data'))
shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(OUT, 'assets'))
shutil.copytree(os.path.join(ROOT, 'media'), os.path.join(OUT, 'media'))
ex = [read(p) for p in sorted(glob.glob(os.path.join(ROOT, '_exhibits', '*.md')))]
ex = [e for e in ex if e.get('published', True) is not False]
mk = [read(p) for p in sorted(glob.glob(os.path.join(ROOT, '_manufacturers', '*.md')))]
shutil.copy(os.path.join(ROOT, 'data', 'site.json'), os.path.join(OUT, 'data', 'site.json'))
json.dump(ex, open(os.path.join(OUT, 'data', 'exhibits.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(mk, open(os.path.join(OUT, 'data', 'manufacturers.json'), 'w'), ensure_ascii=False, indent=1)
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
if '--fragment' in sys.argv:  # для публикации предпросмотра: без обёртки документа
    html = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*', '', html, flags=re.I)
    html = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', '', html)
    html = re.sub(r'</head>\s*<body>\s*', '\n', html)
    html = re.sub(r'\s*</body>\s*</html>\s*$', '\n', html)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print(len(ex), 'exhibits,', len(mk), 'makers ->', OUT)
