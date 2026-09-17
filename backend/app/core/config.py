from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Multi-LLM Custom ChatGPT"
    app_version: str = "0.1.0"
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Provider keys may be empty. The app still starts; providers fail at call time.
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    llm_timeout_seconds: float = 30.0
    llm_max_output_tokens: int = 2048
    max_prompt_length: int = 8000

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
