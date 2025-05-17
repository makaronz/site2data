// import { z } from "zod";
// import { PromptTemplate } from "langchain/prompts";
// import { ChatOpenAI } from "langchain/chat_models/openai";
// import { StructuredOutputParser } from "langchain/output_parsers";
import fs from "fs";
// import { RetryWithFallbacks } from "langchain/chains";

// Tymczasowo zakomentowane do czasu dodania zależności
// const sceneSchema = z.object({ scene_id:z.string(), location:z.string(),
//   characters:z.array(z.string()), summary:z.string() });
// const parser  = new StructuredOutputParser(sceneSchema);

// const tmpl = new PromptTemplate({
//    template: fs.readFileSync("prompts/scene_v1.txt","utf8"),
//    inputVariables:["script"]
// });

// const model  = new ChatOpenAI({ modelName:"gpt-4o-mini", temperature:0 });
// export const sceneChain = tmpl | model | parser; 

// const fixer = new PromptTemplate({
//      template: fs.readFileSync("prompts/fix_json.txt","utf8"),
//      inputVariables:["bad_json"]
// }) | model | parser;

// Tymczasowa funkcja zastępcza
export async function callLLM(script: string) {
  console.log("Tymczasowo wyłączone ze względu na brakujące zależności langchain i zod");
  // Zwracamy mocka wyniku
  return {
    scene_id: "mock-scene-1",
    location: "Example Location",
    characters: ["Character 1", "Character 2"],
    summary: "This is a mock summary for testing purposes."
  };
}

// Tymczasowy export
export const sceneChain = { invoke: callLLM }; 