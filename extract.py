import os
import json
import time

try:
    import google.generativeai as genai
except ImportError:
    print("Please install google-generativeai: pip install google-generativeai")
    exit(1)

# Using the API key you provided
genai.configure(api_key="AIzaSyD7tbBIrOdFfmAIlkbmO_r3RQk9OrsUUOI")

pdf_path = "BCI/Rajasthan Basic Computer Teacher 18 June 2022 (Paper 1) English.pdf"

print(f"Uploading {pdf_path} to Gemini...")
sample_file = genai.upload_file(path=pdf_path)

print(f"File uploaded: {sample_file.uri}")
print("Waiting for file processing...")
while sample_file.state.name == "PROCESSING":
    time.sleep(2)
    sample_file = genai.get_file(sample_file.name)

if sample_file.state.name == "FAILED":
    print("File processing failed.")
    exit(1)

print("File processed successfully. Extracting all questions (up to 100)...")
# We use Gemini 2.5 Flash as requested by the user previously
model = genai.GenerativeModel('gemini-2.5-flash')

prompt = """
Extract all multiple choice questions from this exam paper (up to 100).
Output ONLY a JSON array of objects with this exact structure:
[
  {
    "id": "bci_i_1",
    "subject": "General Studies",
    "question": "Question text here?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Brief explanation if possible, else empty string."
  }
]
Do not use markdown blocks like ```json. Output raw JSON only.
"""

response = model.generate_content([sample_file, prompt])

print("Extraction complete. Writing to output_bci_1.json...")
try:
    text = response.text
    if text.startswith("```json"):
        text = text[7:-3]
    elif text.startswith("```"):
        text = text[3:-3]
        
    # Attempt to parse to verify
    data = json.loads(text)
    print(f"Successfully extracted {len(data)} questions!")
    
    with open("output_bci_1.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("Success! You can now copy this JSON into src/data/fallbackTests.js")
except Exception as e:
    print("Error parsing or saving:", e)
    with open("output_bci_1_raw.txt", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Raw output saved to output_bci_1_raw.txt")
