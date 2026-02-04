from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AIRequest(Base):
	__tablename__ = "ai_requests"

	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
	tool = Column(String, nullable=False, index=True)
	status = Column(String, nullable=False, default="success")
	prompt = Column(Text, nullable=False)
	input_data = Column(JSON, nullable=True)
	response_text = Column(Text, nullable=True)
	error_message = Column(Text, nullable=True)
	tokens_used = Column(Integer, nullable=True)
	created_at = Column(DateTime(timezone=True), server_default=func.now())

	user = relationship("User", back_populates="ai_requests")

	def __repr__(self) -> str:
		return f"<AIRequest {self.tool} - {self.status}>"
