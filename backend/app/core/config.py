from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://applypilot:applypilot123@localhost:5432/applypilot_db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email verification
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 15

    # Password reset
    PASSWORD_RESET_EXPIRE_MINUTES: int = 15
    
    # Email (SendGrid)
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: Optional[str] = "noreply@applypilot.com"
    EMAIL_FROM: Optional[str] = None
    
    # AI
    OPENAI_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_API_URL: Optional[str] = "https://api.deepseek.com/v1/chat/completions"
    AI_DAILY_QUOTA: int = 50

    # Supabase storage
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_BUCKET: Optional[str] = None
    SUPABASE_SIGNED_URL_EXPIRES_IN: int = 86400

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def apply_email_from(self):
        if self.EMAIL_FROM:
            self.FROM_EMAIL = self.EMAIL_FROM
        return self

settings = Settings()
