// Load env variables
import dotenv from 'dotenv';
dotenv.config();


import { OpenAI } from "langchain/llms/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { TokenTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RetrievalQAChain } from "langchain/chains";
import path from 'path';

// Replace with your own key
const OPENAI_API_KEY = process.env.OPEN_AI_KEY;

// USE OPEN AI MODEL
const model = new OpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0.1
});


(async () => {

    // Step 1: Document loader, for now we are trying to load pdf document
    // Although we can load, public, private, structured or even unstructured data in langchain
    const filePath = path.resolve(__dirname, '../documents/witcher_game.pdf');
    const loader = new PDFLoader(filePath);
    const docs = await loader.load(); // By default, the PDFLoader will create one document for each page in the PDF file

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
    const splitter = new TokenTextSplitter({
        chunkSize: 100,
        chunkOverlap: 30
    });
    const output = await splitter.splitDocuments(docs);
    //console.log(output);

    // Step 3: Store these documents in vector storage in the form of embeddings for indexing
    // Create a vector store instance
    // Load the docs into the vector store
    const vectorStore = await MemoryVectorStore.fromDocuments(
        output,
        new OpenAIEmbeddings()
    );

    // Search the vector store with a query, to return documents from database
    //const question = "What is the overall supervisor feedback?";
    //const topDocuments = await vectorStore.similaritySearch(question, 2);
    // console.log(searchResults);


    // Step 4: Call the GPT model to respond from our pulled out data
    // Create a RetrievalQuestionAnsweringChain instance, passing the LLM model as the llm parameter
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
    const res = await chain.call({ query: "What are the name of game characters?" });
    console.log(res.text);
})();
