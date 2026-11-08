import json,re
from pathlib import Path
p=Path(__file__).resolve().parent/'theme'; data=json.loads((p/'import.json').read_text(encoding='utf-8'))
assert len(data)==61
assert len({x['slug'] for x in data})==61
errors=[]
for page in data:
 assert page['content'],page['slug']
 raw=page['head']+page['before']+page['content']+page['after']
 for asset in set(re.findall(r'assets/[a-zA-Z0-9_./%-]+',raw)):
  if not (p/asset).exists():errors.append((page['slug'],asset))
 for x in re.findall(r'<!-- wp:marli/section (.*?) /-->',page['content']):json.loads(x)
print('Pages: 61. Unique slugs: 61. Block JSON: valid.')
print('Missing source assets:',len(set(errors)))
print(sorted(set(errors))[:30])

