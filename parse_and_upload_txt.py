import os
import re
import json
import time
import requests

try:
    import google.generativeai as genai
except ImportError:
    print("Please install google-generativeai: pip install google-generativeai")
    exit(1)

# Load environment variables
def load_env():
    env_vars = {}
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip()
    return env_vars

env = load_env()
gemini_key = env.get("VITE_GEMINI_API_KEY")
supabase_url = env.get("VITE_SUPABASE_URL")
supabase_key = env.get("VITE_SUPABASE_ANON_KEY")

if not gemini_key or not supabase_url or not supabase_key:
    print("Error: Missing credentials in .env file.")
    exit(1)

genai.configure(api_key=gemini_key)
model = genai.GenerativeModel('gemini-2.5-flash')

# Define syllabus subjects for classification
paper1_subjects = [
    "Rajasthan History", 
    "Rajasthan Geography", 
    "Art and Culture", 
    "General Science", 
    "Current Affairs & Schemes", 
    "General Ability (Quant & Reasoning)"
]

paper2_subjects = [
    "Pedagogy", 
    "Mental Ability", 
    "Fundamentals of Computer", 
    "Data Processing", 
    "Programming Fundamentals", 
    "Data structures and Algorithms", 
    "Computer Organization and Operating System", 
    "Communication and Network Concepts", 
    "Network Security", 
    "Database Management System", 
    "System Analysis and Design", 
    "Internet of Things and its application"
]

# Configure all 4 papers
files_to_process = [
    {
        "filename": "Rajasthan_Computer_Teacher_18_June_2022_Paper_1.txt",
        "paper_type": "Paper I",
        "exam_type": "Basic",
        "label": "basic_p1",
        "subjects": paper1_subjects
    },
    {
        "filename": "Rajasthan_Computer_Teacher_18_June_2022_Paper_2.txt",
        "paper_type": "Paper II",
        "exam_type": "Basic",
        "label": "basic_p2",
        "subjects": paper2_subjects
    },
    {
        "filename": "Rajasthan_Computer_Teacher_Paper1.txt",
        "paper_type": "Paper I",
        "exam_type": "Senior",
        "label": "senior_p1",
        "subjects": paper1_subjects
    },
    {
        "filename": "Rajasthan_Computer_Teacher_Paper2.txt",
        "paper_type": "Paper II",
        "exam_type": "Senior",
        "label": "senior_p2",
        "subjects": paper2_subjects
    }
]

