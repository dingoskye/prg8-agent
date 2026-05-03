import {AzureOpenAIEmbeddings} from "@langchain/openai";
import {FaissStore} from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({ temperature: 0.2 });
const vectorStore = await FaissStore.load("./documents", embeddings);
console.log("✅ vector store loaded!")

// zoek relevante documenten
const result = await vectorStore.similaritySearch("Wat zijn de huisregels van de ns", 1);
console.log(result);