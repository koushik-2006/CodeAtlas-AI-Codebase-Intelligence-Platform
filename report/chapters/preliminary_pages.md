# PRELIMINARY PAGES

## 1. COVER PAGE / TITLE PAGE

```text
                                  A PROJECT REPORT
                                         ON

                                     CODEATLAS:
                 AI-POWERED CODEBASE INTELLIGENCE PLATFORM

                                     Submitted by

                                   [STUDENT NAME 1]
                                [REGISTER NUMBER 1]

                                   [STUDENT NAME 2]
                                [REGISTER NUMBER 2]

                             in partial fulfillment for
                                 the award of the
                                     degree of

                              BACHELOR OF ENGINEERING
                                        IN
                         COMPUTER SCIENCE AND ENGINEERING

                            V.S.B. ENGINEERING COLLEGE
                              KARUR - 639 111, INDIA

                                 ANNA UNIVERSITY
                             CHENNAI - 600 025, INDIA

                                   [MONTH, YEAR]
```

---

## 2. BONAFIDE CERTIFICATE

```text
                           V.S.B. ENGINEERING COLLEGE
                             KARUR - 639 111, INDIA

                              BONAFIDE CERTIFICATE

Certified that this project report titled "CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM" is the bonafide work of [STUDENT NAME 1] (Reg. No.: [REGISTER NUMBER 1]) and [STUDENT NAME 2] (Reg. No.: [REGISTER NUMBER 2]), who carried out the project work under my supervision.


SIGNATURE                                           SIGNATURE
[SUPERVISOR NAME]                                   [HEAD OF THE DEPARTMENT]
PROJECT SUPERVISOR                                  HEAD OF THE DEPARTMENT
Department of Computer Science                      Department of Computer Science
and Engineering                                     and Engineering
V.S.B. Engineering College                          V.S.B. Engineering College
Karur - 639 111                                     Karur - 639 111


Submitted for the Project Viva-Voce examination held on _____________________.



INTERNAL EXAMINER                                   EXTERNAL EXAMINER
```

---

## 3. STUDENT DECLARATION

```text
                                STUDENT DECLARATION

We, [STUDENT NAME 1] (Reg. No.: [REGISTER NUMBER 1]) and [STUDENT NAME 2] (Reg. No.: [REGISTER NUMBER 2]), hereby declare that the project report titled "CODEATLAS: AI-POWERED CODEBASE INTELLIGENCE PLATFORM" submitted to Anna University, Chennai, in partial fulfillment of the requirements for the award of the Degree of Bachelor of Engineering in Computer Science and Engineering, is a record of original work done by us under the guidance of [SUPERVISOR NAME], Department of Computer Science and Engineering, V.S.B. Engineering College, Karur.

We further declare that the work reported herein does not form part of any other project report or dissertation on the basis of which a degree or award was conferred on an earlier occasion on this or any other candidate.



Place: Karur                                        1. ___________________________
Date:  [SUBMISSION DATE]                               [STUDENT NAME 1]

                                                    2. ___________________________
                                                       [STUDENT NAME 2]
```

---

## 4. ACKNOWLEDGEMENT

```text
                                  ACKNOWLEDGEMENT

We express our profound gratitude to our respected Chairman, Correspondent, and Principal of V.S.B. Engineering College, Karur, for providing state-of-the-art infrastructural facilities, computational resources, and an encouraging academic environment to carry out this project work.

We convey our heartfelt thanks to [HEAD OF THE DEPARTMENT], Head of the Department of Computer Science and Engineering, for their continuous support, valuable administrative guidance, and technical encouragement throughout the project tenure.

We register our deepest sense of gratitude and sincere indebtedness to our project supervisor, [SUPERVISOR NAME], Department of Computer Science and Engineering, for their invaluable guidance, constructive criticism, inspiring suggestions, and meticulous scrutiny during the design, implementation, and documentation of CodeAtlas.

We also thank all faculty members, technical supporting staff of the Department of Computer Science and Engineering, and our fellow classmates for their direct and indirect assistance. Finally, we express our warmest love and gratitude to our beloved parents and family members for their enduring moral support and blessings.


                                                       [STUDENT NAME 1]
                                                       [STUDENT NAME 2]
```

