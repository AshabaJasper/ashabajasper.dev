/**
 * Every project on the portfolio. Sources: the Persmon Technologies project
 * listing (persmontechnologies.com/projects and each project page, read on
 * 7 October 2026) and the Jasper OS repository docs. The owner confirmed that
 * every Persmon project is his work. Nothing here is invented: unknown years
 * are null and stacks are only those the listing names.
 *
 * Pure data with no server imports, so client components and tests can use it.
 */

export type WorkKind = "system" | "website" | "ecommerce" | "mobile";

export interface WorkLink {
  label: string;
  /** Absolute URL, or a path on `site` when `site` is set. */
  href: string;
  /** Set for links to another of our own sites; resolved with crossHref() at render. */
  site?: "blog";
}

export interface CaseStudy {
  /** One line under the title. */
  headline: string;
  /** Two or three sentences. */
  context: string;
  /** What the system does, four to six bullets. */
  built: string[];
  stack: string[];
  role: string;
  links: WorkLink[];
}

export interface WorkItem {
  slug: string;
  name: string;
  kind: WorkKind;
  sector: string;
  year: number | null;
  /** One factual sentence. */
  summary: string;
  /** Public https URL, or null for internal, mobile and private work. */
  url: string | null;
  stack: string[];
  featured: boolean;
  order: number;
  /** Describes what the screenshot in src/data/work-images.ts shows. */
  screenshotAlt?: string;
  caseStudy?: CaseStudy;
}

const PERSMON = "Built at Persmon Technologies";
const persmonPage = (slug: string): WorkLink => ({
  label: "Project page at Persmon Technologies",
  href: `https://persmontechnologies.com/projects/${slug}/`,
});

