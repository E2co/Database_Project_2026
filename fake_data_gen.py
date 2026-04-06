import random
from faker import Faker
import datetime

# Create an instance of the Faker class
fake = Faker()

# ─── REALISTIC ACADEMIC CONTENT GENERATORS ───────────────────────────────────

# Event descriptions for different event types
EVENT_DESCRIPTIONS = {
    "Lecture": [
        "Topics will include key concepts and practical applications.",
        "Required attendance for comprehensive understanding of material.",
        "Bring notes and any reference materials you may need.",
        "Interactive session with live examples and case studies.",
        "Focus on theoretical foundations and real-world applications.",
        "Covers material from chapters specified in syllabus.",
        "Attendance will be taken. Questions encouraged.",
        "Part of the core material for the mid-term assessment.",
    ],
    "Lab": [
        "Hands-on practical session with guided exercises.",
        "Come prepared with assignment materials from previous lesson.",
        "Work in groups to complete lab experiments and analysis.",
        "Results should be documented for your submission.",
        "Attendance is mandatory for grading purposes.",
        "Bring your field notebook and measurement tools.",
        "Learn practical skills applicable to real-world scenarios.",
        "Submit lab report within one week of completion.",
    ],
    "Assignment Due": [
        "Submit completed assignment through the course portal.",
        "Late submissions will incur a 10% penalty per day.",
        "Please follow the formatting guidelines provided.",
        "Show all work and justify your reasoning.",
        "Refer to the rubric for grading criteria.",
        "This counts as 15% of your final grade.",
        "Group work permitted; cite all sources properly.",
        "Email professor with any technical submission issues.",
    ],
    "Exam": [
        "Comprehensive exam covering all course material to date.",
        "Expected duration: 2 hours. Bring student ID.",
        "Non-programmable calculator permitted.",
        "Closed book unless noted otherwise in syllabus.",
        "Review session scheduled for the day before.",
        "Format: Multiple choice, short answer, and essay questions.",
        "Arrive 15 minutes early to your assigned seat.",
        "This exam comprises 30% of your final grade.",
    ],
    "Tutorial": [
        "Review of recent lecture content with Q&A.",
        "Instructor will work through sample problems step-by-step.",
        "Bring questions from assignments or lectures.",
        "Optional: bring your draft work for feedback.",
        "Recording will be available for students unable to attend.",
        "Focus on commonly misunderstood concepts.",
        "Opportunity to clarify any confusing material before assessment.",
        "Highly recommended for students seeking clarification.",
    ]
}

# Generic academic discussion starters for forums
DISCUSSION_STARTERS = [
    "Does anyone have suggestions on how to approach this concept?",
    "I found an interesting resource on this topic. Check it out: {topic}",
    "Can someone explain how {topic} applies to real-world scenarios?",
    "What are the key differences between {topic} and {related_topic}?",
    "For the assignment, how did everyone interpret this requirement?",
    "I'm struggling with step {step} of the assignment. Any tips?",
    "Great lecture today. I'd like to discuss {topic} further.",
    "Does anyone want to form a study group for the upcoming exam?",
    "I found an error in my work. Here's what I did differently...",
    "Can we discuss the pros and cons of this {topic}?",
    "The reading for this week touched on {topic}. Thoughts?",
    "Looking for clarification on the lab procedure from last week.",
    "Has anyone completed the research task yet? Results being shared?",
    "I have a different perspective on {topic}. Thoughts?",
    "Quick question about the grading criteria for the assignment.",
]

# Discussion responses (common academic replies)
DISCUSSION_RESPONSES = [
    "Good question! I think the key is understanding {concept}. That's essential.",
    "I approached it the same way. The important thing is {key_point}.",
    "I had the same confusion at first. What helped me was {solution}.",
    "Great point! That's a really insightful observation about {topic}.",
    "I appreciate the clarity. This connects well with what we discussed previously.",
    "Excellent summary! You've captured the main points well.",
    "Your approach is solid. Another way to think about it is through {concept}.",
    "I respectfully disagree. I believe there's a different perspective because of the fundamentals.",
    "This is a great area of discussion. The key distinction is {key_point}.",
    "Couldn't have said it better myself. Well explained!",
]