---

## 5. ABSTRACT

Modern software development is characterized by massive, polyglot codebases comprising hundreds of thousands of lines of code distributed across decoupled microservices. Empirical research indicates that software engineers spend up to 70% of their working hours comprehending unfamiliar code, tracing caller and callee execution flows, predicting the blast radius of modifications, and refactoring architectural dependencies. Conventional developer tools either provide static, non-interactive warning logs or ungrounded generative AI chatbots prone to fabricating nonexistent functions and phantom line numbers.

This project presents **CodeAtlas**, a production-grade, AI-powered codebase intelligence platform designed to bridge deterministic compiler analysis with multi-modal artificial intelligence. CodeAtlas is architected as a decoupled, multi-tier full-stack application featuring a Next.js 14 client frontend (React 18, TypeScript, Tailwind CSS, Framer Motion), an asynchronous Python FastAPI gateway, and an ACID-compliant PostgreSQL relational database (AWS Neon Cloud / Local). 

The platform implements a multi-language lexical Abstract Syntax Tree (AST) parser that extracts functions, classes, routes, and decorators with exact 1-based source line ranges. A graph-mining engine resolves bidirectional caller/callee trees and detects circular dependencies using Tarjan's strongly connected components algorithm. CodeAtlas integrates Google Gemini AI foundation models (`gemini-1.5-flash` and `gemini-1.5-pro`) through a bounded Retrieval-Augmented Generation (RAG) pipeline that guarantees zero hallucinations by conditioning answers strictly on parsed AST contexts and providing clickable source code receipts. A deterministic offline fallback synthesizes structured technical answers directly from the AST symbol graph when external AI services are unavailable.

CodeAtlas features a production-grade security architecture incorporating 12-round bcrypt password hashing, 6-digit email OTP verification, Google OAuth (OpenID Connect), GitHub OAuth (OAuth 2.0 with anti-CSRF state cookies), and HttpOnly session persistence. An automated static export pipeline (`scripts/build-static-pages.ts`) compiles 47 static HTML pages with repository base path injection for deployment to GitHub Pages via GitHub Actions. Across 237 automated assertions, CodeAtlas achieved a 100% test pass rate with 0 TypeScript and ESLint errors.

---

## 6. KEYWORDS
Codebase Intelligence; Abstract Syntax Tree (AST); Static Code Analysis; Retrieval-Augmented Generation (RAG); Google Gemini AI; Caller/Callee Graph; Dependency Analysis; Next.js 14; FastAPI; PostgreSQL; OAuth 2.0; GitHub Pages.

---

## 7. TABLE OF CONTENTS

