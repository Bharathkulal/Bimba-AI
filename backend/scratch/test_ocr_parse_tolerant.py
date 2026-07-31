import re
import pprint

ocr_text = """KARAN PRATAP SINGH
(415) 602-9452 | San Francisco, CA | contact@karanpratapsingh.com
karanpratapsingh.com | linkedin.com/karan99 | github.com/karanpratapsingh
SKILLS
Programming Golang, Python, TypeScript, JavaScript, Java, PostgreSQL, Redis, GraphQL
F rameworks Express.js, Django, Flask, FastAPI, Spring Boot, React.js, Next.js
DevOps Docker, Kubernetes, Terraform, Pulumi, Jenkins
Cloud Providers Amazon Web Services (A WS), Google Cloud Platform (GCP)
EXPERIENCE
Software Engineer 02/05/2024 - Present
Apple Inc. Cupertino, CA
Senior Software Engineer 05/03/2023 - 01/26/2024
The Guardian Life Insurance Company of America Holmdel, NJ
 Developed features for Guardian Anytime web app leveraging React.js and Node.js serving over 4M users.
 Migrated legacy Java SOAP APIs to RESTful APIs using Spring Boot ensuring robust code quality.
 Improved reliability and maintainability of React.js application by increasing test coverage by 12%.
Senior Engineer 12/07/2020 - 05/13/2023
Curebase San Francisco, CA
 Designed scalable REST and GraphQL APIs using TypeScript, Node.js, Redis, and PostgreSQL.
 Led initiative for codebase migration to TypeScript, reducing cost and API latency by 50%.
 Built fault-tolerant, horizontally scalable multi-tenancyfor core SaaS product leveragingA WS (ALB,
ECS, S3, RDS, SQS, DynamoDB)with a focus on security , GDPR, and HIP AA compliance.
 Utilized Golang, Python, and T erraformto develop business-critical internal tools and simplify SDLC.
Software Developer 05/26/2020 - 01/31/2021
Quotient Inc. Maryland, USA (Remote)
 Created a digital asset management platform using React, TypeScript, Node.js, and GraphQL.
 Implemented terabyte-scale data ingestion and streamingwith Node.js for over 150 million artifacts.
 Designed end-to-end GraphQL data layer and client-side enterprise search solution with React.
 Optimized production CI/CD pipeline using Docker multi-stage builds, reducing container size by 80%.
Software Developer 08/17/2019 - 06/07/2020
Stewards London, UK (Remote)
 Implemented event-driven food delivery mobile application with React Native.
 Consolidated internal sales and custom B2B integrations with React and Node.js.
 Edge-optimized GraphQL API utilizing Google Cloud CDN, increasing customer retention by 60%.
PUBLICA TIONS
 Manas Singh, Karan Pratap Singhet al. System and method for defense in depth of one or more
software delivery pipelines. US Patent Application No. 18373596 . Filed September 27, 2023.
 Manas Singh, Karan Pratap Singhet al. System and method for continuous automated threat
modeling. US Patent Application No. 18230253 . Filed August 4, 2023.
 Learn Go, Published Jan 2023, ISBN 979-8-9883975-4-0.
 System Design, Published Aug 2022, ISBN 979-8-9883975-8-8.
ACHIEVEMENTS
 Co-authored U.S. patents, contributing novel solutions in software security and delivery pipelines.
 Author and maintainer of System Design , ranked amongst GitHubs top 500 global repositorieswith
over 38K starsand 40K monthly views.
 Published 50+ technical articleson software engineering topics such as distributed systems, microservices,
software architecture, and DevOps on Medium and Dev.to, reaching over 2 million views.
 Created and managed a Y ouT ube channel on software engineering, producing educational tutorials
that have reached 70K+ developers globally.
 Published technical books on System Design and Learn Go, contributing practical guidance and
insights to the software engineering community.
 Contributed to open-source projects, acknowledged in React Native v0.60 by Meta.
PROJECTS
 ScaleETL - High-performance CLI for partitioning, transforming, loading, and searching CSV datasets up
to 1 billion rows.
 Preview Environments - On-demand ephemeral, secure, and isolated A WS infrastructure to accelerate
early Product and QA collaboration and improve cross-team visibility.
 HyperT rade- Distributed system for automated cryptocurrency trading across multiple exchanges.
 F ull Stack Starter Kit- Scalable, GraphQL first template used by 1200+ developers.
 Proximity - Privacy-focused, open-source social media platform with over 10,000 users.
EDUCA TION
Bachelors of T echnology , Computer Science and Engineering 2017 - 2021
SRM Institute of Science and Technology Delhi NCR, India"""