# Topic-specific keywords and concepts (used in content generation)
TOPIC_KEYWORDS = {
    "COMP": ["algorithm", "data structure", "optimization", "complexity", "implementation"],
    "MATH": ["theorem", "proof", "equation", "formula", "problem set"],
    "PHYS": ["experiment", "hypothesis", "observation", "measurement", "pendulum"],
    "BIOL": ["species", "ecosystem", "organism", "cell", "reproduction"],
    "CHEM": ["reaction", "compound", "element", "molecule", "titration"],
    "GEOG": ["region", "climate", "population", "infrastructure", "geospatial"],
    "ECON": ["supply", "demand", "market", "GDP", "inflation"],
    "PSYC": ["behavior", "cognition", "stimulus", "response", "development"],
    "SOCI": ["society", "culture", "norms", "institutions", "social change"],
    "EENG": ["circuit", "voltage", "current", "impedance", "signal"],
    "CENG": ["structure", "load", "foundation", "soil", "hydraulics"],
    "MSBM": ["profit", "revenue", "strategy", "management", "stakeholder"],
    "GOVN": ["policy", "legislation", "governance", "rights", "institution"],
    "MED": ["diagnosis", "treatment", "symptoms", "patient", "clinical"],
    "NURS": ["care", "patient", "vital signs", "medication", "recovery"],
    "PHAR": ["medication", "dosage", "interaction", "side effects", "pharmacokinetics"],
}

# Function to generate realistic event descriptions
def generate_event_description(event_type, dept_code):
    descriptions = EVENT_DESCRIPTIONS.get(event_type, EVENT_DESCRIPTIONS["Lecture"])
    base_desc = random.choice(descriptions)
    return base_desc.replace("'", "''")

# Function to generate realistic forum thread content
def generate_forum_thread(dept_code):
    keywords = TOPIC_KEYWORDS.get(dept_code, ["topic", "concept", "material"])
    topic = random.choice(keywords)
    related = random.choice(keywords)
    
    starter = random.choice(DISCUSSION_STARTERS)
    content = starter.format(topic=topic, related_topic=related, step=random.randint(1, 5))
    return content.replace("'", "''")

# Function to generate realistic forum replies
def generate_forum_reply(dept_code):
    keywords = TOPIC_KEYWORDS.get(dept_code, ["topic", "concept", "material"])
    concept = random.choice(keywords)
    key_point = random.choice(["the methodology", "the approach", "the distinction", "the foundation"])
    solution = random.choice(["reviewing the textbook", "thinking about it differently", "referring back to the lecture notes"])
    
    response = random.choice(DISCUSSION_RESPONSES)
    content = response.format(concept=concept, key_point=key_point, solution=solution, topic=concept)
    return content.replace("'", "''")

# ─── CONFIGURATION ───────────────────────────────────────────────────────────
# Set REGENERATE_MODE to:
#   "all"          - regenerate all SQL files (Lecturers, Courses, Students, Enrollments, Calendar, Forums, Threads)
#   "forums_only"  - regenerate only Calendar Events, Forums, and Discussion Threads (faster, keeps existing tables)
REGENERATE_MODE = "all"

NUM_LECTURERS = 750
NUM_COURSES = 3400
NUM_STUDENTS = 150000
ENROLLMENT_DATE = "2024-09-02"

MAJORS = {
    "Science & Technology": ("Computer Science", "Information Technology", "Software Engineering", 
                             "Actuarial Sciences", "Electronics & Computer Science", "General Physics", 
                             "Materials Science", "Biochemistry", "Biotechnology", "Microbiology", 
                             "Applied Chemistry", "General Chemistry", "Environmental Chemistry", "Food Chemistry", 
                             "Animal Biology", "Plant Biology", "Marine Biology", "Horticulture", "Geography", "Geology", "Human Geography"),
    
    "Engineering":          ("Biomedical Engineering", "Civil Engineering", 
                             "Electrical Power Engineering", "Electronics Engineering", "Computer Engineering"),

    "Social Sciences":      ("Economics", "Economics & Statistics", "Banking & Finance", 
                             "Psychology", "Sociology", "Social Anthropology", "Political Science",
                             "International Relations", "Public Policy & Management", "Accounting", "Marketing", "Entrepreneurship", "Tourism Management"),
    
    "Medical Sciences":     ("MBBS - Medicine & Surgery", "DDS - Doctor of Dental Surgery", 
                             "BSc Nursing", "BSc Physical Therapy", "BSc Pharmacy", "BSc Radiological Sciences")
}

FACULTIES = {
    "Science & Technology": ("Computing", ["COMP"], "Mathematics", ["MATH"], "Physics", ["PHYS"], 
                             "Biology", ["BIOL"], "Chemistry", ["CHEM"], "Life Sciences", ["BIOL"], "Geography & Geology", ["GEOG"]),
    
    "Engineering":          ("Biomedical Engineering", ["BMNG"], "Civil Engineering", ["CENG"], 
                             "Electrical Power Engineering", ["EPNG"], "Electronics Engineering", ["EENG"]),

    "Social Sciences":      ("Economics", ["ECON"], "Psychology", ["PSYC"], "Sociology", ["SOCI"],
                             "Mona School of Business & Management", ["MSBM"], "Government", ["GOVN"]),
    
    "Medical Sciences":     ("Medicine", ["MED"], "Nursing", ["NURS"], "Pharmacy", ["PHAR"],)
}

