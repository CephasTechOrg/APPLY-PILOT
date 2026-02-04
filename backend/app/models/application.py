from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True, index=True)

    company = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="saved")

    location = Column(String, nullable=True)
    job_url = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    salary_range = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    recruiter_name = Column(String, nullable=True)
    recruiter_email = Column(String, nullable=True)
    recruiter_phone = Column(String, nullable=True)

    applied_at = Column(DateTime(timezone=True), nullable=True)
    interview_date = Column(DateTime(timezone=True), nullable=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
    resume = relationship("Resume", foreign_keys=[resume_id])
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")
    cover_letter = relationship("CoverLetter", back_populates="application", uselist=False)

    def __repr__(self):
        return f"<Application {self.company} - {self.job_title}>"
