import anthropic
from typing import List, AsyncGenerator
from src.core.config import get_settings
from src.models.schemas import SourceCitation

settings = get_settings()


class GenerationService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-3-5-sonnet-20241022"

    def _build_prompt(self, query: str, sources: List[SourceCitation]) -> str:
        """Build the prompt for Claude with sources."""
        source_blocks = []
        for i, src in enumerate(sources):
            authors_str = ", ".join(src.authors[:3])
            if len(src.authors) > 3:
                authors_str += " et al."
            source_blocks.append(
                f"[Source {i+1}]\n"
                f"Paper: {src.paper_title}\n"
                f"Authors: {authors_str}\n"
                f"University: {src.university}\n"
                f"Year: {src.year}\n"
                f"Excerpt: {src.chunk_text[:1500]}"
            )

        sources_text = "\n\n---\n\n".join(source_blocks)

        prompt = f"""You are SkolarPulse, an AI research assistant that answers questions using only the provided academic sources.

Your task: Answer the user's question based ONLY on the provided sources. Cite sources inline using [Source N] format.

Guidelines:
- Be accurate and precise. Only use information from the provided sources.
- If the sources don't contain enough information, say so clearly.
- Cite every claim with [Source N] where N is the source number.
- Include the university name when citing (e.g., "According to Smith et al. [Source 1] from MIT...")
- Be concise but comprehensive.
- Use academic tone.

Sources:
{sources_text}

Question: {query}

Answer:"""
        return prompt

    def generate_answer(self, query: str, sources: List[SourceCitation]) -> str:
        """Generate answer using Claude."""
        if not sources:
            return "I couldn't find any relevant research papers to answer your question. Try rephrasing or checking different universities."

        prompt = self._build_prompt(query, sources)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    async def generate_answer_stream(
        self, query: str, sources: List[SourceCitation]
    ) -> AsyncGenerator[str, None]:
        """Generate streaming answer using Claude."""
        if not sources:
            yield "I couldn't find any relevant research papers to answer your question. Try rephrasing or checking different universities."
            return

        prompt = self._build_prompt(query, sources)

        stream = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )

        for chunk in stream:
            if chunk.type == "content_block_delta":
                yield chunk.delta.text

    def health_check(self) -> bool:
        try:
            self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hi"}]
            )
            return True
        except Exception:
            return False


generation_service = GenerationService()