MAJOR_COURSES = {

    # ── SCIENCE & TECHNOLOGY ─────────────────────────────────────────────────

    # Computing department
    "Computer Science": ("COMP", ["Algorithms", "Data Structures", "Operating Systems",
                                   "Machine Learning", "Databases", "Networks",
                                   "Software Engineering", "Cybersecurity", "AI", "Cloud Computing"]),
    "Information Technology": ("COMP", ["Web Development", "Database Management", "Networking",
                                         "IT Project Management", "Cybersecurity", "Cloud Computing",
                                         "Systems Analysis", "Mobile Development", "IT Support", "Data Management"]),
    "Software Engineering": ("COMP", ["Software Design Patterns", "Agile Development", "Version Control",
                                       "Testing & QA", "DevOps", "System Architecture",
                                       "Requirements Engineering", "Code Review", "CI/CD", "API Design"]),
    "Electronics & Computer Science": ("COMP", ["Digital Logic", "Embedded Systems", "Microprocessors",
                                                  "Computer Architecture", "Signal Processing",
                                                  "VLSI Design", "Real-Time Systems", "IoT", "Robotics", "Networks"]),

    # Mathematics department
    "Actuarial Sciences": ("MATH", ["Probability", "Financial Mathematics", "Risk Theory",
                                     "Statistics", "Life Contingencies", "Stochastic Processes",
                                     "Actuarial Modelling", "Econometrics", "Pension Mathematics", "Insurance"]),

    # Physics department
    "General Physics": ("PHYS", ["Classical Mechanics", "Thermodynamics", "Electromagnetism",
                                   "Quantum Mechanics", "Optics", "Nuclear Physics",
                                   "Astrophysics", "Relativity", "Fluid Dynamics", "Particle Physics"]),
    "Materials Science": ("PHYS", ["Crystallography", "Polymer Science", "Thermodynamics",
                                    "Nanomaterials", "Mechanical Properties", "Electronic Materials",
                                    "Surface Science", "Composite Materials", "Corrosion", "Materials Characterisation"]),

    # Chemistry department
    "Applied Chemistry": ("CHEM", ["Organic Chemistry", "Inorganic Chemistry", "Analytical Chemistry",
                                    "Electrochemistry", "Catalysis", "Industrial Chemistry",
                                    "Polymer Science", "Spectroscopy", "Thermochemistry", "Physical Chemistry"]),
    "General Chemistry": ("CHEM", ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry",
                                    "Analytical Chemistry", "Biochemistry", "Polymer Science",
                                    "Electrochemistry", "Spectroscopy", "Thermochemistry", "Catalysis"]),
    "Environmental Chemistry": ("CHEM", ["Atmospheric Chemistry", "Water Chemistry", "Soil Chemistry",
                                          "Toxicology", "Green Chemistry", "Pollution Analysis",
                                          "Environmental Monitoring", "Analytical Chemistry", "Geochemistry", "Waste Management"]),
    "Food Chemistry": ("CHEM", ["Food Analysis", "Food Additives", "Nutritional Biochemistry",
                                  "Food Safety", "Sensory Evaluation", "Food Processing Chemistry",
                                  "Flavour Chemistry", "Packaging Science", "Fermentation", "Quality Control"]),

    # Biology / Life Sciences department
    "Biochemistry": ("BIOL", ["Metabolic Biochemistry", "Molecular Biology", "Enzymology",
                               "Cell Signalling", "Protein Structure", "Nucleic Acid Biochemistry",
                               "Lipid Metabolism", "Carbohydrate Metabolism", "Bioenergetics", "Genetics"]),
    "Biotechnology": ("BIOL", ["Genetic Engineering", "Fermentation Technology", "Bioinformatics",
                                "Cell Culture", "Recombinant DNA Technology", "Biosensors",
                                "Industrial Biotechnology", "Agricultural Biotechnology", "Bioprocessing", "Genomics"]),
    "Microbiology": ("BIOL", ["Bacteriology", "Virology", "Mycology", "Microbial Ecology",
                               "Medical Microbiology", "Immunology", "Environmental Microbiology",
                               "Industrial Microbiology", "Microbial Genetics", "Parasitology"]),
    "Animal Biology": ("BIOL", ["Zoology", "Animal Physiology", "Comparative Anatomy",
                                  "Ethology", "Ecology", "Evolutionary Biology",
                                  "Entomology", "Herpetology", "Ornithology", "Marine Zoology"]),
    "Plant Biology": ("BIOL", ["Botany", "Plant Physiology", "Plant Ecology",
                                "Plant Genetics", "Ethnobotany", "Plant Pathology",
                                "Plant Biochemistry", "Bryology", "Algology", "Seed Science"]),
    "Marine Biology": ("BIOL", ["Marine Ecology", "Oceanography", "Marine Zoology",
                                  "Coral Reef Biology", "Marine Microbiology", "Marine Biochemistry",
                                  "Fisheries Science", "Marine Conservation", "Phycology", "Ichthyology"]),
    "Horticulture": ("BIOL", ["Crop Production", "Soil Science", "Plant Pathology",
                               "Post-Harvest Physiology", "Landscape Design", "Irrigation Management",
                               "Plant Breeding", "Greenhouse Management", "Pomology", "Vegetable Crops"]),

    # Geography & Geology department
    "Geography": ("GEOG", ["Physical Geography", "Human Geography", "Cartography",
                             "GIS & Remote Sensing", "Climate & Meteorology", "Geomorphology",
                             "Urban Geography", "Environmental Geography", "Population Geography", "Regional Planning"]),
    "Geology": ("GEOG", ["Mineralogy", "Petrology", "Stratigraphy",
                           "Structural Geology", "Geochemistry", "Palaeontology",
                           "Hydrogeology", "Volcanology", "Sedimentology", "Engineering Geology"]),
    "Human Geography": ("GEOG", ["Urban Geography", "Population Studies", "Cultural Geography",
                                   "Political Geography", "Economic Geography", "Social Geography",
                                   "Transport Geography", "Health Geography", "Tourism Geography", "GIS"]),

    # ── ENGINEERING ──────────────────────────────────────────────────────────

    "Biomedical Engineering": ("BMNG", ["Biomechanics", "Medical Imaging", "Biomedical Instrumentation",
                                         "Tissue Engineering", "Biomaterials", "Physiological Modelling",
                                         "Rehabilitation Engineering", "Clinical Engineering", "Signal Processing", "Bioinformatics"]),
    "Civil Engineering": ("CENG", ["Structural Design", "Fluid Mechanics", "Geotechnical Engineering",
                                    "Transportation Engineering", "Environmental Engineering", "Surveying",
                                    "Construction Management", "Hydraulics", "Concrete Technology", "Project Management"]),
    "Electrical Power Engineering": ("EPNG", ["Power Systems", "High Voltage Engineering", "Electrical Machines",
                                               "Power Electronics", "Renewable Energy", "Control Systems",
                                               "Transmission & Distribution", "Smart Grids", "Circuit Analysis", "Energy Management"]),
    "Electronics Engineering": ("EENG", ["Circuit Analysis", "Digital Electronics", "Microelectronics",
                                          "Signal Processing", "Telecommunications", "Embedded Systems",
                                          "VLSI Design", "Control Systems", "Antenna Design", "RF Engineering"]),
    "Computer Engineering": ("EENG", ["Computer Architecture", "Embedded Systems", "Digital Logic",
                                       "Operating Systems", "Microprocessors", "VLSI Design",
                                       "Real-Time Systems", "Networks", "IoT", "Hardware-Software Co-Design"]),

    # ── SOCIAL SCIENCES ──────────────────────────────────────────────────────

    # Economics department
    "Economics": ("ECON", ["Microeconomics", "Macroeconomics", "Econometrics",
                             "Development Economics", "International Trade", "Public Finance",
                             "Labour Economics", "Game Theory", "Financial Economics", "Urban Economics"]),
    "Economics & Statistics": ("ECON", ["Microeconomics", "Macroeconomics", "Econometrics",
                                         "Probability", "Statistical Inference", "Time Series Analysis",
                                         "Regression Analysis", "Game Theory", "Financial Statistics", "Survey Methods"]),
    "Banking & Finance": ("ECON", ["Financial Markets", "Corporate Finance", "Banking Operations",
                                    "Investment Analysis", "Risk Management", "Financial Modelling",
                                    "International Finance", "Monetary Economics", "Portfolio Management", "Derivatives"]),

    # Psychology department
    "Psychology": ("PSYC", ["Cognitive Psychology", "Developmental Psychology", "Social Psychology",
                              "Abnormal Psychology", "Neuroscience", "Behavioural Analysis",
                              "Research Methods", "Clinical Psychology", "Forensic Psychology", "Health Psychology"]),

    # Sociology department
    "Sociology": ("SOCI", ["Social Theory", "Research Methods", "Cultural Sociology",
                             "Urban Sociology", "Gender Studies", "Race and Ethnicity",
                             "Political Sociology", "Medical Sociology", "Criminology", "Globalisation"]),
    "Social Anthropology": ("SOCI", ["Cultural Anthropology", "Ethnographic Methods", "Social Theory",
                                      "Caribbean Societies", "Gender & Culture", "Political Anthropology",
                                      "Medical Anthropology", "Economic Anthropology", "Kinship Studies", "Religion & Ritual"]),

    # Government department
    "Political Science": ("GOVN", ["Political Theory", "Comparative Politics", "Caribbean Politics",
                                    "Public Administration", "International Relations", "Constitutional Law",
                                    "Electoral Systems", "Political Economy", "Governance", "Diplomacy"]),
    "International Relations": ("GOVN", ["International Law", "Diplomacy", "Global Governance",
                                          "Foreign Policy Analysis", "International Security", "Political Economy",
                                          "Caribbean Foreign Policy", "Human Rights", "International Organisations", "Conflict Resolution"]),
    "Public Policy & Management": ("GOVN", ["Public Administration", "Policy Analysis", "Governance",
                                             "Development Policy", "Budgeting & Finance", "Project Management",
                                             "Ethics in Public Service", "E-Government", "Regulatory Frameworks", "Strategic Planning"]),

    # Mona School of Business & Management
    "Accounting": ("MSBM", ["Financial Accounting", "Management Accounting", "Auditing",
                              "Taxation", "Corporate Finance", "Accounting Information Systems",
                              "Forensic Accounting", "Cost Accounting", "Financial Reporting", "Business Law"]),
    "Marketing": ("MSBM", ["Consumer Behaviour", "Marketing Research", "Digital Marketing",
                             "Brand Management", "Advertising", "Sales Management",
                             "International Marketing", "Marketing Strategy", "Social Media Marketing", "E-Commerce"]),
    "Entrepreneurship": ("MSBM", ["Business Planning", "Innovation Management", "Venture Capital",
                                    "Small Business Management", "Social Entrepreneurship", "Marketing",
                                    "Financial Management", "Legal Aspects of Business", "Leadership", "E-Commerce"]),
    "Tourism Management": ("MSBM", ["Tourism Planning", "Hospitality Management", "Ecotourism",
                                     "Event Management", "Tourism Marketing", "Hotel Operations",
                                     "Heritage Tourism", "Sustainable Tourism", "Caribbean Tourism", "Tourism Economics"]),

    # ── MEDICAL SCIENCES ─────────────────────────────────────────────────────

    "MBBS - Medicine & Surgery": ("MED", ["Anatomy", "Physiology", "Biochemistry",
                                           "Pathology", "Pharmacology", "Clinical Medicine",
                                           "Surgery", "Paediatrics", "Obstetrics & Gynaecology", "Psychiatry"]),
    "DDS - Doctor of Dental Surgery": ("MED", ["Dental Anatomy", "Oral Pathology", "Oral Surgery",
                                                 "Periodontics", "Orthodontics", "Restorative Dentistry",
                                                 "Endodontics", "Prosthodontics", "Paediatric Dentistry", "Dental Pharmacology"]),
    "BSc Nursing": ("NURS", ["Fundamentals of Nursing", "Medical-Surgical Nursing", "Pharmacology",
                               "Mental Health Nursing", "Paediatric Nursing", "Community Health Nursing",
                               "Obstetric Nursing", "Nursing Research", "Critical Care Nursing", "Nursing Ethics"]),
    "BSc Physical Therapy": ("NURS", ["Musculoskeletal Physiotherapy", "Neurological Rehabilitation", "Anatomy",
                                       "Exercise Physiology", "Cardiopulmonary Therapy", "Sports Physiotherapy",
                                       "Paediatric Physiotherapy", "Electrotherapy", "Research Methods", "Clinical Practice"]),
    "BSc Pharmacy": ("PHAR", ["Pharmaceutics", "Pharmacology", "Medicinal Chemistry",
                               "Pharmacokinetics", "Clinical Pharmacy", "Pharmaceutical Analysis",
                               "Pharmacy Law & Ethics", "Therapeutics", "Pharmacognosy", "Drug Delivery"]),
    "BSc Radiological Sciences": ("PHAR", ["Radiographic Anatomy", "Radiographic Technique", "Radiation Physics",
                                             "Radiographic Pathology", "CT & MRI Imaging", "Interventional Radiology",
                                             "Radiation Protection", "Nuclear Medicine", "Ultrasonography", "Clinical Practice"]),
}

