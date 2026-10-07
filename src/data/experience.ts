/**
 * The owner's history. Sources: his CV (last updated June 2026, read on
 * 7 October 2026), his LinkedIn and persmontechnologies.com. See
 * docs/PROFILE_SOURCES.md. Numbers in highlights are the CV's own figures,
 * reported as his results, never rounded or extended. Phone numbers and
 * referees from the CV are deliberately not stored anywhere on the site.
 *
 * Pure data with no server imports, so client components and tests can use it.
 */

export interface YearMonth {
  year: number;
  /** 1 to 12. */
  month: number;
}

export type ExperienceKind = "work" | "education" | "community";

export interface ExperienceEntry {
  /** Stable kebab-case key, used for anchors. */
  id: string;
  organisation: string;
  role: string;
  location: string | null;
  /** One sentence. */
  description: string;
  /** Bullets from the CV, in its order. */
  highlights: string[];
  href: string | null;
  /** Null when the start is not known. */
  start: YearMonth | null;
  /** "present" for ongoing roles. */
  end: YearMonth | "present";
  kind: ExperienceKind;
  remote?: boolean;
}

export const experience: readonly ExperienceEntry[] = [
  {
    id: "persmon",
    organisation: "Persmon Technologies",
    role: "Co-founder and COO",
    location: "Kampala, Uganda",
    description: "A Kampala software company with 47 shipped projects, from hotel systems to civic data.",
    highlights: [
      "47 shipped projects in the Persmon portfolio: systems, websites, online stores and mobile apps",
      "Focused on the systems Persmon builds for clients and the platforms it runs itself, such as HMS and OMS",
    ],
    href: "https://persmontechnologies.com",
    // Owner input needed: the date he became COO is not on the CV. LinkedIn
    // shows organisation tenure from December 2022, which is not the same
    // thing, so no start is shown for this role.
    start: null,
    end: "present",
    kind: "work",
  },
  {
    id: "reveloop",
    organisation: "Reveloop Tech Systems (Ezrev), for Envision Radiology",
    role: "Data Scientist and AI/ML Engineer",
    location: "Colorado Springs, USA",
    remote: true,
    description:
      "Production AI/ML, data-science and observability systems for a leading US radiology network, across its RIS, DICOM imaging and clinical document workflows.",
    highlights: [
      "Built RadCareLoop, a multi-LLM radiologist follow-up analyser: a Gemini, GPT and Claude ensemble with a custom Judge arbitration layer, validated at 97.9% accuracy against a 10,000-report gold-standard dataset",
      "Architected the Patient Document AI intake pipeline: multi-page fax orders split, filtered and routed through a 9-service orchestration layer into SQL Server",
      "Engineered LLM-assisted CPT and ICD code-mapping services, and fixed a critical patient-record duplication defect in the entity-resolution logic",
      "Deployed DICOM computer-vision models on Azure Kubernetes Service with node-pool autoscaling and namespace resource quotas for cost control",
      "Stood up MLOps and observability with MLflow and Azure Application Insights",
      "Designed Grafana telemetry dashboards for the RIS and PACS ecosystem, with role-based access through Grafana Teams",
    ],
    href: null,
    start: { year: 2025, month: 2 },
    end: { year: 2026, month: 6 },
    kind: "work",
  },
  {
    id: "excellent-shop",
    organisation: "Excellent Shop",
    role: "Lead Analyst and E-commerce Developer",
    location: "Kampala, Uganda",
    description: "A full-stack e-commerce platform with inventory, payments and live analytics.",
    highlights: [
      "Architected and launched the e-commerce platform, with inventory tracking, secure payments and automated pricing, driving a 25% increase in online sales revenue",
      "Built real-time analytics dashboards for sales trends and conversion funnels, improving conversion rates by 15%",
      "Optimised SEO and site performance for a 30% lift in organic traffic",
      "Automated stock management with Python and SQL, cutting manual inventory errors by 40%",
    ],
    href: null,
    start: { year: 2024, month: 2 },
    end: { year: 2025, month: 1 },
    kind: "work",
  },
  {
    id: "uganda-bookshop",
    organisation: "Uganda Bookshop",
    role: "Data Engineer and Digital Marketing Analyst",
    location: "Kampala, Uganda",
    description: "Data pipelines, forecasting models and BI dashboards for Kampala's oldest bookshop.",
    highlights: [
      "Designed automated ETL pipelines with Python, SQL and Apache Airflow over 5+ sources, improving cross-departmental data access by 50%",
      "Built customer segmentation and sales forecasting models with scikit-learn and XGBoost, contributing to a 40% rise in online sales",
      "Developed Tableau and Power BI dashboards with live feeds, lifting customer engagement by 35%",
    ],
    href: null,
    start: { year: 2023, month: 5 },
    end: { year: 2024, month: 8 },
    kind: "work",
  },
  {
    id: "centenary-publishing",
    organisation: "Centenary Publishing",
    role: "Mobile Application Developer",
    location: "Kampala, Uganda",
    description: "Print publications turned into interactive, offline-first e-books and apps.",
    highlights: [
      "Led the digitisation of print publications into interactive e-books (Uganda Youth Praise, Come and Worship), increasing digital downloads by 10% in the first quarter",
      "Developed cross-platform apps with Flutter and Firebase, offline first for low-connectivity regions",
    ],
    href: null,
    start: { year: 2023, month: 8 },
    end: { year: 2024, month: 4 },
    kind: "work",
  },
  {
    id: "mtn-uganda",
    organisation: "MTN Uganda",
    role: "Software Engineer Intern, Operations and Monitoring",
    location: "Kampala, Uganda",
    description: "Infrastructure monitoring and automation in the network operations centre.",
    highlights: [
      "Configured and maintained Grafana and the ELK Stack for real-time infrastructure monitoring",
      "Wrote automation scripts that reduced manual monitoring workloads by 25%",
      "Optimised SQL queries, improving reporting speed by 30% for monitoring dashboards",
    ],
    href: null,
    start: { year: 2023, month: 7 },
    end: { year: 2023, month: 9 },
    kind: "work",
  },
  {
    id: "blue-pearls",
    organisation: "Blue Pearls Company and Uganda Transporters",
    role: "Data Analyst and Fleet Management Software Developer",
    location: "Nakawa, Uganda",
    description: "Predictive maintenance and fleet analytics on live IoT sensor data.",
    highlights: [
      "Trained Random Forest and XGBoost models on real-time IoT sensor data to predict maintenance, cutting unexpected breakdowns by 30% and upkeep costs by 20%",
      "Deployed an IoT fleet-management system with geolocation tracking and predictive maintenance scheduling, improving fleet uptime by 18%",
      "Designed real-time fleet analytics dashboards for logistics tracking and route optimisation",
    ],
    href: null,
    start: { year: 2021, month: 4 },
    end: { year: 2024, month: 6 },
    kind: "work",
  },
  {
    id: "decades",
    organisation: "Decades Investments",
    role: "Lead Technical and Business Analyst",
    location: "Kampala, Uganda",
    description: "An e-commerce store and an inventory system for a growing business.",
    highlights: [
      "Developed and launched a full e-commerce store, increasing online sales by 25%",
      "Designed an inventory-management system, reducing manual stock-tracking errors by 20%",
    ],
    href: null,
    start: { year: 2019, month: 9 },
    end: { year: 2021, month: 2 },
    kind: "work",
  },
  {
    id: "learnnovate",
    organisation: "Learnnovate",
    role: "Founder and Program Director",
    location: "Uganda",
    description: "A technology education non-profit.",
    highlights: ["Built and runs technology education programmes reaching 200+ learners across multiple schools, focused on digital literacy and coding"],
    href: "https://github.com/Learnnovate-Africa",
    start: { year: 2022, month: 12 },
    end: "present",
    kind: "community",
  },
  {
    id: "radiant-smile",
    organisation: "Radiant Smile Foundation",
    role: "Data Analyst (volunteer)",
    location: "Uganda",
    description: "Impact measurement for a charity's programmes.",
    highlights: ["Created impact-measurement dashboards for programme effectiveness, supporting resource allocation and grant reporting"],
    href: null,
    start: { year: 2023, month: 6 },
    end: "present",
    kind: "community",
  },
  {
    id: "ucu",
    organisation: "Uganda Christian University",
    role: "BSc Computer Science, First Class Honours, GPA 4.62/5.0",
    location: "Mukono, Uganda",
    description: "Data science, machine learning, software engineering and algorithms. GDSC Lead.",
    highlights: [
      "Capstone: Help Anonymous, an AI-powered mental-health app in Flutter with BERT and LSTM sentiment analysis, serving 270+ active users",
      "Google Developer Student Club Lead (2022 to 2023): led 100+ students through workshops on ML, Python, TensorFlow and cloud",
      "Ranked among Africa's Top 100 in the Google Developer Community for Machine Learning and Cloud",
      "General Secretary, Data Science Society",
    ],
    href: null,
    start: { year: 2022, month: 1 },
    end: { year: 2024, month: 7 },
    kind: "education",
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatYearMonth(value: YearMonth): string {
  return `${MONTHS[value.month - 1]} ${value.year}`;
}

/** "Feb 2025 to Jun 2026", "Dec 2022 to present", or "Present" when the start is unknown. */
export function experiencePeriod(entry: Pick<ExperienceEntry, "start" | "end">): string {
  const end = entry.end === "present" ? "present" : formatYearMonth(entry.end);
  if (entry.start === null) return entry.end === "present" ? "Present" : end;
  if (entry.end !== "present" && entry.start.year === entry.end.year && entry.start.month === entry.end.month) return end;
  return `${formatYearMonth(entry.start)} to ${end}`;
}

/** Months between start and end, inclusive, or null when unknown. `now` is passed in for ongoing roles. */
export function experienceMonths(entry: Pick<ExperienceEntry, "start" | "end">, now: YearMonth): number | null {
  if (entry.start === null) return null;
  const end = entry.end === "present" ? now : entry.end;
  return (end.year - entry.start.year) * 12 + (end.month - entry.start.month) + 1;
}

export const workHistory = (): ExperienceEntry[] => experience.filter((e) => e.kind === "work");
export const educationHistory = (): ExperienceEntry[] => experience.filter((e) => e.kind === "education");
export const communityHistory = (): ExperienceEntry[] => experience.filter((e) => e.kind === "community");
