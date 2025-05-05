import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { WeaviateVectorStore } from "langchain/vectorstores/weaviate";

export async function addChunksToWeaviate(chunks: string[]) {
  const weaviate = new WeaviateVectorStore({
    url: "http://weaviate:8080", indexName: "Scene",
    embeddings: new OpenAIEmbeddings()
  });
  await weaviate.addDocuments(chunks.map((t, i) => ({ id: `S${i+1}`, text: t })));
} 