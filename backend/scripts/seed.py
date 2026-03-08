"""
Seed script — creates initial admin and staff users.
Run from the backend/ directory:
    PYTHONPATH=. .venv/bin/python scripts/seed.py
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User

USERS = [
    {"email": "admin@school.edu",  "password": "admin1234", "role": "admin"},
    {"email": "staff@school.edu",  "password": "staff1234", "role": "staff"},
]

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for u in USERS:
            existing = await session.scalar(select(User).where(User.email == u["email"]))
            if existing:
                print(f"  [skip]    {u['email']} already exists")
                continue

            user = User(
                email=u["email"],
                password=hash_password(u["password"]),
                role=u["role"],
                is_active=True,
            )
            session.add(user)
            print(f"  [created] {u['email']}  role={u['role']}")

        await session.commit()
    print("\nDone.")


if __name__ == "__main__":
    print("Seeding users...\n")
    asyncio.run(seed())