def split_questions(filepath):
    print(f"Reading and splitting {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Match question numbers at the start of a line
    matches = list(re.finditer(r"^(?:\d+)\.\s", content, re.MULTILINE))
    blocks = []
    
    for i in range(len(matches)):
        start = matches[i].start()
        end = matches[i+1].start() if i + 1 < len(matches) else len(content)
        blocks.append(content[start:end].strip())
        
    print(f"Found {len(blocks)} questions.")
    return blocks

def parse_batch(batch, paper_label, subjects):
    batch_text = "\n\n---\n\n".join(batch)
    
    prompt = f"""
You are an expert parser for the Rajasthan RSSB Computer Instructor previous year exam questions.
Here is a text snippet containing a batch of questions from {paper_label}:
---
{batch_text}
---

Your job is to parse each question in the batch into a structured JSON array.

CRITICAL INSTRUCTIONS FOR DIAGRAMS/FIGURES:
- If a question contains a `[Figure: ...]` tag (e.g., describing a Venn diagram, clock, seating arrangement, triangle grid, die, matrix, or a flow chart):
  - Read the description of the figure carefully.
  - Draw the figure as a high-quality diagram using ASCII / UTF-8 box-drawing characters (such as ┌, ┐, └, ┘, │, ─, ┼, ┬, ┴, ╭, ╮, ╯, ╰, arrows, circles, boxes, etc.) inside a markdown code block.
  - Prepend this ASCII diagram directly at the very beginning of the "question" text field.
  - Label it clearly, e.g. "Figure:" or "Venn Diagram:".
  - Make sure the diagram represents the exact layout, numbers, and labels described.

Output ONLY a JSON array of objects with this exact structure:
[
  {{
    "question": "English question text (with the drawn ASCII code block prepended at the start if there was a figure description)",
    "subject": "Exactly one of: {', '.join(subjects)}",
    "topic": "Key topic name (1-3 words, e.g. 'Venn Diagrams', 'Soil Types', 'CPU Scheduling')",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0, // Integer 0 for A, 1 for B, 2 for C, 3 for D
    "explanation": "Detailed explanation of why the correct option is correct."
  }}
]
Respond with valid, raw JSON only. Do not wrap in ```json or ``` code fences. Do not write conversational text.
"""
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```json"):
        text = text[7:-3]
    elif text.startswith("```"):
        text = text[3:-3]
        
    return json.loads(text.strip())

def process_file(filepath, paper_type, subjects, label):
    blocks = split_questions(filepath)
    parsed_questions = []
    
    # Check if progress file exists to resume execution
    progress_file = f"parsed_{label}_progress.json"
    if os.path.exists(progress_file):
        try:
            with open(progress_file, "r", encoding="utf-8") as f:
                parsed_questions = json.load(f)
            print(f"Resuming from previous progress. Loaded {len(parsed_questions)} parsed questions.")
        except Exception as e:
            print(f"Could not load progress file: {e}. Starting fresh.")
            parsed_questions = []
            
    # Process from the last successful question index
    start_index = len(parsed_questions)
    batch_size = 5
    
    for i in range(start_index, len(blocks), batch_size):
        batch = blocks[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}/{len(blocks)//batch_size + 1}...")
        
        retries = 6
        while retries > 0:
            try:
                results = parse_batch(batch, paper_type, subjects)
                if isinstance(results, list):
                    parsed_questions.extend(results)
                    break
                else:
                    raise Exception("Output is not a list")
            except Exception as e:
                err_str = str(e)
                print(f"Error parsing batch: {err_str}")
                retries -= 1
                if "429" in err_str or "quota" in err_str.lower() or "limit" in err_str.lower():
                    print("Rate limit (429) hit. Sleeping 25 seconds before retrying...")
                    time.sleep(25)
                else:
                    print("Sleeping 5 seconds before retrying...")
                    time.sleep(5)
        
        if retries == 0:
            raise Exception("Failed to parse batch after maximum retries.")
            
        # Save progress locally
        with open(progress_file, "w", encoding="utf-8") as f:
            json.dump(parsed_questions, f, indent=2, ensure_ascii=False)
            
        # Pace requests to fit Gemini Free Tier limits (15 RPM / 5 RPM spike limit)
        time.sleep(7)
            
    # Final backup file
    final_file = f"parsed_{label}.json"
    with open(final_file, "w", encoding="utf-8") as f:
        json.dump(parsed_questions, f, indent=2, ensure_ascii=False)
    
    # Clean progress file
    if os.path.exists(progress_file):
        os.remove(progress_file)
        
    print(f"Finished parsing. Saved to {final_file}")
    return parsed_questions

def upload_to_supabase(records):
    print(f"Uploading {len(records)} questions to Supabase...")
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    url = f"{supabase_url}/rest/v1/pyqs"
    
    chunk_size = 50
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        res = requests.post(url, headers=headers, json=chunk)
        if res.ok or res.status_code == 201:
            print(f"✅ Uploaded chunk {i//chunk_size + 1} ({len(chunk)} questions)")
        else:
            print(f"❌ Failed to upload chunk: {res.status_code} - {res.text}")

def main():
    for task in files_to_process:
        filepath = task["filename"]
        if not os.path.exists(filepath):
            print(f"⚠️ Text file not found: {filepath}. Skipping.")
            continue
            
        print("\n" + "="*60)
        print(f"Processing: {task['filename']} ({task['exam_type']} {task['paper_type']})")
        print("="*60)
        
        try:
            questions = process_file(filepath, task["paper_type"], task["subjects"], task["label"])
            
            # Format records for DB
            records = []
            for q in questions:
                records.append({
                    "paper_type": task["paper_type"],
                    "exam_type": task["exam_type"],
                    "subject": q.get("subject", task["subjects"][0]),
                    "topic": q.get("topic", None),
                    "question": q.get("question"),
                    "options": q.get("options"),
                    "correct_index": q.get("correct_index", q.get("correctIndex", 0)),
                    "explanation": q.get("explanation", ""),
                    "year": 2022
                })
                
            upload_to_supabase(records)
            print(f"🎉 Fully completed: {task['filename']}!")
        except Exception as e:
            print(f"❌ Aborted processing for {task['filename']}: {e}")
            print("You can run the script again and it will resume from where it failed!")

if __name__ == "__main__":
    main()
