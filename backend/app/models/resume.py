from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Resume(Base):
	__tablename__ = "resumes"

	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

	title = Column(String, nullable=False)
	file_name = Column(String, nullable=False)
	storage_path = Column(String, nullable=False)
	content_type = Column(String, nullable=False)
	file_size = Column(Integer, nullable=False)
	is_primary = Column(Boolean, default=False)

	created_at = Column(DateTime(timezone=True), server_default=func.now())
	updated_at = Column(DateTime(timezone=True), onupdate=func.now())

	user = relationship("User", back_populates="resumes")
	content = relationship("ResumeContent", back_populates="resume", uselist=False, cascade="all, delete-orphan")

	def __repr__(self):
		return f"<Resume {self.title}>"