```text
Title                                                                   Page No.
Bonafide Certificate ....................................................     ii
Student Declaration .....................................................    iii
Acknowledgement .........................................................     iv
Abstract ................................................................      v
Keywords ................................................................     vi
List of Figures .........................................................   viii
List of Tables ..........................................................     ix
List of Abbreviations ...................................................      x

CHAPTER 1 — INTRODUCTION ................................................      1
  1.1 Overview of Software Codebases and Modern Software Development ....      1
  1.2 Problems in Understanding Large and Complex Codebases .............      2
  1.3 Need for Intelligent Codebase Analysis ............................      3
  1.4 Role of Artificial Intelligence in Software Engineering ...........      4
  1.5 Problem Statement .................................................      5
  1.6 Objectives of CodeAtlas ...........................................      5
  1.7 Scope of the Project ..............................................      6
  1.8 Existing Challenges and Motivation ................................      7
  1.9 Advantages of the Proposed Platform ...............................      8
  1.10 Organization of the Report .......................................      8

CHAPTER 2 — LITERATURE SURVEY ...........................................     10
  2.1 Overview of Program Comprehension and Software Maintenance Research     10
  2.2 Static Code Analysis and Abstract Syntax Tree Parsing .............     12
  2.3 Large Language Models in Software Engineering .....................     14
  2.4 Software Security and Authentication Standards ....................     16
  2.5 Literature Survey Comparison Table ................................     18
  2.6 Identified Research & Practical Gaps ..............................     20
  2.7 How CodeAtlas Addresses the Research Gap ..........................     21

CHAPTER 3 — SYSTEM ANALYSIS AND DESIGN ..................................     23
  3.1 Existing System and Current Approaches ............................     23
  3.2 Limitations of Existing Approaches ................................     24
  3.3 Proposed CodeAtlas System .........................................     25
  3.4 Functional Requirements ...........................................     25
  3.5 Non-Functional Requirements .......................................     26
  3.6 Feasibility Analysis ..............................................     27
  3.7 System Architecture ...............................................     28
  3.8 Component and Module Design .......................................     30
  3.9 Use-Case Diagram ..................................................     31
  3.10 Data-Flow Diagram (Level-1 DFD) ..................................     33
  3.11 Database Design and Entity Relationships .........................     34
  3.12 API Design .......................................................     36
  3.13 Authentication and Authorization Design ..........................     37
  3.14 Security and Privacy Considerations ..............................     39

CHAPTER 4 — METHODOLOGY AND IMPLEMENTATION ..............................     41
  4.1 Development Methodology ...........................................     41
  4.2 Technology Stack ..................................................     41
  4.3 Frontend Implementation ...........................................     43
  4.4 Backend Implementation ............................................     45
  4.5 Database Implementation & Session Management ......................     46
  4.6 User Registration and Login Implementation ........................     47
  4.7 Google Authentication (OpenID Connect) ............................     49
  4.8 GitHub Authentication and Repository Access .......................     50
  4.9 Dashboard Implementation ..........................................     51
  4.10 Repository Ingestion & Crawling Pipeline .........................     52
  4.11 Code Parsing & Abstract Syntax Tree Exploration ..................     53
  4.12 AI-Assisted Code Understanding with Grounded RAG .................     55
  4.13 Search and Navigation ............................................     57
  4.14 Dependency Analysis & Architecture Visualization .................     58
  4.15 Additional Implemented Modules ...................................     60
  4.16 API Communication & Client Architecture ..........................     61
  4.17 Error Handling and Validation ....................................     62
  4.18 Testing Methodology ..............................................     63
  4.19 Build & Deployment Pipeline ......................................     64
  4.20 GitHub Pages Compatibility & Architectural Limitations ...........     65

CHAPTER 5 — TESTING, RESULTS, AND DISCUSSION ............................     67
  5.1 Testing Objectives ................................................     67
  5.2 Testing Environment ...............................................     67
  5.3 Unit Testing ......................................................     68
  5.4 Integration Testing (Phase 10 & Phase 21) .........................     69
  5.5 Authentication Testing (54 Tests) .................................     70
  5.6 OAuth 2.0 & Session Security Testing (106 Tests) ..................     71
  5.7 Gemini AI Integration & Grounded RAG Testing (43 Tests) ...........     72
  5.8 Static Build & Deployment Testing .................................     73
  5.9 Comprehensive Test Case Execution Table ...........................     74
  5.10 Issues Encountered and Engineering Resolutions ...................     78
  5.11 Current Technical Limitations ....................................     80
  5.12 Discussion of Findings ...........................................     81

CHAPTER 6 — CONCLUSION AND FUTURE ENHANCEMENTS ..........................     83
  6.1 Conclusion ........................................................     83
  6.2 Objectives Achieved ...............................................     83
  6.3 Technical Contributions ...........................................     84
  6.4 Current Limitations ...............................................     85
  6.5 Future Enhancements ...............................................     85
  6.6 Final Summary .....................................................     86

APPENDICES ..............................................................     87
  Appendix A: Core Source Code Excerpts .................................     87
  Appendix B: API Endpoint Catalog ......................................     91
  Appendix C: Database Schema Specification .............................     93
  Appendix D: Configuration Examples & Environment Variables ............     95
  Appendix E: Automated Test Execution Evidence .........................     97
  Appendix F: Platform Interface & Visual Screenshots ..................     99
  Appendix G: Local Setup & Execution Guide ..............................    102
  Appendix H: GitHub Actions & Pages Workflow ...........................    104

REFERENCES ..............................................................    106
```

