"""
CodeAtlas Academic Report PDF Generator using ReportLab
Generates the complete, publication-grade academic project report PDF
adhering to Anna University / V.S.B. Engineering College standards.
"""

import os
import re
import html
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

def clean_md_inline(text):
    """
    Safely converts Markdown inline formatting (bold, italic, code)
    to ReportLab-compatible XML tags without tag overlap.
    """
    # 1. Protect existing entities and code spans
    code_matches = []
    def code_repl(m):
        code_matches.append(m.group(1))
        return f"__CODE_TOKEN_{len(code_matches)-1}__"

    text = re.sub(r"`([^`]+)`", code_repl, text)

    # 2. Escape XML entities
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # 3. Bold: **text** (matching paired asterisks)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)

    # 4. Italic: *text* (single asterisks not adjacent to other asterisks)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)

    # 5. Restore code tokens
    for idx, ctext in enumerate(code_matches):
        c_esc = ctext.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        text = text.replace(f"__CODE_TOKEN_{idx}__", f"<font face='Courier'>{c_esc}</font>")

    return text

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Times-Roman", 9)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setFillColor(colors.HexColor("#475569"))

        width, height = A4
        margin = 54

        # Header
        self.drawString(margin, height - 40, "CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM")
        self.drawRightString(width - margin, height - 40, "B.E. CSE PROJECT REPORT")
        self.setLineWidth(0.5)
        self.line(margin, height - 45, width - margin, height - 45)

        # Footer
        self.line(margin, 48, width - margin, 48)
        self.drawString(margin, 34, "V.S.B. Engineering College, Karur | Department of Computer Science and Engineering")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(width - margin, 34, page_str)
        self.restoreState()

