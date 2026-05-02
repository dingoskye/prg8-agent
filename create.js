import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { AzureOpenAIEmbeddings, AzureChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent } from "langchain";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME
});

const model = new AzureChatOpenAI({ temperature: 0.2 });
const agent = createAgent({model, system: "Je bent een ns reisplanner" });



// laad tekstbestand
const loader = new TextLoader("./public/huisregelsNS.txt")
const docs = await loader.load()

// opsplitsen
const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000, chunkOverlap: 200 });
const chunks = await textSplitter.splitDocuments(docs);

// // tijdelijke vector store
const vectorStore = new FaissStore(embeddings, {});
await vectorStore.addDocuments(chunks);
console.log("✅ vector store created!")

// relevante tekst zoeken
const prompt = "Wat zijn de huisregels van de ns?"
const relevantDocs = await vectorStore.similaritySearch(prompt);
const context = relevantDocs.map(doc => doc.pageContent).join("\n\n")

// agent aanroepen
const result = await agent.invoke({
    messages: [{ role: "user", content: `Geef met deze tekst ${context} een antwoord op deze vraag ${prompt}` }],
});

// vector store
await vectorStore.save("./documents");   // directory name
console.log("✅ vector store saved!")

// log
// console.log(`Er zijn ${chunks.length} chunks. De eerste chunk is:`);
// console.log(chunks[0]);
// console.log(`Found ${relevantDocs.length} relevant documents`)
// console.log(context)
console.log(result.messages.at(-1).content)