# dept_name -> code,  e.g. "Computing" -> "COMP"
dept_code = {
    FACULTIES[faculty][i]: FACULTIES[faculty][i + 1][0]
    for faculty in FACULTIES
    for i in range(0, len(FACULTIES[faculty]), 2)
    if isinstance(FACULTIES[faculty][i], str)
}

dept_names = list(dept_code.keys())

# dept_name -> faculty,  e.g. "Computing" -> "Science & Technology"
dept_to_faculty = {
    FACULTIES[faculty][i]: faculty
    for faculty in FACULTIES
    for i in range(0, len(FACULTIES[faculty]), 2)
    if isinstance(FACULTIES[faculty][i], str)
}

# prefix -> [major names whose DEPARTMENTS entry uses that prefix]
# e.g. "COMP" -> ["Computer Science", "Information Technology", ...]
prefix_to_majors = {}
for major, (prefix, _) in MAJOR_COURSES.items():
    prefix_to_majors.setdefault(prefix, []).append(major)

# dept_name -> [major names that belong to it]
# used so a lecturer only teaches courses from their own department
dept_to_majors = {
    dept: prefix_to_majors.get(dept_code[dept], [])
    for dept in dept_names
}

# faculty -> [course_ids] — built after course generation, used for student enrollment
faculty_courses = {faculty: [] for faculty in FACULTIES}

