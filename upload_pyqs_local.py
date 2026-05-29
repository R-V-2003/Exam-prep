import os
import re
import json
import requests
from dotenv import load_dotenv

load_dotenv()
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase credentials in .env file.")
    exit(1)

def build_figure(figure_text):
    text = figure_text.lower()
    if "binary search tree with root 50" in text:
        return """
```text
          50
        /    \\
      30      63
     /  \\    /  \\
   15   43  59  77
  / \\   / \\    /  \\
 10 25 36 48  73  81
```
"""
    if "pie chart showing \"books in bad condition\"" in text:
        return """
```text
Tamil 27%, Kannada 23%, English 20%, Telugu 16%, Hindi 14%
```
"""
    if "pie chart showing the percentage distribution of tickets" in text:
        return """
```text
PVR 10%, Cinepolis 20%, Mukta A2 16%, Rangmahal Cineplex 24%, Jyoti Cineplex 30%
```
"""
    if "binary tree structure with root node 100" in text:
        return """
```text
        100
       /   \\
     19     36
    /  \\   /  \\
  17    3 25   1
 /  \\
2    7
```
"""
    if "pie chart with segments a 20%, b 30%" in text:
        return """
```text
A: 20%, B: 30%, C: 5%, D: 8%, E: 12%, F: 15%, G: 10%
```
"""
    return f"\n```text\n{figure_text}\n```\n"

files_to_process = [
    {
        "filename": "Rajasthan_Computer_Teacher_18_June_2022_Paper_1.txt",
        "paper_type": "Paper I",
        "exam_type": "Basic",
        "subject": "General Ability"
    },
    {
        "filename": "Rajasthan_Computer_Teacher_18_June_2022_Paper_2.txt",
        "paper_type": "Paper II",
        "exam_type": "Basic",
        "subject": "Computer Science"
    },
    {
        "filename": "Rajasthan_Computer_Teacher_Paper1.txt",
        "paper_type": "Paper I",
        "exam_type": "Senior",
        "subject": "General Ability"
    },
    {
        "filename": "Rajasthan_Computer_Teacher_Paper2.txt",
        "paper_type": "Paper II",
        "exam_type": "Senior",
        "subject": "Computer Science"
    }
]

def parse_file(task):
    filepath = task["filename"]
    print(f"Parsing {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all questions: from 1 to 100
    content = "\n" + content.strip()
    questions = []
    
    for q_num in range(1, 101):
        start_str = f"\n{q_num}. "
        end_str = f"\n{q_num+1}. " if q_num < 100 else None
        
        start_idx = content.find(start_str)
        if start_idx == -1:
            # Fallback if there is a typo like '100.' instead of '100. '
            start_str = f"\n{q_num}."
            start_idx = content.find(start_str)
            if start_idx == -1:
                print(f"Warning: Could not find question {q_num} in {filepath}")
                continue
                
        if end_str:
            end_idx = content.find(end_str, start_idx)
            if end_idx == -1:
                end_str_fallback = f"\n{q_num+1}."
                end_idx = content.find(end_str_fallback, start_idx)
                if end_idx == -1:
                    end_idx = len(content)
        else:
            end_idx = len(content)
            
        block = content[start_idx:end_idx].strip()
        # Remove the leading number and dot
        block = re.sub(r"^\d+\.\s*", "", block)
        
        lines = block.split("\n")
        
        en_q = []
        hi_q = []
        options = ["", "", "", ""]
        
        state = "EN_Q" # EN_Q, EN_OPT, HI_Q, HI_OPT
        
        for line in lines:
            line_str = line.strip()
            if not line_str: continue
            
            # Check for figure
            if "[Figure:" in line_str:
                fig_match = re.search(r"\[Figure:(.*?)\]", line_str)
                if fig_match:
                    fig_desc = fig_match.group(1).strip()
                    diagram = build_figure(fig_desc)
                    if state == "EN_Q":
                        en_q.append(diagram)
                    elif state == "HI_Q":
                        hi_q.append(diagram)
                continue
            
            is_opt = re.match(r"^\(([A-D1-4])\)\s+(.*)", line_str)
            if is_opt:
                opt_letter = is_opt.group(1)
                opt_val = is_opt.group(2)
                
                # Map 1-4 to A-D if needed
                if opt_letter == "1": opt_letter = "A"
                if opt_letter == "2": opt_letter = "B"
                if opt_letter == "3": opt_letter = "C"
                if opt_letter == "4": opt_letter = "D"
                
                try:
                    idx = ord(opt_letter) - ord('A')
                except TypeError:
                    idx = 0
                
                if idx < 0 or idx > 3:
                    # If somehow it's not A-D, just ignore as option
                    pass
                else:
                    if state == "EN_Q" or state == "EN_OPT":
                        state = "EN_OPT"
                        options[idx] = opt_val
                    elif state == "HI_Q" or state == "HI_OPT":
                        state = "HI_OPT"
                        if options[idx]:
                            options[idx] += " / " + opt_val
                        else:
                            options[idx] = opt_val
                    continue
            
            # If not an option, append to question
            if state == "EN_OPT":
                state = "HI_Q"
                hi_q.append(line_str)
            elif state == "EN_Q":
                en_q.append(line_str)
            elif state == "HI_Q":
                hi_q.append(line_str)
            elif state == "HI_OPT":
                # Extra lines in Hindi option? Add to last option
                for idx in reversed(range(4)):
                    if options[idx]:
                        options[idx] += " " + line_str
                        break
                    
        q_text = "\n".join(en_q)
        if hi_q:
            q_text += "\n\n" + "\n".join(hi_q)
            
        questions.append({
            "paper_type": f"{task['exam_type']} - {task['paper_type']}",
            "subject": task["subject"],
            "topic": "PYQ",
            "question": q_text,
            "options": options,
            "correct_index": 0,
            "explanation": "",
            "year": 2022
        })
        
    return questions

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
            print(f"Uploaded chunk {i//chunk_size + 1} ({len(chunk)} questions)")
        else:
            print(f"Failed to upload chunk: {res.status_code} - {res.text}")

def main():
    all_records = []
    for task in files_to_process:
        if not os.path.exists(task["filename"]):
            print(f"⚠️ Text file not found: {task['filename']}. Skipping.")
            continue
        records = parse_file(task)
        print(f"Parsed {len(records)} questions from {task['filename']}")
        all_records.extend(records)
        
    if all_records:
        upload_to_supabase(all_records)
        print("Done!")

if __name__ == "__main__":
    main()
