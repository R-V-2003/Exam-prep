import { fallbackTests } from '../data/fallbackTests.js';
import { storage } from './storage.js';

export const gemini = {
  // Call Groq API completions endpoint
  async callGroqAPI(prompt, systemInstruction = '', jsonMode = false) {
    const apiKey = storage.getGroqApiKey();
    if (!apiKey) {
      throw new Error("Groq API Key is missing. Configure it in Settings.");
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: jsonMode ? 0.15 : 0.6
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Groq API Call Failed (Status ${response.status})`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || '';

    return {
      text: textContent,
      grounding: null
    };
  },

  // Call Gemini REST API directly
  async callGeminiAPI(prompt, systemInstruction = '', enableSearch = false) {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Configure a key in Settings.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (enableSearch) {
      payload.tools = [{ googleSearch: {} }];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API Call Failed (Status ${response.status})`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textContent = candidate?.content?.parts?.[0]?.text || '';
    const groundingMetadata = candidate?.groundingMetadata || null;

    return {
      text: textContent,
      grounding: groundingMetadata
    };
  },

  // Call Gemini REST API with JSON response enforcement
  async callGeminiAPIJson(prompt, systemInstruction = '') {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API Key is missing.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API Call Failed (Status ${response.status})`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    try {
      return JSON.parse(textContent);
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini", textContent);
      throw new Error("The AI returned a malformed response format. Please try again.");
    }
  },

  // Router for calling text APIs based on available keys
  async callAPI(prompt, systemInstruction = '', enableSearch = false) {
    // If search is explicitly requested and we have a Gemini key, route to Gemini for web grounding
    if (enableSearch && storage.hasApiKey()) {
      try {
        return await this.callGeminiAPI(prompt, systemInstruction, true);
      } catch (err) {
        console.warn("Gemini Search failed, falling back to Groq", err);
      }
    }

    // Prioritize Gemini since user explicitly provided key and requested generous limits model
    if (storage.hasApiKey()) {
      try {
        return await this.callGeminiAPI(prompt, systemInstruction, enableSearch);
      } catch (err) {
        console.warn("Gemini API failed, falling back to Groq", err);
      }
    }

    // Fallback to Groq
    if (storage.hasGroqApiKey()) {
      return this.callGroqAPI(prompt, systemInstruction, false);
    }

    throw new Error("No active AI API Key configured.");
  },

  // Router for calling JSON APIs based on available keys
  async callAPIJson(prompt, systemInstruction = '') {
    // Prioritize Gemini 2.5 Flash for JSON parsing as it is highly robust and generous
    if (storage.hasApiKey()) {
      try {
        return await this.callGeminiAPIJson(prompt, systemInstruction);
      } catch (err) {
        console.warn("Gemini JSON API failed, falling back to Groq", err);
      }
    }

    if (storage.hasGroqApiKey()) {
      const result = await this.callGroqAPI(prompt, systemInstruction, true);
      try {
        return JSON.parse(result.text);
      } catch (e) {
        console.error("Failed to parse JSON response from Groq", result.text);
        throw new Error("The AI returned a malformed JSON format. Please try again.");
      }
    }

    throw new Error("No active AI API Key configured.");
  },

  // Generates custom test dynamically
  async generateTest(examType, subjects, questionCount = 10, difficulty = 'Medium', customPrompt = '') {
    const hasKey = storage.hasGroqApiKey() || storage.hasApiKey();
    
    if (!hasKey) {
      return this.simulateTestGeneration(examType, subjects, questionCount);
    }

    const systemPrompt = `You are an elite exam question generator for the Rajasthan RSSB Computer Instructor (BCI) Exam.
Your goal is to generate questions that match the syllabus, structure, and difficulty.
Your output MUST be a valid JSON object matching this schema precisely:
{
  "questions": [
    {
      "subject": "Subject Name",
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of correct answer..."
    }
  ]
}
Do not enclose in markdown blocks. Return only the raw JSON.`;

    const userPrompt = `Generate a mock test of exactly ${questionCount} multiple choice questions (with 4 options) for the "${examType}" syllabus.
Subjects/Topics to include: ${subjects.join(', ')}.
Overall Difficulty: ${difficulty}.
${customPrompt ? `Additional Custom Instruction: ${customPrompt}` : ''}
Ensure the questions are challenging, technically accurate, and reflect Rajasthan Computer Instructor exam patterns. Provide a comprehensive explanation for each.`;

    try {
      const result = await this.callAPIJson(userPrompt, systemPrompt);
      if (result && Array.isArray(result.questions)) {
        return result.questions;
      }
      throw new Error("Invalid structure returned");
    } catch (err) {
      console.warn("Real API failed, falling back to simulated data", err);
      return this.simulateTestGeneration(examType, subjects, questionCount);
    }
  },

  // Daily current affairs updates & linked quiz
  async generateDailyCurrentsAndQuiz() {
    const hasKey = storage.hasGroqApiKey() || storage.hasApiKey();
    
    if (!hasKey) {
      return this.simulateDailyCurrentsAndQuiz();
    }

    const todayStr = new Date().toDateString();
    
    const cached = storage.getCachedCurrentAffairs();
    if (cached) {
      return cached;
    }

    // Custom Web Search Integration for Groq
    let newsContext = "";
    try {
      const rssUrl = 'https://news.google.com/rss/search?q=Rajasthan+current+affairs+India&hl=en-IN&gl=IN&ceid=IN:en';
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
      const newsRes = await fetch(proxyUrl);
      const newsData = await newsRes.json();
      
      if (newsData.contents) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(newsData.contents, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        
        newsContext = "LATEST LIVE NEWS HEADLINES (Use these to construct the briefing):\n";
        for (let i = 0; i < Math.min(items.length, 12); i++) {
          const title = items[i].querySelector("title")?.textContent || "";
          const pubDate = items[i].querySelector("pubDate")?.textContent || "";
          newsContext += `- ${title} (Published: ${pubDate})\n`;
        }
      }
    } catch (e) {
      console.warn("Custom search integration failed", e);
    }

    const searchPrompt = `${newsContext}\n\nSearch and list the top 5 key current affairs and national/international news events for today (${todayStr}) relevant to government exams (especially Rajasthan state-level news and schemes). Rely heavily on the LIVE NEWS HEADLINES provided above if available. Include recent appointments, awards, and economic data.
Also generate a JSON quiz based on these events containing exactly 5 questions (each with 4 options, a correctIndex, and a detailed explanation).
Format your final output as a single JSON object with this format:
{
  "summary": "Full text of the current affairs summary with references...",
  "quiz": [
    {
      "subject": "Current Affairs",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2,
      "explanation": "Explanation..."
    }
  ]
}`;

    const systemPrompt = `You are a current affairs analyzer and exam tutor. Construct a short current affairs briefing followed by a 5-question review quiz. Respond ONLY in valid JSON format.`;

    try {
      // Use Search Grounding if Gemini is available, otherwise normal API
      const result = await this.callAPI(searchPrompt, systemPrompt, storage.hasApiKey());
      
      let cleanText = result.text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').trim();
      }
      
      const parsed = JSON.parse(cleanText);
      
      if (result.grounding?.groundingChunks?.length) {
        parsed.citations = result.grounding.groundingChunks.map(chunk => ({
          title: chunk.web?.title || 'Web Search Result',
          url: chunk.web?.uri || '#'
        }));
      } else if (newsContext) {
        parsed.citations = [{
          title: "Google News RSS (Rajasthan & India)",
          url: "https://news.google.com"
        }];
      }

      storage.setCachedCurrentAffairs(parsed);
      return parsed;
    } catch (err) {
      console.warn("Daily current affairs generation failed, using mock", err);
      return this.simulateDailyCurrentsAndQuiz();
    }
  },

  // Generate comprehensive Markdown study guide
  async generateStudyGuide(subject, topic) {
    const hasKey = storage.hasGroqApiKey() || storage.hasApiKey();
    if (!hasKey) {
      return `# ${topic}\n\n*Demo Mode:* Please configure an API key to generate comprehensive study material for ${topic} under ${subject}.`;
    }

    const systemPrompt = `You are an elite AI Tutor for the Rajasthan RSSB Computer Instructor (BCI) Exam.
Your task is to generate a highly visual, accessible, and structured Markdown study guide. 
CRITICAL UI RULES:
- AVOID long paragraphs entirely. Break everything into extremely short, digestible bullet points.
- Use Markdown Tables to compare concepts.
- Use Blockquotes (> ) for important definitions or formulas.
- Use bold text heavily to highlight key terms.
- Use code blocks for programming/SQL.
- Format the content to look like quick "flashcards" or "cheat sheets" rather than a textbook.
DO NOT include conversational text (e.g., "Here is your study guide"). Just output the raw Markdown content.`;

    const userPrompt = `Create an easy-to-read, highly accessible cheat-sheet style study guide for the topic "${topic}" which falls under the subject "${subject}" in the BCI syllabus.
Must Include:
- A brief 2-sentence summary at the top
- Core concepts as a bulleted list or table
- Important facts or formulas in Blockquotes
- Examples (if applicable)
Keep it extremely concise and readable.`;

    try {
      const response = await this.callAPI(userPrompt, systemPrompt, false);
      return response.text;
    } catch (err) {
      console.error("Failed to generate study guide", err);
      throw new Error("Unable to generate study material at this time.");
    }
  },

  // Fallback simulator for mock test generation
  simulateTestGeneration(examType, subjects, count) {
    const list = fallbackTests[examType] || fallbackTests.BCI_I || fallbackTests.BCI_II;
    // Filter by subject if requested and matching
    let pool = [];
    if (subjects && subjects.length > 0) {
      pool = list.filter(q => subjects.some(s => q.subject.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(q.subject.toLowerCase())));
    }
    if (pool.length === 0) {
      pool = list;
    }

    // Shuffle and pick
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const finalQuestions = shuffled.slice(0, count);

    // If we need more than we have, pad it by copying and changing slightly
    while (finalQuestions.length < count) {
      const randomQ = pool[Math.floor(Math.random() * pool.length)];
      finalQuestions.push({
        ...randomQ,
        id: `sim_${Date.now()}_${finalQuestions.length}`,
        question: `[Practice Mode] ${randomQ.question}`
      });
    }

    return finalQuestions;
  },

  // Fallback simulator for daily current affairs
  simulateDailyCurrentsAndQuiz() {
    const summary = `### Daily Current Affairs Briefing (${new Date().toLocaleDateString()})

1. **Digital India Expansion**: The Union Cabinet has approved a Rs 14,903 crore expansion of the Digital India program. This includes re-skilling IT professionals and expanding the Bhashini translation tool.
2. **Chandrayaan-4 Architecture Finalized**: ISRO announced the lunar sample return mission, Chandrayaan-4. It will feature a modular launch structure using two separate rockets.
3. **ADB Growth Forecast**: The Asian Development Bank maintained India's GDP growth projection at 7.0% for the current fiscal year, citing strong industrial demand and agricultural recovery.
4. **Project Tiger Golden Jubilee**: India celebrated 50 years of Project Tiger, recording an increase in wild tiger population to 3,682, which represents 75% of the world's wild tiger population.
5. **New Chief Election Commissioner**: Justice (Retd.) Rajiv Kumar has been appointed as the Special Commissioner, overseeing electoral audits to improve transparent EVM logs.`;

    const quiz = [
      {
        id: "daily_1",
        subject: "Current Affairs",
        question: "What is the budget allocation approved for the expansion of the Digital India program?",
        options: [
          "Rs 10,500 crore",
          "Rs 14,903 crore",
          "Rs 18,200 crore",
          "Rs 12,000 crore"
        ],
        correctIndex: 1,
        explanation: "The Union Cabinet has approved Rs 14,903 crore for the Digital India program expansion, enabling deep tech training for IT professionals and integration of AI-driven voice translation services."
      },
      {
        id: "daily_2",
        subject: "Current Affairs",
        question: "According to the census on the golden jubilee of Project Tiger, what is India's estimated tiger population?",
        options: [
          "2,967",
          "3,167",
          "3,682",
          "4,120"
        ],
        correctIndex: 2,
        explanation: "India's tiger population in the wild has grown to 3,682 according to recent surveys, accounting for approximately 75% of the global tiger count."
      },
      {
        id: "daily_3",
        subject: "Current Affairs",
        question: "Which multilateral bank maintained India's GDP growth projection at 7.0% for the current fiscal year?",
        options: [
          "World Bank",
          "International Monetary Fund",
          "Asian Development Bank",
          "New Development Bank"
        ],
        correctIndex: 2,
        explanation: "The Asian Development Bank (ADB) maintained India's economic growth projection at 7.0%, crediting robust infrastructure development and services sector output."
      }
    ];

    return {
      summary,
      quiz,
      citations: [
        { title: "Press Information Bureau (PIB) India", url: "https://pib.gov.in" },
        { title: "Asian Development Bank Reports", url: "https://adb.org" }
      ]
    };
  },

  // Doubts Assistant chat with grounding option
  async askDoubt(message, chatHistory = [], activeQuestion = null, enableSearch = false) {
    const hasKey = storage.hasGroqApiKey() || storage.hasApiKey();
    if (!hasKey) {
      return this.simulateDoubtAnswer(message, activeQuestion, enableSearch);
    }

    let contextPrompt = '';
    if (activeQuestion) {
      contextPrompt = `[Context Question the user is practicing:
Subject: ${activeQuestion.subject}
Question: ${activeQuestion.question}
Options: ${activeQuestion.options.join(' | ')}
Correct Answer index: ${activeQuestion.correctIndex}
Explanation: ${activeQuestion.explanation}]
---
`;
    }

    // Build chat history context
    let conversationContext = '';
    chatHistory.slice(-6).forEach(msg => {
      conversationContext += `${msg.sender === 'user' ? 'Question' : 'Answer'}: ${msg.text}\n`;
    });

    const prompt = `${contextPrompt}${conversationContext}Question: ${message}\nAnswer:`;

    const systemInstruction = `You are an AI Tutor for the Rajasthan RSSB Computer Instructor (BCI) Exam.
You must base your answers on the official syllabus (Rajasthan GK, Pedagogy, Reasoning, Computer Science) and the patterns from the 2022 Previous Year Papers.
Provide a DIRECT factual reply to the user's question. DO NOT include any conversational filler. DO NOT say "You asked:" or "Here is the answer:". Just provide the exact factual answer or explanation immediately.
If the user asks a question not related to the BCI syllabus, politely steer them back.
Always be structured, and use Markdown for formatting (bold text, lists, code block math formulas, tables).`;

    try {
      const response = await this.callAPI(prompt, systemInstruction, enableSearch);
      
      let citations = [];
      if (response.grounding?.groundingChunks?.length) {
        citations = response.grounding.groundingChunks.map(chunk => ({
          title: chunk.web?.title || 'Web Source',
          url: chunk.web?.uri || '#'
        }));
      }

      return {
        text: response.text,
        citations
      };
    } catch (err) {
      console.error("Doubt query failed", err);
      return {
        text: `Error connecting to Gemini API: ${err.message}. Showing local backup response below:\n\n${this.simulateDoubtAnswer(message, activeQuestion, enableSearch).text}`,
        citations: []
      };
    }
  },

  simulateDoubtAnswer(message, activeQuestion, enableSearch) {
    let responseText = '';
    const qLower = message.toLowerCase();

    if (activeQuestion) {
      responseText = `**Correct Answer: Option ${String.fromCharCode(65 + activeQuestion.correctIndex)}**
      
${activeQuestion.explanation}

(Options were: ${activeQuestion.options.join(', ')})`;
    } else if (qLower.includes('constitution') || qLower.includes('polity')) {
      responseText = `**Indian Polity Concept Review:**
      
The Indian Constitution is the longest written constitution of any sovereign country. Part III (Articles 12 to 35) deals with **Fundamental Rights**, which are:
- Right to Equality (Articles 14-18)
- Right to Freedom (Articles 19-22)
- Right against Exploitation (Articles 23-24)
- Right to Freedom of Religion (Articles 25-28)
- Cultural and Educational Rights (Articles 29-30)
- Right to Constitutional Remedies (Article 32 - described by Dr. B.R. Ambedkar as the 'Heart and Soul' of the Constitution).

Would you like a sample question on one of these Articles?`;
    } else if (qLower.includes('aptitude') || qLower.includes('quant') || qLower.includes('math') || qLower.includes('speed') || qLower.includes('percentage')) {
      responseText = `**Quantitative Aptitude Tip: Speed, Distance & Time**
      
Here is the key relationship:
$$\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}}$$

**Conversion Rules:**
- To convert km/h to m/s, multiply by $\\frac{5}{18}$. (e.g., $72 \\text{ km/h} = 72 \\times \\frac{5}{18} = 20 \\text{ m/s}$)
- To convert m/s to km/h, multiply by $\\frac{18}{5}$.

**Average Speed Formula:**
When a body travels equal distances at speeds $A$ and $B$, the average speed is:
$$\\text{Average Speed} = \\frac{2AB}{A+B}$$

Let me know if you want to solve a practice question using this formula!`;
    } else {
      responseText = `The topic you asked about is a core part of the BCI syllabus. In a real API call, I would provide a direct, factual explanation based on the Rajasthan Computer Instructor curriculum and previous year papers. Please configure your API key for live AI generation.`;
    }

    return {
      text: responseText,
      citations: [
        { title: "M Laxmikanth - Indian Polity Reference", url: "#" },
        { title: "Quantitative Aptitude for Competitive Exams", url: "#" }
      ]
    };
  },

  // Fallback: generate test from local question bank when no API key is available
  simulateTestGeneration(examType, subjects, questionCount) {
    // Pick from the fallback test bank
    const bankKey = examType === 'BCI_I' ? 'BCI_I' : 'BCI_II';
    const bank = fallbackTests[bankKey] || fallbackTests['BCI_I'] || [];
    
    if (bank.length === 0) {
      throw new Error('No fallback questions available. Please configure an API key.');
    }

    // Filter by subjects if provided
    let pool = bank;
    if (subjects && subjects.length > 0 && subjects[0] !== '') {
      const filtered = bank.filter(q => 
        subjects.some(s => q.subject?.toLowerCase().includes(s.toLowerCase()))
      );
      if (filtered.length >= questionCount) {
        pool = filtered;
      }
    }

    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  },

  // Fallback: simulate daily current affairs when no API key is available
  simulateDailyCurrentsAndQuiz() {
    return {
      summary: "**Today's Current Affairs Briefing**\n\n• Government of India announced new digital literacy initiatives for rural areas\n• Rajasthan State Government launched new teacher training programs\n• RSSB released updated exam calendar for upcoming recruitment cycles\n• India's GDP growth rate projected at 6.5% for current fiscal year\n• New education policy reforms being implemented across states",
      quiz: [
        {
          subject: "Current Affairs",
          question: "Which initiative was recently launched by the Government of India for rural areas?",
          options: ["Digital Literacy Program", "Smart City Mission", "Ujjwala Yojana Extension", "Rural Employment Guarantee"],
          correctIndex: 0,
          explanation: "The Government of India has been focusing on digital literacy initiatives for rural areas to bridge the digital divide."
        },
        {
          subject: "Current Affairs",
          question: "What is India's projected GDP growth rate for the current fiscal year?",
          options: ["5.5%", "6.0%", "6.5%", "7.0%"],
          correctIndex: 2,
          explanation: "India's GDP growth rate has been projected at 6.5% for the current fiscal year by major economic agencies."
        },
        {
          subject: "Current Affairs",
          question: "Which state body released an updated exam calendar for recruitment?",
          options: ["UPSC", "SSC", "RSSB", "RPSC"],
          correctIndex: 2,
          explanation: "Rajasthan Staff Selection Board (RSSB) regularly updates its exam calendar for various recruitment examinations."
        },
        {
          subject: "Current Affairs",
          question: "What new program did Rajasthan State Government launch?",
          options: ["Healthcare Initiative", "Teacher Training Program", "Road Development Scheme", "Water Conservation Project"],
          correctIndex: 1,
          explanation: "The Rajasthan State Government has been actively launching teacher training programs to improve education quality."
        },
        {
          subject: "Current Affairs",
          question: "Which major policy reform is being implemented across Indian states?",
          options: ["Land Reform Act", "New Education Policy", "Labour Reform Act", "Tax Reform Policy"],
          correctIndex: 1,
          explanation: "The New Education Policy (NEP) reforms are being implemented across states to modernize India's education system."
        }
      ]
    };
  }
};
