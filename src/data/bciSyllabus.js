// Detailed Syllabus structure for the RSSB Rajasthan Computer Instructor (BCI) Exam
export const bciSyllabus = {
  examName: "RSSB Computer Instructor",
  papers: {
    "Paper I": {
      name: "Paper I (General Studies & Ability)",
      description: "100 Marks | 2.0 Hours | 100 Questions | 1/3 negative marking",
      subjects: [
        {
          id: "raj_history",
          name: "Rajasthan History",
          icon: "fa-landmark",
          topics: [
            "Rajput dynasties (Chauhan, Sisodia, etc.)",
            "Important rulers (Prithviraj Chauhan, Maharana Pratap, Rana Sanga, Rana Kumbha)",
            "Battles of Haldighati and Khanwa",
            "Freedom movement and Prajamandal movements in Rajasthan",
            "Integration of Rajasthan",
            "Important historical inscriptions",
            "Folk heroes and Lok Devtas (Tejaji, Pabuji, Gogaji, Ramdevji)",
            "Temples and historical forts of Rajasthan"
          ]
        },
        {
          id: "raj_geography",
          name: "Rajasthan Geography",
          icon: "fa-globe-asia",
          topics: [
            "Districts and physical regions",
            "Drainage system, rivers, dams, and lakes",
            "Thar Desert features",
            "Climate regions (including Koppen's classification)",
            "Soil types and distribution",
            "Mineral resources",
            "Irrigation projects",
            "National parks and Wildlife sanctuaries",
            "Demographics (Population census, literacy, sex ratio)",
            "Agriculture and major industries"
          ]
        },
        {
          id: "raj_art_culture",
          name: "Art and Culture",
          icon: "fa-palette",
          topics: [
            "Folk dances and folk songs of Rajasthan",
            "Traditional musical instruments",
            "Puppetry and local paintings",
            "Fairs, festivals, and customs",
            "Handicrafts and Kala academies",
            "Traditional costumes and jewellery",
            "Fort and temple architecture"
          ]
        },
        {
          id: "current_affairs",
          name: "Current Affairs & Schemes",
          icon: "fa-newspaper",
          topics: [
            "Rajasthan government schemes and initiatives",
            "State budget announcements and economic updates",
            "Sports events and personalities",
            "Awards and honors",
            "National and international current affairs",
            "Recent appointments and environmental updates"
          ]
        },
        {
          id: "general_ability",
          name: "General Ability (Quant & Reasoning)",
          icon: "fa-brain",
          topics: [
            "Logical Reasoning and Analytical Ability",
            "Decision Making and Problem Solving",
            "Basic Numeracy (numbers, order of magnitude - Class X level)",
            "Data Interpretation (charts, graphs, tables, data sufficiency)"
          ]
        }
      ]
    },
    "Paper II": {
      name: "Paper II (Computer Science & Pedagogy)",
      description: "100 Marks | 2.0 Hours | 100 Questions | 1/3 negative marking",
      subjects: [
        {
          id: "pedagogy",
          name: "Pedagogy",
          icon: "fa-chalkboard-teacher",
          topics: [
            "Teaching methods and learning theories",
            "Bloom's taxonomy and learning objectives",
            "Piaget theory and constructivism",
            "Inclusive education and classroom management",
            "Teaching aids and evaluation methods",
            "Educational psychology and learning disabilities"
          ]
        },
        {
          id: "computer_fundamentals",
          name: "Fundamentals of Computer & MS Office",
          icon: "fa-desktop",
          topics: [
            "Computer generations and hardware/software components",
            "Memory hierarchy (RAM, ROM, Cache, Registers)",
            "Number systems (binary, octal, decimal, hexadecimal conversions)",
            "Data representation and booting process",
            "MS Office formatting (Word, Excel formulas & charts, PowerPoint, MS Access queries)"
          ]
        },
        {
          id: "programming_fundamentals",
          name: "Programming Fundamentals & OOPs",
          icon: "fa-code",
          topics: [
            "Variables, data types, operators, loops, and functions",
            "Pointers, arrays, and string handling",
            "Object-Oriented Programming (OOP) concepts in C++ and Java",
            "Classes, objects, constructors, inheritance, polymorphism, encapsulation",
            "Exception handling and file handling in C++/Java",
            "Python basics, AI basics, Machine Learning, and Blockchain concepts"
          ]
        },
        {
          id: "dsa",
          name: "Data Structures and Algorithms",
          icon: "fa-project-diagram",
          topics: [
            "Arrays, Linked Lists, Stacks, Queues, and Circular Queues",
            "Trees, Binary Trees, and Binary Search Trees",
            "Graphs, BFS (Breadth First Search), and DFS (Depth First Search)",
            "Linear and Binary Search algorithms",
            "Sorting algorithms (Bubble, Selection, Insertion, Quick, Merge)"
          ]
        },
        {
          id: "operating_system",
          name: "Operating Systems",
          icon: "fa-cog",
          topics: [
            "Process and Thread management, process states",
            "CPU Scheduling algorithms (FCFS, SJF, Priority, Round Robin)",
            "Deadlock prevention, avoidance, detection, and recovery",
            "Memory management, paging, segmentation, and virtual memory",
            "File systems, disk scheduling, and Linux shell programming"
          ]
        },
        {
          id: "networking",
          name: "Networking & Communication",
          icon: "fa-network-wired",
          topics: [
            "OSI and TCP/IP reference models",
            "Data communication terminologies and transmission media",
            "Network devices (hubs, switches, routers, gateways)",
            "IP and MAC addressing (IPv4/IPv6 subnetting)",
            "Routing protocols and switching techniques",
            "Wireless networks, WiFi, WiMAX, and mobile communication basics"
          ]
        },
        {
          id: "dbms",
          name: "DBMS & SQL",
          icon: "fa-database",
          topics: [
            "DBMS vs RDBMS architecture",
            "ER modeling and relational algebra",
            "Keys (Primary, Foreign, Candidate, Super keys)",
            "Normalization (1NF, 2NF, 3NF, BCNF)",
            "SQL commands (DDL, DML, DCL: SELECT, JOINs, UPDATE, DELETE)",
            "Transactions, ACID properties, and NoSQL databases"
          ]
        },
        {
          id: "cyber_security",
          name: "Cyber Security & Web Technology",
          icon: "fa-shield-alt",
          topics: [
            "Firewalls, antivirus, and malware (viruses, worms, trojans)",
            "Encryption and hashing basics (cryptography)",
            "DOS/DDOS attacks and network security fundamentals",
            "Web technology: HTML tags, CSS, XML, URLs, hosting",
            "System Analysis and Design (SDLC, software models: Waterfall, Spiral, Prototype)"
          ]
        }
      ]
    }
  }
};
