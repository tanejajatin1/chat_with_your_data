"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load env variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai_1 = require("langchain/llms/openai");
const pdf_1 = require("langchain/document_loaders/fs/pdf");
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
const text_splitter_1 = require("langchain/text_splitter");
const memory_1 = require("langchain/vectorstores/memory");
const openai_2 = require("langchain/embeddings/openai");
const chains_1 = require("langchain/chains");
const path_1 = __importDefault(require("path"));
// Replace with your own key
const OPENAI_API_KEY = process.env.OPEN_AI_KEY;
// USE OPEN AI MODEL
const model = new openai_1.OpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0.1
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1: Document loader, for now we are trying to load pdf document
    // Although we can load, public, private, structured or even unstructured data in langchain
    const filePath = path_1.default.resolve(__dirname, '../documents/witcher_game.pdf');
    const loader = new pdf_1.PDFLoader(filePath);
    const docs = yield loader.load(); // By default, the PDFLoader will create one document for each page in the PDF file
    // Remove "\n" characters from page content
    docs.forEach((doc) => {
        doc.pageContent = doc.pageContent.replace(/\n/g, " ");
    });
    // const loader = new PDFLoader("path/to/your/pdf/file.pdf", {
    //     splitPages: false,
    // });
    // Step 2: Split document into meaningful chunks: 
    // Character based
    // const splitter = new RecursiveCharacterTextSplitter({
    //     chunkSize: 250,
    //     chunkOverlap: 50
    // });
    // const output = await splitter.splitDocuments(docs);
    // console.log(output);
    // Token based
    const splitter = new text_splitter_1.TokenTextSplitter({
        chunkSize: 100,
        chunkOverlap: 30
    });
    const output = yield splitter.splitDocuments(docs);
    //console.log(output);
    // Step 3: Store these documents in vector storage in the form of embeddings for indexing
    // Create a vector store instance
    // Load the docs into the vector store
    const vectorStore = yield memory_1.MemoryVectorStore.fromDocuments(output, new openai_2.OpenAIEmbeddings());
    // Search the vector store with a query, to return documents from database
    //const question = "What is the overall supervisor feedback?";
    //const topDocuments = await vectorStore.similaritySearch(question, 2);
    // console.log(searchResults);
    // Step 4: Call the GPT model to respond from our pulled out data
    // Create a RetrievalQuestionAnsweringChain instance, passing the LLM model as the llm parameter
    const chain = chains_1.RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
    const res = yield chain.call({ query: "What are the name of game characters?" });
    console.log(res.text);
}))();