# major -> faculty
major_to_faculty = {
    major: faculty
    for faculty, majors in MAJORS.items()
    for major in majors
}



# Lecturers ────────────────────────────────────────────────────────────────────
lecturer_ids = []
lecturer_dept = {}
lecturer_courses_count = {}
lecturer_data = []  # Collect data before writing to file

for n in range(1, NUM_LECTURERS + 1):
    name = fake.name().replace("'", "''")
    dept = random.choice(dept_names)
    lid = f"{dept_code[dept]}{n}"
    lecturer_ids.append(lid)
    lecturer_dept[lid] = dept
    lecturer_courses_count[lid] = 0
    lecturer_data.append(f"INSERT INTO Lecturer VALUES ('{lid}', '{name}', '{dept}');\n")

if REGENERATE_MODE != "forums_only":
    f = open("OURVLE_Clone_Lecturers.sql", "w")
    f.write("USE OURVLECloneDatabase;\n")
    f.write("TRUNCATE TABLE Lecturer;\n\n")
    f.write(" ──── Lecturers ────────────────────────────────────────────────────────────────────\n")
    f.writelines(lecturer_data)
    f.write("\n")
    f.close()
    print("✓ Generated OURVLE_Clone_Lecturers.sql")
else:
    print("⊘ Skipped OURVLE_Clone_Lecturers.sql (forums_only mode)")


