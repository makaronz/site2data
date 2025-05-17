// import { OpenAIEmbeddings } from "langchain/embeddings/openai";
// import { WeaviateVectorStore } from "langchain/vectorstores/weaviate";

// Tymczasowo zastąpienie typów z langchain
class MockOpenAIEmbeddings {}
class MockWeaviateVectorStore {
  constructor() {}
  async addDocuments() {}
}

export async function addChunksToWeaviate(chunks: string[]) {
  console.log("Tymczasowo wyłączone ze względu na brakujące zależności langchain");
  // Kod wyłączony do czasu dodania zależności
  // const weaviate = new WeaviateVectorStore({
  //   url: "http://weaviate:8080", indexName: "Scene",
  //   embeddings: new OpenAIEmbeddings()
  // });
  // await weaviate.addDocuments(chunks.map((t, i) => ({ id: `S${i+1}`, text: t })));
} 