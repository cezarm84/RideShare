from typing import Any, Optional

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Optional[Any] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(AppException):
    """Exception raised when a resource is not found."""

    def __init__(
        self, message: str = "Resource not found", detail: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class AuthenticationException(AppException):
    """Exception raised for auth-related errors."""

    def __init__(
        self, message: str = "Authentication failed", detail: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        )


class PermissionDeniedException(AppException):
    """Exception raised for permission-related errors."""

    def __init__(
        self, message: str = "Permission denied", detail: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class ValidationException(AppException):
    """Exception raised for validation errors."""

    def __init__(self, message: str = "Validation error", detail: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


class BusinessLogicException(AppException):
    """Exception raised for business logic errors."""

    def __init__(
        self, message: str = "Business rule violation", detail: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


# Setup exception handlers with FastAPI


def setup_exception_handlers(app):
    """Register exception handlers with the FastAPI app."""

    @app.exception_handler(AppException)
    async def handle_app_exception(request, exc):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.message,
                "detail": exc.detail,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        return JSONResponse(
            status_code=exc.status_code,
            headers=getattr(exc, "headers", None),
            content={
                "message": exc.detail,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc):
        # Log the exception here
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "message": "Internal server error",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
        )
