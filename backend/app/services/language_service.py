from app.utils.language_detection import detect_language_by_filename, detect_language_from_code


class LanguageService:
    def detect_by_path(self, path: str) -> str:
        return detect_language_by_filename(path)

    def detect_by_code(self, code: str) -> str:
        return detect_language_from_code(code)


language_service = LanguageService()
