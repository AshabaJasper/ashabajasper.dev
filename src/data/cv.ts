/**
 * The parts of the owner's CV that are not experience: summary, skills,
 * notable projects, awards, certifications and further training. Source:
 * his CV, last updated June 2026, read on 7 October 2026. Wording is
 * condensed but every fact and number is the CV's own.
 *
 * Deliberately absent: phone numbers and the references section. The CV
 * page says references are available on request.
 *
 * Pure data with no server imports, so client components and tests can use it.
 */

export const cvSummary =
  "Data scientist and AI/ML engineer with a First Class computer science degree and a record of shipping production data products end to end: data pipelines and LLM systems, observability dashboards and full-stack applications. Most recently delivered AI/ML, data-science and analytics systems for a leading US radiology network (Envision Radiology, through Reveloop Tech Systems), spanning multi-LLM clinical analysis, document-intake automation, DICOM computer vision on Kubernetes and Grafana telemetry across the RIS and PACS ecosystem. Combines metric-driven analysis with the engineering discipline to put models into production and keep them observable.";

export const cvHeadline = ["Data Scientist", "AI/ML Engineer", "Analytics and BI", "Full-Stack Developer"] as const;

export const competencies: readonly string[] = [
  "Machine learning and deep learning",
  "LLM and generative AI systems",
  "Predictive modelling and analytics",
  "Data pipeline and ETL architecture",
  "NLP and computer vision",
  "MLOps and model observability",
  "Full-stack development",
  "Cloud and Kubernetes",
  "Business intelligence and dashboards",
  "Statistical analysis and experimentation",
];

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
}

export const skillGroups: readonly SkillGroup[] = [
  { id: "languages", label: "Programming and scripting", items: ["Python", "SQL", "R", "JavaScript", "TypeScript", "C#/.NET", "Dart", "Bash", "C++"] },
  { id: "ml", label: "Data science and ML", items: ["scikit-learn", "TensorFlow", "Keras", "PyTorch", "XGBoost", "LightGBM", "BERT", "Hugging Face", "OpenCV"] },
  { id: "genai", label: "Generative AI and LLMs", items: ["OpenAI GPT", "Google Gemini", "Anthropic Claude", "LLM ensembles and evaluation", "Prompt engineering", "RAG"] },
  { id: "data", label: "Data engineering and ETL", items: ["Apache Airflow", "Apache Spark", "Pandas", "NumPy", "SQLAlchemy", "Dask", "SQL Server", "PostgreSQL", "MySQL"] },
  { id: "bi", label: "BI and visualisation", items: ["Grafana", "Power BI", "Tableau", "Matplotlib", "Seaborn", "Plotly"] },
  { id: "cloud", label: "Cloud and infrastructure", items: ["Azure AKS", "Application Insights", "Key Vault", "AWS SageMaker", "S3", "Lambda", "BigQuery", "Vertex AI"] },
  { id: "mlops", label: "MLOps and observability", items: ["MLflow", "DVC", "Docker", "Kubernetes", "CI/CD", "Experiment tracking"] },
  { id: "web", label: "Web and mobile", items: ["Next.js", "React", "Django", "Flask", "FastAPI", "Flutter", "Firebase", "REST APIs", "GraphQL"] },
  { id: "databases", label: "Databases", items: ["SQL Server", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "Firebase"] },
  { id: "it", label: "IT and security", items: ["Linux administration", "Network configuration", "Firewall management", "ELK Stack", "ITIL practices"] },
];

export interface CvProject {
  name: string;
  context: string;
  text: string;
}

export const notableProjects: readonly CvProject[] = [
  {
    name: "RadCareLoop",
    context: "Envision Radiology",
    text: "A multi-LLM radiology follow-up analyser: Gemini, GPT and Claude with a Judge arbitration layer, validated at 97.9% accuracy against a 10,000-report gold-standard dataset.",
  },
  {
    name: "Patient Document AI pipeline",
    context: "Envision Radiology",
    text: "Automated multi-page fax order intake through a 9-service orchestration layer writing to SQL Server, traced with Application Insights.",
  },
  {
    name: "DICOM vision on Kubernetes",
    context: "Envision Radiology",
    text: "Computer-vision models for DICOM imaging on Azure AKS, with autoscaling node pools, resource quotas and MLflow tracking.",
  },
  {
    name: "RIS and PACS Grafana telemetry",
    context: "Envision Radiology",
    text: "Observability dashboards, including the DICOM Worklist dashboard, with team-based access control across the RIS ecosystem.",
  },
  {
    name: "Help Anonymous",
    context: "Capstone, Uganda Christian University",
    text: "An AI-powered mental-health platform: BERT and LSTM sentiment analysis in a Flutter app serving 270+ users with anonymous counselling.",
  },
  {
    name: "Predictive maintenance for fleets",
    context: "Blue Pearls and Uganda Transporters",
    text: "Random Forest and XGBoost models on real-time IoT sensor data, reducing unexpected breakdowns by 30% and operating costs by 20%.",
  },
];

export interface Award {
  title: string;
  issuer: string;
  year: string;
}

export const awards: readonly Award[] = [
  { title: "Gold Award", issuer: "Queen's Commonwealth Essay Competition", year: "2021" },
  { title: "First Class Honours, BSc Computer Science (GPA 4.62/5.0)", issuer: "Uganda Christian University", year: "2024" },
  { title: "Top 100 in Africa, Google Developer Community for Machine Learning and Cloud", issuer: "Google Developer Community", year: "2022 to 2023" },
  { title: "I4G Cybersecurity Scholarship", issuer: "Cisco Networking Academy", year: "2023" },
];

export interface Certification {
  title: string;
  issuer: string;
  year: string;
}

export const certifications: readonly Certification[] = [
  { title: "IBM Data Science Professional Certificate", issuer: "Coursera", year: "2026" },
  { title: "Machine Learning Specialization (Andrew Ng), DeepLearning.AI", issuer: "Coursera", year: "2026" },
  { title: "Junior Cybersecurity Analyst and Cyber Threat Management", issuer: "Cisco Networking Academy", year: "2023" },
  { title: "Introduction to Machine Learning", issuer: "Kaggle", year: "2023 to 2025" },
  { title: "Google Cloud Essentials", issuer: "Google Cloud Skills Boost", year: "2023" },
  { title: "Digital Marketing Professional Certificate", issuer: "CertiProf", year: "2023" },
];

export interface Training {
  title: string;
  provider: string;
  period: string;
  text: string;
}

export const training: readonly Training[] = [
  {
    title: "Junior Cybersecurity Analyst, I4G scholarship",
    provider: "Cisco Networking Academy",
    period: "Apr 2023 to Aug 2023",
    text: "Network security, threat analysis, penetration testing and firewall management, with hands-on vulnerability assessment labs.",
  },
  {
    title: "Certificate in Software Engineering with Python",
    provider: "MTN ACE Program, Refactory Academy",
    period: "2023",
    text: "An industry-sponsored intensive in Python, full-stack development and production application architecture.",
  },
  {
    title: "Uganda Advanced Certificate of Education (PCM)",
    provider: "Namilyango College, Mukono",
    period: "2018 to 2019",
    text: "Physics, Chemistry and Mathematics. Led the NASTECH Club to a Best Club Award in 2019.",
  },
];
