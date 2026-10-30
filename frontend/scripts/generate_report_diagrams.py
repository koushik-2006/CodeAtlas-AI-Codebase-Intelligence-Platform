"""
CodeAtlas Academic Report Diagram Generator
Generates 10 high-resolution, publication-grade architectural, sequence, and entity diagrams
for the Bachelor of Engineering college project report.
"""

import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size=14, bold=False):
    # Try standard Windows fonts (Arial, Segoe UI, Calibri, Consolas)
    font_candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for candidate in font_candidates:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_rounded_card(draw, box, fill, outline, width=2, radius=10):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_arrow(draw, start, end, color="#4B5563", width=2, head_len=10, label=None, label_font=None, label_color="#1F2937"):
    x0, y0 = start
    x1, y1 = end
    draw.line([start, end], fill=color, width=width)
    import math
    angle = math.atan2(y1 - y0, x1 - x0)
    angle1 = angle + math.pi * 0.85
    angle2 = angle - math.pi * 0.85
    hx1 = x1 + head_len * math.cos(angle1)
    hy1 = y1 + head_len * math.sin(angle1)
    hx2 = x1 + head_len * math.cos(angle2)
    hy2 = y1 + head_len * math.sin(angle2)
    draw.polygon([(x1, y1), (hx1, hy1), (hx2, hy2)], fill=color)
    
    if label and label_font:
        mx = (x0 + x1) / 2
        my = (y0 + y1) / 2 - 14
        draw.text((mx - 20, my), label, fill=label_color, font=label_font)

# -------------------------------------------------------------
# 1. OVERALL SYSTEM ARCHITECTURE
# -------------------------------------------------------------
def make_system_architecture():
    img = Image.new("RGB", (1300, 750), "#F8FAFC")
    draw = ImageDraw.Draw(img)
    f_title = get_font(22, True)
    f_sec = get_font(16, True)
    f_sub = get_font(13, True)
    f_body = get_font(11, False)

    # Header Banner
    draw.rectangle([0, 0, 1300, 60], fill="#0F172A")
    draw.text((30, 18), "FIGURE 3.1: CODEATLAS MULTI-TIER SYSTEM ARCHITECTURE", fill="#FFFFFF", font=f_title)

    # Tier 1: Client Presentation Tier
    draw_rounded_card(draw, (40, 90, 390, 700), "#EFF6FF", "#3B82F6", 2, 12)
    draw.rectangle([40, 90, 390, 130], fill="#1E40AF")
    draw.text((60, 102), "1. CLIENT PRESENTATION TIER (NEXT.JS 14)", fill="#FFFFFF", font=f_sec)

    modules_t1 = [
        ("Dashboard & Workspaces", "Cockpit, repo health metrics, welcome hero, session restore", "#DBEAFE"),
        ("Architecture Explorer", "2D graph view, 3D city visualization, cluster inspector", "#DBEAFE"),
        ("CodeLens & Assistant", "Grounded chat, verified AST citations, line receipts", "#DBEAFE"),
        ("Code Review & Blast Radius", "Security checks, PR diff analysis, transitive callers", "#DBEAFE"),
        ("Auth Client & State", "Google OAuth, GitHub OAuth, session context, JWT storage", "#DBEAFE"),
    ]
    y = 150
    for title, desc, bg in modules_t1:
        draw_rounded_card(draw, (60, y, 370, y + 85), bg, "#93C5FD", 1, 8)
        draw.text((75, y + 10), title, fill="#1E3A8A", font=f_sub)
        draw.text((75, y + 35), desc, fill="#1E293B", font=f_body)
        y += 105

    # Tier 2: Application Gateway & Backend Tier
    draw_rounded_card(draw, (450, 90, 850, 700), "#F0FDF4", "#10B981", 2, 12)
    draw.rectangle([450, 90, 850, 130], fill="#047857")
    draw.text((470, 102), "2. FASTAPI BACKEND & SERVICES TIER", fill="#FFFFFF", font=f_sec)

    modules_t2 = [
        ("API Gateway & Router (/api/v1)", "16 Modular routers, CORS middleware, JWT auth verification", "#DCFCE7"),
        ("AST Code Parsing Engine", "Multi-language lexical analysis, symbol extraction, definitions", "#DCFCE7"),
        ("Call Graph & Dependency Miner", "Caller/callee resolution, circular dependency detection", "#DCFCE7"),
        ("Security & Auth Cryptography", "Bcrypt password hashing, 6-digit OTP engine, CSRF state", "#DCFCE7"),
        ("Grounded Context Builder", "AST context extraction, prompt bounding, citation formatter", "#DCFCE7"),
    ]
    y = 150
    for title, desc, bg in modules_t2:
        draw_rounded_card(draw, (470, y, 830, y + 85), bg, "#6EE7B7", 1, 8)
        draw.text((485, y + 10), title, fill="#065F46", font=f_sub)
        draw.text((485, y + 35), desc, fill="#1F2937", font=f_body)
        y += 105

    # Tier 3: Data & External AI Intelligence Tier
    draw_rounded_card(draw, (910, 90, 1260, 700), "#FAF5FF", "#8B5CF6", 2, 12)
    draw.rectangle([910, 90, 1260, 130], fill="#6D28D9")
    draw.text((930, 102), "3. DATA & AI INTELLIGENCE TIER", fill="#FFFFFF", font=f_sec)

    modules_t3 = [
        ("Neon PostgreSQL Database", "Tables: users, connected_accounts, repositories, code_symbols", "#F3E8FF"),
        ("Google Gemini AI (1.5 Flash/Pro)", "Multi-modal reasoning, grounded code explanation, RAG", "#F3E8FF"),
        ("GitHub REST & OAuth APIs", "User profile sync, repo ingestion, branch & commit metadata", "#F3E8FF"),
        ("Local Memory & AST Cache", "Fast symbol caching, in-memory dependency lookups", "#F3E8FF"),
        ("Static Asset CDN (GitHub Pages)", "Static distribution (out/), .nojekyll, 404.html SPA fallback", "#F3E8FF"),
    ]
    y = 150
    for title, desc, bg in modules_t3:
        draw_rounded_card(draw, (930, y, 1240, y + 85), bg, "#D8B4FE", 1, 8)
        draw.text((945, y + 10), title, fill="#4C1D95", font=f_sub)
        draw.text((945, y + 35), desc, fill="#1F2937", font=f_body)
        y += 105

    # Inter-tier arrows
    draw_arrow(draw, (370, 190), (470, 190), "#2563EB", 2, 8, "HTTPS / REST", f_body)
    draw_arrow(draw, (470, 230), (370, 230), "#059669", 2, 8, "JSON Receipts", f_body)
    draw_arrow(draw, (830, 190), (930, 190), "#047857", 2, 8, "SQLAlchemy / ORM", f_body)
    draw_arrow(draw, (830, 310), (930, 310), "#7C3AED", 2, 8, "Gemini API v1beta", f_body)
    draw_arrow(draw, (830, 415), (930, 415), "#0284C7", 2, 8, "OAuth 2.0 Auth", f_body)

    os.makedirs("report/diagrams/architecture", exist_ok=True)
    img.save("report/diagrams/architecture/overall_system_architecture.png")

