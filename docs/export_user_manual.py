"""Export the adjacent Markdown manual to editable DOCX and print HTML.

Uses only the Python standard library. Run: python docs/export_user_manual.py
The PDF is rendered separately with the project's existing DomPDF dependency.
"""

from html import escape
from pathlib import Path
import re
from xml.etree import ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'USER_MANUAL.md'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
ET.register_namespace('w', W)
ET.register_namespace('r', R)


def element(tag, attributes=None, text=None):
    item = ET.Element(f'{{{W}}}{tag}', {f'{{{W}}}{key}': str(value) for key, value in (attributes or {}).items()})
    item.text = text
    return item


def inline_runs(parent, text):
    # Render the inline constructs used by this manual; retain link labels.
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    for token in re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', text):
        if not token:
            continue
        run = element('r')
        if token.startswith('**'):
            properties = element('rPr')
            properties.append(element('b'))
            run.append(properties)
            token = token[2:-2]
        elif token.startswith('`'):
            properties = element('rPr')
            properties.append(element('rFonts', {'ascii': 'Consolas', 'hAnsi': 'Consolas'}))
            run.append(properties)
            token = token[1:-1]
        value = element('t', text=token)
        value.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        run.append(value)
        parent.append(run)


def paragraph(text='', style=None):
    item = element('p')
    if style:
        properties = element('pPr')
        properties.append(element('pStyle', {'val': style}))
        item.append(properties)
    inline_runs(item, text)
    return item


def html_inline(text):
    text = escape(text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)


