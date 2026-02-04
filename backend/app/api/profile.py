from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.storage import StorageError, resolve_avatar_url, upload_profile_avatar
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter()

MAX_AVATAR_SIZE = 2 * 1024 * 1024


def get_or_create_profile(db: Session, user_id: int) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(user_id=user_id, open_to_work=True)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileResponse)
def read_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db, current_user.id)
    avatar_url = resolve_avatar_url(profile.avatar_url)
    if avatar_url:
        profile.avatar_url = avatar_url
    return profile


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(db, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    if "avatar_url" in updates:
        avatar_value = updates.pop("avatar_url")
        if not avatar_value:
            profile.avatar_url = None
    for key, value in updates.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    avatar_url = resolve_avatar_url(profile.avatar_url)
    if avatar_url:
        profile.avatar_url = avatar_url
    return profile


@router.post("/me/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file.")

    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be smaller than 2MB.",
        )

    try:
        object_path, signed_url = upload_profile_avatar(
            content,
            file.content_type,
            file.filename,
            current_user.id,
        )
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    profile = get_or_create_profile(db, current_user.id)
    profile.avatar_url = object_path
    db.commit()
    db.refresh(profile)
    profile.avatar_url = signed_url
    return profile
