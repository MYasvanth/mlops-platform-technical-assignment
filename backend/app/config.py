from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./mlops.db"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "dev-secret"
    debug: str = "false"

    model_config = {"env_file": ".env"}


settings = Settings()
