import os
import logging
from typing import Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)


def get_configured_llm():
    """Factory creating the appropriate BaseChatModel or None for mock mode.
    Primary flagship provider: Sarvam AI (sarvam-105b).
    Fallback providers: NVIDIA, OpenAI, Google GenAI, Anthropic.
    """
    provider = settings.resolve_provider()

    if provider == "sarvam":
        api_key = settings.sarvam_api_key or os.getenv("SARVAM_API_KEY")
        if not api_key:
            logger.warning("Sarvam provider selected but SARVAM_API_KEY is not set. Checking fallback providers.")
            # Fall back to NVIDIA if available
            nv_key = settings.nvidia_api_key or os.getenv("NVIDIA_API_KEY")
            if nv_key:
                logger.info("Falling back to NVIDIA provider.")
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(
                    model=settings.nvidia_model,
                    base_url=settings.nvidia_base_url,
                    api_key=nv_key,
                    temperature=settings.temperature,
                    timeout=10.0,
                    max_retries=0
                )
            return None

        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.sarvam_model or "sarvam-105b",
            base_url=settings.sarvam_base_url or "https://api.sarvam.ai/v2",
            api_key=api_key,
            temperature=settings.temperature,
            timeout=20.0,
            max_retries=1,
            default_headers={"api-subscription-key": api_key}
        )

    elif provider == "nvidia":
        api_key = settings.nvidia_api_key or os.getenv("NVIDIA_API_KEY")
        if not api_key:
            logger.warning("NVIDIA provider selected but NVIDIA_API_KEY is not set.")
            return None
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.nvidia_model,
            base_url=settings.nvidia_base_url,
            api_key=api_key,
            temperature=settings.temperature,
            timeout=10.0,
            max_retries=0
        )

    elif provider == "openai":
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
