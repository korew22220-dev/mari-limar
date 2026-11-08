import sys, re, json, shutil
from pathlib import Path
# Install beautifulsoup4 before running this build.
from bs4 import BeautifulSoup, Tag
src=Path(__file__).resolve().parents[1]
out=Path(__file__).resolve().parent/'theme'
out.mkdir(exist_ok=True)
shutil.copytree(src/'assets',out/'assets',dirs_exist_ok=True)
for p in src.glob('*.mp4'): shutil.copy2(p,out/p.name)
def block(html,label='Блок страницы'):
    return '<!-- wp:marli/section '+json.dumps({'html':html,'label':label},ensure_ascii=False).replace('--','\\u002d\\u002d')+' /-->'
def native(el):
    h=str(el)
    if not isinstance(el,Tag): return h
    if el.name=='p': return '<!-- wp:paragraph -->'+h+'<!-- /wp:paragraph -->'
    if el.name in ['h2','h3','h4']:
        el['class']=el.get('class',[])+['wp-block-heading']
        return '<!-- wp:heading '+json.dumps({'level':int(el.name[1])})+' -->'+str(el)+'<!-- /wp:heading -->'
    return '<!-- wp:html -->'+h+'<!-- /wp:html -->'
pages=[]
for f in sorted(src.glob('*.html')):
    soup=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
    title=soup.h1.get_text(' ',strip=True) if soup.h1 else soup.title.get_text()
    head=''.join(str(x) for x in soup.head.contents if not (isinstance(x,Tag) and (x.name=='title' or (x.name=='meta' and x.get('name')=='robots'))))
    body=soup.body
    main=body.find('main')
    pre=[]; post=[]; seen=False
    for el in list(body.contents):
        if el==main: seen=True; continue
        (post if seen else pre).append(str(el))
    contents=[]
    if main:
        for el in main.contents:
            if not isinstance(el,Tag): continue
            article=el.select_one('.article-body')
            if article and f.stem.startswith('blog-'):
                before,after=str(el).split(str(article),1)
                contents.append(block(before+str(article).split('>',1)[0]+'>','Оформление статьи'))
                contents.extend(native(x) for x in article.contents if isinstance(x,Tag))
                contents.append(block('</article>'+after,'Конец статьи'))
            else:
                heading=el.find(['h1','h2','h3'])
                contents.append(block(str(el),heading.get_text(' ',strip=True)[:90] if heading else el.name))
    typ='post' if f.stem.startswith('blog-') else 'ml_kitchen' if f.stem.startswith('kitchen-') else 'ml_wardrobe' if f.stem.startswith('wardrobe-') else 'page'
    pages.append(dict(slug=f.stem,title=title,type=typ,head=head,body_class=' '.join(body.get('class',[])),before=''.join(pre),after=''.join(post),main_attrs=str(main).split('>',1)[0]+'>' if main else '<main>',content='\n'.join(contents)))
(out/'import.json').write_text(json.dumps(pages,ensure_ascii=False),encoding='utf-8')
(out/'style.css').write_text('/*\nTheme Name: Марли Лимарт\nVersion: 0.1.0\nRequires PHP: 8.0\nDescription: Тема тестового переноса с редактируемыми блоками.\n*/',encoding='utf-8')
print(json.dumps({'pages':len(pages),'types':{t:sum(p['type']==t for p in pages) for t in set(p['type'] for p in pages)}},ensure_ascii=False))


