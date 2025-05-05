import { z } from "zod";
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import fs from "fs";
import { RetryWithFallbacks } from "langchain/chains";

const sceneSchema = z.object({ scene_id:z.string(), location:z.string(),
  characters:z.array(z.string()), summary:z.string() });
const parser  = new StructuredOutputParser(sceneSchema);

const tmpl = new PromptTemplate({
   template: fs.readFileSync("prompts/scene_v1.txt","utf8"),
   inputVariables:["script"]
});

const model  = new ChatOpenAI({ modelName:"gpt-4o-mini", temperature:0 });
export const sceneChain = tmpl | model | parser; 

const fixer = new PromptTemplate({
     template: fs.readFileSync("prompts/fix_json.txt","utf8"),
     inputVariables:["bad_json"]
}) | model | parser;

export async function callLLM(script: string) {
  return await RetryWithFallbacks({
     originalChain: sceneChain,
     fallbackChains: [fixer, fixer],
     maxOriginalAttempts: 1
  }).invoke({ script });
} 