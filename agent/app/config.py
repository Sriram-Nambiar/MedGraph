import os
from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API endpoints for main application
    api_base_url: str = "http://localhost:5000"
    graph_search_endpoint: str = "/api/graph/search"
    vector_search_endpoint: str = "/api/vector/search"
    admission_endpoint: str = "/api/patients/{patient_id}/admissions"
    use_mock_api: bool = True  # Default to synthetic mock data during development/hackathon

    # LLM configuration
    llm_provider: Literal["mock", "openai", "google_genai", "anthropic"] = "mock"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    google_api_key: Optional[str] = None
    google_model: str = "gemini-2.0-flash"
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    temperature: float = 0.0

    # Agent / Workflow Settings
    max_retries: int = 2
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def resolve_provider(self) -> str:
        """Auto-detect provider if default is mock or explicit."""
        if self.llm_provider != "mock":
            return self.llm_provider
        if self.openai_api_key or os.getenv("OPENAI_API_KEY"):
            return "openai"
        if self.google_api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"):
            return "google_genai"
        if self.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY"):
            return "anthropic"
        return "mock"


settings = Settings()
