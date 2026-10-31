import os
import logging
from typing import Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)


def get_configured_llm():
    """Factory creating the appropriate BaseChatModel or None for mock mode."""
    provider = settings.resolve_provider()

    if provider == "openai":
        api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OpenAI provider selected but OPENAI_API_KEY is not set. Falling back to deterministic mode.")
            return None
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.temperature,
            api_key=api_key
        )

    elif provider == "google_genai":
        api_key = settings.google_api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("Google GenAI provider selected but GOOGLE_API_KEY is not set. Falling back to deterministic mode.")
            return None
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.google_model,
            temperature=settings.temperature,
            google_api_key=api_key
        )

    elif provider == "anthropic":
        api_key = settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("Anthropic provider selected but ANTHROPIC_API_KEY is not set. Falling back to deterministic mode.")
            return None
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=settings.anthropic_model,
            temperature=settings.temperature,
            api_key=api_key
        )

    return None
