import random
from faker import Faker

# Create an instance of the Faker class
fake = Faker()

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

f = open("OURVLE_Clone_Database.sql", "w")
f.write("USE OURVLECloneDatabase;\n\n")

# Lecturers
lecturer_ids = []
lecturer_dept = {}
lecturer_courses_count = {}

f.write("--- Lecturers\n")
for n in range(1, NUM_LECTURERS + 1):
    name = fake.name().replace("'", "''")
    dept = random.choice(dept_names)
    lid = f"{dept_code[dept]}{n}"
    lecturer_ids.append(lid)
    lecturer_dept[lid] = dept
    lecturer_courses_count[lid] = 0
    f.write(f"INSERT INTO Lecturer VALUES ('{lid}', '{name}', '{dept}');\n")
f.write("\n")

# Courses
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

f.write("-- Courses\n")
assigned_codes = set()
course_faculty = {}

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
    faculty_courses[faculty].append(cid)

    f.write(f"INSERT INTO Course VALUES ('{cid}', '{name}', '{code}', {lid});\n")
f.write("\n")

# Students
all_majors = [m for majors in MAJORS.values() for m in majors]
student_ids = list(range(630160000, 630160000 + NUM_STUDENTS))
student_major = {}

f.write("-- Students\n")
for sid in student_ids:
    first = fake.first_name().replace("'", "''")
    last = fake.last_name().replace("'", "''")
    major = random.choice(all_majors)
    student_major[sid] = major
    f.write(f"INSERT INTO Student VALUES ({sid}, '{first}', '{last}', '{major}', '{ENROLLMENT_DATE}');\n")
f.write("\n")

# Enrollments
student_courses = {sid: set() for sid in student_ids}
course_enrollment_count = {cid: 0 for cid in course_ids}

# Only pick students whose faculty matches the course's faculty
faculty_students = {}
for sid, major in student_major.items():
    fac = major_to_faculty[major]
    faculty_students.setdefault(fac, []).append(sid)

for cid in course_ids:
    fac = course_faculty[cid]
    eligible_pool = faculty_students[fac]
    seeded = 0
    attempts = 0
    max_attempts = len(eligible_pool) * 2

    while seeded < 10 and attempts < max_attempts:
        sid = random.choice(eligible_pool)
        if cid not in student_courses[sid] and len(student_courses[sid]) < 6:
            student_courses[sid].add(cid)
            course_enrollment_count[cid] += 1
            seeded += 1
        attempts += 1

for sid in student_ids:
    fac = major_to_faculty[student_major[sid]]
    available = faculty_courses[fac]
    attempts = 0
    max_attempts = len(available) * 2

    while len(student_courses[sid]) < 3 and attempts < max_attempts:
        cid = random.choice(available)
        if cid not in student_courses[sid]:
            student_courses[sid].add(cid)
            course_enrollment_count[cid] += 1
        attempts += 1

f.write("-- Enrollments\n")
for sid, courses in student_courses.items():
    for cid in courses:
        f.write(f"INSERT INTO Enrollment VALUES ({sid}, '{cid}');\n")
f.write("\n")
f.close()
print("Completed!!!, Check 'OURVLE_Clone_Database.sql' and run it.")

# ── Sanity check ──────────────────────────────────────────────────────────────
total_enrollments = sum(course_enrollment_count.values())
avg_enrollment    = total_enrollments / NUM_COURSES
print(f"Total enrollments : {total_enrollments:,}")
print(f"Average per course: {avg_enrollment:.1f}")
print(f"Courses below 10  : {sum(1 for v in course_enrollment_count.values() if v < 10)}")