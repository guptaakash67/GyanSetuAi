"""
Embed the curated scripture JSON and scraped verse CSV into Pinecone.

Run from the server directory with:
    python -m app.ai.ingest
"""

import csv
import os
from pathlib import Path

from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec

from app.config import DATA_DIR, RUNTIME_CONFIG, SCRIPTURES
l
AI_CONFIG = RUNTIME_CONFIG["ai"]
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", AI_CONFIG["pinecone_index"])
SCRAPED_DATA_PATH = DATA_DIR / AI_CONFIG["scraped_data_file"]
SCRAPED_TRADITION = AI_CONFIG["scraped_data_tradition"]

REQUIRED_CSV_COLUMNS = {
    "verse_id",
    "scripture",
    "book",
    "verse_no",
    "text",
    "context_type",
    "concept",
    "primary_theme",
    "secondary_theme",
}


def _clean_label(value: str) -> str:
    value = value.strip()
    return "" if value.casefold() == "none" else value


def load_scraped_documents(csv_path: Path = SCRAPED_DATA_PATH) -> list[Document]:
    documents: list[Document] = []

    with csv_path.open(encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        columns = set(reader.fieldnames or [])
        missing_columns = REQUIRED_CSV_COLUMNS - columns
        if missing_columns:
            raise ValueError(
                f"Scraped scripture CSV is missing columns: {', '.join(sorted(missing_columns))}"
            )

        seen_ids: set[str] = set()
        for row_number, row in enumerate(reader, start=2):
            verse_id = (row.get("verse_id") or "").strip()
            scripture = (row.get("scripture") or "").strip()
            verse_text = (row.get("text") or "").strip()
            if not verse_id or not scripture or not verse_text:
                raise ValueError(
                    f"Scraped scripture CSV row {row_number} has an empty verse_id, scripture, or text."
                )
            if verse_id in seen_ids:
                raise ValueError(
                    f"Scraped scripture CSV contains duplicate verse_id {verse_id!r}."
                )
            seen_ids.add(verse_id)

            book = _clean_label(row.get("book") or "")
            verse_number = _clean_label(row.get("verse_no") or "")
            context_type = _clean_label(row.get("context_type") or "")
            concept = _clean_label(row.get("concept") or "")
            primary_theme = _clean_label(row.get("primary_theme") or "")
            secondary_theme = _clean_label(row.get("secondary_theme") or "")
            reference = f"{scripture} {book}:{verse_number}".strip()
            topics = [
                topic
                for topic in (concept, primary_theme, secondary_theme)
                if topic
            ]

            content_parts = [
                f"Scripture: {scripture}",
                f"Reference: {reference}",
            ]
            if context_type:
                content_parts.append(f"Context: {context_type}")
            if topics:
                content_parts.append(f"Concepts and themes: {', '.join(topics)}")
            content_parts.extend(("", f"Verse: {verse_text}"))

            documents.append(
                Document(
                    page_content="\n".join(content_parts),
                    metadata={
                        "id": verse_id,
                        "title": reference,
                        "tradition": SCRAPED_TRADITION,
                        "source": scripture,
                        "verse": verse_text,
                        "category": primary_theme or concept or context_type,
                        "context_type": context_type,
                        "concept": concept,
                        "primary_theme": primary_theme,
                        "secondary_theme": secondary_theme,
                    },
                )
            )

    if not documents:
        raise ValueError(f"No scripture verses found in {csv_path}.")
    return documents


def load_curated_documents() -> list[Document]:
    documents = []
    for scripture in SCRIPTURES:
        text = f"{scripture['verse']}\n\nInsight: {scripture['keyInsight']}"
        documents.append(
            Document(
                page_content=text,
                metadata={
                    "id": scripture["id"],
                    "title": scripture["title"],
                    "tradition": scripture["tradition"],
                    "source": scripture["source"],
                    "category": scripture["category"],
                },
            )
        )
    return documents


def ingest():
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY is not set in the server .env file.")

    curated_documents = load_curated_documents()
    scraped_documents = load_scraped_documents()
    documents = curated_documents + scraped_documents
    ids = [
        *(f"curated-{document.metadata['id']}" for document in curated_documents),
        *(f"scraped-{document.metadata['id']}" for document in scraped_documents),
    ]
    print(f"Starting ingestion of {len(documents)} scripture passages into Pinecone...")

    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Create index if it doesn't exist
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX not in existing_indexes:
        print(f"Creating Pinecone index '{PINECONE_INDEX}'...")
        pc.create_index(
            name=PINECONE_INDEX,
            dimension=AI_CONFIG["embedding_dimension"],
            metric=AI_CONFIG["pinecone_metric"],
            spec=ServerlessSpec(
                cloud=AI_CONFIG["pinecone_cloud"],
                region=AI_CONFIG["pinecone_region"],
            ),
        )
        print(f"Index '{PINECONE_INDEX}' created")
    else:
        print(f"Index '{PINECONE_INDEX}' already exists")

    # Initialize embeddings
    print("Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(model_name=AI_CONFIG["embedding_model"])

    print(f"Embedding and uploading {len(documents)} documents...")
    vector_store = PineconeVectorStore(
        index=pc.Index(PINECONE_INDEX),
        embedding=embeddings,
        text_key="text",
    )
    vector_store.add_documents(documents=documents, ids=ids)

    print(f"Successfully ingested {len(documents)} scripture passages into Pinecone!")
    print("You can now use the RAG pipeline for scripture search and chat.")


if __name__ == "__main__":
    ingest()
