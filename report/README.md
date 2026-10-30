# CodeAtlas College Project Report Workspace

This directory contains the complete academic project report assets, markdown chapters, verified evidence registries, publication diagrams, editable Microsoft Word (`.docx`), and publication-grade Adobe PDF (`.pdf`) deliverables for **CodeAtlas — AI-Powered Codebase Intelligence Platform**, prepared for **V.S.B. Engineering College / Anna University**.

---

## 1. Directory Structure

```text
report/
├── README.md                                # Workspace documentation and regeneration guide
├── CodeAtlas_Project_Report.docx            # Editable Microsoft Word deliverable (~680 KB)
├── CodeAtlas_Project_Report.pdf             # Publication-grade Adobe PDF deliverable (66 Pages, ~873 KB)
├── evidence/
│   ├── source_inventory.md                  # Comprehensive mapping of code files, endpoints & models
│   ├── feature_status.md                    # Verified matrix of implemented vs planned features
│   ├── test_results.md                      # Audit of all 237 automated assertions (100% pass rate)
│   └── references_verified.md               # 22 verified academic references with IEEE annotations
├── diagrams/
│   ├── architecture/
│   │   ├── overall_system_architecture.png  # Figure 3.1: Multi-tier platform architecture
│   │   ├── use_case_diagram.png             # Figure 3.8: Unified platform use cases & actors
│   │   ├── data_flow_diagram.png            # Figure 3.9: Level-1 Data Flow Diagram (DFD)
│   │   └── deployment_architecture.png      # Figure 3.10: Hybrid GitHub Pages + Cloud Run topology
│   ├── workflows/
│   │   ├── frontend_backend_db_interaction.png   # Figure 3.2: Sequence diagram across tiers
│   │   ├── user_registration_login_sequence.png # Figure 3.3: Bcrypt & OTP verification sequence
│   │   ├── google_github_oauth_sequence.png     # Figure 3.4: Federated OAuth 2.0 / OIDC sequence
│   │   ├── repository_indexing_workflow.png     # Figure 3.5: AST parsing & indexing pipeline
│   │   └── ai_assisted_code_analysis_workflow.png # Figure 3.6: Grounded RAG reasoning with receipts
│   └── database/
│       └── database_er_diagram.png          # Figure 3.7: PostgreSQL relational ER schema
└── chapters/
    ├── preliminary_pages.md                 # Cover page, Certificate, Declaration, Abstract, TOC
    ├── chapter_1_introduction.md            # Problem, motivation, objectives, scope (1.1 - 1.10)
    ├── chapter_2_literature_survey.md       # Scholarly review, comparison table, research gap (2.1 - 2.7)
    ├── chapter_3_system_design.md           # Architecture, DFD, ER, requirements, security (3.1 - 3.14)
    ├── chapter_4_methodology.md             # Stack, AST parser, Gemini AI, static build (4.1 - 4.20)
    ├── chapter_5_testing_results.md         # 237 test cases, actual results, resolutions (5.1 - 5.15)
    ├── chapter_6_conclusion.md              # Objectives achieved, contributions, future scope (6.1 - 6.6)
    ├── appendices.md                        # Appendices A through H
    └── references.md                        # Formatted IEEE bibliography
```

---

## 2. Deliverable Verification & Regeneration Scripts

Both primary deliverables can be regenerated at any time from the source markdown chapters and diagram assets:

1. **Regenerate Technical Diagrams**:
   ```bash
   python scripts/generate_report_diagrams.py
   ```
2. **Recompile Publication PDF (66 Pages)**:
   ```bash
   python scripts/generate_pdf_report.py
   ```
3. **Recompile Editable Microsoft Word DOCX**:
   ```bash
   python scripts/generate_docx_report.py
   ```

