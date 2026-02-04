from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import quote, urlsplit, urlunsplit
from uuid import uuid4

import requests
from requests import RequestException

from app.core.config import settings


class StorageError(RuntimeError):
    pass


def _get_base_url() -> str:
    if not settings.SUPABASE_URL:
        raise StorageError("Supabase storage is not configured.")
    return settings.SUPABASE_URL.rstrip("/")


def _get_bucket() -> str:
    if not settings.SUPABASE_BUCKET:
        raise StorageError("Supabase bucket is not configured.")
    return settings.SUPABASE_BUCKET.strip()


def _get_key() -> str:
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise StorageError("Supabase service role key is not configured.")
    return settings.SUPABASE_SERVICE_ROLE_KEY


def _public_url(bucket: str, object_path: str) -> str:
    base_url = _get_base_url()
    bucket_encoded = quote(bucket, safe="")
    object_encoded = quote(object_path, safe="/")
    return f"{base_url}/storage/v1/object/public/{bucket_encoded}/{object_encoded}"


def _extract_object_path(url: str, bucket: str) -> Optional[str]:
    if not url:
        return None

    markers = [
        f"/storage/v1/object/public/{bucket}/",
        f"/storage/v1/object/{bucket}/",
        f"/storage/v1/object/sign/{bucket}/",
        f"/storage/v1/object/authenticated/{bucket}/",
    ]

    for marker in markers:
        if marker in url:
            path = url.split(marker, 1)[1]
            return path.split("?", 1)[0]

    return None


def create_signed_url(object_path: str, expires_in: Optional[int] = None) -> str:
    base_url = _get_base_url()
    bucket = _get_bucket()
    key = _get_key()
    expires_in = expires_in or settings.SUPABASE_SIGNED_URL_EXPIRES_IN

    bucket_encoded = quote(bucket, safe="")
    object_encoded = quote(object_path, safe="/")
    payload = {"expiresIn": int(expires_in)}
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
    }

    endpoints = [
        f"{base_url}/storage/v1/object/sign/{bucket_encoded}/{object_encoded}",
        f"{base_url}/storage/v1/object/{bucket_encoded}/{object_encoded}/sign",
    ]

    last_status = None
    for endpoint in endpoints:
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        except RequestException as exc:
            raise StorageError(f"Supabase signed URL request failed: {exc}") from exc
        last_status = response.status_code
        if response.status_code < 300:
            data = response.json()
            signed_url = data.get("signedURL") or data.get("signedUrl") or data.get("signed_url")
            if signed_url:
                if signed_url.startswith("http"):
                    return _sanitize_url(signed_url)
                if signed_url.startswith("/"):
                    # Supabase returns relative URLs like /object/sign/... 
                    # We need to prepend base_url + /storage/v1
                    return _sanitize_url(f"{base_url}/storage/v1{signed_url}")
                return _sanitize_url(f"{base_url}/storage/v1/{signed_url}")

    raise StorageError(f"Supabase signed URL failed: {last_status}")


def _resolve_extension(filename: Optional[str], content_type: Optional[str]) -> str:
    if filename:
        suffix = Path(filename).suffix
        if suffix:
            return suffix
    if content_type:
        # Basic mapping without extra dependencies.
        if content_type == "image/png":
            return ".png"
        if content_type == "image/jpeg":
            return ".jpg"
        if content_type == "image/webp":
            return ".webp"
        if content_type == "image/gif":
            return ".gif"
        if content_type == "application/pdf":
            return ".pdf"
        if content_type == "application/msword":
            return ".doc"
        if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return ".docx"
    return ""


def upload_profile_avatar(
    content: bytes,
    content_type: str,
    filename: Optional[str],
    user_id: int,
) -> Tuple[str, str]:
    base_url = _get_base_url()
    bucket = _get_bucket()
    key = _get_key()

    extension = _resolve_extension(filename, content_type)
    object_path = f"profiles/{user_id}/{uuid4().hex}{extension}"
    bucket_encoded = quote(bucket, safe="")
    object_encoded = quote(object_path, safe="/")
    upload_url = f"{base_url}/storage/v1/object/{bucket_encoded}/{object_encoded}"

    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }

    response = requests.post(upload_url, headers=headers, data=content, timeout=30)
    if response.status_code >= 300:
        raise StorageError(f"Supabase upload failed: {response.status_code}")

    signed_url = create_signed_url(object_path)
    return object_path, signed_url


def resolve_avatar_url(stored_value: Optional[str]) -> Optional[str]:
    if not stored_value:
        return None

    bucket = _get_bucket()
    value = stored_value.strip()

    # If value is already a public/signed URL, try to extract path and sign it.
    if value.startswith("http"):
        object_path = _extract_object_path(value, bucket)
        if object_path:
            try:
                return create_signed_url(object_path)
            except StorageError:
                return value
        return _sanitize_url(value)

    # Treat as object path.
    try:
        return create_signed_url(value)
    except StorageError:
        return _sanitize_url(value)


def upload_resume_file(
    content: bytes,
    content_type: str,
    filename: Optional[str],
    user_id: int,
) -> Tuple[str, str]:
    base_url = _get_base_url()
    bucket = _get_bucket()
    key = _get_key()

    extension = _resolve_extension(filename, content_type)
    object_path = f"resumes/{user_id}/{uuid4().hex}{extension}"
    bucket_encoded = quote(bucket, safe="")
    object_encoded = quote(object_path, safe="/")
    upload_url = f"{base_url}/storage/v1/object/{bucket_encoded}/{object_encoded}"

    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }

    response = requests.post(upload_url, headers=headers, data=content, timeout=30)
    if response.status_code >= 300:
        raise StorageError(f"Supabase upload failed: {response.status_code}")

    signed_url = create_signed_url(object_path)
    return object_path, signed_url


def resolve_resume_url(stored_value: Optional[str]) -> Optional[str]:
    if not stored_value:
        return None

    bucket = _get_bucket()
    value = stored_value.strip()

    if value.startswith("http"):
        object_path = _extract_object_path(value, bucket)
        if object_path:
            try:
                return create_signed_url(object_path)
            except StorageError:
                return value
        return _sanitize_url(value)

    try:
        return create_signed_url(value)
    except StorageError:
        return _sanitize_url(value)


def download_resume_file(object_path: str) -> bytes:
    """
    Download resume file content from Supabase storage.
    
    Args:
        object_path: The object path in storage (e.g., resumes/1/abc123.pdf)
        
    Returns:
        File content as bytes
        
    Raises:
        StorageError: If download fails
    """
    base_url = _get_base_url()
    bucket = _get_bucket()
    key = _get_key()
    
    bucket_encoded = quote(bucket, safe="")
    object_encoded = quote(object_path, safe="/")
    download_url = f"{base_url}/storage/v1/object/{bucket_encoded}/{object_encoded}"
    
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
    }
    
    response = requests.get(download_url, headers=headers, timeout=60)
    if response.status_code >= 300:
        raise StorageError(f"Supabase download failed: {response.status_code}")
    
    return response.content


def _sanitize_url(url: str) -> str:
    parts = urlsplit(url)
    path = quote(parts.path, safe="/")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))
