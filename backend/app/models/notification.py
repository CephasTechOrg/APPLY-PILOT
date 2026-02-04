from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):
	__tablename__ = "notifications"

	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

	title = Column(String, nullable=False)
	message = Column(Text, nullable=False)
	category = Column(String, nullable=False, default="general")
	action_url = Column(String, nullable=True)

	is_read = Column(Boolean, nullable=False, server_default="false")
	read_at = Column(DateTime(timezone=True), nullable=True)
	created_at = Column(DateTime(timezone=True), server_default=func.now())

	user = relationship("User", back_populates="notifications")
