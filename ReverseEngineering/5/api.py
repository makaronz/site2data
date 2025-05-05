from fastapi import FastAPI, Query
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.vectorstores import Weaviate
from langchain.embeddings import OpenAIEmbeddings

app = FastAPI()
vec = Weaviate("http://weaviate:8080", "Scene", OpenAIEmbeddings())
qa  = RetrievalQA.from_chain_type(llm=ChatOpenAI(), retriever=vec.as_retriever())

@app.get("/search")
def search(q: str = Query(...)):
    return qa.run(q) 