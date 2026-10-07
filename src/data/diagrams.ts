import type { DiagramSpec } from "@/components/portfolio/diagram-layout";

/**
 * One diagram per case study. Every node and edge restates a fact from the
 * case study in src/data/work.ts (itself taken from the Persmon project
 * pages): nothing here adds a feature, an integration or a number.
 *
 * Pure data with no server imports.
 */
export const diagrams: Record<string, DiagramSpec> = {
  hms: {
    title: "How HMS keeps a hotel on one set of books",
    description:
      "Front desk staff sign in with a PIN and record bookings, where double bookings are blocked. The restaurant and bar bill through the point of sale, with voids and split bills, and housekeeping logs maintenance and stock. All of it lands on one set of books for each hotel, priced in UGX, which settles through Mobile Money tenders and a shift cash-up, on PostgreSQL with row-level security keeping each hotel's data apart.",
    stages: [
      {
        label: "Staff",
        nodes: [
          { id: "desk", label: "Front desk", sub: "PIN sign-in", icon: "key" },
          { id: "bar", label: "Restaurant, bar", sub: "Point of sale", icon: "utensils" },
          { id: "hk", label: "Housekeeping", sub: "Rooms and upkeep", icon: "bed" },
        ],
      },
      {
        label: "Records",
        nodes: [
          { id: "bookings", label: "Bookings", sub: "No double bookings", icon: "calendar" },
          { id: "pos", label: "Bills", sub: "Voids, split bills", icon: "receipt" },
          { id: "upkeep", label: "Upkeep and stock", sub: "Maintenance, stock", icon: "wrench" },
        ],
      },
      {
        label: "Ledger",
        nodes: [{ id: "books", label: "One set of books", sub: "Per hotel, in UGX", icon: "book", accent: true }],
      },
      {
        label: "Settle and store",
        nodes: [
          { id: "momo", label: "Mobile Money", sub: "At the point of sale", icon: "phone" },
          { id: "cashup", label: "Shift cash-up", sub: "Per shift", icon: "cash" },
          { id: "db", label: "PostgreSQL", sub: "Row-level security", logo: "postgresql" },
        ],
      },
    ],
    edges: [
      { from: "desk", to: "bookings" },
      { from: "bar", to: "pos" },
      { from: "hk", to: "upkeep" },
      { from: "bookings", to: "books" },
      { from: "pos", to: "books" },
      { from: "upkeep", to: "books" },
      { from: "books", to: "momo" },
      { from: "books", to: "cashup" },
      { from: "books", to: "db" },
    ],
  },
  oms: {
    title: "How OMS brings a firm onto one live screen",
    description:
      "Clients, the 12-stage project board, approvals with dual sign-off and invoices with receipts all write to one Supabase and PostgreSQL database. Changes appear live for the whole team, feed a command centre that shows deadlines at risk, approvals and receivables, and are recorded in a full audit log behind an access matrix.",
    stages: [
      {
        label: "Modules",
        nodes: [
          { id: "clients", label: "Clients", sub: "Client records", icon: "users" },
          { id: "board", label: "Project board", sub: "12 stages", icon: "board" },
          { id: "approvals", label: "Approvals", sub: "Dual sign-off", icon: "badge" },
          { id: "invoices", label: "Invoices", sub: "Receipts, payroll", icon: "receipt" },
        ],
      },
      {
        label: "Live data",
        nodes: [{ id: "db", label: "Supabase", sub: "PostgreSQL, live", logo: "supabase", accent: true }],
      },
      {
        label: "Oversight",
        nodes: [
          { id: "command", label: "Command centre", sub: "Deadlines at risk", icon: "gauge" },
          { id: "team", label: "The whole team", sub: "Sees changes live", icon: "users" },
          { id: "audit", label: "Audit log", sub: "Access matrix", icon: "shield" },
        ],
      },
    ],
    edges: [
      { from: "clients", to: "db" },
      { from: "board", to: "db" },
      { from: "approvals", to: "db" },
      { from: "invoices", to: "db" },
      { from: "db", to: "command" },
      { from: "db", to: "team" },
      { from: "db", to: "audit" },
    ],
  },
  "uganda-bookshop": {
    title: "From the shelf to a paid order at Uganda Bookshop",
    description:
      "Staff curate the catalogue with featured books, quotes and the blog, and customers reach it in the browser or the installable app that works offline. They search and filter, fill a basket priced on the server and pay at checkout through Pesapal. Orders are tracked in customer accounts, stock is kept as a ledger of movements, and everything is stored in PostgreSQL through Drizzle ORM.",
    stages: [
      {
        label: "Storefront",
        nodes: [
          { id: "staff", label: "Staff tools", sub: "Featured books, blog", icon: "pen" },
          { id: "catalogue", label: "Catalogue", sub: "Search and filters", icon: "search", accent: true },
          { id: "app", label: "Offline app", sub: "Installable", icon: "wifi" },
        ],
      },
      { label: "Basket", nodes: [{ id: "basket", label: "Basket", sub: "Priced on the server", icon: "cart" }] },
      { label: "Pay", nodes: [{ id: "checkout", label: "Checkout", sub: "Pesapal payments", icon: "card" }] },
      {
        label: "Records",
        nodes: [
          { id: "orders", label: "Orders", sub: "Tracked in accounts", icon: "package" },
          { id: "db", label: "PostgreSQL", sub: "Drizzle ORM", logo: "postgresql" },
          { id: "ledger", label: "Stock ledger", sub: "Every movement", icon: "boxes" },
        ],
      },
    ],
    edges: [
      { from: "staff", to: "catalogue" },
      { from: "app", to: "catalogue" },
      { from: "catalogue", to: "basket" },
      { from: "basket", to: "checkout" },
      { from: "checkout", to: "orders" },
      { from: "orders", to: "db" },
      { from: "ledger", to: "db" },
    ],
  },
  "pearl-insights": {
    title: "How Pearl Insights turns public data into tools",
    description:
      "Census, district, budget and public-service data for Uganda come together in Pearl Insights, a React and Vite application. It serves five explorers for anyone to use in the browser, and an open data API with a guide and FAQ for developers who want to build on it.",
    stages: [
      {
        label: "Public data",
        nodes: [
          { id: "census", label: "2024 census", icon: "users" },
          { id: "districts", label: "Districts", icon: "pin" },
          { id: "budget", label: "National budget", icon: "landmark" },
          { id: "services", label: "Public services", icon: "building" },
        ],
      },
      {
        label: "Platform",
        nodes: [{ id: "app", label: "Pearl Insights", sub: "React and Vite", logo: "react", accent: true }],
      },
      {
        label: "Tools",
        nodes: [
          { id: "explorers", label: "Explorers", sub: "Five public tools", icon: "chart" },
          { id: "api", label: "Open data API", sub: "Guide and FAQ", icon: "code" },
        ],
      },
      {
        label: "People",
        nodes: [
          { id: "public", label: "Anyone", sub: "In the browser", icon: "globe" },
          { id: "devs", label: "Developers", sub: "Build on the API", icon: "terminal" },
        ],
      },
    ],
    edges: [
      { from: "census", to: "app" },
      { from: "districts", to: "app" },
      { from: "budget", to: "app" },
      { from: "services", to: "app" },
      { from: "app", to: "explorers" },
      { from: "app", to: "api" },
      { from: "explorers", to: "public" },
      { from: "api", to: "devs" },
    ],
  },
  "sickle-cell-awards-voting": {
    title: "One vote per person, per category, end to end",
    description:
      "A voter signs in and votes through a dialog in each of the twelve categories. Every vote passes the one-vote rule, enforced per account and per phone number, and phone numbers are kept only as a keyed digest. Organisers open, pause or close voting with a logged reason. Votes and audit records live in PostgreSQL and feed a staff dashboard with totals, charts and CSV export, behind two-factor sign-in.",
    stages: [
      { label: "Voter", nodes: [{ id: "voter", label: "Voter", sub: "Account sign-in", icon: "user" }] },
      {
        label: "Ballot",
        nodes: [
          { id: "dialog", label: "Vote dialog", sub: "12 categories", icon: "vote" },
          { id: "organisers", label: "Organisers", sub: "Open, pause, close", icon: "sliders" },
        ],
      },
      {
        label: "Rules",
        nodes: [
          { id: "rule", label: "One vote rule", sub: "Account and phone", icon: "shield", accent: true },
          { id: "state", label: "Voting state", sub: "Reason logged", icon: "clipboard" },
        ],
      },
      {
        label: "Storage",
        nodes: [
          { id: "digest", label: "Phone digest", sub: "Keyed, never plain", icon: "fingerprint" },
          { id: "db", label: "PostgreSQL", sub: "Votes and audit", logo: "postgresql" },
        ],
      },
      {
        label: "Results",
        nodes: [
          { id: "dashboard", label: "Staff dashboard", sub: "Charts, CSV export", icon: "chart" },
          { id: "staff", label: "Staff sign-in", sub: "Two-factor", icon: "lock" },
        ],
      },
    ],
    edges: [
      { from: "voter", to: "dialog" },
      { from: "dialog", to: "rule" },
      { from: "organisers", to: "state" },
      { from: "rule", to: "digest" },
      { from: "rule", to: "db" },
      { from: "state", to: "db" },
      { from: "db", to: "dashboard" },
      { from: "staff", to: "dashboard" },
    ],
  },
};