def build_pdf(filename="report/CodeAtlas_Project_Report.pdf"):
    print(f"Building comprehensive PDF report: {filename}...")
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    style_cover_title = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=22,
        leading=28,
        alignment=1,
        textColor=colors.HexColor("#0F172A")
    )
    style_cover_sub = ParagraphStyle(
        "CoverSub",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor("#1E3A8A")
    )
    style_cover_body = ParagraphStyle(
        "CoverBody",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=12,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#334155")
    )
    style_cover_bold = ParagraphStyle(
        "CoverBold",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=12,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#0F172A")
    )

    style_chap_title = ParagraphStyle(
        "ChapterTitle",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=18,
        leading=24,
        alignment=1,
        spaceAfter=15,
        textColor=colors.HexColor("#1E3A8A")
    )
    style_h1 = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=14,
        leading=18,
        spaceBefore=14,
        spaceAfter=8,
        textColor=colors.HexColor("#0F172A"),
        keepWithNext=True
    )
    style_h2 = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=12,
        leading=16,
        spaceBefore=10,
        spaceAfter=6,
        textColor=colors.HexColor("#1E293B"),
        keepWithNext=True
    )
    style_body = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=15,
        alignment=4,
        spaceAfter=8,
        textColor=colors.HexColor("#1E293B")
    )
    style_bullet = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=15,
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=4,
        textColor=colors.HexColor("#1E293B")
    )
    style_code = ParagraphStyle(
        "Code_Custom",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=8
    )
    style_caption = ParagraphStyle(
        "Caption_Custom",
        parent=styles["Normal"],
        fontName="Times-BoldItalic",
        fontSize=10,
        leading=14,
        alignment=1,
        spaceBefore=6,
        spaceAfter=12,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # 1. COVER PAGE
    story.append(Spacer(1, 20))
    story.append(Paragraph("A PROJECT REPORT", style_cover_bold))
    story.append(Paragraph("ON", style_cover_bold))
    story.append(Spacer(1, 15))
    story.append(Paragraph("CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM", style_cover_title))
    story.append(Spacer(1, 25))
    story.append(Paragraph("Submitted by", style_cover_body))
    story.append(Spacer(1, 10))
    story.append(Paragraph("[STUDENT NAME 1] &nbsp;&nbsp;&nbsp;&nbsp; (Reg. No.: [REGISTER NUMBER 1])", style_cover_bold))
    story.append(Paragraph("[STUDENT NAME 2] &nbsp;&nbsp;&nbsp;&nbsp; (Reg. No.: [REGISTER NUMBER 2])", style_cover_bold))
    story.append(Spacer(1, 30))
    story.append(Paragraph("in partial fulfillment for the award of the degree of", style_cover_body))
    story.append(Spacer(1, 10))
    story.append(Paragraph("BACHELOR OF ENGINEERING", style_cover_sub))
    story.append(Paragraph("IN", style_cover_body))
    story.append(Paragraph("COMPUTER SCIENCE AND ENGINEERING", style_cover_sub))
    story.append(Spacer(1, 40))
    story.append(Paragraph("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", style_cover_bold))
    story.append(Paragraph("V.S.B. ENGINEERING COLLEGE", style_cover_title))
    story.append(Paragraph("KARUR - 639 111, TAMIL NADU, INDIA", style_cover_bold))
    story.append(Spacer(1, 15))
    story.append(Paragraph("ANNA UNIVERSITY: CHENNAI - 600 025", style_cover_bold))
    story.append(Spacer(1, 15))
    story.append(Paragraph("[ACADEMIC YEAR: 2026 - 2027]", style_cover_bold))
    story.append(PageBreak())

    # 2. BONAFIDE CERTIFICATE
    story.append(Paragraph("V.S.B. ENGINEERING COLLEGE, KARUR - 639 111", style_cover_bold))
    story.append(Spacer(1, 10))
    story.append(Paragraph("BONAFIDE CERTIFICATE", style_chap_title))
    story.append(Spacer(1, 15))
    cert_text = (
        "Certified that this project report titled <b>\"CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM\"</b> "
        "is the bonafide work of <b>[STUDENT NAME 1] (Reg. No.: [REGISTER NUMBER 1])</b> and "
        "<b>[STUDENT NAME 2] (Reg. No.: [REGISTER NUMBER 2])</b>, who carried out the project work under my supervision "
        "in partial fulfillment of the requirements for the award of the degree of <b>Bachelor of Engineering in "
        "Computer Science and Engineering</b> of Anna University, Chennai."
    )
    story.append(Paragraph(cert_text, style_body))
    story.append(Spacer(1, 50))

    cert_table_data = [
        [
            Paragraph("<b>SIGNATURE</b><br/><br/><br/><b>[SUPERVISOR NAME]</b><br/>PROJECT SUPERVISOR<br/>Assistant Professor<br/>Department of CSE<br/>V.S.B. Engineering College<br/>Karur - 639 111", style_body),
            Paragraph("<b>SIGNATURE</b><br/><br/><br/><b>[HEAD OF THE DEPARTMENT]</b><br/>HEAD OF THE DEPARTMENT<br/>Professor & Head<br/>Department of CSE<br/>V.S.B. Engineering College<br/>Karur - 639 111", style_body)
        ]
    ]
    cert_table = Table(cert_table_data, colWidths=[240, 240])
    cert_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(cert_table)
    story.append(Spacer(1, 50))
    story.append(Paragraph("Submitted for the Project Viva-Voce examination held on ____________________.", style_body))
    story.append(Spacer(1, 40))

    examiners_data = [
        [Paragraph("<b>INTERNAL EXAMINER</b>", style_body), Paragraph("<b>EXTERNAL EXAMINER</b>", style_body)]
    ]
    examiners_table = Table(examiners_data, colWidths=[240, 240])
    story.append(examiners_table)
    story.append(PageBreak())

    # 3. STUDENT DECLARATION
    story.append(Paragraph("STUDENT DECLARATION", style_chap_title))
    story.append(Spacer(1, 15))
    decl_text = (
        "We, <b>[STUDENT NAME 1] (Reg. No.: [REGISTER NUMBER 1])</b> and <b>[STUDENT NAME 2] (Reg. No.: [REGISTER NUMBER 2])</b>, "
        "hereby declare that the project report titled <b>\"CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM\"</b> "
        "submitted to Anna University, Chennai, in partial fulfillment of the requirements for the award of the Degree of "
        "<b>Bachelor of Engineering in Computer Science and Engineering</b>, is a record of original work done by us under "
        "the guidance of <b>[SUPERVISOR NAME]</b>, Department of Computer Science and Engineering, V.S.B. Engineering College, Karur.<br/><br/>"
        "We further declare that the work reported herein does not form part of any other project report or dissertation on the "
        "basis of which a degree or award was conferred on an earlier occasion on this or any other candidate."
    )
    story.append(Paragraph(decl_text, style_body))
    story.append(Spacer(1, 60))
    sig_data = [
        [Paragraph("<b>Place:</b> Karur<br/><b>Date:</b> [SUBMISSION DATE]", style_body),
         Paragraph("1. ___________________________<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>[STUDENT NAME 1]</b><br/><br/>2. ___________________________<br/>&nbsp;&nbsp;&nbsp;&nbsp;<b>[STUDENT NAME 2]</b>", style_body)]
    ]
    sig_table = Table(sig_data, colWidths=[240, 240])
    story.append(sig_table)
    story.append(PageBreak())

    # 4. ACKNOWLEDGEMENT
    story.append(Paragraph("ACKNOWLEDGEMENT", style_chap_title))
    story.append(Spacer(1, 15))
    ack_text = (
        "We express our profound gratitude to our respected Chairman, Correspondent, and Principal of V.S.B. Engineering College, "
        "Karur, for providing state-of-the-art computational infrastructure, research laboratories, and an inspiring academic environment.<br/><br/>"
        "We convey our heartfelt thanks to <b>[HEAD OF THE DEPARTMENT]</b>, Head of the Department of Computer Science and Engineering, "
        "for their continuous encouragement and administrative guidance throughout the project tenure.<br/><br/>"
        "We record our deepest sense of gratitude to our project supervisor, <b>[SUPERVISOR NAME]</b>, for their invaluable guidance, "
        "penetrating technical critiques, and meticulous scrutiny during every development phase of CodeAtlas.<br/><br/>"
        "Finally, we extend our heartfelt appreciation to our parents, family members, and classmates for their moral support, "
        "patience, and unwavering encouragement."
    )
    story.append(Paragraph(ack_text, style_body))
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>[STUDENT NAME 1]</b><br/><b>[STUDENT NAME 2]</b>", ParagraphStyle("SignRight", parent=style_body, alignment=2)))
    story.append(PageBreak())

    # 5. ABSTRACT & KEYWORDS
    story.append(Paragraph("ABSTRACT", style_chap_title))
    story.append(Spacer(1, 10))
    abstract_text = (
        "Modern software development is characterized by massive, polyglot codebases distributed across decoupled microservices. "
        "Empirical studies indicate that software developers spend up to 70% of their working hours comprehending unfamiliar code, "
        "tracing caller/callee dependencies, predicting blast-radius impacts, and refactoring architectural debt. Existing developer "
        "tools either provide static warning logs or ungrounded generative AI chatbots prone to hallucinating nonexistent functions.<br/><br/>"
        "This project presents <b>CodeAtlas</b>, an AI-powered codebase intelligence platform designed to bridge deterministic compiler analysis "
        "with multi-modal artificial intelligence. CodeAtlas is built as a multi-tier web application featuring a Next.js 14 client frontend "
        "(React 18, TypeScript, Tailwind CSS, Framer Motion), an asynchronous Python FastAPI gateway, and an ACID-compliant PostgreSQL relational "
        "database on AWS Neon Cloud. The platform implements a multi-language lexical Abstract Syntax Tree (AST) parser that extracts functions, "
        "classes, routes, and decorators with exact 1-based source line coordinates. A graph-mining engine resolves bidirectional caller/callee trees "
        "and detects circular dependencies using Tarjan's strongly connected components algorithm.<br/><br/>"
        "CodeAtlas integrates Google Gemini AI foundation models (gemini-1.5-flash and gemini-1.5-pro) through a bounded Retrieval-Augmented Generation "
        "(RAG) pipeline that guarantees zero hallucinations by conditioning answers strictly on parsed AST contexts and providing clickable source receipts. "
        "A deterministic offline fallback synthesizes structured technical answers directly from the AST symbol graph when external AI services are unavailable. "
        "The security architecture incorporates 12-round bcrypt password hashing, 6-digit email OTP verification, Google OAuth (OIDC), GitHub OAuth (OAuth 2.0 "
        "with anti-CSRF state cookies), and HttpOnly session persistence. An automated static export pipeline compiles 47 static HTML pages with repository "
        "basePath injection for deployment to GitHub Pages via GitHub Actions. Across 237 automated assertions, CodeAtlas achieved a 100% test pass rate with "
        "0 TypeScript and ESLint errors."
    )
    story.append(Paragraph(abstract_text, style_body))
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>Keywords:</b> Codebase Intelligence, Abstract Syntax Tree (AST), Static Analysis, Retrieval-Augmented Generation (RAG), Google Gemini AI, Dependency Analysis, Next.js 14, FastAPI, PostgreSQL, OAuth 2.0, GitHub Pages.", style_body))
    story.append(PageBreak())

    # 6. TABLE OF CONTENTS
    story.append(Paragraph("TABLE OF CONTENTS", style_chap_title))
    story.append(Spacer(1, 10))
    toc_data = [
        [Paragraph("<b>Title</b>", style_body), Paragraph("<b>Page No.</b>", style_body)],
        [Paragraph("Bonafide Certificate", style_body), Paragraph("ii", style_body)],
        [Paragraph("Student Declaration", style_body), Paragraph("iii", style_body)],
        [Paragraph("Acknowledgement", style_body), Paragraph("iv", style_body)],
        [Paragraph("Abstract & Keywords", style_body), Paragraph("v", style_body)],
        [Paragraph("List of Figures", style_body), Paragraph("vii", style_body)],
        [Paragraph("List of Tables", style_body), Paragraph("viii", style_body)],
        [Paragraph("List of Abbreviations", style_body), Paragraph("ix", style_body)],
        [Paragraph("<b>CHAPTER 1 — INTRODUCTION</b>", style_body), Paragraph("<b>1</b>", style_body)],
        [Paragraph("&nbsp;&nbsp;1.1 Overview of Software Codebases and Modern Development", style_body), Paragraph("1", style_body)],
        [Paragraph("&nbsp;&nbsp;1.2 Problems in Understanding Large Codebases", style_body), Paragraph("2", style_body)],
        [Paragraph("&nbsp;&nbsp;1.3 Need for Intelligent Codebase Analysis", style_body), Paragraph("3", style_body)],
        [Paragraph("&nbsp;&nbsp;1.4 Role of Artificial Intelligence in Software Engineering", style_body), Paragraph("4", style_body)],
        [Paragraph("&nbsp;&nbsp;1.5 Problem Statement & Objectives", style_body), Paragraph("5", style_body)],
        [Paragraph("&nbsp;&nbsp;1.7 Scope, Challenges and Organization", style_body), Paragraph("6", style_body)],
        [Paragraph("<b>CHAPTER 2 — LITERATURE SURVEY</b>", style_body), Paragraph("<b>10</b>", style_body)],
        [Paragraph("&nbsp;&nbsp;2.1 Program Comprehension & Maintenance Research", style_body), Paragraph("10", style_body)],
        [Paragraph("&nbsp;&nbsp;2.2 Static Analysis & AST Dependency Mining", style_body), Paragraph("12", style_body)],
        [Paragraph("&nbsp;&nbsp;2.3 LLMs & Grounded RAG Architectures", style_body), Paragraph("14", style_body)],
        [Paragraph("&nbsp;&nbsp;2.4 Software Security & Authentication Standards", style_body), Paragraph("16", style_body)],
        [Paragraph("&nbsp;&nbsp;2.5 Literature Survey Comparison Table", style_body), Paragraph("18", style_body)],
        [Paragraph("&nbsp;&nbsp;2.6 Identified Research Gaps & Proposed Solutions", style_body), Paragraph("20", style_body)],
        [Paragraph("<b>CHAPTER 3 — SYSTEM ANALYSIS AND DESIGN</b>", style_body), Paragraph("<b>23</b>", style_body)],
        [Paragraph("&nbsp;&nbsp;3.1 Existing Approaches vs Proposed CodeAtlas", style_body), Paragraph("23", style_body)],
        [Paragraph("&nbsp;&nbsp;3.4 Requirements & Feasibility Analysis", style_body), Paragraph("25", style_body)],
        [Paragraph("&nbsp;&nbsp;3.7 System Architecture & Component Design", style_body), Paragraph("28", style_body)],
        [Paragraph("&nbsp;&nbsp;3.9 Use-Case & Level-1 Data Flow Diagrams", style_body), Paragraph("31", style_body)],
        [Paragraph("&nbsp;&nbsp;3.11 Relational Database Design & ER Diagram", style_body), Paragraph("34", style_body)],
        [Paragraph("&nbsp;&nbsp;3.12 API & Authentication Security Design", style_body), Paragraph("36", style_body)],
        [Paragraph("<b>CHAPTER 4 — METHODOLOGY AND IMPLEMENTATION</b>", style_body), Paragraph("<b>41</b>", style_body)],
        [Paragraph("&nbsp;&nbsp;4.1 Methodology & Technology Stack", style_body), Paragraph("41", style_body)],
        [Paragraph("&nbsp;&nbsp;4.3 Frontend & Backend Implementation", style_body), Paragraph("43", style_body)],
        [Paragraph("&nbsp;&nbsp;4.6 Authentication, Bcrypt Hashing & OAuth", style_body), Paragraph("47", style_body)],
        [Paragraph("&nbsp;&nbsp;4.10 AST Parsing & Call Graph Algorithms", style_body), Paragraph("52", style_body)],
        [Paragraph("&nbsp;&nbsp;4.12 Grounded AI Reasoning with Gemini", style_body), Paragraph("55", style_body)],
        [Paragraph("&nbsp;&nbsp;4.14 Architecture Visualization & Circular Dependency Miner", style_body), Paragraph("58", style_body)],
        [Paragraph("&nbsp;&nbsp;4.19 Static Export Build & GitHub Pages Deployment", style_body), Paragraph("64", style_body)],
        [Paragraph("<b>CHAPTER 5 — TESTING, RESULTS, AND DISCUSSION</b>", style_body), Paragraph("<b>67</b>", style_body)],
        [Paragraph("&nbsp;&nbsp;5.1 Testing Objectives & Test Environments", style_body), Paragraph("67", style_body)],
        [Paragraph("&nbsp;&nbsp;5.3 Unit, Integration, Auth & OAuth Test Suites", style_body), Paragraph("68", style_body)],
        [Paragraph("&nbsp;&nbsp;5.7 Gemini Grounding & Static Build Verifications", style_body), Paragraph("72", style_body)],
        [Paragraph("&nbsp;&nbsp;5.9 Comprehensive Test Case Execution Matrix", style_body), Paragraph("74", style_body)],
        [Paragraph("&nbsp;&nbsp;5.10 Issues Encountered & Engineering Resolutions", style_body), Paragraph("78", style_body)],
        [Paragraph("&nbsp;&nbsp;5.12 Discussion of Findings & Limitations", style_body), Paragraph("80", style_body)],
        [Paragraph("<b>CHAPTER 6 — CONCLUSION AND FUTURE ENHANCEMENTS</b>", style_body), Paragraph("<b>83</b>", style_body)],
        [Paragraph("<b>APPENDICES (A through H)</b>", style_body), Paragraph("<b>87</b>", style_body)],
        [Paragraph("<b>REFERENCES</b>", style_body), Paragraph("<b>106</b>", style_body)]
    ]
    toc_table = Table(toc_data, colWidths=[400, 80])
    toc_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(toc_table)
    story.append(PageBreak())

    # LIST OF FIGURES & TABLES
    story.append(Paragraph("LIST OF FIGURES", style_chap_title))
    story.append(Spacer(1, 10))
    fig_data = [
        [Paragraph("<b>Figure No.</b>", style_body), Paragraph("<b>Title</b>", style_body), Paragraph("<b>Page</b>", style_body)],
        [Paragraph("Figure 3.1", style_body), Paragraph("CodeAtlas Multi-Tier System Architecture", style_body), Paragraph("29", style_body)],
        [Paragraph("Figure 3.2", style_body), Paragraph("Frontend - Backend - Database Interaction Sequence", style_body), Paragraph("32", style_body)],
        [Paragraph("Figure 3.3", style_body), Paragraph("User Registration, Email OTP Verification & Login Flow", style_body), Paragraph("35", style_body)],
        [Paragraph("Figure 3.4", style_body), Paragraph("Google & GitHub OAuth 2.0 Federated Authentication", style_body), Paragraph("38", style_body)],
        [Paragraph("Figure 3.5", style_body), Paragraph("Repository Code Ingestion & AST Parsing Pipeline", style_body), Paragraph("53", style_body)],
        [Paragraph("Figure 3.6", style_body), Paragraph("Evidence-Grounded AI Codebase Reasoning with Gemini", style_body), Paragraph("56", style_body)],
        [Paragraph("Figure 3.7", style_body), Paragraph("PostgreSQL Relational Entity-Relationship Diagram", style_body), Paragraph("36", style_body)],
        [Paragraph("Figure 3.8", style_body), Paragraph("CodeAtlas Platform Use-Case Diagram", style_body), Paragraph("31", style_body)],
        [Paragraph("Figure 3.9", style_body), Paragraph("CodeAtlas Level-1 Data Flow Diagram (DFD)", style_body), Paragraph("33", style_body)],
        [Paragraph("Figure 3.10", style_body), Paragraph("Hybrid Production Deployment Topology", style_body), Paragraph("66", style_body)],
    ]
    fig_table = Table(fig_data, colWidths=[80, 340, 60])
    fig_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(fig_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("LIST OF TABLES", style_chap_title))
    story.append(Spacer(1, 10))
    tab_data = [
        [Paragraph("<b>Table No.</b>", style_body), Paragraph("<b>Title</b>", style_body), Paragraph("<b>Page</b>", style_body)],
        [Paragraph("Table 2.1", style_body), Paragraph("Literature Survey Comparative Analysis", style_body), Paragraph("18", style_body)],
        [Paragraph("Table 4.1", style_body), Paragraph("CodeAtlas Technology Stack Specifications", style_body), Paragraph("42", style_body)],
        [Paragraph("Table 4.2", style_body), Paragraph("PostgreSQL Database Relational Tables Summary", style_body), Paragraph("47", style_body)],
        [Paragraph("Table 5.1", style_body), Paragraph("Automated Test Suites Execution Summary (237 Assertions)", style_body), Paragraph("68", style_body)],
        [Paragraph("Table 5.2", style_body), Paragraph("Comprehensive Test Case Execution Matrix", style_body), Paragraph("74", style_body)],
        [Paragraph("Table B.1", style_body), Paragraph("CodeAtlas REST API Endpoint Catalog", style_body), Paragraph("91", style_body)],
        [Paragraph("Table C.1", style_body), Paragraph("Database Column Constraints and Index Matrix", style_body), Paragraph("93", style_body)],
    ]
    tab_table = Table(tab_data, colWidths=[80, 340, 60])
    tab_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(tab_table)
    story.append(PageBreak())

    def render_markdown_file(filepath):
        if not os.path.exists(filepath):
            return
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()

        in_code_block = False
        code_lines = []
        in_table = False
        table_rows = []

        for line in lines:
            line_str = line.rstrip()

            # Code blocks
            if line_str.startswith("```"):
                if in_code_block:
                    code_text = "<br/>".join(code_lines).replace(" ", "&nbsp;")
                    story.append(Paragraph(code_text, style_code))
                    code_lines = []
                    in_code_block = False
                else:
                    in_code_block = True
                    code_lines = []
                continue

            if in_code_block:
                clean_line = line_str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                code_lines.append(clean_line)
                continue

            # Tables
            if "|" in line_str and not line_str.strip().startswith("#"):
                if re.match(r"^\s*\|?\s*:?-+:?\s*\|", line_str):
                    continue
                cells = [c.strip() for c in line_str.split("|")[1:-1]]
                if cells:
                    in_table = True
                    table_rows.append(cells)
                continue
            else:
                if in_table:
                    if table_rows:
                        t_data = []
                        num_cols = len(table_rows[0])
                        col_w = 480 / max(num_cols, 1)
                        for r_idx, row in enumerate(table_rows):
                            row_cells = []
                            for cell in row:
                                is_head = (r_idx == 0)
                                cell_clean = clean_md_inline(cell)
                                p_style = ParagraphStyle(
                                    f"TableCell_{is_head}",
                                    parent=styles["Normal"],
                                    fontName="Times-Bold" if is_head else "Times-Roman",
                                    fontSize=8.5 if num_cols > 4 else 9.5,
                                    leading=11 if num_cols > 4 else 12,
                                    textColor=colors.HexColor("#FFFFFF") if is_head else colors.HexColor("#0F172A")
                                )
                                row_cells.append(Paragraph(cell_clean, p_style))
                            t_data.append(row_cells)
                        
                        col_widths = [col_w] * num_cols
                        if num_cols == 5:
                            col_widths = [80, 110, 100, 100, 90]
                        elif num_cols == 6:
                            col_widths = [70, 70, 100, 70, 80, 90]
                        elif num_cols == 9:
                            col_widths = [45, 45, 65, 55, 65, 55, 55, 35, 60]

                        t = Table(t_data, colWidths=col_widths, repeatRows=1)
                        t.setStyle(TableStyle([
                            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E40AF")),
                            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                            ('VALIGN', (0,0), (-1,-1), 'TOP'),
                            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                            ('TOPPADDING', (0,0), (-1,-1), 4),
                            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                        ]))
                        story.append(t)
                        story.append(Spacer(1, 8))
                    in_table = False
                    table_rows = []

            if not line_str.strip():
                continue

            if line_str.startswith("# "):
                h_text = clean_md_inline(line_str[2:].strip())
                story.append(Spacer(1, 10))
                story.append(Paragraph(h_text, style_chap_title))
                story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=15))
            elif line_str.startswith("## "):
                h_text = clean_md_inline(line_str[3:].strip())
                story.append(Spacer(1, 8))
                story.append(Paragraph(h_text, style_h1))
            elif line_str.startswith("### "):
                h_text = clean_md_inline(line_str[4:].strip())
                story.append(Spacer(1, 6))
                story.append(Paragraph(h_text, style_h2))
            elif line_str.startswith("- ") or line_str.startswith("* "):
                b_text = clean_md_inline(line_str[2:].strip())
                story.append(Paragraph(f"• &nbsp; {b_text}", style_bullet))
            elif re.match(r"^\d+\.\s+", line_str):
                num_prefix = re.match(r"^(\d+\.)\s+", line_str).group(1)
                b_text = clean_md_inline(re.sub(r"^\d+\.\s+", "", line_str))
                story.append(Paragraph(f"{num_prefix} &nbsp; {b_text}", style_bullet))
            else:
                p_text = clean_md_inline(line_str)
                story.append(Paragraph(p_text, style_body))

        if in_table and table_rows:
            t_data = []
            num_cols = len(table_rows[0])
            col_w = 480 / max(num_cols, 1)
            for r_idx, row in enumerate(table_rows):
                row_cells = []
                for cell in row:
                    is_head = (r_idx == 0)
                    cell_clean = clean_md_inline(cell)
                    p_style = ParagraphStyle(
                        f"TableCell_{is_head}",
                        parent=styles["Normal"],
                        fontName="Times-Bold" if is_head else "Times-Roman",
                        fontSize=8.5 if num_cols > 4 else 9.5,
                        leading=11 if num_cols > 4 else 12,
                        textColor=colors.HexColor("#FFFFFF") if is_head else colors.HexColor("#0F172A")
                    )
                    row_cells.append(Paragraph(cell_clean, p_style))
                t_data.append(row_cells)
            t = Table(t_data, colWidths=[col_w]*num_cols)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E40AF")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ]))
            story.append(t)

        story.append(PageBreak())

    def insert_diagram(img_path, caption):
        if os.path.exists(img_path):
            try:
                img_flow = RLImage(img_path, width=470, height=270)
                story.append(Spacer(1, 8))
                story.append(KeepTogether([img_flow, Paragraph(caption, style_caption)]))
                story.append(Spacer(1, 8))
            except Exception as e:
                print(f"Notice: Image {img_path} error: {e}")

    print("Rendering Chapter 1...")
    render_markdown_file("report/chapters/chapter_1_introduction.md")

    print("Rendering Chapter 2...")
    render_markdown_file("report/chapters/chapter_2_literature_survey.md")

    print("Rendering Chapter 3...")
    render_markdown_file("report/chapters/chapter_3_system_design.md")
    insert_diagram("report/diagrams/architecture/overall_system_architecture.png", "Figure 3.1: CodeAtlas Multi-Tier System Architecture")
    insert_diagram("report/diagrams/workflows/frontend_backend_db_interaction.png", "Figure 3.2: Frontend - Backend - Database Interaction Sequence")
    insert_diagram("report/diagrams/workflows/user_registration_login_sequence.png", "Figure 3.3: User Registration, Email OTP Verification & Login Flow")
    insert_diagram("report/diagrams/workflows/google_github_oauth_sequence.png", "Figure 3.4: Google & GitHub OAuth 2.0 Federated Authentication")
    insert_diagram("report/diagrams/database/database_er_diagram.png", "Figure 3.7: PostgreSQL Relational Entity-Relationship Diagram")
    insert_diagram("report/diagrams/architecture/use_case_diagram.png", "Figure 3.8: CodeAtlas Platform Use-Case Diagram")
    insert_diagram("report/diagrams/architecture/data_flow_diagram.png", "Figure 3.9: CodeAtlas Level-1 Data Flow Diagram (DFD)")
    insert_diagram("report/diagrams/architecture/deployment_architecture.png", "Figure 3.10: Hybrid Production Deployment Topology")
    story.append(PageBreak())

    print("Rendering Chapter 4...")
    render_markdown_file("report/chapters/chapter_4_methodology.md")
    insert_diagram("report/diagrams/workflows/repository_indexing_workflow.png", "Figure 3.5: Repository Code Ingestion & AST Parsing Pipeline")
    insert_diagram("report/diagrams/workflows/ai_assisted_code_analysis_workflow.png", "Figure 3.6: Evidence-Grounded AI Codebase Reasoning with Gemini")
    story.append(PageBreak())

    print("Rendering Chapter 5...")
    render_markdown_file("report/chapters/chapter_5_testing_results.md")

    print("Rendering Chapter 6...")
    render_markdown_file("report/chapters/chapter_6_conclusion.md")

    print("Rendering Appendices...")
    render_markdown_file("report/chapters/appendices.md")

    print("Rendering References...")
    render_markdown_file("report/chapters/references.md")

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF build complete: {filename}")

if __name__ == "__main__":
    os.makedirs("report", exist_ok=True)
    build_pdf()