def parse(text):
    # Pre-cleaning specific known PDF space splits
    text = text.replace("EDUCA TION", "EDUCATION")
    text = text.replace("PUBLICA TIONS", "PUBLICATIONS")
    text = text.replace("T echnology", "Technology")
    text = text.replace("F ull", "Full")
    text = text.replace("HyperT rade", "HyperTrade")
    text = text.replace("A WS", "AWS")
    text = text.replace("T erraform", "Terraform")
    text = text.replace("leveragingA WS", "leveraging AWS")
    text = text.replace("Y ouT ube", "YouTube")
    text = text.replace("F rameworks", "Frameworks")
    
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+|linkedin\.com/[\w\-]+", text, re.IGNORECASE)
    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w\-]+", text, re.IGNORECASE)
    
    name = "Candidate Name"
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        name = lines[0]
        
    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""
    linkedin = linkedin_match.group(0) if linkedin_match else ""
    github = github_match.group(0) if github_match else ""
    
    skills = []
    experience = []
    projects = []
    education = []
    
    current_section = None
    for line in lines[1:]:
        lower_line = line.lower()
        
        # Whitespace-tolerant section detection
        if re.search(r"\b(s\s*k\s*i\s*l\s*l\s*s|t\s*e\s*c\s*h\s*n\s*o\s*l\s*o\s*g\s*i\s*e\s*s)\b", lower_line):
            current_section = "skills"
            continue
        elif re.search(r"\b(e\s*x\s*p\s*e\s*r\s*i\s*e\s*n\s*c\s*e|e\s*m\s*p\s*l\s*o\s*y\s*m\s*e\s*n\s*t|w\s*o\s*r\s*k\s* \s*h\s*i\s*s\s*t\s*o\s*r\s*y)\b", lower_line):
            current_section = "experience"
            continue
        elif re.search(r"\b(p\s*r\s*o\s*j\s*e\s*c\s*t\s*s)\b", lower_line):
            current_section = "projects"
            continue
        elif re.search(r"\b(e\s*d\s*u\s*c\s*a\s*t\s*i\s*o\s*n|a\s*c\s*a\s*d\s*e\s*m\s*i\s*c\s*s)\b", lower_line):
            current_section = "education"
            continue
        elif re.search(r"\b(p\s*u\s*b\s*l\s*i\s*c\s*a\s*t\s*i\s*o\s*n\s*s|a\s*c\s*h\s*i\s*e\s*v\s*e\s*m\s*e\s*n\s*t\s*s|a\s*w\s*a\s*r\s*d\s*s)\b", lower_line):
            current_section = None
            continue
            
        if current_section == "skills":
            clean_line = re.sub(r"^(programming|frameworks|devops|cloud providers|tools|languages)\b", "", line, flags=re.IGNORECASE).strip()
            parts = re.split(r"[,;•|]", clean_line)
            for part in parts:
                part = part.strip()
                if part and len(part) < 40:
                    skills.append({"category": "Programming", "name": part, "level": 4})
        elif current_section == "experience":
            date_match = re.search(r"(\d{2}/\d{2}/\d{4}|\w+ \d{4})?\s*-\s*(\d{2}/\d{2}/\d{4}|Present|\w+ \d{4})", line)
            if date_match:
                duration = date_match.group(0)
                title = line.replace(duration, "").strip(", \t")
                experience.append({"company": "", "position": title, "duration": duration, "description": ""})
            elif experience:
                if not experience[-1]["company"]:
                    experience[-1]["company"] = line
                else:
                    experience[-1]["description"] += "\n" + line
        elif current_section == "projects":
            clean_line = re.sub(r"^[•\-\*]\s*", "", line).strip()
            if clean_line:
                parts = re.split(r"\s*[\-–—:]\s+", clean_line, maxsplit=1)
                if len(parts) == 2:
                    projects.append({"name": parts[0].strip(), "tech_stack": "", "description": parts[1].strip()})
                else:
                    projects.append({"name": "Project", "tech_stack": "", "description": clean_line})
        elif current_section == "education":
            year_match = re.search(r"\b(19|20)\d{2}\s*-\s*\b(19|20)\d{2}\b", line)
            if year_match:
                passing_year = year_match.group(0)
                degree = line.replace(passing_year, "").strip(", \t")
                education.append({"institution": "", "degree": degree, "year": passing_year, "passing_year": passing_year})
            elif education:
                if not education[-1]["institution"]:
                    education[-1]["institution"] = line
                elif not education[-1]["degree"]:
                    education[-1]["degree"] = line
                else:
                    education.append({"institution": line, "degree": "", "year": "", "passing_year": ""})
            else:
                education.append({"institution": line, "degree": "", "year": "", "passing_year": ""})
                
    return {
        "personal_info": {
            "name": name,
            "email": email,
            "phone": phone,
            "address": "",
            "linkedin": linkedin,
            "github": github,
            "portfolio": "",
            "summary": ""
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills
    }

pprint.pprint(parse(ocr_text))
