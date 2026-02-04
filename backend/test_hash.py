from app.core.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

db = SessionLocal()
user = db.query(User).filter(User.email == 'cephasbonsuosei001@gmail.com').first()

if user:
    h = user.password_hash
    print(f"Email: {user.email}")
    print(f"Hash length: {len(h)}")
    print(f"Hash: {h}")
    print(f"Starts with $2b$: {h.startswith('$2b$')}")
    print(f"Starts with $argon2: {h.startswith('$argon2')}")
    
    # Test context
    ctx = CryptContext(schemes=["argon2", "bcrypt"], default="argon2", deprecated=["bcrypt"])
    print(f"Identified as: {ctx.identify(h)}")
    
    # Try direct bcrypt
    from passlib.hash import bcrypt
    print(f"bcrypt.identify: {bcrypt.identify(h)}")
else:
    print("User not found")

db.close()
