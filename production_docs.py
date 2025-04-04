import os
import json
from typing import List, Dict, Any
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
from dotenv import load_dotenv

load_dotenv()

class ProductionDocsManager:
    def __init__(self, docs_dir: str = "production_docs"):
        self.docs_dir = docs_dir
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = None
        os.makedirs(docs_dir, exist_ok=True)
        
    def load_documents(self) -> List[Dict[str, Any]]:
        """Load and process production documents."""
        try:
            loader = DirectoryLoader(
                self.docs_dir,
                glob="**/*.txt",
                loader_cls=TextLoader
            )
            documents = loader.load()
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            
            texts = text_splitter.split_documents(documents)
            return texts
        except Exception as e:
            print(f"Error loading documents: {e}")
            return []

    def create_vector_store(self):
        """Create or update the vector store with documents."""
        try:
            texts = self.load_documents()
            if texts:
                self.vector_store = FAISS.from_documents(texts, self.embeddings)
                return True
            return False
        except Exception as e:
            print(f"Error creating vector store: {e}")
            return False

    def query_docs(self, query: str) -> Dict[str, Any]:
        """Query the production documentation."""
        try:
            if not self.vector_store:
                if not self.create_vector_store():
                    return {"error": "No documents available"}
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=OpenAI(),
                chain_type="stuff",
                retriever=self.vector_store.as_retriever()
            )
            
            result = qa_chain.run(query)
            return {"answer": result}
        except Exception as e:
            print(f"Error querying documents: {e}")
            return {"error": str(e)}

    def add_document(self, content: str, doc_type: str, metadata: Dict[str, Any] = None):
        """Add a new production document."""
        try:
            doc_id = f"{doc_type}_{len(os.listdir(self.docs_dir)) + 1}"
            doc_path = os.path.join(self.docs_dir, f"{doc_id}.txt")
            
            doc_data = {
                "content": content,
                "metadata": metadata or {},
                "type": doc_type
            }
            
            with open(doc_path, 'w', encoding='utf-8') as f:
                json.dump(doc_data, f, indent=2, ensure_ascii=False)
            
            # Update vector store
            self.create_vector_store()
            return {"success": True, "doc_id": doc_id}
        except Exception as e:
            print(f"Error adding document: {e}")
            return {"error": str(e)}

    def link_media_to_docs(self, media_path: str, doc_ids: List[str]):
        """Link media files to production documents."""
        try:
            links_path = os.path.join(self.docs_dir, "media_links.json")
            
            # Load existing links
            if os.path.exists(links_path):
                with open(links_path, 'r') as f:
                    links = json.load(f)
            else:
                links = {}
            
            # Add new links
            links[media_path] = doc_ids
            
            # Save updated links
            with open(links_path, 'w') as f:
                json.dump(links, f, indent=2)
            
            return {"success": True}
        except Exception as e:
            print(f"Error linking media to docs: {e}")
            return {"error": str(e)}

    def get_media_docs(self, media_path: str) -> List[Dict[str, Any]]:
        """Get production documents linked to a media file."""
        try:
            links_path = os.path.join(self.docs_dir, "media_links.json")
            if not os.path.exists(links_path):
                return []
            
            with open(links_path, 'r') as f:
                links = json.load(f)
            
            if media_path not in links:
                return []
            
            docs = []
            for doc_id in links[media_path]:
                doc_path = os.path.join(self.docs_dir, f"{doc_id}.txt")
                if os.path.exists(doc_path):
                    with open(doc_path, 'r', encoding='utf-8') as f:
                        docs.append(json.load(f))
            
            return docs
        except Exception as e:
            print(f"Error getting media docs: {e}")
            return [] 