import base64
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from app.dependencies import get_current_user, get_snippet_matcher, get_graph_service
from app.services.image_extraction_service import image_extraction_service
from app.services.code_explanation_service import code_explanation_service
from app.services.snippet_matching_service import SnippetMatchingService
from app.services.graph_service import GraphService
from app.schemas.visual_explorer import (
    ExtractCodeResponse,
    VisualAnalyzeRequest,
    SnippetMatchRequest,
    SnippetMatchResponse
)
from app.schemas.graph import WorkflowGraphResponse

router = APIRouter(prefix="/visual", tags=["Visual Explorer & CodeLens"])


@router.post("/extract", response_model=ExtractCodeResponse)
async def extract_code_from_image(
    file: UploadFile = File(None),
    image_base64: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Extract source code from an uploaded image or camera snapshot."""
    if file:
        content = await file.read()
        filename = file.filename or "uploaded.png"
    elif image_base64:
        # Strip data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        try:
            content = base64.b64decode(image_base64)
            filename = "camera_snapshot.png"
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 image data.")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide either an image file or image_base64.")

    return await image_extraction_service.extract_from_image_bytes(content, filename)


@router.post("/analyze")
async def analyze_visual_code(
    req: VisualAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    snippet_matcher: SnippetMatchingService = Depends(get_snippet_matcher)
):
    """Explain extracted code and optionally match it to a selected repository."""
    explanation = await code_explanation_service.explain_code(req.code, req.language, req.level)
    match_result = None

    if req.repository_id:
        match_result = await snippet_matcher.match_snippet(req.repository_id, req.code)

    return {
        "code": req.code,
        "language": explanation["language"],
        "explanation": explanation,
        "repository_match": match_result
    }


@router.post("/match", response_model=SnippetMatchResponse)
async def match_snippet_to_repository(
    req: SnippetMatchRequest,
    current_user: dict = Depends(get_current_user),
    snippet_matcher: SnippetMatchingService = Depends(get_snippet_matcher)
):
    """Match a code snippet against indexed repository files."""
    return await snippet_matcher.match_snippet(req.repository_id, req.code)


@router.post("/workflow", response_model=WorkflowGraphResponse)
async def trace_workflow(
    req: SnippetMatchRequest,
    current_user: dict = Depends(get_current_user),
    graph_service: GraphService = Depends(get_graph_service)
):
    """FlowTrace: Trace matching code through repository callers and dependencies into a workflow graph."""
    return await graph_service.trace_snippet_workflow(req.repository_id, req.code, req.language)
