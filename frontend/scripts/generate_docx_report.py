"""
CodeAtlas Academic Report DOCX Generator
Generates a native, 100% valid Microsoft Word .docx document adhering to
Anna University / V.S.B. Engineering College standards, including embedded diagrams,
tables, styled headings, headers, and footers.
"""

import os
import re
import html
import zipfile

def make_docx(output_filename="report/CodeAtlas_Project_Report.docx"):
    print(f"Generating editable Microsoft Word document: {output_filename}...")

    # Media images to embed
    diagram_files = [
        ("report/diagrams/architecture/overall_system_architecture.png", "image1.png", "rId10", "Figure 3.1: CodeAtlas Multi-Tier System Architecture"),
        ("report/diagrams/workflows/frontend_backend_db_interaction.png", "image2.png", "rId11", "Figure 3.2: Frontend - Backend - Database Interaction Sequence"),
        ("report/diagrams/workflows/user_registration_login_sequence.png", "image3.png", "rId12", "Figure 3.3: User Registration, Email OTP Verification & Login Flow"),
        ("report/diagrams/workflows/google_github_oauth_sequence.png", "image4.png", "rId13", "Figure 3.4: Google & GitHub OAuth 2.0 Federated Authentication"),
        ("report/diagrams/database/database_er_diagram.png", "image5.png", "rId14", "Figure 3.7: PostgreSQL Relational Entity-Relationship Diagram"),
        ("report/diagrams/architecture/use_case_diagram.png", "image6.png", "rId15", "Figure 3.8: CodeAtlas Platform Use-Case Diagram"),
        ("report/diagrams/architecture/data_flow_diagram.png", "image7.png", "rId16", "Figure 3.9: CodeAtlas Level-1 Data Flow Diagram (DFD)"),
        ("report/diagrams/architecture/deployment_architecture.png", "image8.png", "rId17", "Figure 3.10: Hybrid Production Deployment Topology"),
        ("report/diagrams/workflows/repository_indexing_workflow.png", "image9.png", "rId18", "Figure 3.5: Repository Code Ingestion & AST Parsing Pipeline"),
        ("report/diagrams/workflows/ai_assisted_code_analysis_workflow.png", "image10.png", "rId19", "Figure 3.6: Evidence-Grounded AI Codebase Reasoning with Gemini"),
    ]

    # 1. [Content_Types].xml
    content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>"""

    # 2. _rels/.rels
    root_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    # 3. word/_rels/document.xml.rels
    doc_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
"""
    for _, img_name, rId, _ in diagram_files:
        doc_rels_xml += f'  <Relationship Id="{rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{img_name}"/>\n'
    doc_rels_xml += "</Relationships>"

    # 4. word/styles.xml
    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:color w:val="1E293B"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="360" w:lineRule="auto" w:after="160"/>
        <w:jc w:val="both"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="180" w:line="360" w:lineRule="auto"/>
      <w:keepNext/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="1E3A8A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120" w:line="360" w:lineRule="auto"/>
      <w:keepNext/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr>
      <w:spacing w:before="180" w:after="80" w:line="360" w:lineRule="auto"/>
      <w:keepNext/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
      <w:b/>
      <w:sz w:val="24"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>
</w:styles>"""

    # 5. word/settings.xml
    settings_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>"""

    # 6. word/fontTable.xml
    font_table_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fontTable xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Times New Roman"/>
  <w:font w:name="Courier New"/>
  <w:font w:name="Arial"/>
</w:fontTable>"""

    # 7. word/header1.xml
    header1_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="6" w:space="4" w:color="CBD5E1"/>
      </w:pBdr>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t>CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM</w:t>
    </w:r>
    <w:r>
      <w:tab/>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t>B.E. CSE REPORT</w:t>
    </w:r>
  </w:p>
</w:hdr>"""

    # 8. word/footer1.xml (with PAGE of NUMPAGES fields)
    footer1_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:top w:val="single" w:sz="6" w:space="4" w:color="CBD5E1"/>
      </w:pBdr>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t>V.S.B. Engineering College, Karur | Department of Computer Science &amp; Engineering</w:t>
    </w:r>
    <w:r>
      <w:tab/>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t>Page </w:t>
    </w:r>
    <w:fldSimple w:instr="PAGE"/>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t> of </w:t>
    </w:r>
    <w:fldSimple w:instr="NUMPAGES"/>
  </w:p>
