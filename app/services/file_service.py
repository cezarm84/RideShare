import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import magic
from fastapi import UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.attachment import MessageAttachment
from app.models.message import ConversationMessage as Message


class FileService:
    """Service for handling file uploads and storage"""

    # Set allowed file types
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    ALLOWED_DOCUMENT_TYPES = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg"}
    ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mpeg", "video/quicktime"}

    @staticmethod
    def get_file_type(file_content: bytes) -> str:
        """Determine the file type from file content using python-magic"""
        mime = magic.Magic(mime=True)
        return mime.from_buffer(file_content)

    @staticmethod
    def is_file_allowed(file_type: str) -> bool:
        """Check if a file type is allowed"""
        allowed_types = (
            FileService.ALLOWED_IMAGE_TYPES
            | FileService.ALLOWED_DOCUMENT_TYPES
            | FileService.ALLOWED_AUDIO_TYPES
            | FileService.ALLOWED_VIDEO_TYPES
        )

        return file_type in allowed_types

    @staticmethod
    def save_file(file: UploadFile, user_id: int) -> Dict[str, Any]:
        """Save an uploaded file and return metadata"""
        # Read file content
        file_content = file.file.read()
        file.file.seek(0)  # Reset file pointer

        # Check file type
        file_type = FileService.get_file_type(file_content)
        if not FileService.is_file_allowed(file_type):
            raise ValueError(f"File type {file_type} not allowed")

        # Generate a unique filename
        file_extension = Path(file.filename).suffix if file.filename else ""
        if not file_extension and file_type:
            # If no extension but we have a mime type, try to assign one
            if file_type == "image/jpeg":
                file_extension = ".jpg"
            elif file_type == "image/png":
                file_extension = ".png"
            # Add more mappings as needed

        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Determine storage path
        base_dir = os.path.join(settings.MEDIA_ROOT, "uploads")
        user_dir = os.path.join(base_dir, str(user_id))
        year_month = datetime.now().strftime("%Y/%m")
        full_dir = os.path.join(user_dir, year_month)

        # Create directory if it doesn't exist
        os.makedirs(full_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(full_dir, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Prepare metadata
        result = {
            "file_name": file.filename,
            "file_size": len(file_content),
            "file_type": file_type,
            "upload_path": os.path.join(
                "uploads", str(user_id), year_month, unique_filename
            ),
            "file_url": f"{settings.API_BASE_URL}/media/{os.path.join('uploads', str(user_id), year_month, unique_filename)}",
        }

        # Get additional metadata for specific file types
        if file_type in FileService.ALLOWED_IMAGE_TYPES:
            try:
                with Image.open(file.file) as img:
                    result["width"] = img.width
                    result["height"] = img.height

                    # Create thumbnail if it's an image
                    thumbnail_dir = os.path.join(
                        base_dir, str(user_id), year_month, "thumbnails"
                    )
                    os.makedirs(thumbnail_dir, exist_ok=True)
                    thumbnail_path = os.path.join(thumbnail_dir, unique_filename)

                    # Generate thumbnail
                    img.thumbnail((200, 200))
                    img.save(thumbnail_path)

                    result["thumbnail_url"] = (
                        f"{settings.API_BASE_URL}/media/{os.path.join('uploads', str(user_id), year_month, 'thumbnails', unique_filename)}"
                    )

                file.file.seek(0)  # Reset file pointer
            except Exception as e:
                print(f"Error processing image metadata: {e}")

        # Handle other file types as needed

        return result

    @staticmethod
    def create_message_attachment(
        db: Session, message_id: int, file_metadata: Dict[str, Any]
    ) -> MessageAttachment:
        """Create a message attachment record in the database"""
        db_obj = MessageAttachment(
            message_id=message_id,
            file_name=file_metadata.get("file_name", ""),
            file_size=file_metadata.get("file_size", 0),
            file_type=file_metadata.get("file_type", ""),
            file_url=file_metadata.get("file_url", ""),
            upload_path=file_metadata.get("upload_path", ""),
            width=file_metadata.get("width"),
            height=file_metadata.get("height"),
            duration=file_metadata.get("duration"),
            thumbnail_url=file_metadata.get("thumbnail_url"),
        )

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
