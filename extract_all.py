import os
import json
import time
import requests

try:
    import google.generativeai as genai
except ImportError:
    print("Please install google-generativeai: pip install google-generativeai")
    exit(1)

# Load environment variables from .env file
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

if not gemini_key:
    print("Error: VITE_GEMINI_API_KEY is missing from .env")
    exit(1)

if not supabase_url or not supabase_key:
    print("Error: Supabase config is missing from .env")
    exit(1)

genai.configure(api_key=gemini_key)

# The PDFs to process
bci_dir = r"C:\Users\RAHUL\OneDrive\Desktop\BCI"
files_to_process = [
    {
        "filename": "Rajasthan Basic Computer Teacher 18 June 2022 (Paper 1) English.pdf",
        "paper_type": "Paper I",
        "label": "basic_p1",
        "subjects": ["Rajasthan History", "Rajasthan Geography", "Art and Culture", "General Science", "Current Affairs & Schemes", "General Ability (Quant & Reasoning)"]
    },
    {
        "filename": "Rajasthan Basic Computer Teacher 18 June 2022 (Paper 2) English.pdf",
        "paper_type": "Paper II",
        "label": "basic_p2",
        "subjects": ["Pedagogy", "Mental Ability", "Fundamentals of Computer", "Data Processing", "Programming Fundamentals", "Data structures and Algorithms", "Computer Organization and Operating System", "Communication and Network Concepts", "Network Security", "Database Management System", "System Analysis and Design", "Internet of Things and its application"]
    },
    {
        "filename": "Rajasthan Basic Computer Senior Teacher 19 June 2022 (Paper 1) English.pdf",
        "paper_type": "Paper I",
        "label": "senior_p1",
        "subjects": ["Rajasthan History", "Rajasthan Geography", "Art and Culture", "General Science", "Current Affairs & Schemes", "General Ability (Quant & Reasoning)"]
    },
    {
        "filename": "Rajasthan Basic Computer Senior Teacher 19 June 2022 (Paper 2) English.pdf",
        "paper_type": "Paper II",
        "label": "senior_p2",
        "subjects": ["Pedagogy", "Mental Ability", "Fundamentals of Computer", "Data Processing", "Programming Fundamentals", "Data structures and Algorithms", "Computer Organization and Operating System", "Communication and Network Concepts", "Network Security", "Database Management System", "System Analysis and Design", "Internet of Things and its application"]
    }
]

def upload_file_to_gemini(filepath):
    print(f"Uploading {os.path.basename(filepath)} to Gemini API...")
    uploaded = genai.upload_file(path=filepath)
    print(f"Uploaded. File URI: {uploaded.uri}")
    
    # Wait for processing
    while uploaded.state.name == "PROCESSING":
        print("Waiting for file to be processed...")
        time.sleep(3)
        uploaded = genai.get_file(uploaded.name)
        
    if uploaded.state.name == "FAILED":
        raise Exception("File processing failed on Gemini servers.")
    print("File processing complete!")
    return uploaded

def extract_questions_chunk(gemini_file, paper_type, subjects, start_q, end_q):
    print(f"Extracting Questions {start_q} to {end_q} from {gemini_file.display_name}...")
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
This document is a PDF of the Rajasthan RSSB Computer Instructor previous year exam paper.
Extract questions from number {start_q} to {end_q} (inclusive).

CRITICAL INSTRUCTIONS FOR DIAGRAMS/FIGURES:
- If any question contains a visual figure, diagram, chart, Venn diagram, seating arrangement circle/table, network topology, tree, or logical reasoning grid:
  - You MUST construct an accurate representation of it using ASCII/UTF-8 box-drawing characters (such as ┌, ┐, └, ┘, │, ─, ┼, ┬, ┴, ╭, ╮, ╯, ╰, arrows, etc.) inside a markdown code block.
  - Embed this code block directly at the very beginning of the "question" text field.
  - Label it clearly, e.g. "Figure: [Description]" or "Venn Diagram:".
  - Make sure the diagram represents the exact values and labels shown in the PDF image.

Output ONLY a JSON array of objects with this exact structure:
[
  {{
    "question": "Question text here (including the figure ASCII block at the start if applicable)",
    "subject": "Exactly one of: {', '.join(subjects)}",
    "topic": "A short 1-3 word key topic name (e.g. 'Soil Types', 'CPU Scheduling', 'Venn Diagrams')",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_index": 0, // Integer 0 for A, 1 for B, 2 for C, 3 for D
    "explanation": "Detailed step-by-step solution or explanation of why the correct option is correct."
  }}
]
Respond with valid, raw JSON. Do NOT include markdown code fences like ```json. Do NOT write conversational intros or explanation outside the JSON.
"""
    
    response = model.generate_content([gemini_file, prompt])
    text = response.text.strip()
    
    # Strip fences if returned
    if text.startswith("```json"):
        text = text[7:-3]
    elif text.startswith("```"):
        text = text[3:-3]
        
    return json.loads(text.strip())

def upload_to_supabase(records):
    print(f"Uploading {len(records)} questions to Supabase 'pyqs' table...")
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    url = f"{supabase_url}/rest/v1/pyqs"
    
    # Upload in chunks of 50 to prevent size limit issues
    chunk_size = 50
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        res = requests.post(url, headers=headers, json=chunk)
        if res.ok or res.status_code == 201:
            print(f"✅ Uploaded chunk {i//chunk_size + 1} ({len(chunk)} questions)")
        else:
            print(f"❌ Failed to upload chunk {i//chunk_size + 1}: {res.status_code} - {res.text}")

def main():
    for task in files_to_process:
        pdf_path = os.path.join(bci_dir, task["filename"])
        if not os.path.exists(pdf_path):
            print(f"⚠️ PDF file not found at: {pdf_path}. Skipping.")
            continue
            
        print("\n" + "="*50)
        print(f"Processing: {task['filename']}")
        print("="*50)
        
        try:
            gemini_file = upload_file_to_gemini(pdf_path)
            
            # Extract in two chunks of 50 questions each
            questions_1_50 = extract_questions_chunk(gemini_file, task["paper_type"], task["subjects"], 1, 50)
            print(f"Extracted {len(questions_1_50)} questions from first half.")
            
            questions_51_100 = extract_questions_chunk(gemini_file, task["paper_type"], task["subjects"], 51, 100)
            print(f"Extracted {len(questions_51_100)} questions from second half.")
            
            # Combine
            all_questions = questions_1_50 + questions_51_100
            print(f"Total extracted: {len(all_questions)} questions.")
            
            # Add metadata
            formatted_records = []
            for q in all_questions:
                formatted_records.append({
                    "paper_type": task["paper_type"],
                    "subject": q.get("subject", task["subjects"][0]),
                    "topic": q.get("topic", None),
                    "question": q.get("question"),
                    "options": q.get("options"),
                    "correct_index": q.get("correct_index", 0),
                    "explanation": q.get("explanation", ""),
                    "year": 2022
                })
                
            # Save locally for backup
            backup_filename = f"extracted_{task['label']}.json"
            with open(backup_filename, "w", encoding="utf-8") as f:
                json.dump(formatted_records, f, indent=2, ensure_ascii=False)
            print(f"Saved local backup to {backup_filename}")
            
            # Upload to Supabase
            upload_to_supabase(formatted_records)
            
            # Clean up uploaded file on Gemini server
            print("Cleaning up file from Gemini cloud...")
            genai.delete_file(gemini_file.name)
            
        except Exception as e:
            print(f"❌ Error processing {task['filename']}: {e}")

if __name__ == "__main__":
    main()
