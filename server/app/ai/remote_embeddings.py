from collections.abc import Sequence
import math
from typing import Any

import httpx
from langchain_core.embeddings import Embeddings


class RenderEmbeddingService(Embeddings):
    def __init__(
        self,
        service_url: str,
        token: str,
        expected_dimension: int,
    ) -> None:
        self._url = f"{service_url.rstrip('/')}/internal/embeddings"
        self._token = token
        self._expected_dimension = expected_dimension

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        response = httpx.post(
            self._url,
            json={"texts": [text.replace("\n", " ") for text in texts]},
            headers={"Authorization": f"Bearer {self._token}"},
            timeout=httpx.Timeout(180.0),
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, dict):
            raise ValueError("Embedding endpoint returned an unexpected response.")
        result = payload.get("embeddings")

        if not isinstance(result, Sequence) or len(result) != len(texts):
            raise ValueError("Embedding endpoint returned an unexpected result shape.")

        vectors: list[list[float]] = []
        for vector in result:
            if not isinstance(vector, Sequence) or len(vector) != self._expected_dimension:
                raise ValueError(
                    "Embedding endpoint returned a vector with an unexpected dimension."
                )
            normalized = [float(value) for value in vector]
            if not all(math.isfinite(value) for value in normalized):
                raise ValueError("Embedding endpoint returned non-finite values.")
            vectors.append(normalized)
        return vectors

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]