# Courses ────────────────────────────────────────────────────────────────────
course_ids = [f"C{str(cid).zfill(3)}" for cid in range(1, NUM_COURSES + 1)]
shuffled_courses = course_ids[:]
random.shuffle(shuffled_courses)

course_lecturer = {}

for x, lid in enumerate(lecturer_ids):
    course_lecturer[shuffled_courses[x]] = lid
    lecturer_courses_count[lid] += 1

for cid in shuffled_courses[NUM_LECTURERS:]:
    eligible = [lid for lid in lecturer_ids if lecturer_courses_count[lid] < 5]
    lid = random.choice(eligible)
    course_lecturer[cid] = lid
    lecturer_courses_count[lid] += 1

assigned_codes = set()
course_faculty = {}
course_major = {}
course_data = []

for cid in course_ids:
    lid = course_lecturer[cid]
    dept = lecturer_dept[lid]
    faculty = dept_to_faculty[dept]

    majors_in_dept = dept_to_majors[dept]
    major = random.choice(majors_in_dept)
    prefix, topics = MAJOR_COURSES[major]
    
    topic = random.choice(topics)
    level = random.choice(['I', 'II', 'III', 'IV'])
    name = f"{topic} {level}".replace("'", "'")

    while True:
        code = f"{prefix}{random.randint(1000, 9999)}"
        if code not in assigned_codes:
            assigned_codes.add(code)
            break
    
    course_faculty[cid] = faculty
    course_major[cid] = major
    faculty_courses[faculty].append(cid)
    course_data.append(f"INSERT INTO Course VALUES ('{cid}', '{name}', '{code}', '{lid}');\n")

if REGENERATE_MODE != "forums_only":
    f = open("OURVLE_Clone_Courses.sql", "w")
    f.write("USE OURVLECloneDatabase;\n")
    f.write("TRUNCATE TABLE Course;\n\n")
    f.write(" ──── Courses ────────────────────────────────────────────────────────────────────\n")
    f.writelines(course_data)
    f.write("\n")
    f.close()
    print("✓ Generated OURVLE_Clone_Courses.sql")
else:
    print("⊘ Skipped OURVLE_Clone_Courses.sql (forums_only mode)")


# Students ────────────────────────────────────────────────────────────────────
all_majors = [m for majors in MAJORS.values() for m in majors]
student_ids = list(range(630160000, 630160000 + NUM_STUDENTS))
student_major = {}
student_data = []

for sid in student_ids:
    first = fake.first_name().replace("'", "''")
    last = fake.last_name().replace("'", "''")
    major = random.choice(all_majors)
    student_major[sid] = major
    student_data.append(f"INSERT INTO Student VALUES ({sid}, '{first}', '{last}', '{major}', '{ENROLLMENT_DATE}');\n")

if REGENERATE_MODE != "forums_only":
    f = open("OURVLE_Clone_Students.sql", "w")
    f.write("USE OURVLECloneDatabase;\n")
    f.write("TRUNCATE TABLE Student;\n\n")
    f.write(" ──── Students ────────────────────────────────────────────────────────────────────\n")
    f.writelines(student_data)
    f.write("\n")
    f.close()
    print("✓ Generated OURVLE_Clone_Students.sql")