def blocks(lines):
    position = 0
    while position < len(lines):
        line = lines[position].strip()
        if not line:
            position += 1
            continue
        if line.startswith('|'):
            rows = []
            while position < len(lines) and lines[position].strip().startswith('|'):
                cells = [cell.strip() for cell in lines[position].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-{3,}:?', cell) for cell in cells):
                    rows.append(cells)
                position += 1
            yield ('table', rows)
            continue
        heading = re.match(r'^(#{1,4})\s+(.+)', line)
        if heading:
            yield ('heading', (len(heading.group(1)), heading.group(2)))
            position += 1
            continue
        if re.match(r'^(\d+\.\s+|-\s+)', line):
            yield ('list', line)
            position += 1
            continue
        text = [line]
        position += 1
        while position < len(lines) and lines[position].strip() and not re.match(r'^(#|\||\d+\.\s+|-\s+)', lines[position].strip()):
            text.append(lines[position].strip())
            position += 1
        yield ('paragraph', ' '.join(text))


def word_table(rows):
    table = element('tbl')
    properties = element('tblPr')
    properties.append(element('tblW', {'w': 0, 'type': 'auto'}))
    properties.append(element('tblLayout', {'type': 'fixed'}))
    borders = element('tblBorders')
    for side in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        borders.append(element(side, {'val': 'single', 'sz': 4, 'color': 'CBD8CC'}))
    properties.append(borders)
    table.append(properties)
    columns = max(map(len, rows))
    grid = element('tblGrid')
    width = 9360 // columns
    for _ in range(columns):
        grid.append(element('gridCol', {'w': width}))
    table.append(grid)
    for index, row in enumerate(rows):
        tr = element('tr')
        row_properties = element('trPr')
        if index == 0:
            row_properties.append(element('tblHeader'))
        tr.append(row_properties)
        for value in row:
            cell = element('tc')
            cell_properties = element('tcPr')
            cell_properties.append(element('tcW', {'w': width, 'type': 'dxa'}))
            if index == 0:
                cell_properties.append(element('shd', {'fill': 'EAF2EB'}))
            margins = element('tcMar')
            for side in ['top', 'left', 'bottom', 'right']:
                margins.append(element(side, {'w': 80, 'type': 'dxa'}))
            cell_properties.append(margins)
            cell.append(cell_properties)
            cell.append(paragraph('**' + value + '**' if index == 0 else value, 'TableText'))
            tr.append(cell)
        table.append(tr)
    return table


def xml(item):
    return ET.tostring(item, encoding='utf-8', xml_declaration=True)


def export():
    source = SOURCE.read_text(encoding='utf-8')
    # Front matter has its own designed cover in the exported versions.
    content = source[source.index('## Contents'):].splitlines()
    document = element('document')
    body = element('body')
    document.append(body)
    for text, style in [
        ('Living Myth Industrial Clinic', 'Subtitle'),
        ('Medical Services Management System', 'Title'),
        ('User Manual', 'Title'),
        ('Guest/Public Pages • Patient • Company • Receptionist • Doctor • MedTech • RadTech • Administrator', 'Subtitle'),
        ('Version 1.2 | November 3, 2026', 'Subtitle'),
        ('Printed results are collected at the clinic. Patient accounts track document status; they do not download clinical report PDFs.', 'Normal'),
        ('This edition covers the implemented menus and workflows. Screenshots are not included; a separate screenshot checklist supports an illustrated edition.', 'Normal'),
    ]:
        body.append(paragraph(text, style))
    page_break = paragraph()
    run = element('r')
    run.append(element('br', {'type': 'page'}))
    page_break.append(run)
    body.append(page_break)
    html = ['<section class="cover"><p class="eyebrow">Living Myth Industrial Clinic</p><h1>Medical Services Management System</h1><h1>User Manual</h1><p>Version 1.2 · November 3, 2026</p><p>Guest/Public Pages &middot; Patient · Company · Receptionist · Doctor · MedTech · RadTech · Administrator</p><div class="cover-note">Printed results are collected at the clinic. Patients track document status; they do not download clinical report PDFs.</div><p class="note">Text edition verified against the current application. Screenshots are not included.</p></section>']
    for kind, value in blocks(content):
        if kind == 'heading':
            level, text = value
            style = 'ContentsHeading' if text == 'Contents' else 'Heading' + str(max(1, level - 1))
            body.append(paragraph(text, style))
            html.append(f'<h{level} class="{"contents" if text == "Contents" else "chapter" if level == 2 else "subsection"}">{html_inline(text)}</h{level}>')
        elif kind == 'table':
            body.append(word_table(value))
            html.append('<table><thead><tr>' + ''.join('<th>' + html_inline(cell) + '</th>' for cell in value[0]) + '</tr></thead><tbody>')
            for row in value[1:]:
                html.append('<tr>' + ''.join('<td>' + html_inline(cell) + '</td>' for cell in row) + '</tr>')
            html.append('</tbody></table>')
            body.append(paragraph())
        else:
            body.append(paragraph(value, 'ListText' if kind == 'list' else 'Normal'))
            html.append(f'<p class="{"step" if kind == "list" else "body"}">{html_inline(value)}</p>')
    section = element('sectPr')
    section.append(element('footerReference', {'type': 'default'}))
    section[-1].set(f'{{{R}}}id', 'rIdFooter')
    section.append(element('pgSz', {'w': 11906, 'h': 16838}))
    section.append(element('pgMar', {'top': 1080, 'right': 1273, 'bottom': 1080, 'left': 1273, 'header': 400, 'footer': 500}))
    body.append(section)
    footer = element('ftr')
    footer_paragraph = paragraph('LMIC User Manual • Version 1.2 | Page ', 'Footer')
    field = element('fldSimple', {'instr': 'PAGE'})
    field.append(element('r'))
    field[0].append(element('t', text='1'))
    footer_paragraph.append(field)
    footer.append(footer_paragraph)
    styles = f'''<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="{W}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="24332A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="270" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:before="280" w:after="220"/></w:pPr><w:rPr><w:b/><w:sz w:val="52"/><w:color w:val="315D40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="260"/></w:pPr><w:rPr><w:sz w:val="25"/><w:color w:val="5F7264"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ContentsHeading"><w:name w:val="Contents"/><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="315D40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:before="140" w:after="180"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="315D40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="315D40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:pPr><w:keepNext/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:pPr><w:spacing w:after="40" w:line="240"/></w:pPr><w:rPr><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListText"><w:name w:val="List Text"/><w:pPr><w:ind w:left="260" w:hanging="260"/><w:spacing w:after="90"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="Footer"/><w:pPr><w:jc w:val="right"/></w:pPr><w:rPr><w:sz w:val="17"/><w:color w:val="5F7264"/></w:rPr></w:style>
</w:styles>'''
    types = '''<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'''
    rel_namespace = 'http://schemas.openxmlformats.org/package/2006/relationships'
    docx_path = ROOT / 'USER_MANUAL.docx'
    try:
        archive = ZipFile(docx_path, 'w', ZIP_DEFLATED)
    except PermissionError:
        docx_path = ROOT / 'USER_MANUAL_v1.2.docx'
        archive = ZipFile(docx_path, 'w', ZIP_DEFLATED)
    with archive as output:
        output.writestr('[Content_Types].xml', types)
        output.writestr('_rels/.rels', f'<Relationships xmlns="{rel_namespace}"><Relationship Id="rIdDocument" Type="{R}/officeDocument" Target="word/document.xml"/></Relationships>')
        output.writestr('word/_rels/document.xml.rels', f'<Relationships xmlns="{rel_namespace}"><Relationship Id="rIdStyles" Type="{R}/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="{R}/footer" Target="footer1.xml"/></Relationships>')
        output.writestr('word/document.xml', xml(document))
        output.writestr('word/styles.xml', styles)
        output.writestr('word/footer1.xml', xml(footer))
    css = '''@page { margin: 42px 44px 48px; } body { font-family: DejaVu Sans, sans-serif; font-size: 10px; line-height: 1.45; color: #24332a; } h1 { font-size: 28px; color: #315d40; line-height: 1.2; } h2 { font-size: 20px; color: #315d40; } h2.chapter { page-break-before: always; } h3 { margin-top: 18px; font-size: 13px; color: #315d40; page-break-after: avoid; } .cover { padding-top: 100px; page-break-after: always; } .cover-note { margin-top: 35px; border-left: 4px solid #315d40; padding: 15px; background: #eaf2eb; } .eyebrow { font-weight: bold; color: #5f7264; } .note { margin-top: 30px; color: #5f7264; } p { margin: 0 0 8px; } p.step { padding-left: 10px; } table { width: 100%; border-collapse: collapse; margin: 10px 0 14px; table-layout: fixed; font-size: 9px; } th, td { border: 1px solid #cbd8cc; padding: 6px; vertical-align: top; word-wrap: break-word; } th { background: #eaf2eb; text-align: left; } tr { page-break-inside: avoid; } a { color: #315d40; } code { font-family: DejaVu Sans Mono, monospace; font-size: 8px; }'''
    (ROOT / 'USER_MANUAL.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>LMIC User Manual</title><style>' + css + '</style></head><body>' + '\n'.join(html) + '</body></html>', encoding='utf-8')
    print(f'Created docs/{docx_path.name} and docs/USER_MANUAL.html')


if __name__ == '__main__':
    export()
