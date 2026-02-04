from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ExtractionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# Create PostgreSQL ENUM type that uses lowercase values
extraction_status_enum = ENUM(
    'pending', 'processing', 'completed', 'failed',
    name='extractionstatus',
    create_type=False  # Already created in migration
)


class ResumeContent(Base):
    """
    Stores the parsed/structured content of a resume in canonical JSON schema.
    This is the single source of truth for resume data used in template rendering.
    """
    __tablename__ = "resume_contents"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Canonical JSON schema data
    structured_data = Column(JSONB, nullable=True)
    
    # Raw text extracted from resume file
    raw_text = Column(Text, nullable=True)

    # Extraction metadata - use string values matching the database enum
    extraction_status = Column(
        extraction_status_enum,
        default="pending",
        nullable=False
    )
    extraction_error = Column(Text, nullable=True)

    # Purpose/industry for template selection
    purpose = Column(String(50), nullable=True)  # software_engineer, academic, business
    industry = Column(String(100), nullable=True)
    language = Column(String(10), default="en")
    tone = Column(String(20), default="professional")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    resume = relationship("Resume", back_populates="content")

    def __repr__(self):
        return f"<ResumeContent resume_id={self.resume_id} status={self.extraction_status}>"