else:
    print("⊘ Skipped OURVLE_Clone_Students.sql (forums_only mode)")


# Enrollments ────────────────────────────────────────────────────────────────────
student_courses = {sid: set() for sid in student_ids}
course_enrollment_count = {cid: 0 for cid in course_ids}

# Group students by their FACULTY (not specific major)
# This allows them to take ANY course from their faculty
faculty_students = {}
for sid, major in student_major.items():
    fac = major_to_faculty[major]
    faculty_students.setdefault(fac, []).append(sid)

# Pass 1 — guarantee every course has at least 10 students (requirement e)
# Iterate over courses, not students, so no course is accidentally skipped.
for cid in course_ids:
    fac           = course_faculty[cid]
    eligible_pool = faculty_students.get(fac, [])
    if not eligible_pool:
        continue
    seeded   = 0
    attempts = 0
    max_attempts = len(eligible_pool) * 3

    while seeded < 10 and attempts < max_attempts:
        sid = random.choice(eligible_pool)
        if cid not in student_courses[sid] and len(student_courses[sid]) < 6:
            student_courses[sid].add(cid)
            course_enrollment_count[cid] += 1
            seeded += 1
        attempts += 1

# Pass 2 — ensure every student has at least 3 courses (requirement d)
for sid in student_ids:
    fac             = major_to_faculty[student_major[sid]]
    available_courses = faculty_courses.get(fac, [])
    if not available_courses:
        continue
    attempts     = 0
    max_attempts = len(available_courses) * 3

    while len(student_courses[sid]) < 3 and attempts < max_attempts:
        cid = random.choice(available_courses)
        if cid not in student_courses[sid] and len(student_courses[sid]) < 6:
            student_courses[sid].add(cid)
            course_enrollment_count[cid] += 1
        attempts += 1

# Generate enrollment data
enrollment_data = []
for sid, courses in student_courses.items():
    for cid in courses:
        enrollment_data.append(f"INSERT INTO Enrollment VALUES ({sid}, '{cid}');\n")

if REGENERATE_MODE != "forums_only":
    f = open("OURVLE_Clone_Enrollments.sql", "w")
    f.write("USE OURVLECloneDatabase;\n")
    f.write("TRUNCATE TABLE Enrollment;\n\n")
    f.write("-- Enrollments\n")
    f.writelines(enrollment_data)
    f.write("\n")
    f.close()
    print("✓ Generated OURVLE_Clone_Enrollments.sql")
else:
    print("⊘ Skipped OURVLE_Clone_Enrollments.sql (forums_only mode)")


# Calendar Events ────────────────────────────────────────────────────────────────────
EVENT_TYPES = [ "Lab", "Tutorial", "Assignment Due", "Exam"]

SEMESTER_START = datetime.date(2024, 9, 2)
SEMESTER_END   = datetime.date(2024, 12, 20)

def random_date(start, end):
    delta = end - start
    return start + datetime.timedelta(days=random.randint(0, delta.days))

f = open("OURVLE_Clone_Calendar_Events.sql", "w")
f.write("USE OURVLECloneDatabase;\n")
f.write("TRUNCATE TABLE Calendar_Event;\n\n")
f.write(" ──── Calendar Events ────────────────────────────────────────────────────────────────────\n")
event_id = 1
course_events = {cid: [] for cid in course_ids} # track which events belong to which course

for cid in course_ids:
    dept = lecturer_dept[course_lecturer[cid]]
    dept_code_prefix = dept_code[dept]
    major = course_major[cid]
    course_topic = MAJOR_COURSES[major][1][random.randint(0, len(MAJOR_COURSES[major][1]) - 1)]
    
    num_events = random.randint(5, 16) # each course gets 8-18 events
    event_counts = {"Lab": 0, "Tutorial": 0, "Assignment Due": 0, "Exam": 0}
    
    for _ in range(num_events):
        etype = random.choice(EVENT_TYPES)
        edate = random_date(SEMESTER_START, SEMESTER_END)
        
        # Generate realistic title based on event type
        if etype == "Lecture":
            title = f"Lecture: Introduction to {course_topic}".replace("'", "''")
        elif etype == "Lab":
            title = f"Lab Session: {course_topic} Practical Work".replace("'", "''")
        elif etype == "Tutorial":
            title = f"Tutorial: Q&A on {course_topic}".replace("'", "''")
        elif etype == "Assignment Due":
            title = f"Assignment Submission: {course_topic} - Part {random.randint(1, 3)}".replace("'", "''")
        elif etype == "Exam":
            title = f"Exam: {course_topic} Assessment".replace("'", "''")
        elif etype == "Seminar":
            title = f"Seminar: Advanced {course_topic} Topics".replace("'", "''")
        else:  # Office Hours
            title = f"Office Hours: {course_topic} Discussion".replace("'", "''")
        
        desc = generate_event_description(etype, dept_code_prefix)
        
        f.write(
            f"INSERT INTO Calendar_Event VALUES "
            f"({event_id}, '{cid}', '{title}', '{desc}', '{etype}', '{edate}');\n"
        )
        course_events[cid].append(event_id)
        event_id += 1
