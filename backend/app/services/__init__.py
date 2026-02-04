"""Services package.

Note: Services are imported lazily or explicitly to avoid import-time
dependency issues (e.g., WeasyPrint requires GTK on Windows).
"""

# Don't import at module level - let callers import directly
# from app.services import cover_letter_service
# from app.services import template_service  
# from app.services import extraction_service
