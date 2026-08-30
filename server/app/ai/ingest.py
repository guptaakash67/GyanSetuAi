"""
Run this once to embed all scripture data into Pinecone.

Usage:
    python ingest.py

This reads from scriptures.json and pushes embeddings to Pinecone.
"""

import os

import json
from dotenv import load_dotenv
from langchain_pinecone import PineconeVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "tatva")

# ── Scripture data ────────────────────────────────────────────────────────────
# Each entry: { id, title, tradition, source, category, verse, keyInsight }
SCRIPTURES = [
    # ── Hindu ────────────────────────────────────────────────────────────────
    {
        "id": "bg-2-47",
        "title": "Bhagavad Gita 2.47",
        "tradition": "hindu",
        "source": "Bhagavad Gita",
        "category": "Duty & Action",
        "verse": "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
        "keyInsight": "Focus on your actions, not their outcomes. Perform your duty without attachment to results.",
    },
    {
        "id": "bg-6-5",
        "title": "Bhagavad Gita 6.5",
        "tradition": "hindu",
        "source": "Bhagavad Gita",
        "category": "Self-Mastery",
        "verse": "Let a man lift himself by his own self; let him not lower himself; for he himself is his friend, and he himself is his enemy.",
        "keyInsight": "You are both your greatest ally and your worst enemy. Self-discipline is the path to self-mastery.",
    },
    {
        "id": "upanishads-1",
        "title": "Mandukya Upanishad 2",
        "tradition": "hindu",
        "source": "Upanishads",
        "category": "Self-Knowledge",
        "verse": "All this is Brahman. This Atman is Brahman. This same Atman has four quarters.",
        "keyInsight": "The individual self (Atman) is identical with the universal consciousness (Brahman).",
    },
    {
        "id": "ramayana-1",
        "title": "Ramayana — Dharma",
        "tradition": "hindu",
        "source": "Ramayana",
        "category": "Righteousness",
        "verse": "One should never do that to another which one regards as injurious to one's own self. This, in brief, is the rule of righteousness.",
        "keyInsight": "The golden rule of dharma — treat others as you wish to be treated.",
    },
    # ── Buddhism ─────────────────────────────────────────────────────────────
    {
        "id": "dhammapada-1",
        "title": "Dhammapada 1",
        "tradition": "buddhism",
        "source": "Dhammapada",
        "category": "Mind",
        "verse": "Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows, as the wheel follows the hoof of an ox.",
        "keyInsight": "Your thoughts shape your reality. Guard the mind carefully.",
    },
    {
        "id": "dhammapada-183",
        "title": "Dhammapada 183",
        "tradition": "buddhism",
        "source": "Dhammapada",
        "category": "Enlightenment",
        "verse": "Not to do any evil, to cultivate good, to purify one's mind — this is the teaching of the Buddhas.",
        "keyInsight": "The entire Buddhist path in one verse: avoid harm, do good, purify the mind.",
    },
    {
        "id": "heart-sutra-1",
        "title": "Heart Sutra",
        "tradition": "buddhism",
        "source": "Heart Sutra",
        "category": "Emptiness",
        "verse": "Form is emptiness, emptiness is form. Emptiness is not different from form, form is not different from emptiness.",
        "keyInsight": "All phenomena are empty of inherent existence — this insight liberates us from suffering.",
    },
    # ── Taoism ───────────────────────────────────────────────────────────────
    {
        "id": "tao-1",
        "title": "Tao Te Ching Chapter 1",
        "tradition": "taoism",
        "source": "Tao Te Ching",
        "category": "The Way",
        "verse": "The Tao that can be told is not the eternal Tao. The name that can be named is not the eternal name. The nameless is the beginning of heaven and earth.",
        "keyInsight": "The ultimate truth transcends words and concepts.",
    },
    {
        "id": "tao-8",
        "title": "Tao Te Ching Chapter 8",
        "tradition": "taoism",
        "source": "Tao Te Ching",
        "category": "Harmony",
        "verse": "The highest good is like water. Water gives life to the ten thousand things and does not strive. It flows in places men reject and so is like the Tao.",
        "keyInsight": "Be like water — nourish without forcing, serve without seeking recognition.",
    },
    # ── Christian ────────────────────────────────────────────────────────────
    {
        "id": "matthew-5-3",
        "title": "Matthew 5:3-5",
        "tradition": "christian",
        "source": "Gospel of Matthew",
        "category": "Beatitudes",
        "verse": "Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they will be comforted. Blessed are the meek, for they will inherit the earth.",
        "keyInsight": "Humility, grief, and gentleness are not weaknesses — they are paths to divine grace.",
    },
    {
        "id": "psalms-23",
        "title": "Psalm 23",
        "tradition": "christian",
        "source": "Psalms",
        "category": "Trust",
        "verse": "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
        "keyInsight": "Divine guidance brings rest, restoration, and provision even in the darkest valleys.",
    },
    # ── Islamic ──────────────────────────────────────────────────────────────
    {
        "id": "quran-2-286",
        "title": "Quran 2:286",
        "tradition": "islamic",
        "source": "Al-Baqarah",
        "category": "Burden & Ease",
        "verse": "Allah does not burden a soul beyond that it can bear. It will have the reward of that which it has earned, and it will bear the punishment of that which it has earned.",
        "keyInsight": "You are never given more than you can handle. Every trial is within your capacity.",
    },
    {
        "id": "quran-94-5",
        "title": "Quran 94:5-6",
        "tradition": "islamic",
        "source": "Al-Inshirah",
        "category": "Hope",
        "verse": "For indeed, with hardship will be ease. Indeed, with hardship will be ease.",
        "keyInsight": "Relief always accompanies difficulty — ease is promised twice for every hardship.",
    },
]


def ingest():
    print(f" Starting ingestion of {len(SCRIPTURES)} scriptures into Pinecone...")

    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Create index if it doesn't exist
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX not in existing_indexes:
        print(f"Creating Pinecone index '{PINECONE_INDEX}'...")
        pc.create_index(
            name=PINECONE_INDEX,
            dimension=384,  # all-MiniLM-L6-v2 dimension
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        print(f"✅ Index '{PINECONE_INDEX}' created")
    else:
        print(f"✅ Index '{PINECONE_INDEX}' already exists")

    # Initialize embeddings
    print("Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Convert scriptures to LangChain Documents
    documents = []
    for s in SCRIPTURES:
        # Combine verse + keyInsight for richer embeddings
        text = f"{s['verse']}\n\nInsight: {s['keyInsight']}"
        doc = Document(
            page_content=text,
            metadata={
                "id": s["id"],
                "title": s["title"],
                "tradition": s["tradition"],
                "source": s["source"],
                "category": s["category"],
            }
        )
        documents.append(doc)

    # Push to Pinecone
    print(f"Embedding and uploading {len(documents)} documents...")
    PineconeVectorStore.from_documents(
        documents=documents,
        embedding=embeddings,
        index_name=PINECONE_INDEX,
        pinecone_api_key=PINECONE_API_KEY,
    )

    print(f"✅ Successfully ingested {len(documents)} scriptures into Pinecone!")
    print("You can now use the RAG pipeline for scripture search and chat.")


if __name__ == "__main__":
    ingest()