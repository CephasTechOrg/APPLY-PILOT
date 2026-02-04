from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    avatar_url = Column(Text, nullable=True)
    headline = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    time_zone = Column(String, nullable=True)
    current_title = Column(String, nullable=True)
    current_company = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)
    preferred_role = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    skills = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    open_to_work = Column(Boolean, default=True, nullable=False)
    education_level = Column(String, nullable=True)
    school = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    certifications = Column(Text, nullable=True)
    work_authorization = Column(String, nullable=True)
    visa_sponsorship_required = Column(Boolean, default=False, nullable=False)
    years_experience = Column(Integer, nullable=True)
    industry = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    relocation_open = Column(Boolean, default=False, nullable=False)
    remote_preference = Column(String, nullable=True)
    salary_expectation = Column(String, nullable=True)
    notice_period = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")