export const work: WorkItem[] = [
  // Featured, in this order.
  {
    slug: "jasper-os",
    name: "Jasper OS",
    kind: "system",
    sector: "Personal software",
    year: 2026,
    summary:
      "A private, self-hosted life dashboard for goals, planning, habits, money, work and learning, built as one modular Next.js app.",
    url: null,
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Auth.js", "Vitest", "Docker"],
    screenshotAlt: "Jasper OS module settings, with presets that switch whole parts of the app on or off and a toggle for each module",
    featured: true,
    order: 1,
    caseStudy: {
      headline: "A private life dashboard, engineered like production software.",
      context:
        "Jasper OS is a single-owner dashboard for running a life: direction and goals, the day ahead, habits, money, work and learning. Every part of it is a module that can be switched off without losing data, and it runs self-hosted with Docker Compose behind Coolify. It holds private data, so it has no public address; the engineering is written up on the blog instead.",
      built: [
        "One module registry drives the sidebar, command palette, quick add, reports and the on and off switches",
        "Money kept as integer minor units, with explicit movement types and no ledger entry ever created automatically",
        "A sign-in PIN accepted only on a trusted device, stored as a bcrypt hash, with wrong tries counted per device",
        "Pure, tested calculation code kept apart from thin database code, with the current time passed in",
        "Privacy tiers that keep sensitive free text out of AI context, nudges and the calendar feed",
        "Opt-in automations and nudges by Telegram and email, with quiet hours, daily caps and a dry-run preview",
      ],
      stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Auth.js", "Vitest", "Docker Compose", "Coolify"],
      role: "Designed and built, solo",
      links: [
        { label: "A module registry as the single source of truth", href: "/module-registry-as-single-source-of-truth", site: "blog" },
        { label: "Money as integer minor units", href: "/money-as-integer-minor-units", site: "blog" },
        { label: "A PIN on a trusted device", href: "/pin-on-a-trusted-device", site: "blog" },
        { label: "Self-hosting Next.js on Coolify", href: "/self-hosting-nextjs-on-coolify", site: "blog" },
      ],
    },
  },
  {
    slug: "hms",
    name: "HMS: Hotel Management System",
    kind: "system",
    sector: "Hospitality",
    year: 2026,
    summary:
      "Multi-hotel operations platform for East African hotels: bookings, rooms, housekeeping, guests, payments and a restaurant and bar point of sale, priced in UGX with Mobile Money.",
    url: "https://hms.persmon.cloud",
    stack: ["Next.js", "NestJS", "TypeScript", "PostgreSQL", "Prisma", "Redis", "Docker"],
    screenshotAlt: "HMS sign-in screen with email and PIN sign-in, and a demo role picker that opens a private copy of the hotel",
    featured: true,
    order: 2,
    caseStudy: {
      headline: "Bookings, housekeeping and the bar on one set of books.",
      context:
        "Hotels in the region often run bookings, housekeeping and the bar on separate books, so double bookings and unpaid folios slip through. HMS is Persmon's own multi-hotel platform, priced in UGX with Mobile Money, and it is in use at Ishasha Junction Hotel. A public demo gives every visitor a private copy for 24 hours.",
      built: [
        "Bookings, check-in and check-out, with double bookings blocked at the database",
        "A restaurant and bar point of sale with modifiers, voids, split bills and Mobile Money tenders",
        "Housekeeping, maintenance and inventory, with a shift cash-up",
        "Nine staff roles, plus a PIN sign-in for the front desk",
        "Each hotel's data isolated by row-level security",
        "A public demo where every visitor gets a private copy for 24 hours",
      ],
      stack: ["Next.js", "NestJS", "TypeScript", "PostgreSQL", "Prisma", "Redis", "Docker"],
      role: PERSMON,
      links: [{ label: "Open the public demo", href: "https://hms.persmon.cloud" }, persmonPage("hms")],
    },
  },
  {
    slug: "oms",
    name: "OMS: Operations Management System",
    kind: "system",
    sector: "Professional services",
    year: 2026,
    summary:
      "One system for running a professional services firm: clients, projects, approvals, invoices, payroll, compliance and meetings, updated live for the whole team.",
    url: "https://ops.persmon.cloud",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Docker"],
    screenshotAlt: "OMS demo sign-in, where a visitor picks a team member such as the chief executive and enters the demo",
    featured: true,
    order: 3,
    caseStudy: {
      headline: "A whole professional services firm, run from one screen.",
      context:
        "OMS is Persmon's own platform for running a professional services firm in one place: clients, projects, approvals, invoices, payroll, compliance and meetings. Changes appear live for the whole team. A public demo runs on sample company data.",
      built: [
        "A command centre with deadlines at risk, approvals and receivables",
        "Clients and a 12-stage project board",
        "Invoices, receipts, budgets and payroll",
        "Approvals with dual sign-off",
        "An access matrix and a full audit log",
        "Optional two-factor sign-in",
      ],
      stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Docker"],
      role: PERSMON,
      links: [{ label: "Open the public demo", href: "https://ops.persmon.cloud" }, persmonPage("oms")],
    },
  },
  {
    slug: "uganda-bookshop",
    name: "Uganda Bookshop online store",
    kind: "ecommerce",
    sector: "Retail and e-commerce",
    year: 2026,
    summary:
      "Online store for Kampala's Uganda Bookshop, selling since 1927: searchable catalogue, basket and checkout, customer accounts, staff storefront tools and an installable app.",
    url: "https://ugandabookshop.com",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "PostgreSQL", "Drizzle ORM", "Docker"],
    screenshotAlt: "Uganda Bookshop home page with bookshelf categories, a title, author or ISBN search and a featured shelf of novels",
    featured: true,
    order: 4,
    caseStudy: {
      headline: "A Kampala bookshop that has sold books since 1927, now online.",
      context:
        "Uganda Bookshop has been selling books in Kampala since 1927. The online store brings its catalogue to the web with search, a basket and checkout, and customer accounts, and gives staff their own storefront tools. It also installs as an app that works offline.",
      built: [
        "A catalogue with search, sections and filters",
        "A server-priced basket and checkout with Pesapal payments",
        "Customer accounts and order tracking",
        "Staff tools for featured books, quotes and the blog",
        "Stock kept as a ledger of movements",
        "An installable app that works offline",
      ],
      stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "PostgreSQL", "Drizzle ORM", "Docker"],
      role: PERSMON,
      links: [{ label: "Visit ugandabookshop.com", href: "https://ugandabookshop.com" }, persmonPage("uganda-bookshop")],
    },
  },
  {
    slug: "pearl-insights",
    name: "Pearl Insights civic data platform",
    kind: "system",
    sector: "Research",
    year: null,
    summary:
      "Independent civic data platform for Uganda, with explorers for census, district, budget and public-service data and an open data API.",
    url: "https://pearl-insights.org",
    stack: ["React", "Vite"],
    screenshotAlt: "Pearl Insights home page with a district map of Uganda shaded by population density",
    featured: true,
    order: 5,
    caseStudy: {
      headline: "Uganda's public data, made explorable.",
      context:
        "Pearl Insights is an independent civic data platform for Uganda. It brings census, district, budget and public-service data together in explorers anyone can use, and offers an open data API for people who want to build on it.",
      built: [
        "A 2024 census explorer",
        "A directory of districts",
        "A national budget explorer",
        "A public services finder",
        "A development tracker",
        "An open data API with a guide and FAQ",
      ],
      stack: ["React", "Vite"],
      role: PERSMON,
      links: [{ label: "Visit pearl-insights.org", href: "https://pearl-insights.org" }, persmonPage("pearl-insights")],
    },
  },
  {
    slug: "sickle-cell-awards-voting",
    name: "Sickle Cell Awards 2026 voting platform",
    kind: "system",
    sector: "Events and NGOs",
    year: 2026,
    summary:
      "Public voting platform for the 1st National Sickle Cell Awards 2026, with one vote per person per category and a private staff results dashboard.",
    url: "https://mhfvotes.pearl-insights.org",
    stack: ["Next.js", "React", "TypeScript", "Supabase Auth", "PostgreSQL", "Zod", "Docker"],
    screenshotAlt: "Sickle Cell Awards 2026 home page with Vote now and How voting works buttons and the count of award categories and nominations",
    featured: true,
    order: 6,
    caseStudy: {
      headline: "One vote per person, per category, with results staff can trust.",
      context:
        "A public voting platform for the 1st National Sickle Cell Awards 2026, built for Mental Health Focus Uganda and partners. Each voter gets one vote per category, enforced per account and per phone number, while staff follow the results on a private dashboard.",
      built: [
        "Twelve award categories, with a vote dialog for each nominee",
        "Voter accounts, with two-factor sign-in for staff",
        "One vote per account and per phone number in each category",
        "Phone numbers stored only as a keyed digest",
        "A staff dashboard with totals, charts, audit records and CSV export",
        "Organisers can open, pause or close voting, with a logged reason",
      ],
      stack: ["Next.js", "React", "TypeScript", "Supabase Auth", "PostgreSQL", "Zod", "Docker"],
      role: PERSMON,
      links: [{ label: "Visit the voting site", href: "https://mhfvotes.pearl-insights.org" }, persmonPage("mhf-votes")],
    },
  },

  // Systems
  {
    slug: "centenary-publishing",
    name: "Centenary Publishing House bookshop and inventory",
    kind: "system",
    sector: "Publishing",
    year: 2026,
    summary:
      "Catalogue and online bookshop for a Ugandan Christian publisher, with cart and order tracking, plus an admin for inventory, orders, sales and customers.",
    url: "https://centenaryph.com",
    stack: ["HTML", "CSS", "JavaScript", "Supabase"],
    featured: false,
    order: 7,
  },
  {
    slug: "persmon-ems",
    name: "Persmon EMS",
    kind: "system",
    sector: "Internal operations",
    year: 2026,
    summary:
      "Persmon's internal operations command centre: clients, deadlines, tasks, team chat, invoicing and payroll across 29 connected modules.",
    url: null,
    stack: ["React", "Supabase", "Playwright"],
    featured: false,
    order: 8,
  },

  // E-commerce
  {
    slug: "excellent-shop",
    name: "Excellent Shop online store",
    kind: "ecommerce",
    sector: "Retail and e-commerce",
    year: null,
    summary:
      "Online store for an electronics and accessories shop, with categories, UGX and sale prices, and a list of its physical stores.",
    url: "https://excellentshopug.com",
    stack: ["WordPress", "WooCommerce"],
    featured: false,
    order: 9,
  },
  {
    slug: "berry-store",
    name: "Berry Store eyewear shop",
    kind: "ecommerce",
    sector: "Retail and e-commerce",
    year: null,
    summary:
      "Online shop for a Kampala eyewear boutique, with a browsable collection, a frame look builder and a cart that sends orders by WhatsApp.",
    url: "https://berry-store-ug.netlify.app",
    stack: [],
    featured: false,
    order: 10,
  },

  // Websites
  {
    slug: "ishasha-junction-hotel",
    name: "Ishasha Junction Hotel website and bookings",
    kind: "website",
    sector: "Hospitality",
    year: 2026,
    summary:
      "Website for a safari hotel between Queen Elizabeth National Park and Bwindi, with live room availability, booking requests and a staff dashboard.",
    url: "https://ishashajunctionhotel.com",
    stack: ["PHP 8", "MySQL", "PHPMailer", "HTML", "CSS", "JavaScript"],
    featured: false,
    order: 11,
  },
  {
    slug: "namirembe-guest-house",
    name: "Namirembe Guest House website and admin",
    kind: "website",
    sector: "Hospitality",
    year: 2026,
    summary:
      "Website for a guesthouse on Namirembe hill in Kampala, covering rooms, dining and conference venues, with an admin console for bookings and content.",
    url: "https://namirembegh.com",
    stack: ["PHP 8", "MySQL", "HTML", "CSS", "JavaScript", "Google Analytics 4"],
    featured: false,
    order: 12,
  },
  {
    slug: "gypsum-masters",
    name: "Gypsum Masters website",
    kind: "website",
    sector: "Construction",
    year: 2026,
    summary:
      "Business website for a Ugandan gypsum ceiling and interiors company, showing services and past work and collecting quote requests.",
    url: "https://gypsummastersltd.com",
    stack: ["HTML", "CSS", "JavaScript", "Netlify Forms"],
    featured: false,
    order: 13,
  },
  {
    slug: "terrazzo-masters",
    name: "Terrazzo Masters website",
    kind: "website",
    sector: "Construction",
    year: 2026,
    summary: "Marketing site for a Kampala terrazzo specialist, with services, a project portfolio, the team and quote requests.",
    url: "https://terrazzomastersug.com",
    stack: ["HTML", "CSS", "JavaScript", "Netlify Forms"],
    featured: false,
    order: 14,
  },
  {
    slug: "la-reine",
    name: "La Reine property and international engagement platform",
    kind: "website",
    sector: "Real estate",
    year: 2025,
    summary: "Website for a Ugandan property management firm, covering six service lines and the Uganda@MIPIM 2026 campaign.",
    url: "https://larieneug.org",
    stack: ["HTML", "Tailwind CSS", "JavaScript"],
    featured: false,
    order: 15,
  },
  {
    slug: "cchcl",
    name: "Church Commissioners Holding Company website",
    kind: "website",
    sector: "Property",
    year: null,
    summary:
      "Corporate website for the Church of Uganda's investment company in Kampala, covering its portfolio, projects, subsidiaries, tenders and careers.",
    url: "https://cchcl.com",
    stack: [],
    featured: false,
    order: 16,
  },
  {
    slug: "rf-energies",
    name: "RF Energies website",
    kind: "website",
    sector: "Energy",
    year: null,
    summary:
      "Website for RF Energy Resources Ltd, an energy and extractives advisory firm, presenting its services across oil and gas, mining, nuclear and renewables.",
    url: "https://rfenergies.com",
    stack: [],
    featured: false,
    order: 17,
  },
  {
    slug: "decade",
    name: "Decade Tours website",
    kind: "website",
    sector: "Travel",
    year: null,
    summary:
      "Website for a Ugandan tour operator, with a tour search, destinations and packages with starting prices, trip customisation and a blog.",
    url: "https://decadetours.com",
    stack: ["Next.js"],
    featured: false,
    order: 18,
  },
  {
    slug: "bakerm-hotel",
    name: "Bakerm Hotel website",
    kind: "website",
    sector: "Hospitality",
    year: null,
    summary:
      "Website for a hotel in Wakiso, with room types, stay requests, offers, restaurant table reservations and event bookings.",
    url: "https://bakermhotel.com",
    stack: [],
    featured: false,
    order: 19,
  },
  {
    slug: "nabugabo-holiday-center",
    name: "Nabugabo Holiday Center website and bookings",
    kind: "website",
    sector: "Hospitality",
    year: null,
    summary:
      "Website for a lakeside holiday centre on Lake Nabugabo, Masaka, with cottages, camping, rates in UGX and an online booking page.",
    url: "https://nabugabohc.com",
    stack: ["React"],
    featured: false,
    order: 20,
  },
  {
    slug: "tower-of-hope",
    name: "Tower of Hope Children's Foundation website",
    kind: "website",
    sector: "Charity and NGOs",
    year: null,
    summary: "Website for a child-welfare charity in Soroti, presenting its programmes and impact and inviting donations.",
    url: "https://towerofhopeug.org",
    stack: [],
    featured: false,
    order: 21,
  },
  {
    slug: "damac-charity",
    name: "DaMaC Charity website",
    kind: "website",
    sector: "Charity and NGOs",
    year: null,
    summary: "Website for a community-based non-profit, covering its programmes, success stories and ways to donate, volunteer or partner.",
    url: "https://damacorganization.com",
    stack: [],
    featured: false,
    order: 22,
  },
  {
    slug: "khan-associates",
    name: "KHAN Associates website",
    kind: "website",
    sector: "Finance",
    year: null,
    summary:
      "Website for a firm of certified public accountants in Kampala, covering audit, tax and consulting services, the team and consultation bookings.",
    url: "https://khanassociatescpa.com",
    stack: ["Bootstrap"],
    featured: false,
    order: 23,
  },
  {
    slug: "finetouch-salon",
    name: "Finetouch Salon website",
    kind: "website",
    sector: "Beauty",
    year: null,
    summary:
      "Website for a Kampala salon, listing its hair, nail, facial, spa and grooming services with a three-step appointment booking.",
    url: "https://finetouchsalonug.com",
    stack: [],
    featured: false,
    order: 24,
  },
  {
    slug: "area-uganda",
    name: "AREA Uganda website",
    kind: "website",
    sector: "Real estate",
    year: null,
    summary:
      "Website for the Association of Real Estate Agents Uganda, with membership applications, training, an agent verification search and its annual conference.",
    url: "https://areauganda.netlify.app",
    stack: [],
    featured: false,
    order: 25,
  },
  {
    slug: "areis",
    name: "Africa Real Estate Investment Summit website",
    kind: "website",
    sector: "Events",
    year: null,
    summary:
      "Event website for the Africa Real Estate Investment Summit 2025 in Kigali, with speakers, the agenda, ticket packages and registration.",
    url: "https://africa-re-conference.netlify.app",
    stack: [],
    featured: false,
    order: 26,
  },
  {
    slug: "mrco-advocates",
    name: "Mwesigwa Rukutana & Co. Advocates website",
    kind: "website",
    sector: "Legal",
    year: null,
    summary:
      "Website for a Kampala law firm, covering its practice areas, people, insights and careers, with a call to talk to a lawyer.",
    url: "https://mrco-demo.netlify.app",
    stack: [],
    featured: false,
    order: 27,
  },
  {
    slug: "archesian-construction",
    name: "Archesian Construction website",
    kind: "website",
    sector: "Construction",
    year: null,
    summary:
      "Website for an architecture, engineering and construction firm in Kampala, showing its disciplines and work, with project enquiries.",
    url: "https://archesian-construction.netlify.app",
    stack: [],
    featured: false,
    order: 28,
  },
  {
    slug: "munta-royal-college",
    name: "Munta Royal College website",
    kind: "website",
    sector: "Education",
    year: null,
    summary:
      "Website for an O- and A-Level secondary school in Luweero, covering academics, admissions, student life and news, with online applications.",
    url: "https://muntaroyalcollege.netlify.app",
    stack: [],
    featured: false,
    order: 29,
  },
  {
    slug: "gods-elite-hostel",
    name: "God's Elite Boys' Hostel website",
    kind: "website",
    sector: "Education",
    year: null,
    summary:
      "Website for a boys' hostel serving Mengo Senior School, with facilities, termly fees, parent testimonials and an application form.",
    url: "https://gods-elite-hostel.netlify.app",
    stack: [],
    featured: false,
    order: 30,
  },
  {
    slug: "acknog-travel",
    name: "Acknog Travel Services website",
    kind: "website",
    sector: "Travel",
    year: null,
    summary:
      "Website for a Ugandan travel company offering airport transfers, special hire, self-drive and ticketing, with bookings and quote requests.",
    url: "https://acknog-travel-services.netlify.app",
    stack: [],
    featured: false,
    order: 31,
  },
  {
    slug: "lyka-movers",
    name: "Lyka Movers website",
    kind: "website",
    sector: "Logistics",
    year: null,
    summary: "Website for a Kampala moving company, with local, long-distance and packing services, pricing, bookings and quote requests.",
    url: "https://lyka-movers.vercel.app",
    stack: [],
    featured: false,
    order: 32,
  },
  {
    slug: "blue-pearls",
    name: "Blue Pearls website",
    kind: "website",
    sector: "Logistics",
    year: null,
    summary: "Website for an East African trucking and logistics company, presenting its services with quote requests.",
    url: "https://bluepearsltd.netlify.app",
    stack: ["Bootstrap"],
    featured: false,
    order: 33,
  },
  {
    slug: "global-tracking",
    name: "Global Tracking website",
    kind: "website",
    sector: "Logistics",
    year: null,
    summary:
      "Website for a Kampala vehicle tracking and transport company, covering GPS tracking, vehicle hire, cargo and clearing services.",
    url: "https://globaltrackingltd.netlify.app",
    stack: ["Bootstrap", "jQuery"],
    featured: false,
    order: 34,
  },
  {
    slug: "jeratha-international",
    name: "Jeratha International website",
    kind: "website",
    sector: "Transport",
    year: null,
    summary: "Website for a Ugandan transport company offering car hire, airport transfers, goods transport and tours.",
    url: "https://jerathainternational.netlify.app",
    stack: ["Bootstrap", "jQuery"],
    featured: false,
    order: 35,
  },
  {
    slug: "pagram-solutions",
    name: "Pagram Solutions website",
    kind: "website",
    sector: "Transport",
    year: null,
    summary: "Website for a transport and logistics company, with car hire daily rates, trucking, driver hire and a booking form.",
    url: "https://pagramsolutions.netlify.app",
    stack: ["Bootstrap"],
    featured: false,
    order: 36,
  },
  {
    slug: "premier-property",
    name: "Premier Property Management website",
    kind: "website",
    sector: "Real estate",
    year: null,
    summary:
      "Website for a Ugandan real estate company, covering property management, sales and lettings, investment advice and featured listings.",
    url: "https://premier-property-website.vercel.app",
    stack: ["Next.js"],
    featured: false,
    order: 37,
  },
  {
    slug: "dwell-and-domain",
    name: "Dwell and Domain website",
    kind: "website",
    sector: "Services",
    year: null,
    summary:
      "Website for an agency placing vetted maids, nannies, caregivers, cooks and security staff with households and institutions.",
    url: "https://dwellanddoman.vercel.app",
    stack: [],
    featured: false,
    order: 38,
  },
  {
    slug: "divine-flowers",
    name: "Divine Flowers website",
    kind: "website",
    sector: "Landscaping and florals",
    year: null,
    summary: "Website for a landscaping, garden design and floral styling business, with services, a gallery, a journal and quote requests.",
    url: "https://divineflowers.vercel.app",
    stack: [],
    featured: false,
    order: 39,
  },
  {
    slug: "veganic-juice",
    name: "Veganic Juice and Tea website",
    kind: "website",
    sector: "Food",
    year: null,
    summary:
      "Website for an event caterer serving juice, tea and coffee at weddings, graduations and other celebrations, with a priced menu and event booking.",
    url: "https://veganicjuice.vercel.app",
    stack: ["Bootstrap"],
    featured: false,
    order: 40,
  },
  {
    slug: "bash-gadgets",
    name: "Bash Gadgets website",
    kind: "website",
    sector: "Retail and e-commerce",
    year: null,
    summary: "Website for a Kampala seller of used Samsung phones, with a price list, warranty claims and WhatsApp ordering.",
    url: "https://bashgadgets.netlify.app",
    stack: [],
    featured: false,
    order: 41,
  },
  {
    slug: "jejjosa",
    name: "Jejjosa & Company website",
    kind: "website",
    sector: "Furniture",
    year: null,
    summary: "Website for a Kampala furniture manufacturer, showing home, office and school collections, with free quote requests.",
    url: "https://jejjosa.netlify.app",
    stack: [],
    featured: false,
    order: 42,
  },
  {
    slug: "pro-bono",
    name: "Pro Bono Initiative website",
    kind: "website",
    sector: "Charity and NGOs",
    year: null,
    summary:
      "Website for a youth-led non-profit working across health, women, environment and education, with a book club, podcasts and a gallery.",
    url: "https://probono-initiative.netlify.app",
    stack: ["Bootstrap", "jQuery"],
    featured: false,
    order: 43,
  },
  {
    slug: "damola",
    name: "DAMOLA UG website",
    kind: "website",
    sector: "Media",
    year: null,
    summary: "Website for a Kampala marketing agency offering influencer marketing, social media, content, analytics and bulk SMS.",
    url: "https://damolaug.netlify.app",
    stack: [],
    featured: false,
    order: 44,
  },
  {
    slug: "lawyers-hand-africa",
    name: "Lawyers Hand Africa website",
    kind: "website",
    sector: "Charity and NGOs",
    year: null,
    summary:
      "Website for a youth-led NGO giving free legal aid and civic education in Uganda, with its programmes, impact figures and donations.",
    url: "https://lawyershandafrica.netlify.app",
    stack: [],
    featured: false,
    order: 45,
  },

  // Mobile apps
  {
    slug: "cityryder-boda",
    name: "CityRyder Boda",
    kind: "mobile",
    sector: "Transport",
    year: 2025,
    summary:
      "Boda boda booking app for Kampala that connects riders and passengers, with live GPS tracking, in-app payments and driver ratings.",
    url: null,
    stack: ["React Native", "GPS", "Mobile Money"],
    featured: false,
    order: 46,
  },
  {
    slug: "enosecure",
    name: "Enosecure Parental Control",
    kind: "mobile",
    sector: "Cybersecurity",
    year: 2025,
    summary: "Family safety app with content filtering, screen-time limits, location and real-time alerts for parents.",
    url: null,
    stack: ["Android", "iOS"],
    featured: false,
    order: 47,
  },
  {
    slug: "uganda-youth-praise",
    name: "Uganda Youth Praise",
    kind: "mobile",
    sector: "Media and faith",
    year: 2025,
    summary:
      "Worship and community app for Uganda's youth, with song libraries, event calendars, live streaming and a prayer-request network.",
    url: null,
    stack: ["Flutter", "Firebase"],
    featured: false,
    order: 48,
  },
];

