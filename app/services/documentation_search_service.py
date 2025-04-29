"""Documentation search service using sentence embeddings and FAISS."""

import logging
import os
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from pathlib import Path
import re
import json

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Will be initialized when the model is loaded
model = None
index = None
docs = None


class DocumentationSearchService:
    """Service for searching documentation using semantic search."""

    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db
        self._ensure_model_loaded()

    def _ensure_model_loaded(self):
        """Ensure the embedding model and index are loaded."""
        global model, index, docs
        if model is None:
            try:
                from sentence_transformers import SentenceTransformer
                import faiss

                logger.info("Loading sentence transformer model...")
                model = SentenceTransformer("all-MiniLM-L6-v2")
                
                # Load documentation chunks
                docs = self._load_documentation()
                
                if not docs:
                    logger.warning("No documentation chunks found.")
                    return
                
                # Create embeddings for all documentation chunks
                logger.info(f"Creating embeddings for {len(docs)} documentation chunks...")
                doc_embeddings = model.encode([chunk["text"] for chunk in docs])
                
                # Build FAISS index
                logger.info("Building FAISS index...")
                dimension = doc_embeddings.shape[1]
                index = faiss.IndexFlatL2(dimension)
                index.add(np.array(doc_embeddings).astype('float32'))
                
                logger.info("Documentation search service initialized successfully.")
            except Exception as e:
                logger.error(f"Error initializing documentation search service: {str(e)}")
                model = None
                index = None
                docs = None

    def _load_documentation(self) -> List[Dict[str, Any]]:
        """Load documentation from markdown files."""
        try:
            # Define paths to documentation files
            docs_paths = [
                Path("docs"),  # Root docs folder
                Path("frontend/public/docs"),  # Frontend public docs
            ]
            
            chunks = []
            
            for docs_path in docs_paths:
                if not docs_path.exists():
                    logger.warning(f"Documentation path does not exist: {docs_path}")
                    continue
                
                logger.info(f"Loading documentation from {docs_path}")
                
                # Process all markdown files
                for file_path in docs_path.glob("**/*.md"):
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        
                        # Split content into chunks (paragraphs)
                        file_chunks = self._chunk_markdown(content)
                        
                        # Add metadata to each chunk
                        for i, chunk in enumerate(file_chunks):
                            chunks.append({
                                "text": chunk,
                                "source": str(file_path.relative_to(docs_path)),
                                "chunk_id": i,
                            })
                    except Exception as e:
                        logger.error(f"Error processing documentation file {file_path}: {str(e)}")
            
            logger.info(f"Loaded {len(chunks)} documentation chunks.")
            return chunks
        except Exception as e:
            logger.error(f"Error loading documentation: {str(e)}")
            return []

    def _chunk_markdown(self, content: str) -> List[str]:
        """Split markdown content into chunks for embedding."""
        # Split by headers or double newlines
        chunks = re.split(r'(#{1,6}\s+[^\n]+\n|(?:\n\s*){2,})', content)
        
        # Recombine headers with their content
        processed_chunks = []
        current_chunk = ""
        
        for chunk in chunks:
            if chunk.strip():
                # If it's a header, start a new chunk
                if re.match(r'^#{1,6}\s+', chunk):
                    if current_chunk:
                        processed_chunks.append(current_chunk.strip())
                    current_chunk = chunk
                else:
                    current_chunk += chunk
        
        # Add the last chunk
        if current_chunk:
            processed_chunks.append(current_chunk.strip())
        
        # Filter out very short chunks
        return [chunk for chunk in processed_chunks if len(chunk) > 20]

    def search_documentation(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Search documentation using semantic search.
        
        Args:
            query: The search query
            k: Number of results to return
            
        Returns:
            List of matching documentation chunks with metadata
        """
        if not query or not query.strip():
            return []
        
        if model is None or index is None or docs is None:
            logger.warning("Documentation search service not initialized.")
            return []
        
        try:
            # Encode the query
            query_embedding = model.encode([query])
            
            # Search the index
            D, I = index.search(np.array(query_embedding).astype('float32'), k=k)
            
            # Get the results
            results = []
            for i in I[0]:
                if i < len(docs):
                    results.append(docs[i])
            
            return results
        except Exception as e:
            logger.error(f"Error searching documentation: {str(e)}")
            return []
