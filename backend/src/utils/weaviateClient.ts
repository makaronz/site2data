import weaviate, { WeaviateClient } from 'weaviate-ts-client';

const WEAVIATE_URL = process.env.WEAVIATE_URL || 'http://localhost:8080';
const WEAVIATE_CLASS_NAME = 'ScriptAnalysis';

let client: WeaviateClient | null = null;

export function getWeaviateClient(): WeaviateClient {
  if (!client) {
    client = weaviate.client({
      scheme: WEAVIATE_URL.startsWith('https') ? 'https' : 'http',
      host: WEAVIATE_URL.replace(/^https?:\/\//, ''),
    });
  }
  return client;
}

export async function saveAnalysisToWeaviate(scriptId: string, analysis: any) {
  const client = getWeaviateClient();
  await client.data.creator()
    .withClassName(WEAVIATE_CLASS_NAME)
    .withId(scriptId)
    .withProperties({
      scriptId,
      data: analysis
    })
    .do();
}

export async function getAnalysisFromWeaviate(scriptId: string) {
  const client = getWeaviateClient();
  const res = await client.graphql.get()
    .withClassName(WEAVIATE_CLASS_NAME)
    .withWhere({
      path: ['scriptId'],
      operator: 'Equal',
      valueString: scriptId
    })
    .withFields('data scriptId')
    .withLimit(1)
    .do();
  const objects = res?.data?.Get?.[WEAVIATE_CLASS_NAME];
  if (objects && objects.length > 0) {
    return objects[0].data || null;
  }
  return null;
} 