/** The kinds in display order, with their section labels. */
export const workKinds: readonly { kind: WorkKind; label: string }[] = [
  { kind: "system", label: "Systems" },
  { kind: "website", label: "Websites" },
  { kind: "ecommerce", label: "E-commerce" },
  { kind: "mobile", label: "Mobile apps" },
];

/** URL-safe key for a sector label. */
export function sectorSlug(sector: string): string {
  return sector
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every sector with how many projects sit in it, most used first, then by name. */
export const sectors: readonly { slug: string; label: string; count: number }[] = (() => {
  const counts = new Map<string, number>();
  for (const item of work) counts.set(item.sector, (counts.get(item.sector) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ slug: sectorSlug(label), label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
})();

/** All work in display order. */
export function allWork(): WorkItem[] {
  return [...work].sort((a, b) => a.order - b.order);
}

/** The six featured case studies, in their fixed order. */
export function featuredWork(): (WorkItem & { caseStudy: CaseStudy })[] {
  return allWork().filter((item): item is WorkItem & { caseStudy: CaseStudy } => item.featured && !!item.caseStudy);
}

export function workBySlug(slug: string): WorkItem | null {
  return work.find((item) => item.slug === slug) ?? null;
}

/** "Hospitality · 2026", or just the sector when the year is unknown. */
export function sectorYear(item: Pick<WorkItem, "sector" | "year">): string {
  return item.year === null ? item.sector : `${item.sector} · ${item.year}`;
}
