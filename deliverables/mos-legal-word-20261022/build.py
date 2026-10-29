from pathlib import Path
import json,re,hashlib,zipfile,subprocess,sys
from lxml import html,etree
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.enum.table import WD_TABLE_ALIGNMENT,WD_CELL_VERTICAL_ALIGNMENT

ROOT=Path(__file__).parent
def norm(t): return re.sub(r'\s+','',t)
def plain(e): return ''.join(e.itertext())
def inline(p,e,bold=False,italic=False,href=None):
    def add(t,b,i,h):
        if not t:return
        r=p.add_run(t);r.bold=b;r.italic=i
        if h:
            rel=p.part.relate_to(h,RT.HYPERLINK,is_external=True)
            link=OxmlElement('w:hyperlink');link.set(qn('r:id'),rel)
            r.font.color.rgb=RGBColor.from_string('175A89');r.font.underline=True
            link.append(r._r);p._p.append(link)
    bold=bold or e.tag in ('b','strong');italic=italic or e.tag in ('i','em')
    href=e.get('href') if e.tag=='a' else href
    add(e.text,bold,italic,href)
    for c in e:
        if c.tag=='br':p.add_run().add_break()
        else:inline(p,c,bold,italic,href)
        add(c.tail,bold,italic,href)

manifest=[]
for f in sorted((ROOT/'sources').glob('*.json')):
    if f.stem=='manifest':continue
    src=json.loads(f.read_text()); key=f.stem;zh=key.endswith('zh')
    tree=html.fragment_fromstring(src['html'],create_parent='div')
    doc=Document();sec=doc.sections[0]
    sec.page_width=Cm(21);sec.page_height=Cm(29.7)
    sec.top_margin=sec.bottom_margin=Cm(1.9)
    sec.left_margin=sec.right_margin=Cm(2)
    for name,size in [('Normal',10.5),('Title',20),('Heading 1',14),('Heading 2',11.5)]:
        s=doc.styles[name];s.font.name='Arial';s.font.size=Pt(size);s.font.color.rgb=RGBColor(0,0,0)
        fonts=s.element.get_or_add_rPr().rFonts
        for attr in list(fonts.attrib):
            if 'Theme' in attr:del fonts.attrib[attr]
        fonts.set(qn('w:eastAsia'),'Noto Sans CJK SC')
        s.paragraph_format.space_after=Pt(6)
        s.paragraph_format.line_spacing=1.18 if zh else 1.12
        if name!='Normal':
            s.font.bold=True;s.paragraph_format.keep_with_next=True
            s.paragraph_format.space_before=Pt(13 if name!='Title' else 0)
    for st in doc.styles:
        for border in list(st.element.iter(qn('w:pBdr'))):border.getparent().remove(border)
    doc.core_properties.title=src['title'];doc.core_properties.author=''
    expected=[];actual=[]
    def paragraph(e,style=None,prefix=''):
        p=doc.add_paragraph(style=style);p.paragraph_format.widow_control=True
        if prefix:
            p.add_run(prefix);p.paragraph_format.left_indent=Cm(.55);p.paragraph_format.first_line_indent=Cm(-.55)
        inline(p,e)
        expected.append(prefix+plain(e))
        actual.append(''.join(p._p.itertext())) if False else None
        return p
    for e in tree:
        if e.tag in ('h1','h2','h3','p'):
            paragraph(e,{'h1':'Title','h2':'Heading 1','h3':'Heading 2'}.get(e.tag))
        elif e.tag in ('ol','ul'):
            for i,li in enumerate(e,1):paragraph(li,prefix=f'{i}. ' if e.tag=='ol' else '• ')
        elif e.tag=='table':
            rows=e.xpath('.//tr');cols=max(len(r) for r in rows)
            table=doc.add_table(rows=0,cols=cols);table.alignment=WD_TABLE_ALIGNMENT.CENTER;table.autofit=False
            widths=[2.7,3.5,5.4,5.4] if cols==4 else [17/cols]*cols
            for col,w in zip(table.columns,widths):col.width=Cm(w)
            pr=table._tbl.tblPr;borders=OxmlElement('w:tblBorders')
            for edge in ('top','left','bottom','right','insideH','insideV'):
                b=OxmlElement('w:'+edge);b.set(qn('w:val'),'single');b.set(qn('w:sz'),'5');b.set(qn('w:color'),'D9D9D9');borders.append(b)
            pr.append(borders)
            for ri,row in enumerate(rows):
                cells=table.add_row().cells
                trpr=cells[0]._tc.getparent().get_or_add_trPr()
                no=OxmlElement('w:cantSplit');trpr.append(no)
                if ri==0:trpr.append(OxmlElement('w:tblHeader'))
                for ci,el in enumerate(row):
                    c=cells[ci];c.width=Cm(widths[ci]);c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
                    p=c.paragraphs[0];p.paragraph_format.space_before=Pt(4);p.paragraph_format.space_after=Pt(4);p.paragraph_format.line_spacing=1.05
                    inline(p,el,bold=ri==0)
                    for r in p.runs:r.font.size=Pt(9)
                    if ri==0:
                        sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EEEEEE');c._tc.get_or_add_tcPr().append(sh)
                    expected.append(plain(el))
        else:raise ValueError(e.tag)
    names={'terms':'用户服务协议','privacy':'隐私政策','personal':'个人版','enterprise':'企业版','zh':'中文','en':'英文'}
    fname='MOS-'+ '-'.join(names[x] for x in key.split('-'))+'.docx'
    dest=ROOT/fname;doc.save(dest)
    with zipfile.ZipFile(dest) as z:
        xml=etree.fromstring(z.read('word/document.xml'))
        ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        ps=xml.xpath('//w:body//w:p',namespaces=ns)
        actual=[''.join(p.xpath('.//w:t/text()',namespaces=ns)) for p in ps]
    assert norm(''.join(expected))==norm(''.join(actual)),key
    # Source HTML and output contain the same content; list numbers are presentation.
    added=sum(len(list(e)) for e in tree if e.tag in ('ol','ul'))
    manifest.append({'file':fname,'source_url':src['url'],'retrieved_at':src['retrieved_at'],'title':src['title'],'source_sha256':hashlib.sha256(src['html'].encode()).hexdigest(),'paragraphs':len(ps),'source_characters':len(src['text']),'numbered_items':added,'text_check':'passed'})
(ROOT/'sources'/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(manifest,ensure_ascii=False,indent=2))