---

## 8. LIST OF FIGURES

```text
Figure No.  Title                                                       Page No.
Figure 3.1  CodeAtlas Multi-Tier System Architecture ....................     29
Figure 3.2  Frontend - Backend - Database Interaction Sequence .........     32
Figure 3.3  User Registration, Email OTP Verification & Login Flow .....     35
Figure 3.4  Google & GitHub OAuth 2.0 Federated Authentication .........     38
Figure 3.5  Repository Code Ingestion & AST Parsing Pipeline ...........     53
Figure 3.6  Evidence-Grounded AI Codebase Reasoning with Gemini .........     56
Figure 3.7  PostgreSQL Relational Entity-Relationship Diagram ..........     36
Figure 3.8  CodeAtlas Platform Use-Case Diagram ........................     31
Figure 3.9  CodeAtlas Level-1 Data Flow Diagram (DFD) ...................     33
Figure 3.10 Hybrid Production Deployment Topology .......................     66
```

---

## 9. LIST OF TABLES

```text
Table No.  Title                                                        Page No.
Table 2.1  Literature Survey Comparative Analysis ......................     18
Table 4.1  CodeAtlas Technology Stack Specifications ...................     42
Table 4.2  PostgreSQL Database Relational Tables Summary ...............     47
Table 5.1  Automated Test Suites Execution Summary .....................     68
Table 5.2  Comprehensive Test Case Execution Matrix ....................     74
Table B.1  CodeAtlas REST API Endpoint Catalog .........................     91
Table C.1  Database Column Constraints and Index Matrix ................     93
```

---

## 10. LIST OF ABBREVIATIONS

```text
ACID    Atomicity, Consistency, Isolation, Durability
API     Application Programming Interface
ASGI    Asynchronous Server Gateway Interface
AST     Abstract Syntax Tree
CDN     Content Delivery Network
CI/CD   Continuous Integration / Continuous Deployment
CORS    Cross-Origin Resource Sharing
CSRF    Cross-Site Request Forgery
DFD     Data Flow Diagram
DOM     Document Object Model
DoS     Denial of Service
ER      Entity-Relationship
FOUC    Flash of Unstyled Content
FPS     Frames Per Second
HTTP    Hypertext Transfer Protocol
HTTPS   Hypertext Transfer Protocol Secure
IDE     Integrated Development Environment
IETF    Internet Engineering Task Force
JSON    JavaScript Object Notation
JWT     JSON Web Token
LOC     Lines of Code
LLM     Large Language Model
MTTO    Mean Time to Onboard
NFR     Non-Functional Requirement
OIDC    OpenID Connect
ORM     Object-Relational Mapping
OTP     One-Time Password
PAT     Personal Access Token
PDG     Program Dependence Graph
PR      Pull Request
RAG     Retrieval-Augmented Generation
RBAC    Role-Based Access Control
REST    Representational State Transfer
RFC     Request for Comments
SDK     Software Development Kit
SPA     Single Page Application
SQL     Structured Query Language
SSO     Single Sign-On
SVG     Scalable Vector Graphics
TLS     Transport Layer Security
TTL     Time To Live
UI      User Interface
UML     Unified Modeling Language
URL     Uniform Resource Locator
UUID    Universally Unique Identifier
WASI    WebAssembly System Interface
XSS     Cross-Site Scripting
```