# -------------------------------------------------------------
# 2. SEQUENCE: FRONTEND - BACKEND - DATABASE INTERACTION
# -------------------------------------------------------------
def make_frontend_backend_db_interaction():
    img = Image.new("RGB", (1200, 700), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_head = get_font(14, True)
    f_msg = get_font(12, True)
    f_note = get_font(11, False)

    # Title
    draw.rectangle([0, 0, 1200, 50], fill="#1E293B")
    draw.text((30, 15), "FIGURE 3.2: FRONTEND - BACKEND - DATABASE INTERACTION SEQUENCE", fill="#FFFFFF", font=f_title)

    # Lifeline entities
    entities = [
        ("Developer / Browser", 150, "#3B82F6"),
        ("Next.js Client (App)", 400, "#60A5FA"),
        ("FastAPI Gateway", 680, "#10B981"),
        ("Auth & AST Services", 920, "#8B5CF6"),
        ("PostgreSQL Database", 1100, "#F59E0B")
    ]

    for name, x, col in entities:
        draw_rounded_card(draw, (x - 90, 70, x + 90, 110), col, "#0F172A", 1, 8)
        draw.text((x - 70, 82), name, fill="#FFFFFF", font=f_head)
        draw.line([(x, 110), (x, 650)], fill="#CBD5E1", width=2)

    # Sequence Messages
    steps = [
        (150, 400, "1. User navigates to /dashboard or requests symbol trace", 150, "#2563EB", False),
        (400, 680, "2. GET /api/v1/repositories/{id}/symbols/navigate (Bearer token / Cookie)", 190, "#1D4ED8", False),
        (680, 920, "3. Validate session JWT, extract user_id, check tenant ownership", 230, "#059669", False),
        (920, 1100, "4. SELECT * FROM code_symbols WHERE name=:name AND repo_id=:id", 270, "#D97706", False),
        (1100, 920, "5. Returns Symbol record (file_path, start_line, end_line, callees)", 320, "#B45309", True),
        (920, 680, "6. Construct caller/callee AST graph & verification receipt", 370, "#7C3AED", True),
        (680, 400, "7. HTTP 200 OK (JSON with verified AST source coordinates)", 420, "#059669", True),
        (400, 150, "8. Render interactive architecture graph & highlight source file", 470, "#2563EB", True),
        (150, 400, "9. User clicks 'Explain Symbol with Gemini AI'", 520, "#2563EB", False),
        (400, 680, "10. POST /api/v1/assistant/query with grounded AST context", 560, "#1D4ED8", False),
        (680, 400, "11. Stream AI explanation with exact file & line citations", 600, "#7C3AED", True)
    ]

    for x0, x1, text, y, col, is_dash in steps:
        draw_arrow(draw, (x0, y), (x1, y), col, 2, 7)
        tx = min(x0, x1) + 20
        draw.text((tx, y - 16), text, fill=col, font=f_msg)

    os.makedirs("report/diagrams/workflows", exist_ok=True)
    img.save("report/diagrams/workflows/frontend_backend_db_interaction.png")

# -------------------------------------------------------------
# 3. SEQUENCE: USER REGISTRATION & LOGIN WITH BCRYPT & OTP
# -------------------------------------------------------------
def make_user_registration_login_sequence():
    img = Image.new("RGB", (1200, 720), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_head = get_font(13, True)
    f_msg = get_font(12, True)

    draw.rectangle([0, 0, 1200, 50], fill="#1E293B")
    draw.text((30, 15), "FIGURE 3.3: USER REGISTRATION, EMAIL OTP VERIFICATION & LOGIN FLOW", fill="#FFFFFF", font=f_title)

    entities = [
        ("User (Browser)", 150, "#3B82F6"),
        ("Frontend Auth", 420, "#60A5FA"),
        ("FastAPI /auth", 700, "#10B981"),
        ("Email / OTP Service", 920, "#F59E0B"),
        ("PostgreSQL (users)", 1100, "#8B5CF6")
    ]

    for name, x, col in entities:
        draw_rounded_card(draw, (x - 85, 70, x + 85, 110), col, "#0F172A", 1, 8)
        draw.text((x - 65, 82), name, fill="#FFFFFF", font=f_head)
        draw.line([(x, 110), (x, 690)], fill="#CBD5E1", width=2)

    steps = [
        (150, 420, "1. Enter Name, Email, Password -> Click 'Create Account'", 140, "#2563EB"),
        (420, 700, "2. POST /api/v1/auth/register (payload validation, password >= 8 chars)", 180, "#1D4ED8"),
        (700, 1100, "3. Query ix_users_email; verify email is unique", 220, "#059669"),
        (700, 700, "4. Hash password using bcrypt (12 salt rounds)", 260, "#047857"),
        (700, 1100, "5. INSERT INTO users (id, email, hashed_password, is_verified=False)", 300, "#059669"),
        (700, 920, "6. Generate cryptographically secure 6-digit OTP (10 min expiry)", 340, "#D97706"),
        (920, 150, "7. Dispatch verification email with 6-digit OTP code", 380, "#B45309"),
        (700, 420, "8. HTTP 201 Created -> Redirect user to /verify-email", 420, "#059669"),
        (150, 420, "9. User inputs 6-digit code from email -> Submits OTP", 470, "#2563EB"),
        (420, 700, "10. POST /api/v1/auth/verify-otp (email, otp_code)", 510, "#1D4ED8"),
        (700, 1100, "11. Validate OTP; UPDATE users SET is_verified=True", 550, "#059669"),
        (700, 420, "12. Issue HS256 JWT access token; Set HttpOnly codeatlas_session cookie", 590, "#7C3AED"),
        (420, 150, "13. Authenticated session active -> Navigate to /dashboard", 630, "#2563EB"),
    ]

    for x0, x1, text, y, col in steps:
        draw_arrow(draw, (x0, y), (x1, y), col, 2, 7)
        tx = min(x0, x1) + 20
        draw.text((tx, y - 15), text, fill=col, font=f_msg)

    os.makedirs("report/diagrams/workflows", exist_ok=True)
    img.save("report/diagrams/workflows/user_registration_login_sequence.png")

# -------------------------------------------------------------
# 4. SEQUENCE: GOOGLE & GITHUB OAUTH 2.0 FLOWS
# -------------------------------------------------------------
def make_oauth_sequence():
    img = Image.new("RGB", (1200, 720), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_head = get_font(13, True)
    f_msg = get_font(12, True)

    draw.rectangle([0, 0, 1200, 50], fill="#1E293B")
    draw.text((30, 15), "FIGURE 3.4: GOOGLE & GITHUB OAUTH 2.0 FEDERATED AUTHENTICATION", fill="#FFFFFF", font=f_title)

    entities = [
        ("User Browser", 150, "#3B82F6"),
        ("CodeAtlas Client", 400, "#60A5FA"),
        ("FastAPI Backend", 660, "#10B981"),
        ("OAuth Provider (Google/GitHub)", 930, "#EA4335"),
        ("PostgreSQL Accounts", 1120, "#8B5CF6")
    ]

    for name, x, col in entities:
        draw_rounded_card(draw, (x - 85, 70, x + 85, 110), col, "#0F172A", 1, 8)
        draw.text((x - 70, 82), name, fill="#FFFFFF", font=f_head)
        draw.line([(x, 110), (x, 690)], fill="#CBD5E1", width=2)

    steps = [
        (150, 400, "1. User clicks 'Continue with Google' or 'Continue with GitHub'", 140, "#2563EB"),
        (400, 660, "2. Request OAuth authorization URL with CSRF state token", 180, "#1D4ED8"),
        (660, 400, "3. Generate random state, set codeatlas_oauth_state HttpOnly cookie", 220, "#059669"),
        (400, 930, "4. Redirect to provider authorization screen (client_id, scopes, state)", 260, "#EA4335"),
        (930, 150, "5. Provider presents consent dialog to user (profile, email, repos)", 300, "#EA4335"),
        (150, 930, "6. User approves access permissions", 340, "#2563EB"),
        (930, 400, "7. Redirect to callback URI with auth code & state: /api/auth/github/callback", 380, "#EA4335"),
        (400, 660, "8. Validate received state matches codeatlas_oauth_state (Anti-CSRF)", 420, "#059669"),
        (660, 930, "9. Secure backend exchange: POST code + client_secret -> access_token", 460, "#047857"),
        (930, 660, "10. Return verified identity profile (provider_id, email, avatar)", 500, "#EA4335"),
        (660, 1120, "11. Find or create user; UPSERT connected_accounts record", 540, "#7C3AED"),
        (660, 400, "12. Issue codeatlas_session HttpOnly cookie with session claims", 580, "#059669"),
        (400, 150, "13. Authenticated redirect to /dashboard?login=success", 630, "#2563EB"),
    ]

    for x0, x1, text, y, col in steps:
        draw_arrow(draw, (x0, y), (x1, y), col, 2, 7)
        tx = min(x0, x1) + 20
        draw.text((tx, y - 15), text, fill=col, font=f_msg)

    os.makedirs("report/diagrams/workflows", exist_ok=True)
    img.save("report/diagrams/workflows/google_github_oauth_sequence.png")

# -------------------------------------------------------------
# 5. REPOSITORY INDEXING & AST EXTRACTION PIPELINE
# -------------------------------------------------------------
def make_repository_indexing_workflow():
    img = Image.new("RGB", (1250, 680), "#F8FAFC")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_head = get_font(13, True)
    f_body = get_font(11, False)

    draw.rectangle([0, 0, 1250, 50], fill="#0F172A")
    draw.text((30, 15), "FIGURE 3.5: REPOSITORY CODE INGESTION & AST PARSING PIPELINE", fill="#FFFFFF", font=f_title)

    boxes = [
        ("Step 1: Source Ingestion", "Connect GitHub repo or upload local codebase archive", 50, 120, 260, 240, "#EFF6FF", "#3B82F6"),
        ("Step 2: File Tree Crawl", "Recursive traverse; filter node_modules, .git, binary assets", 330, 120, 540, 240, "#F0FDF4", "#10B981"),
        ("Step 3: AST Lexical Parser", "Extract functions, classes, decorators, routes, export symbols", 610, 120, 820, 240, "#FAF5FF", "#8B5CF6"),
        ("Step 4: Call Graph Resolver", "Trace callers and callees; resolve cross-file import paths", 890, 120, 1100, 240, "#FFFBEB", "#F59E0B"),

        ("Step 8: Interactive Cockpit", "Display 2D dependency graph, CodeLens, symbol search", 50, 360, 260, 480, "#EFF6FF", "#3B82F6"),
        ("Step 7: RAG Context Store", "Prepare token-bounded AST snippets for Gemini reasoning", 330, 360, 540, 480, "#FAF5FF", "#8B5CF6"),
        ("Step 6: Metric & Health Engine", "Compute circular dependencies, coupling score, health index", 610, 360, 820, 480, "#FFF1F2", "#F43F5E"),
        ("Step 5: Database Indexing", "Batch persist symbols and dependencies to PostgreSQL", 890, 360, 1100, 480, "#F0FDF4", "#10B981")
    ]

    for title, desc, x0, y0, x1, y1, bg, border in boxes:
        draw_rounded_card(draw, (x0, y0, x1, y1), bg, border, 2, 10)
        draw.text((x0 + 15, y0 + 20), title, fill="#0F172A", font=f_head)
        words = desc.split(" ")
        line1 = " ".join(words[:4])
        line2 = " ".join(words[4:])
        draw.text((x0 + 15, y0 + 55), line1, fill="#475569", font=f_body)
        draw.text((x0 + 15, y0 + 75), line2, fill="#475569", font=f_body)

    # Forward arrows top row
    draw_arrow(draw, (260, 180), (330, 180), "#2563EB", 2, 8)
    draw_arrow(draw, (540, 180), (610, 180), "#059669", 2, 8)
    draw_arrow(draw, (820, 180), (890, 180), "#7C3AED", 2, 8)

    # Down arrow to bottom row
    draw_arrow(draw, (995, 240), (995, 360), "#D97706", 2, 8)

    # Left arrows bottom row
    draw_arrow(draw, (890, 420), (820, 420), "#059669", 2, 8)
    draw_arrow(draw, (610, 420), (540, 420), "#E11D48", 2, 8)
    draw_arrow(draw, (330, 420), (260, 420), "#7C3AED", 2, 8)

    os.makedirs("report/diagrams/workflows", exist_ok=True)
    img.save("report/diagrams/workflows/repository_indexing_workflow.png")

# -------------------------------------------------------------
# 6. AI-ASSISTED CODE ANALYSIS WORKFLOW
# -------------------------------------------------------------
def make_ai_analysis_workflow():
    img = Image.new("RGB", (1250, 700), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_head = get_font(13, True)
    f_body = get_font(11, False)

    draw.rectangle([0, 0, 1250, 50], fill="#1E1B4B")
    draw.text((30, 15), "FIGURE 3.6: EVIDENCE-GROUNDED AI CODEBASE REASONING WITH GEMINI", fill="#FFFFFF", font=f_title)

    flow = [
        ("1. User Inquiry", "Developer asks: 'How is password hashing validated during login?'", 60, 120, 320, 240, "#EFF6FF", "#3B82F6"),
        ("2. AST Symbol Match", "Assistant searches AST index for authorize(), User, bcrypt hashes", 380, 120, 640, 240, "#F0FDF4", "#10B981"),
        ("3. Call Chain Assembly", "Retrieves callers (POST /auth) and callees (UserService.findByEmail)", 700, 120, 960, 240, "#FFFBEB", "#F59E0B"),
        ("4. Grounded Prompt Builder", "Wraps raw code snippets with strict boundary tags & file receipts", 700, 340, 960, 460, "#FAF5FF", "#8B5CF6"),
        ("5. Google Gemini Reasoning", "Gemini 1.5 processes prompt; extracts reasoning without hallucinating", 380, 340, 640, 460, "#FAF5FF", "#7C3AED"),
        ("6. Receipt-Verified Response", "Streams markdown answer with exact file paths and line ranges", 60, 340, 320, 460, "#EFF6FF", "#2563EB"),
    ]

    for title, desc, x0, y0, x1, y1, bg, border in flow:
        draw_rounded_card(draw, (x0, y0, x1, y1), bg, border, 2, 10)
        draw.text((x0 + 15, y0 + 20), title, fill="#0F172A", font=f_head)
        words = desc.split(" ")
        line1 = " ".join(words[:4])
        line2 = " ".join(words[4:9])
        line3 = " ".join(words[9:])
        draw.text((x0 + 15, y0 + 55), line1, fill="#334155", font=f_body)
        draw.text((x0 + 15, y0 + 75), line2, fill="#334155", font=f_body)
        draw.text((x0 + 15, y0 + 95), line3, fill="#334155", font=f_body)

    draw_arrow(draw, (320, 180), (380, 180), "#2563EB", 2, 8)
    draw_arrow(draw, (640, 180), (700, 180), "#059669", 2, 8)
    draw_arrow(draw, (830, 240), (830, 340), "#D97706", 2, 8)
    draw_arrow(draw, (700, 400), (640, 400), "#7C3AED", 2, 8)
    draw_arrow(draw, (380, 400), (320, 400), "#7C3AED", 2, 8)

    # Offline fallback callout
    draw_rounded_card(draw, (60, 520, 960, 640), "#FEF2F2", "#EF4444", 2, 10)
    draw.text((80, 540), "DETERMINISTIC OFFLINE RESILIENCE FALLBACK:", fill="#991B1B", font=f_head)
    draw.text((80, 570), "If Gemini API key is missing or external network is restricted, CodeAtlas falls back to local AST synthesis,", fill="#7F1D1D", font=f_body)
    draw.text((80, 595), "generating accurate answers directly from parsed symbol tables and caller/callee trees without crashing.", fill="#7F1D1D", font=f_body)

    os.makedirs("report/diagrams/workflows", exist_ok=True)
    img.save("report/diagrams/workflows/ai_assisted_code_analysis_workflow.png")

# -------------------------------------------------------------
# 7. DATABASE ENTITY-RELATIONSHIP DIAGRAM
# -------------------------------------------------------------
def make_database_er_diagram():
    img = Image.new("RGB", (1250, 750), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_entity = get_font(14, True)
    f_col = get_font(11, False)
    f_pk = get_font(11, True)

    draw.rectangle([0, 0, 1250, 50], fill="#0F172A")
    draw.text((30, 15), "FIGURE 3.7: POSTGRESQL RELATIONAL ENTITY-RELATIONSHIP DIAGRAM", fill="#FFFFFF", font=f_title)

    entities = [
        # (Table, x0, y0, x1, y1, header_col, [ (name, type, constraint) ])
        ("users", 60, 100, 340, 380, "#1E40AF", [
            ("id", "UUID", "PRIMARY KEY"),
            ("email", "VARCHAR(255)", "UNIQUE INDEX"),
            ("hashed_password", "VARCHAR(255)", "NULLABLE"),
            ("display_name", "VARCHAR(255)", "NOT NULL"),
            ("avatar_url", "TEXT", "NULLABLE"),
            ("is_active", "BOOLEAN", "DEFAULT TRUE"),
            ("is_verified", "BOOLEAN", "DEFAULT FALSE"),
            ("created_at", "TIMESTAMP", "NOT NULL"),
            ("updated_at", "TIMESTAMP", "NOT NULL")
        ]),
        ("connected_accounts", 420, 100, 720, 360, "#047857", [
            ("id", "UUID", "PRIMARY KEY"),
            ("user_id", "UUID", "FOREIGN KEY -> users.id"),
            ("provider", "VARCHAR(50)", "google | github"),
            ("provider_user_id", "VARCHAR(255)", "NOT NULL"),
            ("access_token", "TEXT", "ENCRYPTED"),
            ("scopes", "TEXT[]", "NOT NULL"),
            ("created_at", "TIMESTAMP", "NOT NULL")
        ]),
        ("repositories", 820, 100, 1160, 380, "#6D28D9", [
            ("id", "VARCHAR(100)", "PRIMARY KEY"),
            ("user_id", "UUID", "FOREIGN KEY -> users.id"),
            ("name", "VARCHAR(255)", "NOT NULL"),
            ("full_name", "VARCHAR(255)", "NOT NULL"),
            ("owner", "VARCHAR(255)", "NOT NULL"),
            ("connection_type", "VARCHAR(50)", "github | local"),
            ("is_indexed", "BOOLEAN", "DEFAULT FALSE"),
            ("file_count", "INTEGER", "DEFAULT 0"),
            ("symbol_count", "INTEGER", "DEFAULT 0")
        ]),
        ("code_symbols", 60, 440, 480, 710, "#B45309", [
            ("id", "UUID", "PRIMARY KEY"),
            ("repository_id", "VARCHAR(100)", "FOREIGN KEY -> repositories.id"),
            ("name", "VARCHAR(255)", "INDEXED"),
            ("kind", "VARCHAR(50)", "function | class | route"),
            ("file_path", "TEXT", "NOT NULL"),
            ("start_line", "INTEGER", "NOT NULL"),
            ("end_line", "INTEGER", "NOT NULL"),
            ("callers", "JSONB", "CALLER ARRAY"),
            ("callees", "JSONB", "CALLEE ARRAY")
        ]),
        ("dependencies", 700, 440, 1160, 680, "#BE123C", [
            ("id", "UUID", "PRIMARY KEY"),
            ("repository_id", "VARCHAR(100)", "FOREIGN KEY -> repositories.id"),
            ("source_module", "VARCHAR(255)", "NOT NULL"),
            ("target_module", "VARCHAR(255)", "NOT NULL"),
            ("dependency_type", "VARCHAR(50)", "import | api | rpc"),
            ("is_circular", "BOOLEAN", "DEFAULT FALSE")
        ])
    ]

    for title, x0, y0, x1, y1, hcol, fields in entities:
        draw_rounded_card(draw, (x0, y0, x1, y1), "#FFFFFF", hcol, 2, 8)
        draw.rectangle([x0, y0, x1, y0 + 35], fill=hcol)
        draw.text((x0 + 15, y0 + 8), f"TABLE: {title}", fill="#FFFFFF", font=f_entity)
        fy = y0 + 45
        for col_name, col_type, col_con in fields:
            is_key = "PRIMARY" in col_con or "FOREIGN" in col_con
            draw.text((x0 + 15, fy), col_name, fill="#1E293B" if not is_key else "#0F172A", font=f_pk if is_key else f_col)
            draw.text((x0 + 160, fy), col_type, fill="#475569", font=f_col)
            draw.text((x0 + 260, fy), col_con, fill="#2563EB" if "FOREIGN" in col_con else ("#D97706" if "PRIMARY" in col_con else "#64748B"), font=f_col)
            fy += 24

    # Relationship connectors
    draw_arrow(draw, (340, 200), (420, 200), "#2563EB", 2, 6, "1:N", f_pk)
    draw_arrow(draw, (340, 240), (820, 240), "#2563EB", 2, 6, "1:N", f_pk)
    draw_arrow(draw, (820, 360), (480, 520), "#7C3AED", 2, 6, "1:N", f_pk)
    draw_arrow(draw, (980, 380), (980, 440), "#7C3AED", 2, 6, "1:N", f_pk)

    os.makedirs("report/diagrams/database", exist_ok=True)
    img.save("report/diagrams/database/database_er_diagram.png")

# -------------------------------------------------------------
# 8. USE-CASE DIAGRAM
# -------------------------------------------------------------
def make_use_case_diagram():
    img = Image.new("RGB", (1200, 720), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_actor = get_font(14, True)
    f_uc = get_font(12, True)

    draw.rectangle([0, 0, 1200, 50], fill="#0F172A")
    draw.text((30, 15), "FIGURE 3.8: CODEATLAS PLATFORM USE-CASE DIAGRAM", fill="#FFFFFF", font=f_title)

    # Boundary Box
    draw_rounded_card(draw, (280, 80, 920, 680), "#F8FAFC", "#64748B", 2, 12)
    draw.text((310, 95), "SYSTEM BOUNDARY: CODEATLAS INTELLIGENCE PLATFORM", fill="#334155", font=f_actor)

    use_cases = [
        ("UC-1: Register & Authenticate (Email/Google/GitHub)", 320, 140, 880, 185, "#EFF6FF", "#3B82F6"),
        ("UC-2: Connect & Ingest Codebase Repository", 320, 205, 880, 250, "#EFF6FF", "#3B82F6"),
        ("UC-3: Explore AST Hierarchy & Caller/Callee Graph", 320, 270, 880, 315, "#F0FDF4", "#10B981"),
        ("UC-4: Query Grounded AI Assistant with Source Receipts", 320, 335, 880, 380, "#FAF5FF", "#8B5CF6"),
        ("UC-5: Inspect 2D/3D Architecture Dependency Maps", 320, 400, 880, 445, "#FFFBEB", "#F59E0B"),
        ("UC-6: Calculate Pull Request Blast-Radius & Impact", 320, 465, 880, 510, "#FFF1F2", "#F43F5E"),
        ("UC-7: Global Symbol, File & API Pattern Search", 320, 530, 880, 575, "#F0FDF4", "#10B981"),
        ("UC-8: Audit System Health & Circular Dependencies", 320, 595, 880, 640, "#F1F5F9", "#64748B"),
    ]

    for name, x0, y0, x1, y1, bg, border in use_cases:
        draw_rounded_card(draw, (x0, y0, x1, y1), bg, border, 1, 20)
        draw.text((x0 + 40, y0 + 12), name, fill="#0F172A", font=f_uc)

    # Actors
    actors = [
        ("Software Developer", 140, 260, "#2563EB"),
        ("Tech Lead / Architect", 140, 480, "#7C3AED"),
        ("System Administrator", 1060, 380, "#059669")
    ]

    for title, ax, ay, col in actors:
        # stick figure head & body
        draw.ellipse([ax - 18, ay - 40, ax + 18, ay - 4], fill="#FFFFFF", outline=col, width=3)
        draw.line([(ax, ay - 4), (ax, ay + 35)], fill=col, width=3)
        draw.line([(ax - 25, ay + 10), (ax + 25, ay + 10)], fill=col, width=3)
        draw.line([(ax, ay + 35), (ax - 20, ay + 70)], fill=col, width=3)
        draw.line([(ax, ay + 35), (ax + 20, ay + 70)], fill=col, width=3)
        draw.text((ax - 60, ay + 80), title, fill=col, font=f_actor)

    # Developer associations
    for y in [162, 227, 292, 357, 552]:
        draw.line([(160, 260), (320, y)], fill="#93C5FD", width=2)

    # Lead associations
    for y in [292, 422, 487, 617]:
        draw.line([(160, 480), (320, y)], fill="#D8B4FE", width=2)

    # Admin associations
    for y in [162, 227, 617]:
        draw.line([(1040, 380), (880, y)], fill="#6EE7B7", width=2)

    os.makedirs("report/diagrams/architecture", exist_ok=True)
    img.save("report/diagrams/architecture/use_case_diagram.png")

# -------------------------------------------------------------
# 9. DATA-FLOW DIAGRAM (DFD LEVEL 1)
# -------------------------------------------------------------
def make_data_flow_diagram():
    img = Image.new("RGB", (1250, 720), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_proc = get_font(13, True)
    f_label = get_font(11, False)

    draw.rectangle([0, 0, 1250, 50], fill="#0F172A")
    draw.text((30, 15), "FIGURE 3.9: CODEATLAS LEVEL-1 DATA FLOW DIAGRAM (DFD)", fill="#FFFFFF", font=f_title)

    # Entities
    draw_rounded_card(draw, (40, 280, 200, 360), "#EFF6FF", "#3B82F6", 2, 8)
    draw.text((65, 310), "DEVELOPER", fill="#1E40AF", font=f_proc)

    # Processes
    processes = [
        ("1.0 Authenticate\n& Authorize", 280, 140, "#F0FDF4", "#10B981"),
        ("2.0 Ingest &\nParse Repository", 540, 140, "#EFF6FF", "#3B82F6"),
        ("3.0 Construct AST\n& Call Trees", 800, 140, "#FAF5FF", "#8B5CF6"),
        ("4.0 Ground AI\nPrompt with Context", 540, 440, "#FAF5FF", "#7C3AED"),
        ("5.0 Render Graph\n& Code Receipts", 280, 440, "#FFFBEB", "#F59E0B"),
    ]

    for title, px, py, bg, border in processes:
        draw.ellipse([px, py, px + 150, py + 90], fill=bg, outline=border, width=2)
        lines = title.split("\n")
        draw.text((px + 20, py + 25), lines[0], fill="#0F172A", font=f_proc)
        draw.text((px + 20, py + 48), lines[1], fill="#0F172A", font=f_proc)

    # Data Stores
    stores = [
        ("D1: User Store (PostgreSQL users)", 500, 300),
        ("D2: Symbol Store (code_symbols)", 780, 300),
        ("D3: Graph Store (dependencies)", 1000, 300)
    ]
    for sname, sx, sy in stores:
        draw.rectangle([sx, sy, sx + 220, sy + 45], fill="#F8FAFC", outline="#64748B", width=2)
        draw.text((sx + 15, sy + 15), sname, fill="#334155", font=get_font(11, True))

    # Flow lines
    draw_arrow(draw, (200, 300), (280, 185), "#2563EB", 2, 6, "Credentials", f_label)
    draw_arrow(draw, (430, 185), (540, 185), "#059669", 2, 6, "Session Token", f_label)
    draw_arrow(draw, (690, 185), (800, 185), "#2563EB", 2, 6, "Source Files", f_label)
    draw_arrow(draw, (355, 230), (500, 320), "#059669", 2, 6)
    draw_arrow(draw, (875, 230), (880, 300), "#7C3AED", 2, 6)
    draw_arrow(draw, (200, 340), (280, 485), "#D97706", 2, 6, "Natural Query", f_label)
    draw_arrow(draw, (430, 485), (540, 485), "#D97706", 2, 6, "AST Focus", f_label)
    draw_arrow(draw, (615, 440), (780, 345), "#7C3AED", 2, 6, "Lookup", f_label)
    draw_arrow(draw, (540, 500), (430, 500), "#059669", 2, 6, "Cited Answers", f_label)
    draw_arrow(draw, (280, 500), (180, 360), "#059669", 2, 6, "Visual Receipts", f_label)

    os.makedirs("report/diagrams/architecture", exist_ok=True)
    img.save("report/diagrams/architecture/data_flow_diagram.png")

# -------------------------------------------------------------
# 10. DEPLOYMENT ARCHITECTURE
# -------------------------------------------------------------
def make_deployment_architecture():
    img = Image.new("RGB", (1250, 720), "#FFFFFF")
    draw = ImageDraw.Draw(img)
    f_title = get_font(20, True)
    f_head = get_font(14, True)
    f_sub = get_font(12, True)
    f_body = get_font(11, False)

    draw.rectangle([0, 0, 1250, 50], fill="#0F172A")
    draw.text((30, 15), "FIGURE 3.10: HYBRID PRODUCTION DEPLOYMENT TOPOLOGY", fill="#FFFFFF", font=f_title)

    # Box 1: Static Edge CDN (GitHub Pages)
    draw_rounded_card(draw, (50, 100, 400, 660), "#EFF6FF", "#3B82F6", 2, 12)
    draw.rectangle([50, 100, 400, 145], fill="#1E40AF")
    draw.text((70, 115), "STATIC FRONTEND (GITHUB PAGES)", fill="#FFFFFF", font=f_head)

    draw_rounded_card(draw, (70, 165, 380, 245), "#DBEAFE", "#93C5FD", 1, 8)
    draw.text((85, 175), "GitHub Global Edge CDN", fill="#1E3A8A", font=f_sub)
    draw.text((85, 200), "https://koushik-2006.github.io/...", fill="#1E293B", font=f_body)
    draw.text((85, 220), "Serves HTML/CSS/JS, .nojekyll, 404.html", fill="#475569", font=f_body)

    draw_rounded_card(draw, (70, 265, 380, 365), "#DBEAFE", "#93C5FD", 1, 8)
    draw.text((85, 275), "Client-Side SPA Engine", fill="#1E3A8A", font=f_sub)
    draw.text((85, 300), "Next.js 14 Static HTML/JS bundles", fill="#1E293B", font=f_body)
    draw.text((85, 320), "Theme Provider, React Auth Context", fill="#475569", font=f_body)
    draw.text((85, 340), "Framer Motion Interactive Canvas", fill="#475569", font=f_body)

    draw_rounded_card(draw, (70, 385, 380, 485), "#DBEAFE", "#93C5FD", 1, 8)
    draw.text((85, 395), "CI/CD Deployment Workflow", fill="#1E3A8A", font=f_sub)
    draw.text((85, 420), "actions/checkout@v4, Node 20 LTS", fill="#1E293B", font=f_body)
    draw.text((85, 440), "npm ci, npm run build:pages", fill="#475569", font=f_body)
    draw.text((85, 460), "actions/deploy-pages@v4", fill="#475569", font=f_body)

    # Box 2: Application Cloud Hosting (FastAPI Container)
    draw_rounded_card(draw, (460, 100, 810, 660), "#F0FDF4", "#10B981", 2, 12)
    draw.rectangle([460, 100, 810, 145], fill="#047857")
    draw.text((480, 115), "API RUNTIME (CLOUD RUN / RENDER)", fill="#FFFFFF", font=f_head)

    draw_rounded_card(draw, (480, 165, 790, 265), "#DCFCE7", "#6EE7B7", 1, 8)
    draw.text((495, 175), "Docker Linux Container", fill="#065F46", font=f_sub)
    draw.text((495, 200), "Python 3.13 / Uvicorn ASGI Server", fill="#1E293B", font=f_body)
    draw.text((495, 220), "FastAPI REST API Gateway (/api/v1)", fill="#475569", font=f_body)
    draw.text((495, 240), "CORS Regex: https://.*\\.github\\.io", fill="#475569", font=f_body)

    draw_rounded_card(draw, (480, 285, 790, 405), "#DCFCE7", "#6EE7B7", 1, 8)
    draw.text((495, 295), "Intelligence & Security Services", fill="#065F46", font=f_sub)
    draw.text((495, 320), "Bcrypt password hashing (12 rounds)", fill="#1E293B", font=f_body)
    draw.text((495, 340), "HS256 JWT Token minting & verification", fill="#475569", font=f_body)
    draw.text((495, 360), "AST lexical & semantic code parser", fill="#475569", font=f_body)
    draw.text((495, 380), "Call graph & circular dependency miner", fill="#475569", font=f_body)

    # Box 3: Managed Cloud Services & External APIs
    draw_rounded_card(draw, (870, 100, 1210, 660), "#FAF5FF", "#8B5CF6", 2, 12)
    draw.rectangle([870, 100, 1210, 145], fill="#6D28D9")
    draw.text((890, 115), "MANAGED PERSISTENCE & AI", fill="#FFFFFF", font=f_head)

    draw_rounded_card(draw, (890, 165, 1190, 265), "#F3E8FF", "#D8B4FE", 1, 8)
    draw.text((905, 175), "AWS Neon Cloud PostgreSQL", fill="#4C1D95", font=f_sub)
    draw.text((905, 200), "Serverless PostgreSQL 16 cluster", fill="#1E293B", font=f_body)
    draw.text((905, 220), "SSL encrypted connection pool", fill="#475569", font=f_body)
    draw.text((905, 240), "Alembic schema versioning", fill="#475569", font=f_body)

    draw_rounded_card(draw, (890, 285, 1190, 385), "#F3E8FF", "#D8B4FE", 1, 8)
    draw.text((905, 295), "Google AI Studio / Gemini API", fill="#4C1D95", font=f_sub)
    draw.text((905, 320), "gemini-1.5-flash / gemini-1.5-pro", fill="#1E293B", font=f_body)
    draw.text((905, 340), "Grounded code explanation & RAG", fill="#475569", font=f_body)

    draw_rounded_card(draw, (890, 405, 1190, 505), "#F3E8FF", "#D8B4FE", 1, 8)
    draw.text((905, 415), "External Identity Providers", fill="#4C1D95", font=f_sub)
    draw.text((905, 440), "Google OpenID Connect", fill="#1E293B", font=f_body)
    draw.text((905, 460), "GitHub OAuth 2.0 API & Webhooks", fill="#475569", font=f_body)

    # Cross arrows
    draw_arrow(draw, (400, 205), (460, 205), "#2563EB", 2, 8, "CORS HTTPS", f_body)
    draw_arrow(draw, (460, 235), (400, 235), "#059669", 2, 8, "JSON / Stream", f_body)
    draw_arrow(draw, (810, 215), (870, 215), "#047857", 2, 8, "psycopg v3", f_body)
    draw_arrow(draw, (810, 335), (870, 335), "#7C3AED", 2, 8, "HTTPS REST", f_body)
    draw_arrow(draw, (810, 455), (870, 455), "#EA4335", 2, 8, "OAuth Token", f_body)

    os.makedirs("report/diagrams/architecture", exist_ok=True)
    img.save("report/diagrams/architecture/deployment_architecture.png")

if __name__ == "__main__":
    print("Generating 10 academic report diagrams...")
    make_system_architecture()
    make_frontend_backend_db_interaction()
    make_user_registration_login_sequence()
    make_oauth_sequence()
    make_repository_indexing_workflow()
    make_ai_analysis_workflow()
    make_database_er_diagram()
    make_use_case_diagram()
    make_data_flow_diagram()
    make_deployment_architecture()
    print("All 10 diagrams successfully generated!")

