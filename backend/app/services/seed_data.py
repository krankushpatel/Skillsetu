"""
SkillSetu - Deterministic Seed Data Generator
Step 2: Database Models & Seed Data

Generates realistic demo records for Ministry of Ayush & AIIA context:
- 1 Institution: All India Institute of Ayurveda (AIIA)
- 4 Fictional Industries
- 8 Students with intentional variance (2 high-readiness, 3 medium with gaps, 3 foundational)
- 10 Standardized Skills
- 6 Opportunities with realistic multi-skill requirements
- 1 Diagnostic Assessment with exactly 25 questions across 5 core skills
- 12 Learning Resources
- 5 Sample Applications (no match scores computed yet)
- Student Portfolios
"""
import logging
from typing import Dict, Any
from pymongo.database import Database

from backend.app.core.database import (
    COLLECTION_USERS,
    COLLECTION_INSTITUTIONS,
    COLLECTION_INDUSTRIES,
    COLLECTION_SKILLS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_ASSESSMENTS,
    COLLECTION_ASSESSMENT_QUESTIONS,
    COLLECTION_LEARNING_RESOURCES,
    COLLECTION_APPLICATIONS,
    COLLECTION_PORTFOLIOS,
)

logger = logging.getLogger("skillsetu.seed")

# ----------------------------------------------------------------------
# 1. INSTITUTION
# ----------------------------------------------------------------------
INSTITUTION_DATA = [
    {
        "_id": "inst_aiia",
        "name": "All India Institute of Ayurveda (AIIA)",
        "type": "Apex Autonomous Institute, Ministry of Ayush, Govt. of India",
        "location": "Gautampuri, Sarita Vihar, Mathura Road, New Delhi - 110076",
        "departments": [
            "Dravyaguna (Ayurvedic Pharmacology)",
            "Kayachikitsa (Internal Medicine)",
            "Rasa Shastra & Bhashajya Kalpana (Pharmaceutical Science)",
            "Ayush Health Informatics & Biostatistics",
            "Kriya Sharira (Physiology) & Integrative Health"
        ],
        "createdAt": "2026-01-15T09:00:00Z",
        "updatedAt": "2026-01-15T09:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 2. INDUSTRIES (Fictional Organizations)
# ----------------------------------------------------------------------
INDUSTRIES_DATA = [
    {
        "_id": "ind_01",
        "userId": "usr_ind_01",
        "organizationName": "AyurTech Innovations",
        "industryType": "Ayush HealthTech & Telemedicine",
        "description": "Fictional demo enterprise specializing in clinical decision support software, EHR systems, and tele-consultation tools for integrative Ayush clinics.",
        "location": "Bengaluru, Karnataka",
        "website": "https://ayurtech.innovations.example.org",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    {
        "_id": "ind_02",
        "userId": "usr_ind_02",
        "organizationName": "HealthData Labs",
        "industryType": "Clinical Informatics & Analytics",
        "description": "Fictional demo analytics provider focused on health data pipelines, ABDM FHIR interoperability, and automated epidemiological registries.",
        "location": "Hyderabad, Telangana",
        "website": "https://healthdatalabs.example.org",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    {
        "_id": "ind_03",
        "userId": "usr_ind_03",
        "organizationName": "AyuAnalytics",
        "industryType": "Phytochemical & Botanical Intelligence",
        "description": "Fictional demo data science lab researching botanical metabolomics, chemical marker quantification, and herbal pharmacovigilance databases.",
        "location": "Pune, Maharashtra",
        "website": "https://ayuanalytics.example.org",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    {
        "_id": "ind_04",
        "userId": "usr_ind_04",
        "organizationName": "MedTech Research Solutions",
        "industryType": "Biomedical & Clinical Trial Research",
        "description": "Fictional demo contract research organization coordinating GCP-compliant observational and clinical trials in traditional medicine.",
        "location": "New Delhi, Delhi",
        "website": "https://medtechresearch.example.org",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 3. USERS (Identity & Role)
# ----------------------------------------------------------------------
USERS_DATA = [
    # Institution User
    {
        "_id": "usr_inst_aiia",
        "name": "Dr. Rama Krishna",
        "email": "ramakrishna@aiia.gov.in",
        "role": "INSTITUTION",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=RamaKrishna",
        "createdAt": "2026-01-15T09:00:00Z",
        "updatedAt": "2026-01-15T09:00:00Z"
    },
    # Industry Users
    {
        "_id": "usr_ind_01",
        "name": "Dr. Sunita Menon",
        "email": "sunita.menon@ayurtech.demo",
        "role": "INDUSTRY",
        "institutionId": None,
        "industryId": "ind_01",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=SunitaMenon",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    {
        "_id": "usr_ind_02",
        "name": "Rajesh Nair",
        "email": "rajesh.nair@healthdatalabs.demo",
        "role": "INDUSTRY",
        "institutionId": None,
        "industryId": "ind_02",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=RajeshNair",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    {
        "_id": "usr_ind_03",
        "name": "Dr. Tanvi Deshmukh",
        "email": "tanvi.deshmukh@ayuanalytics.demo",
        "role": "INDUSTRY",
        "institutionId": None,
        "industryId": "ind_03",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=TanviDeshmukh",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    {
        "_id": "usr_ind_04",
        "name": "Amitava Sengupta",
        "email": "amitava.sengupta@medtechresearch.demo",
        "role": "INDUSTRY",
        "institutionId": None,
        "industryId": "ind_04",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=AmitavaSengupta",
        "createdAt": "2026-02-01T10:00:00Z",
        "updatedAt": "2026-02-01T10:00:00Z"
    },
    # 8 Students
    {
        "_id": "usr_std_01",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=AaravSharma",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_02",
        "name": "Priyanshi Verma",
        "email": "priyanshi.verma@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyanshiVerma",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_03",
        "name": "Rohan Kulkarni",
        "email": "rohan.kulkarni@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=RohanKulkarni",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_04",
        "name": "Ananya Iyer",
        "email": "ananya.iyer@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaIyer",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_05",
        "name": "Devendra Patel",
        "email": "devendra.patel@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=DevendraPatel",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_06",
        "name": "Sneha Joshi",
        "email": "sneha.joshi@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=SnehaJoshi",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_07",
        "name": "Vikramaditya Nair",
        "email": "vikram.nair@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=VikramadityaNair",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "usr_std_08",
        "name": "Meera Sundaram",
        "email": "meera.sundaram@student.aiia.ac.in",
        "role": "STUDENT",
        "institutionId": "inst_aiia",
        "industryId": None,
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=MeeraSundaram",
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 4. SKILLS (Standardized Taxonomy - 10 Skills)
# ----------------------------------------------------------------------
SKILLS_DATA = [
    {
        "_id": "sk_python",
        "name": "Python",
        "category": "TECHNICAL",
        "description": "Python programming for biomedical data processing, statistical computing, and clinical pipeline automation.",
        "industryDemandScore": 92,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_sql",
        "name": "SQL",
        "category": "TECHNICAL",
        "description": "Relational querying, cohort retrieval, and database schema operations for medical informatics.",
        "industryDemandScore": 85,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_ayur_clin",
        "name": "Ayurvedic Clinical Data",
        "category": "DOMAIN",
        "description": "Standardization of Rogi-Roga Pariksha, Prakriti determination, and NAMASTE / ICD-11 Ayush clinical codification.",
        "industryDemandScore": 88,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_phyto_chem",
        "name": "Phytochemical Data Analysis",
        "category": "DOMAIN",
        "description": "Botanical chemical profiling, HPTLC / HPLC spectral interpretation, and Ayurvedic Pharmacopoeia database analysis.",
        "industryDemandScore": 80,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_biostat",
        "name": "Biostatistics",
        "category": "ANALYTICAL",
        "description": "Statistical inference, survival models, sample size estimation, and hypothesis testing in clinical trials.",
        "industryDemandScore": 86,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_hl7_interop",
        "name": "Health Data Interoperability",
        "category": "TECHNICAL",
        "description": "HL7 FHIR resources, ABDM (Ayushman Bharat Digital Mission) milestones, and EHR interoperability standards.",
        "industryDemandScore": 90,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_ml_health",
        "name": "Machine Learning for Healthcare",
        "category": "TECHNICAL",
        "description": "Supervised & unsupervised learning models for medical risk stratification and disease prediction.",
        "industryDemandScore": 89,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_research_meth",
        "name": "Research Methodology",
        "category": "ANALYTICAL",
        "description": "Good Clinical Practice (GCP), randomized controlled trial protocols, and systematic review methodologies.",
        "industryDemandScore": 84,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_data_viz",
        "name": "Data Visualization",
        "category": "ANALYTICAL",
        "description": "Communicating patient cohort demographics, clinical outcomes, and epidemiological curves using visual analytics.",
        "industryDemandScore": 82,
        "createdAt": "2026-01-20T10:00:00Z"
    },
    {
        "_id": "sk_tech_comm",
        "name": "Technical Communication",
        "category": "SOFT_SKILL",
        "description": "Bridging clinical terminology with software engineering specifications, report writing, and stakeholder presentations.",
        "industryDemandScore": 78,
        "createdAt": "2026-01-20T10:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 5. STUDENT PROFILES (8 Students)
# ----------------------------------------------------------------------
STUDENT_PROFILES_DATA = [
    # 1. Aarav Sharma (Strong / High Readiness)
    {
        "_id": "sp_01",
        "userId": "usr_std_01",
        "institutionId": "inst_aiia",
        "department": "Ayush Health Informatics & Biostatistics",
        "course": "BAMS with Health Informatics Elective",
        "batch": "2022-2026",
        "cgpa": 9.1,
        "bio": "Final year scholar passionate about computational Ayurveda, ABDM interoperability, and automated clinical cohort identification.",
        "skills": [
            {"skillId": "sk_python", "proficiency": 88, "assessed": True, "lastAssessed": "2026-02-15"},
            {"skillId": "sk_sql", "proficiency": 82, "assessed": True, "lastAssessed": "2026-02-15"},
            {"skillId": "sk_ayur_clin", "proficiency": 90, "assessed": True, "lastAssessed": "2026-02-15"},
            {"skillId": "sk_phyto_chem", "proficiency": 84, "assessed": True, "lastAssessed": "2026-02-15"},
            {"skillId": "sk_biostat", "proficiency": 86, "assessed": True, "lastAssessed": "2026-02-15"},
            {"skillId": "sk_ml_health", "proficiency": 85, "assessed": True, "lastAssessed": "2026-02-15"}
        ],
        "certifications": ["ABDM Health Data Professional", "Python for Biomedical Research"],
        "projects": [
            {"title": "NAMASTE to FHIR Code Converter", "domain": "Informatics", "status": "Completed"},
            {"title": "Prakriti Assessment Classifier", "domain": "Machine Learning", "status": "In Progress"}
        ],
        "internships": [
            {"organization": "AIIA Hospital Informatics Cell", "role": "Data Analyst Trainee", "duration": "3 months"}
        ],
        "achievements": ["1st Prize - Ayush Hackathon 2025", "Merit Scholar AIIA"],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 2. Priyanshi Verma (Strong / High Readiness)
    {
        "_id": "sp_02",
        "userId": "usr_std_02",
        "institutionId": "inst_aiia",
        "department": "Dravyaguna (Ayurvedic Pharmacology)",
        "course": "MD (Ayurveda) - Dravyaguna",
        "batch": "2023-2026",
        "cgpa": 8.9,
        "bio": "Postgraduate researcher focusing on botanical phytochemical standardization, clinical trial design, and evidence-based phytotherapy.",
        "skills": [
            {"skillId": "sk_ayur_clin", "proficiency": 92, "assessed": True, "lastAssessed": "2026-02-16"},
            {"skillId": "sk_research_meth", "proficiency": 90, "assessed": True, "lastAssessed": "2026-02-16"},
            {"skillId": "sk_biostat", "proficiency": 85, "assessed": True, "lastAssessed": "2026-02-16"},
            {"skillId": "sk_phyto_chem", "proficiency": 88, "assessed": True, "lastAssessed": "2026-02-16"},
            {"skillId": "sk_python", "proficiency": 78, "assessed": True, "lastAssessed": "2026-02-16"},
            {"skillId": "sk_data_viz", "proficiency": 84, "assessed": True, "lastAssessed": "2026-02-16"}
        ],
        "certifications": ["GCP Certified Clinical Investigator", "HPTLC Fingerprinting Specialist"],
        "projects": [
            {"title": "Phytochemical Fingerprint of Withania somnifera", "domain": "Pharmacology", "status": "Published"},
            {"title": "Meta-analysis of Guduchi in Immune Modulation", "domain": "Biostatistics", "status": "Completed"}
        ],
        "internships": [
            {"organization": "AIIA Dravyaguna Drug Testing Lab", "role": "Research Fellow", "duration": "6 months"}
        ],
        "achievements": ["Best Paper Award - National Dravyaguna Congress 2025"],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 3. Rohan Kulkarni (Medium - Technical Gap in SQL & Python)
    {
        "_id": "sp_03",
        "userId": "usr_std_03",
        "institutionId": "inst_aiia",
        "department": "Kayachikitsa (Internal Medicine)",
        "course": "MD (Ayurveda) - Kayachikitsa",
        "batch": "2023-2026",
        "cgpa": 8.3,
        "bio": "Clinical clinician experienced in Ayurvedic inpatient diagnosis and patient care; actively upskilling in Python and database querying.",
        "skills": [
            {"skillId": "sk_ayur_clin", "proficiency": 84, "assessed": True, "lastAssessed": "2026-02-17"},
            {"skillId": "sk_research_meth", "proficiency": 80, "assessed": True, "lastAssessed": "2026-02-17"},
            {"skillId": "sk_tech_comm", "proficiency": 78, "assessed": True, "lastAssessed": "2026-02-17"},
            {"skillId": "sk_biostat", "proficiency": 68, "assessed": True, "lastAssessed": "2026-02-17"},
            {"skillId": "sk_python", "proficiency": 52, "assessed": True, "lastAssessed": "2026-02-17"},
            {"skillId": "sk_sql", "proficiency": 45, "assessed": True, "lastAssessed": "2026-02-17"}
        ],
        "certifications": ["Clinical Research Coordinator Certificate"],
        "projects": [
            {"title": "Observational Study on Amavata Inpatient Protocols", "domain": "Clinical Medicine", "status": "Ongoing"}
        ],
        "internships": [],
        "achievements": ["AIIA Clinical Excellence Certificate 2024"],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 4. Ananya Iyer (Medium - Clinical Domain Gap in Ayurvedic Terminology)
    {
        "_id": "sp_04",
        "userId": "usr_std_04",
        "institutionId": "inst_aiia",
        "department": "Ayush Health Informatics & Biostatistics",
        "course": "M.Sc. Health Informatics",
        "batch": "2023-2025",
        "cgpa": 8.5,
        "bio": "Data analyst with strong software capabilities; transitioning into Ayush domain and clinical vocabulary mapping.",
        "skills": [
            {"skillId": "sk_python", "proficiency": 82, "assessed": True, "lastAssessed": "2026-02-18"},
            {"skillId": "sk_data_viz", "proficiency": 80, "assessed": True, "lastAssessed": "2026-02-18"},
            {"skillId": "sk_sql", "proficiency": 76, "assessed": True, "lastAssessed": "2026-02-18"},
            {"skillId": "sk_hl7_interop", "proficiency": 74, "assessed": True, "lastAssessed": "2026-02-18"},
            {"skillId": "sk_ayur_clin", "proficiency": 58, "assessed": True, "lastAssessed": "2026-02-18"},
            {"skillId": "sk_phyto_chem", "proficiency": 48, "assessed": True, "lastAssessed": "2026-02-18"}
        ],
        "certifications": ["Healthcare SQL & BI Specialist"],
        "projects": [
            {"title": "Interactive Hospital Dashboard for Patient Inflow", "domain": "Data Visualization", "status": "Completed"}
        ],
        "internships": [
            {"organization": "Regional Health Analytics Centre", "role": "Data Intern", "duration": "2 months"}
        ],
        "achievements": ["Dean's List Semester 3"],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 5. Devendra Patel (Medium - Balanced Intermediate)
    {
        "_id": "sp_05",
        "userId": "usr_std_05",
        "institutionId": "inst_aiia",
        "department": "Rasa Shastra & Bhashajya Kalpana (Pharmaceutical Science)",
        "course": "BAMS",
        "batch": "2021-2026",
        "cgpa": 7.9,
        "bio": "Undergraduate scholar curious about pharmaceutical analytics and herb-mineral quality standardization.",
        "skills": [
            {"skillId": "sk_ayur_clin", "proficiency": 72, "assessed": True, "lastAssessed": "2026-02-19"},
            {"skillId": "sk_research_meth", "proficiency": 70, "assessed": True, "lastAssessed": "2026-02-19"},
            {"skillId": "sk_biostat", "proficiency": 68, "assessed": True, "lastAssessed": "2026-02-19"},
            {"skillId": "sk_python", "proficiency": 64, "assessed": True, "lastAssessed": "2026-02-19"},
            {"skillId": "sk_phyto_chem", "proficiency": 60, "assessed": True, "lastAssessed": "2026-02-19"},
            {"skillId": "sk_sql", "proficiency": 58, "assessed": True, "lastAssessed": "2026-02-19"}
        ],
        "certifications": ["Basic Biostatistics in R & Python"],
        "projects": [
            {"title": "Heavy Metal Profiling in Rasa Aushadhi", "domain": "Quality Control", "status": "In Progress"}
        ],
        "internships": [],
        "achievements": [],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 6. Sneha Joshi (Foundational - Learning Programming)
    {
        "_id": "sp_06",
        "userId": "usr_std_06",
        "institutionId": "inst_aiia",
        "department": "Kayachikitsa (Internal Medicine)",
        "course": "BAMS",
        "batch": "2022-2027",
        "cgpa": 7.4,
        "bio": "Third year BAMS student eager to integrate modern research tools with classical Ayurvedic diagnostics.",
        "skills": [
            {"skillId": "sk_ayur_clin", "proficiency": 65, "assessed": True, "lastAssessed": "2026-02-20"},
            {"skillId": "sk_tech_comm", "proficiency": 60, "assessed": True, "lastAssessed": "2026-02-20"},
            {"skillId": "sk_research_meth", "proficiency": 55, "assessed": True, "lastAssessed": "2026-02-20"},
            {"skillId": "sk_biostat", "proficiency": 42, "assessed": True, "lastAssessed": "2026-02-20"},
            {"skillId": "sk_python", "proficiency": 38, "assessed": True, "lastAssessed": "2026-02-20"},
            {"skillId": "sk_sql", "proficiency": 32, "assessed": True, "lastAssessed": "2026-02-20"}
        ],
        "certifications": [],
        "projects": [
            {"title": "Dietary Survey in Metabolic Disorders", "domain": "Ayurvedic Nutrition", "status": "Completed"}
        ],
        "internships": [],
        "achievements": [],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 7. Vikramaditya Nair (Foundational - Tech & Data Beginner)
    {
        "_id": "sp_07",
        "userId": "usr_std_07",
        "institutionId": "inst_aiia",
        "department": "Kriya Sharira (Physiology) & Integrative Health",
        "course": "BAMS",
        "batch": "2022-2027",
        "cgpa": 7.1,
        "bio": "Ayurveda undergraduate with foundational interest in physiological data tracking and digital clinical charts.",
        "skills": [
            {"skillId": "sk_tech_comm", "proficiency": 62, "assessed": True, "lastAssessed": "2026-02-21"},
            {"skillId": "sk_ayur_clin", "proficiency": 58, "assessed": True, "lastAssessed": "2026-02-21"},
            {"skillId": "sk_data_viz", "proficiency": 40, "assessed": True, "lastAssessed": "2026-02-21"},
            {"skillId": "sk_python", "proficiency": 35, "assessed": True, "lastAssessed": "2026-02-21"},
            {"skillId": "sk_sql", "proficiency": 30, "assessed": True, "lastAssessed": "2026-02-21"}
        ],
        "certifications": [],
        "projects": [],
        "internships": [],
        "achievements": [],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    # 8. Meera Sundaram (Foundational - Laboratory Scholar)
    {
        "_id": "sp_08",
        "userId": "usr_std_08",
        "institutionId": "inst_aiia",
        "department": "Dravyaguna (Ayurvedic Pharmacology)",
        "course": "BAMS",
        "batch": "2023-2028",
        "cgpa": 7.3,
        "bio": "Second year student passionate about medicinal plants, taxonomy, and eager to learn bioinformatics pipelines.",
        "skills": [
            {"skillId": "sk_phyto_chem", "proficiency": 62, "assessed": True, "lastAssessed": "2026-02-22"},
            {"skillId": "sk_ayur_clin", "proficiency": 54, "assessed": True, "lastAssessed": "2026-02-22"},
            {"skillId": "sk_research_meth", "proficiency": 50, "assessed": True, "lastAssessed": "2026-02-22"},
            {"skillId": "sk_biostat", "proficiency": 38, "assessed": True, "lastAssessed": "2026-02-22"},
            {"skillId": "sk_python", "proficiency": 32, "assessed": True, "lastAssessed": "2026-02-22"}
        ],
        "certifications": [],
        "projects": [
            {"title": "Medicinal Flora Cataloging in Delhi NCR", "domain": "Ethnobotany", "status": "Completed"}
        ],
        "internships": [],
        "achievements": [],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 6. NORMALIZED STUDENT SKILL SCORES
# ----------------------------------------------------------------------
def generate_student_skill_scores():
    scores = []
    for profile in STUDENT_PROFILES_DATA:
        s_id = profile["_id"]
        for s_item in profile["skills"]:
            scores.append({
                "_id": f"sss_{s_id}_{s_item['skillId']}",
                "studentId": s_id,
                "skillId": s_item["skillId"],
                "proficiency": s_item["proficiency"],
                "assessed": True,
                "assessmentId": "asm_01",
                "lastAssessed": s_item["lastAssessed"],
                "source": "ASSESSMENT"
            })
    return scores

# ----------------------------------------------------------------------
# 7. OPPORTUNITIES (6 Realistic Opportunities)
# ----------------------------------------------------------------------
OPPORTUNITIES_DATA = [
    {
        "_id": "opp_01",
        "industryId": "ind_01",
        "title": "Ayurvedic Clinical Research Intern",
        "description": "Collaborate with clinical trial monitors to validate Ayurvedic treatment protocols, verify clinical electronic forms, and organize patient cohort records.",
        "type": "INTERNSHIP",
        "location": "Bengaluru, Karnataka",
        "workMode": "HYBRID",
        "stipend": "₹22,000 / month",
        "duration": "6 months",
        "status": "OPEN",
        "createdAt": "2026-02-05T10:00:00Z",
        "updatedAt": "2026-02-05T10:00:00Z"
    },
    {
        "_id": "opp_02",
        "industryId": "ind_02",
        "title": "Health Informatics Assistant",
        "description": "Assist in building data normalization workflows, mapping clinical diagnostic terms to ABDM and FHIR standards, and executing SQL data quality pipelines.",
        "type": "INTERNSHIP",
        "location": "Hyderabad, Telangana",
        "workMode": "REMOTE",
        "stipend": "₹25,000 / month",
        "duration": "6 months",
        "status": "OPEN",
        "createdAt": "2026-02-05T10:00:00Z",
        "updatedAt": "2026-02-05T10:00:00Z"
    },
    {
        "_id": "opp_03",
        "industryId": "ind_03",
        "title": "Herb-Drug Data Analyst",
        "description": "Perform computational and statistical analysis on herbal constituent databases, analyze LC-MS/GC-MS phytochemical profiles, and document compound interactions.",
        "type": "PROJECT",
        "location": "Pune, Maharashtra",
        "workMode": "REMOTE",
        "stipend": "₹30,000 total stipend",
        "duration": "4 months",
        "status": "OPEN",
        "createdAt": "2026-02-05T10:00:00Z",
        "updatedAt": "2026-02-05T10:00:00Z"
    },
    {
        "_id": "opp_04",
        "industryId": "ind_01",
        "title": "Ayush Telehealth Interface Developer",
        "description": "Join our healthtech engineering squad to build clinician-facing telemedicine modules tailored for Ayurvedic consultation flows and clinical pulse telemetry.",
        "type": "FULL_TIME",
        "location": "Bengaluru, Karnataka",
        "workMode": "ON_SITE",
        "stipend": "₹45,000 / month",
        "duration": "Permanent",
        "status": "OPEN",
        "createdAt": "2026-02-05T10:00:00Z",
        "updatedAt": "2026-02-05T10:00:00Z"
    },
    {
        "_id": "opp_05",
        "industryId": "ind_04",
        "title": "Healthcare Data Analytics Intern",
        "description": "Analyze clinical trial endpoints, build automated survival and regression dashboards, and produce presentation-ready graphs for regulatory submissions.",
        "type": "INTERNSHIP",
        "location": "New Delhi, Delhi",
        "workMode": "HYBRID",
        "stipend": "₹24,000 / month",
        "duration": "6 months",
        "status": "OPEN",
        "createdAt": "2026-02-05T10:00:00Z",
        "updatedAt": "2026-02-05T10:00:00Z"
    },
    {
        "_id": "opp_06",
        "industryId": "ind_04",
        "title": "Clinical Research Data Associate",
        "description": "Full-time role overseeing trial data integrity, ensuring compliance with GCP guidelines, drafting clinical study reports, and liaising with investigative sites.",
        "type": "FULL_TIME",
        "location": "New Delhi, Delhi",
        "workMode": "ON_SITE",
        "stipend": "₹40,000 / month",
        "duration": "12 months",
        "status": "OPEN",
        "createdAt": "2026-02-05T10:00:00Z",
        "updatedAt": "2026-02-05T10:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 8. OPPORTUNITY SKILLS (Requirements per Opportunity)
# ----------------------------------------------------------------------
OPPORTUNITY_SKILLS_DATA = [
    # Opp 1: Ayurvedic Clinical Research Intern
    {"_id": "os_01_1", "opportunityId": "opp_01", "skillId": "sk_ayur_clin", "minProficiency": 70, "weight": 3, "mandatory": True},
    {"_id": "os_01_2", "opportunityId": "opp_01", "skillId": "sk_research_meth", "minProficiency": 65, "weight": 2, "mandatory": True},
    {"_id": "os_01_3", "opportunityId": "opp_01", "skillId": "sk_biostat", "minProficiency": 60, "weight": 2, "mandatory": False},
    {"_id": "os_01_4", "opportunityId": "opp_01", "skillId": "sk_tech_comm", "minProficiency": 65, "weight": 1, "mandatory": False},

    # Opp 2: Health Informatics Assistant
    {"_id": "os_02_1", "opportunityId": "opp_02", "skillId": "sk_python", "minProficiency": 75, "weight": 3, "mandatory": True},
    {"_id": "os_02_2", "opportunityId": "opp_02", "skillId": "sk_sql", "minProficiency": 70, "weight": 3, "mandatory": True},
    {"_id": "os_02_3", "opportunityId": "opp_02", "skillId": "sk_hl7_interop", "minProficiency": 60, "weight": 2, "mandatory": True},
    {"_id": "os_02_4", "opportunityId": "opp_02", "skillId": "sk_data_viz", "minProficiency": 65, "weight": 1, "mandatory": False},

    # Opp 3: Herb-Drug Data Analyst
    {"_id": "os_03_1", "opportunityId": "opp_03", "skillId": "sk_phyto_chem", "minProficiency": 75, "weight": 3, "mandatory": True},
    {"_id": "os_03_2", "opportunityId": "opp_03", "skillId": "sk_ayur_clin", "minProficiency": 70, "weight": 2, "mandatory": True},
    {"_id": "os_03_3", "opportunityId": "opp_03", "skillId": "sk_python", "minProficiency": 65, "weight": 2, "mandatory": False},
    {"_id": "os_03_4", "opportunityId": "opp_03", "skillId": "sk_biostat", "minProficiency": 60, "weight": 1, "mandatory": False},

    # Opp 4: Ayush Telehealth Interface Developer
    {"_id": "os_04_1", "opportunityId": "opp_04", "skillId": "sk_python", "minProficiency": 80, "weight": 3, "mandatory": True},
    {"_id": "os_04_2", "opportunityId": "opp_04", "skillId": "sk_hl7_interop", "minProficiency": 75, "weight": 3, "mandatory": True},
    {"_id": "os_04_3", "opportunityId": "opp_04", "skillId": "sk_ayur_clin", "minProficiency": 60, "weight": 2, "mandatory": True},
    {"_id": "os_04_4", "opportunityId": "opp_04", "skillId": "sk_tech_comm", "minProficiency": 70, "weight": 1, "mandatory": False},

    # Opp 5: Healthcare Data Analytics Intern
    {"_id": "os_05_1", "opportunityId": "opp_05", "skillId": "sk_biostat", "minProficiency": 70, "weight": 3, "mandatory": True},
    {"_id": "os_05_2", "opportunityId": "opp_05", "skillId": "sk_python", "minProficiency": 65, "weight": 2, "mandatory": True},
    {"_id": "os_05_3", "opportunityId": "opp_05", "skillId": "sk_data_viz", "minProficiency": 70, "weight": 2, "mandatory": True},
    {"_id": "os_05_4", "opportunityId": "opp_05", "skillId": "sk_sql", "minProficiency": 60, "weight": 1, "mandatory": False},

    # Opp 6: Clinical Research Data Associate
    {"_id": "os_06_1", "opportunityId": "opp_06", "skillId": "sk_research_meth", "minProficiency": 80, "weight": 3, "mandatory": True},
    {"_id": "os_06_2", "opportunityId": "opp_06", "skillId": "sk_biostat", "minProficiency": 75, "weight": 3, "mandatory": True},
    {"_id": "os_06_3", "opportunityId": "opp_06", "skillId": "sk_ayur_clin", "minProficiency": 70, "weight": 2, "mandatory": True},
    {"_id": "os_06_4", "opportunityId": "opp_06", "skillId": "sk_tech_comm", "minProficiency": 75, "weight": 1, "mandatory": False}
]

# ----------------------------------------------------------------------
# 9. ASSESSMENTS (1 Assessment Benchmark)
# ----------------------------------------------------------------------
ASSESSMENTS_DATA = [
    {
        "_id": "asm_01",
        "title": "Ayush Health Informatics Diagnostic Benchmark",
        "description": "Standardized diagnostic assessment evaluating foundational competencies across Python, SQL, Ayurvedic Clinical Data, Biostatistics, and Research Methodology.",
        "targetSkillIds": ["sk_python", "sk_sql", "sk_ayur_clin", "sk_biostat", "sk_research_meth"],
        "durationMinutes": 30,
        "totalQuestions": 25,
        "difficulty": "INTERMEDIATE",
        "active": True,
        "createdAt": "2026-02-01T09:00:00Z"
    }
]

# ----------------------------------------------------------------------
# 10. ASSESSMENT QUESTIONS (5 Skills × 5 Questions = 25 Questions)
# ----------------------------------------------------------------------
ASSESSMENT_QUESTIONS_DATA = [
    # --- Skill 1: Python (5 questions) ---
    {
        "_id": "q_py_01",
        "assessmentId": "asm_01",
        "skillId": "sk_python",
        "question": "Which pandas method is best suited to replace missing blood pressure values in a patient DataFrame with the column mean?",
        "options": [
            "df['bp'].fillna(df['bp'].mean())",
            "df['bp'].dropna(axis=0)",
            "df['bp'].replace_null(df['bp'].average())",
            "df['bp'].impute(mean=True)"
        ],
        "correctAnswer": "df['bp'].fillna(df['bp'].mean())",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "fillna() in pandas takes any scalar value or summary statistic (such as df['bp'].mean()) to impute null entries."
    },
    {
        "_id": "q_py_02",
        "assessmentId": "asm_01",
        "skillId": "sk_python",
        "question": "What is the expected output of [x.lower() for x in ['VATA', 'PITTA', 'KAPHA'] if len(x) == 4] in Python?",
        "options": [
            "['vata']",
            "['vata', 'pitta']",
            "['vata', 'kapha']",
            "['vata', 'pitta', 'kapha']"
        ],
        "correctAnswer": "['vata']",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "'VATA' has length 4 ('V','A','T','A'). 'PITTA' and 'KAPHA' have length 5."
    },
    {
        "_id": "q_py_03",
        "assessmentId": "asm_01",
        "skillId": "sk_python",
        "question": "When working with clinical timestamps in Python, which standard library or module provides fast datetime conversion and timezone normalization?",
        "options": [
            "datetime / pandas.to_datetime",
            "sys.time",
            "math.timestamp",
            "collections.date"
        ],
        "correctAnswer": "datetime / pandas.to_datetime",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "datetime and pandas.to_datetime are the primary tools for parsing and handling ISO 8601 clinical record dates."
    },
    {
        "_id": "q_py_04",
        "assessmentId": "asm_01",
        "skillId": "sk_python",
        "question": "In Python, which data structure is most optimal for checking membership of a patient ID in a list of 100,000 enrolled study participants with O(1) average lookup time?",
        "options": [
            "set",
            "list",
            "tuple",
            "deque"
        ],
        "correctAnswer": "set",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "Python sets are implemented as hash tables and offer O(1) average time complexity for containment checks."
    },
    {
        "_id": "q_py_05",
        "assessmentId": "asm_01",
        "skillId": "sk_python",
        "question": "Which Python library is the standard foundation for computing scientific numerical arrays, vector operations, and matrix algebra?",
        "options": [
            "NumPy",
            "Requests",
            "Flask",
            "BeautifulSoup"
        ],
        "correctAnswer": "NumPy",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "NumPy (Numerical Python) provides multidimensional ndarray objects and vector operations."
    },

    # --- Skill 2: SQL (5 questions) ---
    {
        "_id": "q_sql_01",
        "assessmentId": "asm_01",
        "skillId": "sk_sql",
        "question": "Which SQL clause is used to filter aggregated group results, such as finding clinics with more than 50 registered Ayush patients?",
        "options": [
            "HAVING COUNT(patient_id) > 50",
            "WHERE COUNT(patient_id) > 50",
            "FILTER GROUP > 50",
            "ORDER BY COUNT > 50"
        ],
        "correctAnswer": "HAVING COUNT(patient_id) > 50",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "HAVING operates on aggregated values generated by GROUP BY, while WHERE filters individual row-level data before grouping."
    },
    {
        "_id": "q_sql_02",
        "assessmentId": "asm_01",
        "skillId": "sk_sql",
        "question": "To combine patient demographics with consultation records while preserving all patients even if they haven't had a visit, which JOIN should be used?",
        "options": [
            "LEFT OUTER JOIN",
            "INNER JOIN",
            "CROSS JOIN",
            "NATURAL JOIN"
        ],
        "correctAnswer": "LEFT OUTER JOIN",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "LEFT OUTER JOIN retains all rows from the left table (patients) regardless of matching entries in the right table (visits)."
    },
    {
        "_id": "q_sql_03",
        "assessmentId": "asm_01",
        "skillId": "sk_sql",
        "question": "How do you check for unrecorded diagnostic observations in SQL?",
        "options": [
            "WHERE diagnosis_code IS NULL",
            "WHERE diagnosis_code == NULL",
            "WHERE diagnosis_code = 'EMPTY'",
            "WHERE diagnosis_code IS EMPTY"
        ],
        "correctAnswer": "WHERE diagnosis_code IS NULL",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "In three-valued SQL logic, NULL values must be checked using the 'IS NULL' operator."
    },
    {
        "_id": "q_sql_04",
        "assessmentId": "asm_01",
        "skillId": "sk_sql",
        "question": "Which SQL query returns the distinct Prakriti types recorded in a hospital clinical registry?",
        "options": [
            "SELECT DISTINCT prakriti_type FROM patients;",
            "SELECT UNIQUE prakriti_type FROM patients;",
            "SELECT DIFFERENT prakriti_type FROM patients;",
            "SELECT prakriti_type DEDUPLICATED FROM patients;"
        ],
        "correctAnswer": "SELECT DISTINCT prakriti_type FROM patients;",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "The DISTINCT keyword eliminates duplicate values from the query result set."
    },
    {
        "_id": "q_sql_05",
        "assessmentId": "asm_01",
        "skillId": "sk_sql",
        "question": "What is the purpose of an INDEX on the 'icd11_code' column in an electronic health records database?",
        "options": [
            "Accelerates search and filtering queries on that column",
            "Automatically encrypts the column data",
            "Restricts inputs to numeric values only",
            "Deletes outdated diagnoses periodically"
        ],
        "correctAnswer": "Accelerates search and filtering queries on that column",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "B-Tree database indexes provide rapid logarithmic search times on filtered columns."
    },

    # --- Skill 3: Ayurvedic Clinical Data (5 questions) ---
    {
        "_id": "q_ayur_01",
        "assessmentId": "asm_01",
        "skillId": "sk_ayur_clin",
        "question": "Under the Ministry of Ayush digital initiatives, what does the NAMASTE portal stand for?",
        "options": [
            "National Ayush Morbidity and Standardized Terminologies Electronic Portal",
            "National Ayurvedic Medical and Statistical Treatment Engine",
            "Network for Ayush Medical Automated System Terminology Entity",
            "New Age Medical Application Software for Therapy Evaluation"
        ],
        "correctAnswer": "National Ayush Morbidity and Standardized Terminologies Electronic Portal",
        "difficulty": "MEDIUM",
        "skillWeight": 3,
        "explanation": "NAMASTE provides standardized terminologies and morbidity codes for Ayurveda, Siddha, and Unani systems."
    },
    {
        "_id": "q_ayur_02",
        "assessmentId": "asm_01",
        "skillId": "sk_ayur_clin",
        "question": "Which of the following forms the core of 'Ashtavidha Pariksha' (eight-fold clinical examination) in classical Ayurveda?",
        "options": [
            "Nadi, Mutra, Mala, Jihwa, Shabda, Sparsha, Drik, Akriti",
            "Vata, Pitta, Kapha, Rasa, Rakta, Mamsa, Meda, Asthi",
            "Prana, Udana, Samana, Vyana, Apana, Pachaka, Ranjaka, Sadhaka",
            "Desha, Kala, Vaya, Satva, Satmya, Ahara, Bala, Agni"
        ],
        "correctAnswer": "Nadi, Mutra, Mala, Jihwa, Shabda, Sparsha, Drik, Akriti",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "Ashtavidha Pariksha consists of examining pulse, urine, stool, tongue, voice, touch, eyes, and general appearance."
    },
    {
        "_id": "q_ayur_03",
        "assessmentId": "asm_01",
        "skillId": "sk_ayur_clin",
        "question": "In the context of the WHO ICD-11 Traditional Medicine Module 2, what is the primary objective?",
        "options": [
            "Integrating Ayurvedic and traditional medicine diagnostic codes alongside standard biomedical reporting",
            "Replacing all modern ICD-11 codes with Sanskrit aphorisms",
            "Mandating single-herb prescriptions globally",
            "Restricting electronic health record data access exclusively to research laboratories"
        ],
        "correctAnswer": "Integrating Ayurvedic and traditional medicine diagnostic codes alongside standard biomedical reporting",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "ICD-11 Module 2 provides dual coding so Ayurvedic diagnoses can be captured systematically in international health statistics."
    },
    {
        "_id": "q_ayur_04",
        "assessmentId": "asm_01",
        "skillId": "sk_ayur_clin",
        "question": "When digitizing 'Prakriti' in an EHR, which three primary doshas are scored as phenotypic and physiological constitution markers?",
        "options": [
            "Vata, Pitta, and Kapha",
            "Sattva, Rajas, and Tamas",
            "Prana, Tejas, and Ojas",
            "Agni, Ama, and Mala"
        ],
        "correctAnswer": "Vata, Pitta, and Kapha",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "Prakriti refers to constitutional typology determined by the equilibrium and dominance of Vata, Pitta, and Kapha."
    },
    {
        "_id": "q_ayur_05",
        "assessmentId": "asm_01",
        "skillId": "sk_ayur_clin",
        "question": "Why is recording 'Anupana' (vehicle/adjuvant) crucial when digitizing Ayurvedic drug administration records?",
        "options": [
            "It affects bioavailability, therapeutic absorption, and target organ delivery of the formulation",
            "It is purely a dietary ritual without pharmacological significance",
            "It determines only the billing cost of the formulation",
            "It is used only to disguise the bitter taste of herbal decoctions"
        ],
        "correctAnswer": "It affects bioavailability, therapeutic absorption, and target organ delivery of the formulation",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "Classical texts emphasize Anupana as a catalytic vehicle that modulates pharmacokinetics and pharmacodynamics."
    },

    # --- Skill 4: Biostatistics (5 questions) ---
    {
        "_id": "q_stat_01",
        "assessmentId": "asm_01",
        "skillId": "sk_biostat",
        "question": "In an observational clinical study, what does a p-value of 0.03 (at alpha = 0.05) indicate regarding the null hypothesis?",
        "options": [
            "Reject the null hypothesis, indicating statistically significant evidence of an effect",
            "Accept the null hypothesis with certainty",
            "The experiment had a 97% error rate",
            "The study sample size was insufficient"
        ],
        "correctAnswer": "Reject the null hypothesis, indicating statistically significant evidence of an effect",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "Since p (0.03) is less than alpha (0.05), we reject the null hypothesis in favor of the alternative hypothesis."
    },
    {
        "_id": "q_stat_02",
        "assessmentId": "asm_01",
        "skillId": "sk_biostat",
        "question": "Which statistical test is appropriate to compare mean fasting blood glucose before and after a 12-week Ayurvedic intervention in the same patient group?",
        "options": [
            "Paired Student's t-test (or Wilcoxon signed-rank test)",
            "Unpaired two-sample t-test",
            "Chi-Square test of independence",
            "One-way ANOVA for independent samples"
        ],
        "correctAnswer": "Paired Student's t-test (or Wilcoxon signed-rank test)",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "A paired test evaluates differences in matched pairs (pre-test and post-test on the same individuals)."
    },
    {
        "_id": "q_stat_03",
        "assessmentId": "asm_01",
        "skillId": "sk_biostat",
        "question": "What is the primary difference between Standard Deviation (SD) and Standard Error of the Mean (SEM)?",
        "options": [
            "SD measures dispersion within a sample; SEM measures precision of the sample mean estimating the population mean",
            "SD is for non-parametric data; SEM is exclusively for categorical data",
            "SEM is always larger than SD",
            "SD depends on sample size N while SEM does not"
        ],
        "correctAnswer": "SD measures dispersion within a sample; SEM measures precision of the sample mean estimating the population mean",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "SEM = SD / sqrt(N). SD quantifies individual variation, whereas SEM quantifies the variability of sample means."
    },
    {
        "_id": "q_stat_04",
        "assessmentId": "asm_01",
        "skillId": "sk_biostat",
        "question": "When analyzing categorical data (e.g. proportion of improved vs unchanged symptoms across two intervention arms), which test is most commonly used?",
        "options": [
            "Pearson's Chi-Square Test / Fisher's Exact Test",
            "Mann-Whitney U test",
            "Linear regression analysis",
            "Kaplan-Meier survival curve"
        ],
        "correctAnswer": "Pearson's Chi-Square Test / Fisher's Exact Test",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "Chi-Square and Fisher's Exact tests evaluate contingency tables of categorical frequencies."
    },
    {
        "_id": "q_stat_05",
        "assessmentId": "asm_01",
        "skillId": "sk_biostat",
        "question": "In clinical research, an Odds Ratio (OR) of 1.0 indicates:",
        "options": [
            "No difference in odds of outcome between the exposed and unexposed groups",
            "The exposure confers a 100% increased risk",
            "The exposure completely protects against the outcome",
            "The study was compromised by confounding factors"
        ],
        "correctAnswer": "No difference in odds of outcome between the exposed and unexposed groups",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "An odds ratio of 1.0 represents the null value where odds are identical in both groups."
    },

    # --- Skill 5: Research Methodology (5 questions) ---
    {
        "_id": "q_meth_01",
        "assessmentId": "asm_01",
        "skillId": "sk_research_meth",
        "question": "In clinical trials, what does 'Double-Blind' design specifically prevent?",
        "options": [
            "Observer and participant expectation bias in assessment and reporting",
            "Laboratory contamination of trial formulations",
            "Data entry errors in database tables",
            "Statistical type II errors"
        ],
        "correctAnswer": "Observer and participant expectation bias in assessment and reporting",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "Double-blinding ensures neither the participant nor the investigator knows treatment allocation, mitigating subjective bias."
    },
    {
        "_id": "q_meth_02",
        "assessmentId": "asm_01",
        "skillId": "sk_research_meth",
        "question": "What is the primary guideline checklist recommended internationally for reporting Randomized Controlled Trials (RCTs)?",
        "options": [
            "CONSORT Statement (Consolidated Standards of Reporting Trials)",
            "PRISMA Checklist",
            "STROBE Statement",
            "CARE Case Report Guidelines"
        ],
        "correctAnswer": "CONSORT Statement (Consolidated Standards of Reporting Trials)",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "CONSORT provides standardized 25-item guidelines to ensure transparent and complete reporting of RCTs."
    },
    {
        "_id": "q_meth_03",
        "assessmentId": "asm_01",
        "skillId": "sk_research_meth",
        "question": "Before initiating any human subject clinical study on Ayurvedic formulations, which mandatory approval must be obtained?",
        "options": [
            "Institutional Ethics Committee (IEC) Clearance & CTRI Registration",
            "Local Municipal Corporation Trade License",
            "Patent Office Provisional Certificate",
            "Foreign Contribution Regulation clearance"
        ],
        "correctAnswer": "Institutional Ethics Committee (IEC) Clearance & CTRI Registration",
        "difficulty": "EASY",
        "skillWeight": 2,
        "explanation": "Ethical oversight via IEC and prospective registration with the Clinical Trials Registry - India (CTRI) are statutory requirements."
    },
    {
        "_id": "q_meth_04",
        "assessmentId": "asm_01",
        "skillId": "sk_research_meth",
        "question": "What constitutes 'Informed Consent' in Good Clinical Practice (GCP)?",
        "options": [
            "Voluntary agreement by a competent participant after full disclosure of study aims, risks, benefits, and rights to withdraw",
            "A verbal acknowledgment over a telephone call without documentation",
            "A waiver signed exclusively by the institutional director",
            "An automatic agreement triggered when a patient registers at the clinic"
        ],
        "correctAnswer": "Voluntary agreement by a competent participant after full disclosure of study aims, risks, benefits, and rights to withdraw",
        "difficulty": "EASY",
        "skillWeight": 1,
        "explanation": "Informed consent is an ethical cornerstone protecting autonomy and participant welfare."
    },
    {
        "_id": "q_meth_05",
        "assessmentId": "asm_01",
        "skillId": "sk_research_meth",
        "question": "What is the key distinction between Phase II and Phase III clinical trials?",
        "options": [
            "Phase II evaluates preliminary efficacy and therapeutic dosing in moderate cohorts; Phase III confirms efficacy and safety in large, definitive multi-center populations",
            "Phase II is conducted only in vitro, while Phase III is in animals",
            "Phase II focuses exclusively on post-marketing surveillance",
            "Phase III requires fewer patients than Phase II"
        ],
        "correctAnswer": "Phase II evaluates preliminary efficacy and therapeutic dosing in moderate cohorts; Phase III confirms efficacy and safety in large, definitive multi-center populations",
        "difficulty": "MEDIUM",
        "skillWeight": 2,
        "explanation": "Phase II is exploratory for efficacy/dosage; Phase III is confirmatory with comparative standard-of-care arms."
    }
]

# ----------------------------------------------------------------------
# 11. LEARNING RESOURCES (12 Resources across skills)
# ----------------------------------------------------------------------
LEARNING_RESOURCES_DATA = [
    {
        "_id": "lr_01",
        "skillId": "sk_python",
        "title": "Python for Biomedical Data & Clinical Pipelines",
        "provider": "AIIA Digital Academy (Demo)",
        "description": "Hands-on data manipulation using pandas, NumPy, and clean formatting for medical record processing.",
        "duration": "4 weeks (20 hrs)",
        "difficulty": "FOUNDATIONAL",
        "url": "https://elearning.aiia.demo/python-biomed",
        "potentialSkillGain": 20
    },
    {
        "_id": "lr_02",
        "skillId": "sk_python",
        "title": "Advanced Python Scripting for Health Analytics",
        "provider": "NPTEL Swayam Ayush Stream",
        "description": "Asynchronous APIs, data extraction pipelines, and automated report generation for health facilities.",
        "duration": "6 weeks (30 hrs)",
        "difficulty": "INTERMEDIATE",
        "url": "https://swayam.gov.in/demo/adv-python-health",
        "potentialSkillGain": 18
    },
    {
        "_id": "lr_03",
        "skillId": "sk_sql",
        "title": "Relational Databases & SQL for Electronic Health Records",
        "provider": "Digital Health India Foundation",
        "description": "Master SELECT queries, complex multi-table joins, subqueries, and window functions on clinical schemas.",
        "duration": "3 weeks (15 hrs)",
        "difficulty": "FOUNDATIONAL",
        "url": "https://digitalhealth.demo/courses/sql-ehr",
        "potentialSkillGain": 22
    },
    {
        "_id": "lr_04",
        "skillId": "sk_ayur_clin",
        "title": "NAMASTE Portal & WHO ICD-11 Ayush Terminology",
        "provider": "Ministry of Ayush Capacity Building Cell",
        "description": "Comprehensive guide to NAMASTE terminology, dual morbidity coding, and standardization of clinical descriptors.",
        "duration": "2 weeks (10 hrs)",
        "difficulty": "INTERMEDIATE",
        "url": "https://namaste.ayush.gov.in/demo/training",
        "potentialSkillGain": 25
    },
    {
        "_id": "lr_05",
        "skillId": "sk_ayur_clin",
        "title": "Standardized Prakriti Assessment & Phenotyping",
        "provider": "All India Institute of Ayurveda",
        "description": "Clinical protocols, validated questionnaires, and digital documentation of Prakriti phenotypes.",
        "duration": "3 weeks (12 hrs)",
        "difficulty": "FOUNDATIONAL",
        "url": "https://aiia.gov.in/prakriti-phenotyping",
        "potentialSkillGain": 20
    },
    {
        "_id": "lr_06",
        "skillId": "sk_phyto_chem",
        "title": "Botanical HPTLC & HPLC Spectral Data Analysis",
        "provider": "PhytoAnalytics Institute",
        "description": "Chromatographic fingerprinting, chemical marker profiling, and herbal medicine quality metrics.",
        "duration": "5 weeks (25 hrs)",
        "difficulty": "INTERMEDIATE",
        "url": "https://phytoanalytics.example.org/courses/hptlc",
        "potentialSkillGain": 22
    },
    {
        "_id": "lr_07",
        "skillId": "sk_biostat",
        "title": "Practical Biostatistics for Clinical Trials",
        "provider": "AIIA Research Cell & ICMR (Collaborative Demo)",
        "description": "Hypothesis testing, parametric vs non-parametric methods, survival analysis, and sample size power calculations.",
        "duration": "6 weeks (35 hrs)",
        "difficulty": "INTERMEDIATE",
        "url": "https://aiia.gov.in/biostat-practical",
        "potentialSkillGain": 24
    },
    {
        "_id": "lr_08",
        "skillId": "sk_hl7_interop",
        "title": "HL7 FHIR & ABDM Milestone Implementation",
        "provider": "National Health Authority Sandbox Tutorials",
        "description": "Building ABDM Milestone 1, 2, and 3 compliant health interfaces using FHIR R4 resources.",
        "duration": "4 weeks (20 hrs)",
        "difficulty": "ADVANCED",
        "url": "https://sandbox.abdm.gov.in/tutorials",
        "potentialSkillGain": 22
    },
    {
        "_id": "lr_09",
        "skillId": "sk_ml_health",
        "title": "Applied Machine Learning for Clinical Risk Stratification",
        "provider": "Health Data Innovation Hub",
        "description": "Supervised classification, tree-based models, and model interpretability (SHAP/LIME) on healthcare datasets.",
        "duration": "8 weeks (40 hrs)",
        "difficulty": "ADVANCED",
        "url": "https://healthai.example.org/ml-risk",
        "potentialSkillGain": 20
    },
    {
        "_id": "lr_10",
        "skillId": "sk_research_meth",
        "title": "GCP Guidelines & Clinical Trial Protocol Design",
        "provider": "CDSCO & AIIA Ethics Workshop",
        "description": "Investigator responsibilities, informed consent, protocol deviations, and CONSORT trial reporting.",
        "duration": "3 weeks (15 hrs)",
        "difficulty": "FOUNDATIONAL",
        "url": "https://aiia.gov.in/gcp-workshop",
        "potentialSkillGain": 20
    },
    {
        "_id": "lr_11",
        "skillId": "sk_data_viz",
        "title": "Healthcare Dashboard Design & Visual Storytelling",
        "provider": "Visual BioData Lab",
        "description": "Constructing interactive clinical graphs, epidemiological trends, and executive presentation dashboards.",
        "duration": "3 weeks (15 hrs)",
        "difficulty": "FOUNDATIONAL",
        "url": "https://biodata.example.org/dashboard-design",
        "potentialSkillGain": 18
    },
    {
        "_id": "lr_12",
        "skillId": "sk_tech_comm",
        "title": "Cross-Disciplinary Medical-Technical Communication",
        "provider": "Integrative Health Writing Forum",
        "description": "Translating Ayurvedic clinical paradigms for engineering and data science collaborators without ambiguity.",
        "duration": "2 weeks (10 hrs)",
        "difficulty": "FOUNDATIONAL",
        "url": "https://ayushwriting.example.org/cross-comm",
        "potentialSkillGain": 15
    }
]

# ----------------------------------------------------------------------
# 12. APPLICATIONS (5 Realistic Sample Applications with Step 8 Snapshots)
# ----------------------------------------------------------------------
APPLICATIONS_DATA = [
    {
        "_id": "app_01",
        "opportunityId": "opp_02",  # Health Informatics Assistant
        "studentId": "sp_01",        # Aarav Sharma
        "industryId": "ind_01",
        "status": "SHORTLISTED",
        "matchScore": 88.5,
        "matchScoreSnapshot": 88.5,
        "eligibilitySnapshot": "ELIGIBLE",
        "coverNote": "Eager to contribute to Ayurvedic clinical telemetry and data analysis at AyurTech Innovations.",
        "appliedAt": "2026-02-12T14:30:00Z",
        "updatedAt": "2026-02-15T10:00:00Z",
        "statusHistory": [
            {"status": "APPLIED", "timestamp": "2026-02-12T14:30:00Z", "actor": "STUDENT", "note": "Application submitted with snapshot score 88.5%"},
            {"status": "UNDER_REVIEW", "timestamp": "2026-02-14T09:00:00Z", "actor": "RECRUITER", "note": "Profile verified for health informatics project."},
            {"status": "SHORTLISTED", "timestamp": "2026-02-15T10:00:00Z", "actor": "RECRUITER", "note": "Shortlisted based on strong analytical and Ayurveda domain alignment."}
        ]
    },
    {
        "_id": "app_02",
        "opportunityId": "opp_01",  # Ayurvedic Clinical Research Intern
        "studentId": "sp_02",        # Priyanshi Verma
        "industryId": "ind_01",
        "status": "SHORTLISTED",
        "matchScore": 92.0,
        "matchScoreSnapshot": 92.0,
        "eligibilitySnapshot": "ELIGIBLE",
        "coverNote": "Strong clinical research background with published research review in Ayurvedic pharmacology.",
        "appliedAt": "2026-02-13T09:15:00Z",
        "updatedAt": "2026-02-16T11:00:00Z",
        "statusHistory": [
            {"status": "APPLIED", "timestamp": "2026-02-13T09:15:00Z", "actor": "STUDENT", "note": "Application submitted with snapshot score 92.0%"},
            {"status": "UNDER_REVIEW", "timestamp": "2026-02-15T14:00:00Z", "actor": "RECRUITER", "note": "Candidate profile under review by Clinical Leads."},
            {"status": "SHORTLISTED", "timestamp": "2026-02-16T11:00:00Z", "actor": "RECRUITER", "note": "Shortlisted for clinical trial associate assessment."}
        ]
    },
    {
        "_id": "app_03",
        "opportunityId": "opp_01",  # Ayurvedic Clinical Research Intern
        "studentId": "sp_03",        # Rohan Kulkarni
        "industryId": "ind_01",
        "status": "UNDER_REVIEW",
        "matchScore": 78.5,
        "matchScoreSnapshot": 78.5,
        "eligibilitySnapshot": "CONDITIONAL",
        "coverNote": "Extensive experience in clinical procedures, seeking to apply Ayurvedic informatics.",
        "appliedAt": "2026-02-14T16:45:00Z",
        "updatedAt": "2026-02-17T09:30:00Z",
        "statusHistory": [
            {"status": "APPLIED", "timestamp": "2026-02-14T16:45:00Z", "actor": "STUDENT", "note": "Application submitted with snapshot score 78.5%"},
            {"status": "UNDER_REVIEW", "timestamp": "2026-02-17T09:30:00Z", "actor": "RECRUITER", "note": "Reviewing statistical proficiency score."}
        ]
    },
    {
        "_id": "app_04",
        "opportunityId": "opp_05",  # Healthcare Data Analytics Intern
        "studentId": "sp_04",        # Ananya Iyer
        "industryId": "ind_03",
        "status": "APPLIED",
        "matchScore": 84.0,
        "matchScoreSnapshot": 84.0,
        "eligibilitySnapshot": "ELIGIBLE",
        "coverNote": "Passionate about bridging healthcare data analytics with clinical documentation.",
        "appliedAt": "2026-02-16T11:20:00Z",
        "updatedAt": "2026-02-16T11:20:00Z",
        "statusHistory": [
            {"status": "APPLIED", "timestamp": "2026-02-16T11:20:00Z", "actor": "STUDENT", "note": "Application submitted with snapshot score 84.0%"}
        ]
    },
    {
        "_id": "app_05",
        "opportunityId": "opp_03",  # Herb-Drug Data Analyst
        "studentId": "sp_05",        # Devendra Patel
        "industryId": "ind_02",
        "status": "APPLIED",
        "matchScore": 72.0,
        "matchScoreSnapshot": 72.0,
        "eligibilitySnapshot": "CONDITIONAL",
        "coverNote": "Interested in herb-drug interaction research and statistical modeling.",
        "appliedAt": "2026-02-18T13:00:00Z",
        "updatedAt": "2026-02-18T13:00:00Z",
        "statusHistory": [
            {"status": "APPLIED", "timestamp": "2026-02-18T13:00:00Z", "actor": "STUDENT", "note": "Application submitted with snapshot score 72.0%"}
        ]
    }
]

# ----------------------------------------------------------------------
# 13. PORTFOLIOS
# ----------------------------------------------------------------------
PORTFOLIOS_DATA = [
    {
        "_id": "port_01",
        "studentId": "sp_01",
        "projects": [
            {
                "title": "Ayush FHIR Interoperability Module",
                "description": "Standardized Ayush patient records mapped to ABDM M1/M2 requirements with Python FastAPI.",
                "tags": ["Python", "FHIR", "ABDM", "Ayush"]
            }
        ],
        "certifications": [
            {"name": "ABDM Health Data Professional", "issuer": "National Health Authority", "year": "2025"}
        ],
        "achievements": ["1st Prize Ayush Hackathon 2025"],
        "internships": [
            {"organization": "AIIA Hospital Informatics Cell", "role": "Data Analyst Trainee", "duration": "3 months"}
        ],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    },
    {
        "_id": "port_02",
        "studentId": "sp_02",
        "projects": [
            {
                "title": "Phytochemical Fingerprint of Withania somnifera",
                "description": "High-performance thin-layer chromatography (HPTLC) analysis of withanolides across seasons.",
                "tags": ["Phytochemistry", "HPTLC", "Research Methodology"]
            }
        ],
        "certifications": [
            {"name": "GCP Certified Clinical Investigator", "issuer": "NIDA Clinical Trials Network", "year": "2024"}
        ],
        "achievements": ["Best Paper Award - National Dravyaguna Congress 2025"],
        "internships": [
            {"organization": "AIIA Dravyaguna Drug Testing Lab", "role": "Research Fellow", "duration": "6 months"}
        ],
        "createdAt": "2026-02-10T11:00:00Z",
        "updatedAt": "2026-02-10T11:00:00Z"
    }
]

# ----------------------------------------------------------------------
# SEED ORCHESTRATION FUNCTION
# ----------------------------------------------------------------------
def seed_database(db: Database, force: bool = False) -> Dict[str, Any]:
    """
    Deterministically populates the MongoDB collections with stable IDs.
    If database is already populated and force=False, returns existing status
    without duplicate insertions.
    """
    status = {"action": "skipped", "message": "Database already contains seed data.", "counts": {}}

    user_count = db[COLLECTION_USERS].count_documents({})
    if user_count > 0 and not force:
        logger.info("Database already seeded. Skipping seed execution.")
        for coll in [
            COLLECTION_USERS, COLLECTION_INSTITUTIONS, COLLECTION_INDUSTRIES,
            COLLECTION_SKILLS, COLLECTION_STUDENT_PROFILES, COLLECTION_STUDENT_SKILL_SCORES,
            COLLECTION_OPPORTUNITIES, COLLECTION_OPPORTUNITY_SKILLS, COLLECTION_ASSESSMENTS,
            COLLECTION_ASSESSMENT_QUESTIONS, COLLECTION_LEARNING_RESOURCES, COLLECTION_APPLICATIONS,
            COLLECTION_PORTFOLIOS
        ]:
            status["counts"][coll] = db[coll].count_documents({})
        return status

    logger.info("Starting deterministic MongoDB database seeding...")

    # Define collections and corresponding dataset
    seed_map = [
        (COLLECTION_INSTITUTIONS, INSTITUTION_DATA),
        (COLLECTION_INDUSTRIES, INDUSTRIES_DATA),
        (COLLECTION_USERS, USERS_DATA),
        (COLLECTION_SKILLS, SKILLS_DATA),
        (COLLECTION_STUDENT_PROFILES, STUDENT_PROFILES_DATA),
        (COLLECTION_STUDENT_SKILL_SCORES, generate_student_skill_scores()),
        (COLLECTION_OPPORTUNITIES, OPPORTUNITIES_DATA),
        (COLLECTION_OPPORTUNITY_SKILLS, OPPORTUNITY_SKILLS_DATA),
        (COLLECTION_ASSESSMENTS, ASSESSMENTS_DATA),
        (COLLECTION_ASSESSMENT_QUESTIONS, ASSESSMENT_QUESTIONS_DATA),
        (COLLECTION_LEARNING_RESOURCES, LEARNING_RESOURCES_DATA),
        (COLLECTION_APPLICATIONS, APPLICATIONS_DATA),
        (COLLECTION_PORTFOLIOS, PORTFOLIOS_DATA),
    ]

    for coll_name, dataset in seed_map:
        coll = db[coll_name]
        if force:
            coll.delete_many({})
        for item in dataset:
            # Use replace_one with upsert=True based on _id for absolute idempotence
            coll.replace_one({"_id": item["_id"]}, item, upsert=True)
        status["counts"][coll_name] = coll.count_documents({})
        logger.info(f"Seeded collection '{coll_name}': {status['counts'][coll_name]} records.")

    status["action"] = "seeded" if not force else "re-seeded"
    status["message"] = "SkillSetu database successfully populated with standardized demo data."
    return status
