import { fallbackTests } from '../data/fallbackTests.js';
import { storage } from './storage.js';
import { supabaseService } from './supabase.js';

export const gemini = {
  // Call Groq API completions endpoint
  async callGroqAPI(prompt, systemInstruction = '', jsonMode = false) {
    const apiKey = storage.getGroqApiKey();
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    // If we have an apiBase or we are on production web (where relative endpoints are available)
    if (apiBase || (window.location.protocol !== 'file:' && window.location.hostname !== 'localhost' && !window.location.origin.includes('capacitor'))) {
      try {
        const proxyUrl = `${apiBase}/api/groq`;
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, systemInstruction, jsonMode })
        });

        if (response.ok) {
          const data = await response.json();
          const textContent = data.choices?.[0]?.message?.content || '';
          return {
            text: textContent,
            grounding: null
          };
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn("Groq serverless proxy returned an error, trying client-side request:", errData);
        }
      } catch (err) {
        console.warn("Groq proxy request failed, trying client-side fallback:", err);
      }
    }

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
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    // Try Vercel Serverless proxy first
    if (apiBase || (window.location.protocol !== 'file:' && window.location.hostname !== 'localhost' && !window.location.origin.includes('capacitor'))) {
      try {
        const proxyUrl = `${apiBase}/api/gemini`;
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, systemInstruction, enableSearch, jsonMode: false })
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0];
          const textContent = candidate?.content?.parts?.[0]?.text || '';
          const groundingMetadata = candidate?.groundingMetadata || null;
          return {
            text: textContent,
            grounding: groundingMetadata
          };
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn("Gemini serverless proxy returned an error, trying client-side request:", errData);
        }
      } catch (err) {
        console.warn("Gemini proxy request failed, trying client-side fallback:", err);
      }
    }

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
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    // Try Vercel Serverless proxy first
    if (apiBase || (window.location.protocol !== 'file:' && window.location.hostname !== 'localhost' && !window.location.origin.includes('capacitor'))) {
      try {
        const proxyUrl = `${apiBase}/api/gemini`;
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, systemInstruction, jsonMode: true })
        });

        if (response.ok) {
          const data = await response.json();
          const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return JSON.parse(textContent);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn("Gemini proxy JSON returned error, trying client-side request:", errData);
        }
      } catch (err) {
        console.warn("Gemini proxy JSON request failed, trying client-side fallback:", err);
      }
    }

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

    // Fetch relevant PYQs for mock test style reference (RAG)
    let pyqTestContext = '';
    try {
      const pyqList = [];
      for (const sub of subjects) {
        const matches = await supabaseService.getRelevantPYQs(sub, null);
        if (matches && matches.length > 0) {
          pyqList.push(...matches);
        }
        if (pyqList.length >= 4) break;
      }
      
      if (pyqList.length > 0) {
        pyqTestContext = `REAL PREVIOUS YEAR EXAM QUESTIONS FOR REFERENCE (MIMIC THIS STYLE):
Here are some real questions asked in the actual 2022 Rajasthan Computer Instructor exam. Use them to mimic the tone, question formatting, options structure, and complexity:
${pyqList.map((q, idx) => `Question ${idx + 1}: ${q.question}
Options: A) ${q.options[0]}, B) ${q.options[1]}, C) ${q.options[2]}, D) ${q.options[3]}
Correct Answer Index: ${q.correct_index} (Explanation: ${q.explanation || 'N/A'}`).join('\n\n')}
Generate new, completely unique questions of similar depth and style. Do not repeat these exact questions.`;
      }
    } catch (e) {
      console.warn("Failed to retrieve PYQs for mock test styling:", e);
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

${pyqTestContext ? `${pyqTestContext}\n\n` : ''}Ensure the questions are challenging, technically accurate, and reflect Rajasthan Computer Instructor exam patterns. Provide a comprehensive explanation for each.`;

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

  // Daily current affairs updates & linked quiz — EXCLUSIVELY uses Gemini with Google Search grounding
  async generateDailyCurrentsAndQuiz() {
    // Check for cached data first (called once per day)
    const cached = storage.getCachedCurrentAffairs();
    if (cached) {
      return cached;
    }

    const todayStr = new Date().toDateString();

    const searchPrompt = `Search the web and list the top 5 key current affairs and national/international news events for today (${todayStr}) relevant to government exams (especially Rajasthan state-level news and schemes, national appointments, awards, economic data, and sports).
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

    const systemPrompt = `You are a current affairs analyzer and exam tutor for the Rajasthan RSSB Computer Instructor (BCI) exam. Search the web for the latest news headlines, then construct a comprehensive current affairs briefing followed by a 5-question review quiz. Respond ONLY in valid JSON format. Do not wrap in markdown code fences.`;

    // Strategy 1: Gemini with Google Search grounding (preferred — gives real-time web results)
    if (storage.hasApiKey()) {
      try {
        const result = await this.callGeminiAPI(searchPrompt, systemPrompt, true);
        
        let cleanText = result.text.trim();
        // Strip markdown fences if present
        cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        
        const parsed = JSON.parse(cleanText);
        
        if (result.grounding?.groundingChunks?.length) {
          parsed.citations = result.grounding.groundingChunks.map(chunk => ({
            title: chunk.web?.title || 'Web Search Result',
            url: chunk.web?.uri || '#'
          }));
        }

        // Cache locally so it's only called once per day
        storage.setCachedCurrentAffairs(parsed);
        return parsed;
      } catch (err) {
        console.warn("Gemini daily quiz generation failed, trying Groq fallback", err);
      }
    }

    // Strategy 2: Groq fallback with RSS news context (no web search, but uses live headlines)
    if (storage.hasGroqApiKey()) {
      try {
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
          console.warn("RSS fetch failed for Groq fallback", e);
        }

        const groqPrompt = `${newsContext}\n\nBased on the headlines above, list the top 5 current affairs for today (${todayStr}) and generate a 5-question quiz. ${searchPrompt}`;
        const result = await this.callGroqAPI(groqPrompt, systemPrompt, true);
        const parsed = JSON.parse(result.text);
        parsed.citations = [{ title: "Google News RSS (Rajasthan & India)", url: "https://news.google.com" }];
        storage.setCachedCurrentAffairs(parsed);
        return parsed;
      } catch (err) {
        console.warn("Groq daily quiz fallback also failed", err);
      }
    }

    // Strategy 3: Static mock data
    return this.simulateDailyCurrentsAndQuiz();
  },

  // Generate comprehensive Markdown study guide — EXCLUSIVELY uses Groq for detailed long-form content
  async generateStudyGuide(subject, topic) {
    // 1. Check Supabase database cache first (instantly returns if already generated)
    try {
      const cachedContent = await supabaseService.getStudyGuide(topic);
      if (cachedContent) {
        console.log(`Loading study guide for "${topic}" from database cache.`);
        return cachedContent;
      }
    } catch (e) {
      console.warn("Error fetching from study guides cache:", e);
    }

    // Detect if this is a logical reasoning / analytical ability topic that may need figures
    const isReasoningTopic = /reasoning|analytical|logical|problem solving|data interpretation/i.test(subject) || /reasoning|analytical|logical|problem solving|data interpretation/i.test(topic);

    // 2. Fetch context from database: relevant PYQs and official syllabus descriptions (RAG setup)
    let syllabusContext = '';
    let pyqContext = '';
    try {
      const syllabusDesc = await supabaseService.getSyllabusDescription(subject);
      if (syllabusDesc) {
        syllabusContext = `OFFICIAL SYLLABUS DIRECTIVES:
The official Rajasthan BCI syllabus defines the scope for this subject as: "${syllabusDesc}". Keep your study guide aligned to this scope.`;
      }

      const pyqs = await supabaseService.getRelevantPYQs(subject, topic);
      if (pyqs && pyqs.length > 0) {
        pyqContext = `REAL PREVIOUS YEAR EXAM QUESTIONS FOR REFERENCE (BCI 2022):
Here are some real questions asked in the actual 2022 Rajasthan Computer Instructor exam related to this topic:
${pyqs.map((q, idx) => `Question ${idx + 1}: ${q.question}
Options: A) ${q.options[0]}, B) ${q.options[1]}, C) ${q.options[2]}, D) ${q.options[3]}
Correct Answer: Option ${String.fromCharCode(65 + q.correct_index)}
Explanation: ${q.explanation || 'N/A'}`).join('\n\n')}
Ensure your study guide covers the concepts, technical terms, and analytical depth tested in these real exam questions.`;
      }
    } catch (e) {
      console.warn("Failed to fetch database context for generation:", e);
    }

    let systemInstructionReasoning = '';
    if (isReasoningTopic) {
      systemInstructionReasoning = `- For questions involving visual patterns, series, diagrams, Venn diagrams, seating arrangements, or directions:
  - Represent figures using simple ASCII art or text-based diagrams inside code blocks.
  - For example, use box-drawing characters for flowcharts, tables for matrices, and text arrows for direction problems.
  - Label each figure clearly (e.g., "Figure 1: Seating Arrangement").
  - Provide step-by-step visual walkthroughs when solving pattern-based or spatial reasoning problems.`;
    }

    const systemPrompt = `You are an elite AI Tutor for the Rajasthan RSSB Computer Instructor (BCI) Exam.
Your task is to generate a comprehensive, highly detailed, and structured Markdown study guide.
Ensure all key subtopics are explained thoroughly with theoretical depth, clear examples, and real-world applications where relevant.
CRITICAL UI & FORMATTING RULES:
- Organize content logically using clear headings and sub-headings (h2, h3, h4).
- Use Markdown Tables to contrast and compare different concepts.
- Use Blockquotes (> ) to highlight critical definitions, rules, theorems, or formulas.
- Use code blocks (with appropriate language syntax highlighting) for coding, commands, or SQL examples.
- Bold key terms and terminologies for high readability.
- Maintain a professional, educational, and detailed tone.
${systemInstructionReasoning}
DO NOT include conversational intros or outros (e.g., "Here is your detailed guide"). Just return the raw Markdown content.`;

    let extraReasoningPrompt = '';
    if (isReasoningTopic) {
      extraReasoningPrompt = `5. **Visual Figures & Diagrams**: Include ASCII art or text-based diagrams (inside code blocks) for patterns, Venn diagrams, seating arrangements, direction-based problems, matrices, or series. Provide at least 3 worked-out examples with step-by-step diagram explanations.
6. **Key BCI Exam Tips**: Strategic guidelines, shortcut techniques, and typical question patterns from the RSSB Computer Instructor exam.`;
    } else {
      extraReasoningPrompt = `5. **Key BCI Exam Tips**: Strategic guidelines and typical questions or patterns that appear in the RSSB Computer Instructor exam for this topic.`;
    }

    const userPrompt = `Create a highly detailed, comprehensive, and exhaustive study guide for the topic "${topic}" under the subject "${subject}" in the BCI syllabus.

${syllabusContext ? `${syllabusContext}\n\n` : ''}${pyqContext ? `${pyqContext}\n\n` : ''}Must Include:
1. **Introduction & Definition**: A thorough explanation of the core concept and its significance.
2. **Core Sub-concepts & Architecture**: Detailed explanations of all technical facets, components, properties, or phases. Use tables for comparisons.
3. **Important Rules & Formulas**: Exhaustive list of formulas, equations, or design rules formatted in blockquotes.
4. **Code / Practical Examples**: In-depth examples (such as C++/Java/Python/SQL code blocks, process scheduling scenarios, or numeric steps) showing how it works in practice.
${extraReasoningPrompt}
Ensure the guide is thorough, descriptive, and covers all relevant details to help the candidate master the topic.`;

    // Strategy 1: Groq (preferred — fast, detailed, high token limit for long-form content)
    if (storage.hasGroqApiKey()) {
      try {
        const response = await this.callGroqAPI(userPrompt, systemPrompt, false);
        if (response && response.text) {
          // Cache in Supabase so others get it instantly
          await supabaseService.saveStudyGuide(subject, topic, response.text);
          return response.text;
        }
      } catch (err) {
        console.warn("Groq study guide generation failed, trying Gemini fallback", err);
      }
    }

    // Strategy 2: Gemini fallback
    if (storage.hasApiKey()) {
      try {
        const response = await this.callGeminiAPI(userPrompt, systemPrompt, false);
        if (response && response.text) {
          // Cache in Supabase so others get it instantly
          await supabaseService.saveStudyGuide(subject, topic, response.text);
          return response.text;
        }
      } catch (err) {
        console.warn("Gemini study guide fallback also failed", err);
      }
    }

    // Strategy 3: Local simulated content
    return this.simulateStudyGuide(subject, topic);
  },

  // Fallback simulator for study guide content
  simulateStudyGuide(subject, topic) {
    const subjectClean = subject || 'General Study';
    const topicClean = topic || 'General CS Concept';

    // Predefined templates for common BCI topics
    const templates = {
      "process and thread management, process states": `
# Process & Thread Management (Process States)
> **Process**: A program in execution. It is an active, dynamic entity.
> **Thread**: A lightweight process; the smallest unit of execution within a process.

---

### Process vs Thread: Key Differences
| Feature | Process | Thread |
| :--- | :--- | :--- |
| **Memory** | Has its own address space / memory bounds. | Shares address space and resources with the parent process. |
| **Context Switch** | Heavyweight (slow context switching, high kernel overhead). | Lightweight (very fast context switching, low overhead). |
| **Creation** | Costly in terms of OS system resources. | Economical to create and terminate. |
| **Communication** | Requires IPC (Inter-Process Communication) like Pipes or Sockets. | Direct communication via shared memory space. |

---

### Process State Transition Diagram
A process goes through various states during its lifecycle:
1. **New**: The process is being created.
2. **Ready**: The process is waiting in main memory to be assigned to a processor.
3. **Running**: CPU instructions are actively being executed.
4. **Waiting / Blocked**: The process is suspended waiting for an event (e.g., I/O completion).
5. **Terminated**: The process has finished execution and is destroyed.

> **Key Tip**: The **Short-Term Scheduler** (CPU Scheduler) selects a process from the **Ready** queue and allocates the CPU to it. This transition is known as **Dispatch**.
`,
      "memory hierarchy (ram, rom, cache, registers)": `
# Memory Hierarchy in Computer Systems
> The **Memory Hierarchy** is an approach to organize computer memory such that we minimize access time and maximize storage capacity at minimal cost.

---

### Comparison of Memory Types
| Level | Memory Type | Access Speed | Capacity | Cost per Bit |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0** | CPU Registers | Fastest (sub-nanosecond) | Very Small (Bytes) | Highest |
| **Level 1** | Cache Memory (L1, L2, L3) | Very Fast (1-10 ns) | Small (Megabytes) | High |
| **Level 2** | Primary Memory (RAM) | Fast (50-100 ns) | Medium (Gigabytes) | Medium |
| **Level 3** | Secondary Storage (SSD/HDD) | Slow (milliseconds) | Huge (Terabytes) | Low |

---

### Core Concepts to Remember
- **Cache Locality**:
  - **Temporal Locality**: If a memory location is referenced, it will tend to be referenced again soon.
  - **Spatial Locality**: If a memory location is referenced, nearby memory locations will tend to be referenced soon.
- **ROM Types**:
  - **PROM**: Programmable ROM (written once).
  - **EPROM**: Erasable PROM (erased using Ultraviolet light).
  - **EEPROM**: Electrically Erasable PROM (erased electrically, used in modern flash memory).
`,
      "cpu scheduling algorithms (fcfs, sjf, priority, round robin)": `
# CPU Scheduling Algorithms
> **CPU Scheduling** is the process of deciding which process in the ready queue is allocated the CPU.

---

### Types of CPU Schedulers
- **Non-Preemptive**: A process keeps the CPU until it terminates or switches to the waiting state (e.g., FCFS).
- **Preemptive**: The operating system can interrupt a running process and reallocate the CPU to another process (e.g., Round Robin, Preemptive Priority).

---

### Scheduling Metrics & Algorithms
| Algorithm | Selection Criteria | Preemptive? | Drawbacks |
| :--- | :--- | :--- | :--- |
| **FCFS** (First Come First Served) | Arrival Time | No | **Convoy Effect** (short processes wait behind long ones). |
| **SJF** (Shortest Job First) | Next CPU Burst Time | Preemptive / Non-Preemptive | **Starvation** of longer jobs; hard to predict burst time. |
| **Priority** | Priority Value | Preemptive / Non-Preemptive | **Starvation** of low-priority jobs (solved by **Aging**). |
| **Round Robin (RR)** | Time Quantum (slice) | Yes (forced after quantum) | Performance depends heavily on time quantum size. |

> **Aging**: A technique that gradually increases the priority of processes that wait in the system for a long time.
`
    };

    const normTopic = topicClean.toLowerCase().trim();
    if (templates[normTopic]) {
      return templates[normTopic];
    }

    // Generic layout for other topics
    return `
# ${topicClean}
> **Subject**: ${subjectClean}
> *Study Notes & Quick Reference Cheat-Sheet for Rajasthan Computer Instructor Exam.*

---

### Core Concepts & Overview
- This guide provides a summary of the essential facts and structures related to **${topicClean}**.
- Designed to highlight core parameters and BCI exam-frequent principles.

---

### Key Information Cheat Sheet
| Feature | Details & Description | BCI Exam Weightage / Tip |
| :--- | :--- | :--- |
| **Fundamental Definition** | The basic concept of ${topicClean} in computer engineering/general ability. | Essential memory recall question. |
| **Primary Architecture** | How this component interacts with operating systems, databases, or networks. | Frequently asked in Paper-II matching questions. |
| **Common Use Cases** | Practical applications in programming, logical deduction, or database queries. | Code review or tracing output questions. |

---

### Quick Facts & Formula Reference
> **Important Rule**: Always verify edge cases, boundary parameters, and syntax rules when solving questions on this topic.
>
> **Rajasthan BCI Exam Tip**: Previous papers showed that questions from **${subjectClean}** frequently focus on standard classifications, historical inventors/protocols, and syntax validation.
`;
  },

  // Fallback simulator for mock test generation
  simulateTestGeneration(examType, subjects, count) {
    // Determine the bank key. Ensure we fall back properly if BCI_II is empty or doesn't exist.
    const bankKey = examType === 'BCI_I' ? 'BCI_I' : 'BCI_II';
    let bank = fallbackTests[bankKey];
    
    // If the bank doesn't exist or is empty, fall back to BCI_I
    if (!bank || bank.length === 0) {
      bank = fallbackTests['BCI_I'] || [];
    }

    if (bank.length === 0) {
      throw new Error('No fallback questions available. Please configure an API key.');
    }

    // Filter by subject if requested and matching
    let pool = bank;
    if (subjects && subjects.length > 0 && subjects[0] !== '') {
      const filtered = bank.filter(q => 
        subjects.some(s => q.subject?.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(q.subject?.toLowerCase()))
      );
      if (filtered.length > 0) {
        pool = filtered;
      }
    }

    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const finalQuestions = shuffled.slice(0, count);

    // If we need more than we have, pad it by copying and changing slightly
    while (finalQuestions.length < count) {
      const randomQ = pool[Math.floor(Math.random() * pool.length)];
      if (!randomQ) break;
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
  }
};
