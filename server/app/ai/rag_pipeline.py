import os

from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pinecone import Pinecone

from app.config import RUNTIME_CONFIG
from app.ai.remote_embeddings import RenderEmbeddingService

AI_CONFIG = RUNTIME_CONFIG["ai"]
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", AI_CONFIG["groq_model"])
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", AI_CONFIG["pinecone_index"])

# Lazy globals
_embeddings = None
_vector_store = None
_llm = None
_local_embeddings = None


def validate_runtime_config():
    missing = []
    if not GROQ_API_KEY:
        missing.append("GROQ_API_KEY")
    if not PINECONE_API_KEY:
        missing.append("PINECONE_API_KEY")
    if not PINECONE_INDEX:
        missing.append("PINECONE_INDEX")
    return missing


def get_embeddings():
    global _embeddings  
    if _embeddings is None:
        provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
        if provider == "local":
            _embeddings = get_local_embeddings()
        elif provider == "render":
            service_url = os.getenv("EMBEDDING_SERVICE_URL")
            token = os.getenv("EMBEDDING_SERVICE_TOKEN")
            if not service_url or not token:
                raise ValueError(
                    "Render embeddings require EMBEDDING_SERVICE_URL and "
                    "EMBEDDING_SERVICE_TOKEN."
                )
            _embeddings = RenderEmbeddingService(
                service_url=service_url,
                token=token,
                expected_dimension=AI_CONFIG["embedding_dimension"],
            )
        else:
            raise ValueError(
                "EMBEDDING_PROVIDER must be 'local' or 'render'."
            )
    return _embeddings


def get_local_embeddings():
    global _local_embeddings
    if _local_embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings

        _local_embeddings = HuggingFaceEmbeddings(
            model_name=AI_CONFIG["embedding_model"]
        )
    return _local_embeddings


def get_vector_store():
    global _vector_store
    missing = validate_runtime_config()
    if "PINECONE_API_KEY" in missing or "PINECONE_INDEX" in missing:
        raise ValueError(
            "Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX in the server .env file."
        )
    if _vector_store is None:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        _vector_store = PineconeVectorStore(
            index=pc.Index(PINECONE_INDEX),
            embedding=get_embeddings(),
            text_key="text",
        )
    return _vector_store


def get_llm():
    global _llm
    if not GROQ_API_KEY:
        raise ValueError("Groq is not configured. Set GROQ_API_KEY in the server .env file.")
    if _llm is None:
        _llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL,
            temperature=AI_CONFIG["temperature"],
            max_tokens=AI_CONFIG["max_tokens"],
        )
    return _llm

prompt = PromptTemplate(
    template=AI_CONFIG["prompt_template"],
    input_variables=["context", "question"],
)


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def ask_wisdom(question: str, tradition: str = None):
    retriever = get_vector_store().as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": AI_CONFIG["chat_retrieval_k"],
            **({"filter": {"tradition": tradition}} if tradition else {})
        },
    )
    docs = retriever.invoke(question)
    answer_chain = prompt | get_llm() | StrOutputParser()
    answer = answer_chain.invoke(
        {"context": format_docs(docs), "question": question}
    )
    preview_length = AI_CONFIG["source_preview_characters"]
    sources = [
        {
            "title": doc.metadata.get("title", "Unknown"),
            "tradition": doc.metadata.get("tradition", "Unknown"),
            "source": doc.metadata.get("source", ""),
            "text": doc.page_content[:preview_length] + "...",
        }
        for doc in docs
    ]

    return {"answer": answer, "sources": sources}


def search_scriptures(
    query: str, tradition: str = None, k: int = AI_CONFIG["search_results_k"]
):
    filter_dict = {"tradition": tradition} if tradition else None
    docs = get_vector_store().similarity_search(query, k=k, filter=filter_dict)
    return [{
        "id": doc.metadata.get("id", ""),
        "title": doc.metadata.get("title", ""),
        "tradition": doc.metadata.get("tradition", ""),
        "source": doc.metadata.get("source", ""),
        "category": doc.metadata.get("category", ""),
        "verse": doc.metadata.get("verse", doc.page_content),
    } for doc in docs]