import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

// Use require for pdf-parse to ensure compatibility in Next.js server environment
// Point directly to the lib file to avoid the 'index.js' debug code that tries to read a test file
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

function createYouTubePrompt(combinedText, persona = 'a curious learner', jobTask = 'learn more about this topic') {
  return `
You are an expert educational curator. Your task is to analyze the provided document content and recommend 5 specific YouTube video topics or search queries that would be most helpful for the user.

**User Context:**
*   **Persona:** ${persona}
*   **Goal:** ${jobTask}

**Instructions:**
1.  Analyze the content to identify key concepts, difficult topics, or practical skills that would benefit from visual explanation.
2.  Suggest 5 distinct YouTube video ideas/search queries.
3.  For each recommendation, provide:
    *   **Title:** A catchy, relevant title for the video topic.
    *   **Search Query:** The exact search query to use on YouTube.
    *   **Reason:** A brief explanation of why this video would be helpful.

**Format your response as a JSON array of objects** with keys: "title", "searchQuery", "reason". Do not include markdown formatting like \`\`\`json. Just the raw JSON array.

**Source Content:**
${combinedText.substring(0, 50000)} // Limit context to avoid token limits if text is huge, though Gemini 1.5 is good.
`;
}

export async function POST(req) {
  console.log("API: generate-youtube-recommendations called");
  try {
    const body = await req.json();
    const { persona, jobTask } = body;
    console.log("API: Parsed body", { persona, jobTask });

    const pdfsDirectory = path.join(process.cwd(), 'public', 'pdfs');
    console.log("API: PDF Directory", pdfsDirectory);
    
    // Note: In a real app, we should filter these by the current collection.
    // For now, we follow the pattern of reading available PDFs.
    let files = [];
    try {
        files = await fs.readdir(pdfsDirectory);
        console.log("API: Files found", files);
    } catch (e) {
        console.warn("API: Directory might not exist", e.message);
        // Directory might not exist if no files uploaded yet
        return new Response(JSON.stringify({ recommendations: [] }), { status: 200 });
    }
    
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log("API: No PDF files found");
      return new Response(JSON.stringify({ recommendations: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let combinedText = '';
    // Limit to first 3 PDFs to save time/resources for this demo
    for (const file of pdfFiles.slice(0, 3)) {
      const filePath = path.join(pdfsDirectory, file);
      console.log(`API: Processing file ${file}`);
      const dataBuffer = await fs.readFile(filePath);
      try {
          const data = await pdfParse(dataBuffer);
          combinedText += `\n--- Document: ${file} ---\n${data.text.substring(0, 10000)}`;
          console.log(`API: Extracted ${data.text.length} chars from ${file}`);
      } catch (e) {
          console.error(`Failed to parse PDF ${file}:`, e);
      }
    }

    if (!combinedText) {
        console.warn("API: No text extracted from PDFs");
    }

    console.log("API: Initializing Gemini");
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = createYouTubePrompt(combinedText, persona, jobTask);
    
    console.log("API: Sending prompt to Gemini");
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    console.log("API: Received response from Gemini");
    
    // Clean up markdown if present
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let recommendations = [];
    try {
        recommendations = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", responseText);
        // Fallback or empty
    }

    return new Response(JSON.stringify({ recommendations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-youtube-recommendations API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate recommendations.', details: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