</w:ftr>"""

    # Helper function to generate paragraph XML
    def make_p_xml(text, style="Normal", align="both", bold=False, italic=False, font_size=24, color="1E293B", space_before=0, space_after=160):
        align_xml = f'<w:jc w:val="{align}"/>' if align else ''
        b_xml = '<w:b/>' if bold else ''
        i_xml = '<w:i/>' if italic else ''
        p_style = f'<w:pStyle w:val="{style}"/>' if style != "Normal" else ''
        
        # Split inline formatting
        runs_xml = ""
        # Check for inline bold, italic, code
        parts = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
        for part in parts:
            if not part:
                continue
            r_b = '<w:b/>' if (bold or part.startswith('**')) else ''
            r_i = '<w:i/>' if (italic or (part.startswith('*') and not part.startswith('**'))) else ''
            r_font = '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>' if part.startswith('`') else ''
            
            clean_part = part.strip('*`')
            clean_part = html.escape(clean_part)
            runs_xml += f"""
      <w:r>
        <w:rPr>
          {r_font}
          {r_b}
          {r_i}
          <w:sz w:val="{font_size}"/>
          <w:color w:val="{color}"/>
        </w:rPr>
        <w:t xml:space="preserve">{clean_part}</w:t>
      </w:r>"""

        return f"""
    <w:p>
      <w:pPr>
        {p_style}
        <w:spacing w:before="{space_before}" w:after="{space_after}" w:line="360" w:lineRule="auto"/>
        {align_xml}
      </w:pPr>
      {runs_xml}
    </w:p>"""

    def make_heading_xml(text, level=1):
        clean_text = text.strip()
        if level == 1:
            return make_p_xml(clean_text, style="Heading1", align="center", bold=True, font_size=32, color="1E3A8A", space_before=400, space_after=200)
        elif level == 2:
            return make_p_xml(clean_text, style="Heading2", align="left", bold=True, font_size=28, color="0F172A", space_before=280, space_after=140)
        else:
            return make_p_xml(clean_text, style="Heading3", align="left", bold=True, font_size=24, color="1E293B", space_before=200, space_after=100)

    def make_page_break():
        return """
    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>"""

    def make_image_xml(rId, caption):
        # 5.5 inches wide, 3.2 inches high in EMUs (1 in = 914400 EMUs)
        cx = 5029200
        cy = 2926080
        img_id = rId.replace("rId", "")
        return f"""
    <w:p>
      <w:pPr>
        <w:spacing w:before="200" w:after="100"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="{cx}" cy="{cy}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="{img_id}" name="Diagram {img_id}"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks noChangeAspect="1" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="{img_id}" name="Picture {img_id}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="{rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="60" w:after="240"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:b/>
          <w:sz w:val="20"/>
          <w:color w:val="475569"/>
        </w:rPr>
        <w:t>{html.escape(caption)}</w:t>
      </w:r>
    </w:p>"""

    def make_table_xml(rows):
        if not rows:
            return ""
        num_cols = len(rows[0])
        col_w = int(9360 / max(num_cols, 1))

        tbl_xml = f"""
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>"""
        for _ in range(num_cols):
            tbl_xml += f'<w:gridCol w:w="{col_w}"/>'
        tbl_xml += "</w:tblGrid>"

        for r_idx, row in enumerate(rows):
            is_head = (r_idx == 0)
            shd_color = "1E40AF" if is_head else ("F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            text_color = "FFFFFF" if is_head else "0F172A"
            is_bold = is_head

            tbl_xml += "<w:tr>"
            for cell in row:
                cell_esc = html.escape(cell.strip('*` '))
                tbl_xml += f"""
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="{col_w}" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="{shd_color}"/>
            <w:tcMar>
              <w:top w:w="120" w:type="dxa"/>
              <w:bottom w:w="120" w:type="dxa"/>
              <w:left w:w="140" w:type="dxa"/>
              <w:right w:w="140" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:spacing w:line="260" w:lineRule="auto" w:before="40" w:after="40"/>
              <w:jc w:val="left"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                {'<w:b/>' if is_bold else ''}
                <w:sz w:val="19"/>
                <w:color w:val="{text_color}"/>
              </w:rPr>
              <w:t xml:space="preserve">{cell_esc}</w:t>
            </w:r>
          </w:p>
        </w:tc>"""
            tbl_xml += "</w:tr>"
        tbl_xml += "</w:tbl>"
        return tbl_xml

    # Parse and compile document body
    body_xml = ""

    # Cover Page
    body_xml += make_p_xml("A PROJECT REPORT", align="center", bold=True, font_size=26, space_before=400, space_after=100)
    body_xml += make_p_xml("ON", align="center", bold=True, font_size=24, space_before=60, space_after=200)
    body_xml += make_p_xml("CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM", align="center", bold=True, font_size=36, color="1E3A8A", space_before=200, space_after=300)
    body_xml += make_p_xml("Submitted by", align="center", font_size=24, space_before=200, space_after=140)
    body_xml += make_p_xml("[STUDENT NAME 1] &nbsp;&nbsp;&nbsp;&nbsp; (Reg. No.: [REGISTER NUMBER 1])", align="center", bold=True, font_size=24, space_before=80, space_after=80)
    body_xml += make_p_xml("[STUDENT NAME 2] &nbsp;&nbsp;&nbsp;&nbsp; (Reg. No.: [REGISTER NUMBER 2])", align="center", bold=True, font_size=24, space_before=80, space_after=300)
    body_xml += make_p_xml("in partial fulfillment for the award of the degree of", align="center", font_size=22, space_before=100, space_after=100)
    body_xml += make_p_xml("BACHELOR OF ENGINEERING", align="center", bold=True, font_size=26, color="1E40AF", space_before=100, space_after=60)
    body_xml += make_p_xml("IN", align="center", font_size=22, space_before=60, space_after=60)
    body_xml += make_p_xml("COMPUTER SCIENCE AND ENGINEERING", align="center", bold=True, font_size=26, color="1E40AF", space_before=60, space_after=300)
    body_xml += make_p_xml("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", align="center", bold=True, font_size=24, space_before=100, space_after=60)
    body_xml += make_p_xml("V.S.B. ENGINEERING COLLEGE", align="center", bold=True, font_size=32, color="0F172A", space_before=60, space_after=60)
    body_xml += make_p_xml("KARUR - 639 111, TAMIL NADU, INDIA", align="center", bold=True, font_size=22, space_before=60, space_after=140)
    body_xml += make_p_xml("ANNA UNIVERSITY: CHENNAI - 600 025", align="center", bold=True, font_size=24, space_before=100, space_after=100)
    body_xml += make_p_xml("[ACADEMIC YEAR: 2026 - 2027]", align="center", bold=True, font_size=24, space_before=100, space_after=100)
    body_xml += make_page_break()

    # Preliminary Pages
    prelim_files = ["report/chapters/preliminary_pages.md"]
    for pf in prelim_files:
        if os.path.exists(pf):
            with open(pf, "r", encoding="utf-8") as f:
                content = f.read()
            sections = content.split("\n---")
            for sec in sections:
                lines = sec.strip().split("\n")
                in_table = False
                t_rows = []
                for line in lines:
                    line_s = line.rstrip()
                    if "|" in line_s:
                        if re.match(r"^\s*\|?\s*:?-+:?\s*\|", line_s):
                            continue
                        cells = [c.strip() for c in line_s.split("|")[1:-1]]
                        if cells:
                            in_table = True
                            t_rows.append(cells)
                        continue
                    else:
                        if in_table and t_rows:
                            body_xml += make_table_xml(t_rows)
                            in_table = False
                            t_rows = []

                    if not line_s.strip() or line_s.startswith("```"):
                        continue
                    if line_s.startswith("# "):
                        body_xml += make_heading_xml(line_s[2:], 1)
                    elif line_s.startswith("## "):
                        body_xml += make_heading_xml(line_s[3:], 2)
                    elif line_s.startswith("### "):
                        body_xml += make_heading_xml(line_s[4:], 3)
                    elif line_s.startswith("- ") or line_s.startswith("* "):
                        body_xml += make_p_xml("• " + line_s[2:].strip(), space_before=40, space_after=60)
                    else:
                        body_xml += make_p_xml(line_s.strip())
                if in_table and t_rows:
                    body_xml += make_table_xml(t_rows)
                body_xml += make_page_break()

    # Markdown chapter processor
    def process_md_file(md_path):
        out = ""
        if not os.path.exists(md_path):
            return out
        with open(md_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        in_code = False
        in_table = False
        t_rows = []

        for line in lines:
            line_s = line.rstrip()
            if line_s.startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                out += make_p_xml(line_s, style="Normal", font_size=18, color="0F172A", space_before=20, space_after=20)
                continue
            if "|" in line_s and not line_s.strip().startswith("#"):
                if re.match(r"^\s*\|?\s*:?-+:?\s*\|", line_s):
                    continue
                cells = [c.strip() for c in line_s.split("|")[1:-1]]
                if cells:
                    in_table = True
                    t_rows.append(cells)
                continue
            else:
                if in_table and t_rows:
                    out += make_table_xml(t_rows)
                    in_table = False
                    t_rows = []

            if not line_s.strip():
                continue

            if line_s.startswith("# "):
                out += make_heading_xml(line_s[2:], 1)
            elif line_s.startswith("## "):
                out += make_heading_xml(line_s[3:], 2)
            elif line_s.startswith("### "):
                out += make_heading_xml(line_s[4:], 3)
            elif line_s.startswith("- ") or line_s.startswith("* "):
                out += make_p_xml("• " + line_s[2:].strip(), space_before=40, space_after=60)
            elif re.match(r"^\d+\.\s+", line_s):
                out += make_p_xml(line_s.strip(), space_before=40, space_after=60)
            else:
                out += make_p_xml(line_s.strip())

        if in_table and t_rows:
            out += make_table_xml(t_rows)
        out += make_page_break()
        return out

    # Append all chapters
    body_xml += process_md_file("report/chapters/chapter_1_introduction.md")
    body_xml += process_md_file("report/chapters/chapter_2_literature_survey.md")
    
    # Chapter 3 with diagrams
    body_xml += process_md_file("report/chapters/chapter_3_system_design.md")
    for _, _, rId, caption in diagram_files[:8]:
        body_xml += make_image_xml(rId, caption)
    body_xml += make_page_break()

    # Chapter 4 with indexing and AI diagrams
    body_xml += process_md_file("report/chapters/chapter_4_methodology.md")
    for _, _, rId, caption in diagram_files[8:]:
        body_xml += make_image_xml(rId, caption)
    body_xml += make_page_break()

    # Chapters 5, 6, Appendices, References
    body_xml += process_md_file("report/chapters/chapter_5_testing_results.md")
    body_xml += process_md_file("report/chapters/chapter_6_conclusion.md")
    body_xml += process_md_file("report/chapters/appendices.md")
    body_xml += process_md_file("report/chapters/references.md")

    # Final document.xml assembly
    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    {body_xml}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId4"/>
      <w:footerReference w:type="default" r:id="rId5"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    # Assemble ZIP file as .docx
    with zipfile.ZipFile(output_filename, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types_xml)
        z.writestr("_rels/.rels", root_rels_xml)
        z.writestr("word/_rels/document.xml.rels", doc_rels_xml)
        z.writestr("word/document.xml", document_xml)
        z.writestr("word/styles.xml", styles_xml)
        z.writestr("word/settings.xml", settings_xml)
        z.writestr("word/fontTable.xml", font_table_xml)
        z.writestr("word/header1.xml", header1_xml)
        z.writestr("word/footer1.xml", footer1_xml)

        # Add image media files
        for src_path, arc_name, _, _ in diagram_files:
            if os.path.exists(src_path):
                z.write(src_path, f"word/media/{arc_name}")

    print(f"DOCX build complete: {output_filename}")

if __name__ == "__main__":
    os.makedirs("report", exist_ok=True)
    make_docx()

