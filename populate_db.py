import os
import json
import requests

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
supabase_url = env.get("VITE_SUPABASE_URL")
supabase_key = env.get("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env file.")
    exit(1)

print(f"Connecting to Supabase at: {supabase_url}")

# Headers for Supabase REST API
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates" # upsert behavior
}

# 1. Populate Syllabus
official_syllabus = [
    {
        "subject_key": "pedagogy",
        "subject_name": "Pedagogy",
        "official_description": "Teaching methods and learning theories, Bloom's taxonomy and learning objectives, Piaget theory and constructivism, Inclusive education and classroom management, Teaching aids and evaluation methods, Educational psychology and learning disabilities."
    },
    {
        "subject_key": "computer_fundamentals",
        "subject_name": "Fundamentals of Computer & MS Office",
        "official_description": "Overview of the Computer System including input-output devices, pointing devices, and scanner. Representation of Data (Digital versus Analog, Number System - Decimal, Binary & Hexadecimal), Introduction to Data Processing, Concepts of files and its types."
    },
    {
        "subject_key": "data_processing",
        "subject_name": "Data Processing",
        "official_description": "Word Processing (MS-Word), Spread Sheet Software (MS Excel), Presentation Software (MS Power Point), DBMS Software (MS-Access)."
    },
    {
        "subject_key": "programming_fundamentals",
        "subject_name": "Programming Fundamentals",
        "official_description": "Introduction to C, C++, Java, DotNet, Artificial Intelligence (AI), Machine learning, Python and Block Chain, Principles and Programming Techniques, Introduction of Object Oriented Programming (OOPs) concepts, Introduction to 'Integrated Development Environment' and its advantages."
    },
    {
        "subject_key": "data_structures",
        "subject_name": "Data structures and Algorithms",
        "official_description": "Algorithms for Problem Solving, Abstract data types, Arrays as data structures, linked list v/s array for storage, stack and stack operations, queues, binary trees, binary search trees, graphs and their representations, sorting and searching, symbol table. Data structure using C & C++."
    },
    {
        "subject_key": "computer_organization",
        "subject_name": "Computer Organization and Operating System",
        "official_description": "Basic Structure of Computers, Computer Arithmetic Operations, Central Processing Unit and Instructions, Memory Organization, I/O Organization, Operating Systems Overview, Process Management, Finding and processing files."
    },
    {
        "subject_key": "network_concepts",
        "subject_name": "Communication and Network Concepts",
        "official_description": "Introduction to Computer Networks, Introduction: Networks layers/Models, Networking Devices, Fundamentals of Mobile Communication."
    },
    {
        "subject_key": "network_security",
        "subject_name": "Network Security",
        "official_description": "Protecting Computer Systems from viruses & malicious attacks, Introduction to Firewalls and its utility, Backup & Restoring data, Networking (LAN & WAN) Security, Ethical Hacking."
    },
    {
        "subject_key": "dbms",
        "subject_name": "Database Management System",
        "official_description": "An Overview of the Database Management, Architecture of Database System, Relational Database Management System (RDBMS), Database Design, Manipulating Data, NoSQL Database Technologies, Selecting Right Database."
    },
    {
        "subject_key": "system_analysis",
        "subject_name": "System Analysis and Design",
        "official_description": "Introduction, Requirement Gathering and Feasibility Analysis, Structured Analysis, Structured Design, Object-Oriented Modelling Using UML, Testing, System Implementation and Maintenance, Other Software Development Approaches."
    },
    {
        "subject_key": "iot",
        "subject_name": "Internet of Things and its application",
        "official_description": "Introduction of Internet Technology and Protocol, LAN, MAN, WAN, Search Services Engines, Introduction to online & offline messaging, World Web Browsers, Web publishing, Basic knowledge HTML, XML, and Scripts, Creation & maintenance of Websites, HTML interactivity Tools, Multimedia and Graphics, Voice Mail and Video Conferencing, Introduction to e-Commerce."
    }
]

print("Uploading official syllabus details to Supabase...")
syllabus_url = f"{supabase_url}/rest/v1/syllabus_info"
res = requests.post(syllabus_url, headers=headers, json=official_syllabus)
if res.ok or res.status_code == 201:
    print("✅ Syllabus uploaded successfully!")
else:
    print(f"❌ Failed to upload syllabus: {res.status_code} - {res.text}")

# 2. Populate PYQs from output_bci_1.json
pyq_file = "output_bci_1.json"
if os.path.exists(pyq_file):
    print(f"Reading PYQs from {pyq_file}...")
    with open(pyq_file, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    # Prepare records
    pyq_records = []
    for idx, q in enumerate(questions):
        # Normalize and map fields
        pyq_records.append({
            "paper_type": "Paper I",
            "subject": q.get("subject", "General Studies"),
            "topic": q.get("topic", None),
            "question": q.get("question"),
            "options": q.get("options"),
            "correct_index": q.get("correctIndex", 0),
            "explanation": q.get("explanation", ""),
            "year": 2022
        })

    print(f"Uploading {len(pyq_records)} PYQs to Supabase...")
    pyqs_url = f"{supabase_url}/rest/v1/pyqs"
    
    # Batch request in chunks of 50 to prevent size limits
    chunk_size = 50
    for i in range(0, len(pyq_records), chunk_size):
        chunk = pyq_records[i:i + chunk_size]
        res = requests.post(pyqs_url, headers=headers, json=chunk)
        if res.ok or res.status_code == 201:
            print(f"✅ Uploaded chunk {i//chunk_size + 1} ({len(chunk)} questions)")
        else:
            print(f"❌ Failed to upload PYQ chunk {i//chunk_size + 1}: {res.status_code} - {res.text}")
else:
    print(f"⚠️ {pyq_file} not found. Skip uploading PYQs. Extract it first using extract.py.")
