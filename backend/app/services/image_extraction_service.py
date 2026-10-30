from typing import Any, Dict
from app.integrations.vision.provider import vision_extractor


class ImageExtractionService:
    async def extract_from_image_bytes(self, image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        return await vision_extractor.extract_code_from_bytes(image_bytes, filename)


image_extraction_service = ImageExtractionService()
