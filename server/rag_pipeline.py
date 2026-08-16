import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from pinecone import Pinecone

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "tatva")

# Lazy globals
_embeddings = None
_vector_store = None
_llm = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embeddings

def get_vector_store():
    global _vector_store
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
    if _llm is None:
        _llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model_name="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024,
        )
    return _llm

PROMPT_TEMPLATE = """You are a wise and compassionate spiritual guide for GyanSetu.
Use the following scripture passages to answer the question.
Be thoughtful, empathetic, and grounded in the actual scripture context.

Scripture Context:
{context}

Seeker's Question: {question}

Spiritual Guidance:"""

prompt = PromptTemplate(
    template=PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)

def format_docs(docs):
    return "\n\n".join([d.page_content for d in docs])

def ask_wisdom(question: str, tradition: str = None):
    retriever = get_vector_store().as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 4,
            **({"filter": {"tradition": tradition}} if tradition else {})
        }
    )

    # New LCEL chain (replaces RetrievalQA)
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | get_llm()
        | StrOutputParser()
    )

    answer = chain.invoke(question)

    # Get source documents separately
    docs = retriever.invoke(question)
    sources = [{
        "title": doc.metadata.get("title", "Unknown"),
        "tradition": doc.metadata.get("tradition", "Unknown"),
        "source": doc.metadata.get("source", ""),
        "text": doc.page_content[:200] + "...",
    } for doc in docs]

    return {"answer": answer, "sources": sources}


def search_scriptures(query: str, tradition: str = None, k: int = 6):
    filter_dict = {"tradition": tradition} if tradition else None
    docs = get_vector_store().similarity_search(query, k=k, filter=filter_dict)
    return [{
        "id": doc.metadata.get("id", ""),
        "title": doc.metadata.get("title", ""),
        "tradition": doc.metadata.get("tradition", ""),
        "source": doc.metadata.get("source", ""),
        "category": doc.metadata.get("category", ""),
        "verse": doc.page_content,
    } for doc in docs]