f.write("\n")
f.close()
print("✓ Generated OURVLE_Clone_Calendar_Events.sql")


# Forums ────────────────────────────────────────────────────────────────────
FORUM_TITLES = [
    "General Discussion", "Resources & Links",
    "Project Discussion", "Weekly Q&A"]

f = open("OURVLE_Clone_Forums.sql", "w")
f.write("USE OURVLECloneDatabase;\n")
f.write("TRUNCATE TABLE Discussion_Forum;\n\n")
f.write(" ──── Discussion Forums ────────────────────────────────────────────────────────────────────\n")
forum_id = 1
course_forums = {cid: [] for cid in course_ids}   # course_id -> [forum_ids]

for cid in course_ids:
    num_forums = random.randint(2, 5)
    chosen_titles = random.sample(FORUM_TITLES, min(num_forums, len(FORUM_TITLES)))
    for title in chosen_titles:
        safe_title = title.replace("'", "''")
        f.write(f"INSERT INTO Discussion_Forum VALUES ('{cid}', {forum_id}, '{safe_title}');\n")
        course_forums[cid].append(forum_id)
        forum_id += 1
f.write("\n")
f.close()
print("✓ Generated OURVLE_Clone_Forums.sql")


# Discussion Threads and Replies ────────────────────────────────────────────────────────────────────
student_courses_by_course = {}
for sid, courses in student_courses.items():
    for cid in courses:
        student_courses_by_course.setdefault(cid, []).append(sid)

f = open("OURVLE_Clone_Discussion_Threads.sql", "w")
f.write("USE OURVLECloneDatabase;\n")
f.write("TRUNCATE TABLE Discussion_Thread;\n\n")
f.write("-- Discussion Threads ────────────────────────────────────────────────────────────────────\n")
thread_id  = 1
# track top-level threads per forum so replies can reference them
forum_threads = {}   # forum_id -> [thread_ids of top-level posts]

all_user_ids = [str(sid) for sid in student_ids] + lecturer_ids  # pool of valid authors

for cid in course_ids:
    enrolled_students = list(student_courses_by_course.get(cid, []))
    lecturer_id = course_lecturer[cid]
    dept = lecturer_dept[lecturer_id]
    dept_code_for_course = dept_code[dept]

    for fid in course_forums[cid]:
        forum_threads[fid] = []
        num_threads = random.randint(4, 12)   # top-level posts per forum

        for _ in range(num_threads):
            # Pick author from enrolled students or the lecturer
            if enrolled_students and random.random() < 0.85:
                author = random.choice(enrolled_students)
            else:
                author = lecturer_id

            # Generate realistic academic content
            if random.random() < 0.6:  # 60% chance of student question/discussion
                content = generate_forum_thread(dept_code_for_course)
            else:  # 40% chance of resource/announcement type post
                content = generate_forum_reply(dept_code_for_course)
            
            created_date = random_date(SEMESTER_START, SEMESTER_END)
            # NULL for parent_thread_id since this is a top-level post
            f.write(
                f"INSERT INTO Discussion_Thread VALUES "
                f"({thread_id}, {fid}, '{content}', '{created_date}', '{author}', NULL);\n"
            )
            forum_threads[fid].append(thread_id)
            thread_id += 1

        # Replies — each top-level thread gets 0-6 replies
        for parent_tid in forum_threads[fid]:
            num_replies = random.randint(0, 6)
            for _ in range(num_replies):
                if enrolled_students and random.random() < 0.80:
                    author = random.choice(enrolled_students)
                else:
                    author = lecturer_id

                # Generate realistic reply content
                content = generate_forum_reply(dept_code_for_course)
                created_date = random_date(SEMESTER_START, SEMESTER_END)
                f.write(
                    f"INSERT INTO Discussion_Thread VALUES "
                    f"({thread_id}, {fid}, '{content}', '{created_date}', '{author}', {parent_tid});\n"
                )
                thread_id += 1

f.write("\n")
f.close()
print("✓ Generated OURVLE_Clone_Discussion_Threads.sql")

print("\n" + "="*80)
if REGENERATE_MODE == "forums_only":
    print("COMPLETED! (forums_only mode)")
    print("Load only these 3 SQL files:")
    print("  - OURVLE_Clone_Calendar_Events.sql")
    print("  - OURVLE_Clone_Forums.sql")
    print("  - OURVLE_Clone_Discussion_Threads.sql")
else:
    print("COMPLETED! (all tables regenerated)")
    print("Check all 7 SQL files and load them into the database.")
print("="*80)
