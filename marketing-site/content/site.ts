// All site copy and links in one place. Edit here; components read from this file.

export const SITE_URL = "https://answerd.vitalos.co.uk"

/** Store links. Until the apps are live both point to the download section. Set APP_STORE_URL / PLAY_STORE_URL at build time. */
export const APP_STORE_URL = process.env.APP_STORE_URL || "/#download"
export const PLAY_STORE_URL = process.env.PLAY_STORE_URL || "/#download"
export const STORES_LIVE = APP_STORE_URL.startsWith("http") && PLAY_STORE_URL.startsWith("http")
/** What the QR code encodes: one link that redirects to the right store. */
export const DOWNLOAD_URL = `${SITE_URL}/#download`

export const site = {
  name: "Answerd",
  tagline: "Every business picks up.",
  description: "Find trusted plumbers, cleaners, mechanics, barbers and more near you. Call, message or book in two taps. Free for customers, available across the UK.",
  metaTitle: "Answerd · Local help, just a message away",
  seo: {
    keywords: ["Answerd", "local services", "find a plumber", "electrician near me", "cleaners near me", "mechanic near me", "barbers", "local tradespeople UK", "book local services", "Vitalos"],
    ogAlt: "Answerd: Local help, just a message away.",
  },

  nav: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "For businesses", href: "/#for-businesses" },
    { label: "FAQs", href: "/#faqs" },
  ],
  getApp: "Get the app",

  hero: {
    headline: "Local help, just a message away.",
    subline: "Find trusted plumbers, cleaners, mechanics, barbers and more near you. Call, message or book in two taps.",
    qrLabel: "Scan to download",
    note: "Free for customers · Available across the UK",
  },

  trustLabel: "Why you can trust Answerd",
  trust: [
    { icon: "MapPinned", label: "Every service, UK-wide", tip: "From boilers to barbers, in towns and cities across the UK." },
    { icon: "ShieldCheck", label: "Verified Gas Safe, NICEIC, insured and DBS-checked pros", tip: "Our team checks credentials before a badge appears on a profile." },
    { icon: "Star", label: "Reviews only from real bookings", tip: "Only customers who booked or called a business can review it." },
    { icon: "PhoneCall", label: "Businesses that actually pick up", tip: "Look for Responds instantly: their Answerd desk replies straight away." },
  ],

  howItWorks: {
    id: "how-it-works",
    heading: "How it works",
    intro: "Three steps from “I need someone” to a job done.",
    steps: [
      { title: "Search", body: "Tell us what you need and where." },
      { title: "Call, message or book", body: "Pick a business and reach them in two taps." },
      { title: "Review", body: "Rate the job so your neighbours know who to trust." },
    ],
  },

  services: {
    id: "popular-services",
    heading: "Popular services",
    intro: "Whatever the job, there's someone local.",
    items: [
      { label: "Plumbers", icon: "Wrench" },
      { label: "Electricians", icon: "Zap" },
      { label: "Cleaners", icon: "Sparkles" },
      { label: "Mechanics", icon: "Car" },
      { label: "Barbers & salons", icon: "Scissors" },
      { label: "Gardeners", icon: "Trees" },
      { label: "Removals", icon: "Truck" },
      { label: "Couriers", icon: "Package" },
    ],
    more: "And hundreds more",
    moreBody: "Search for any local service in the app.",
  },

  why: {
    id: "why-answerd",
    heading: "Why Answerd",
    features: [
      { key: "pickup", title: "Businesses that pick up", body: "Many Answerd businesses have an AI front desk, so your call or message gets answered even when they're on a job." },
      { key: "verified", title: "Verified, not just listed", body: "Credential badges are checked by our team." },
      { key: "book", title: "Book in seconds", body: "See real availability and book a slot without the back-and-forth." },
      { key: "ask", title: "Ask Answerd", body: "Not sure who you need? Describe the problem and Answerd suggests the right local businesses." },
    ],
    askBubble: "Need a local service? I'll help you find the right business.",
  },

  download: {
    id: "download",
    headline: "Get Answerd on your phone",
    line: "Find, contact and book local services wherever you are.",
    dialogBody: "Scan with your phone camera, or choose your store.",
  },

  business: {
    id: "for-businesses",
    headline: "Run a local business? Every business picks up.",
    points: ["List free, no contract", "See every call and message Answerd sends you", "Add an AI front desk that answers calls, replies to texts and books jobs"],
    note: "Free to list. AI front desk from £49/month after a 14-day free trial (ex VAT).",
    primary: { label: "List your business", href: "/#download" },
    secondary: "Get the app",
    /** Decorative cards beside the business pitch (aria-hidden). Illustrative, no numbers or stats. */
    visual: [
      { key: "enquiry", title: "New enquiry", body: "Hi, could someone fix a leaking tap this week?" },
      { key: "booked", title: "Desk booked Thu 10am", body: "Tap repair, booked by your AI front desk" },
      { key: "answered", title: "Missed call answered", body: "Your desk picked up while you were on a job" },
    ],
  },

  faqs: {
    id: "faqs",
    heading: "FAQs",
    items: [
      { q: "Is Answerd free for customers?", a: "Yes, always." },
      { q: "How do you check businesses?", a: "We verify credentials like Gas Safe, NICEIC, insurance and DBS, and only customers who booked or called can leave reviews." },
      { q: "What does “Responds instantly” mean?", a: "The business uses an Answerd AI front desk, so calls and messages get answered straight away, even when they're busy." },
      { q: "Is the AI desk a real person?", a: "No. It's an AI assistant, always labelled, and it hands over to the business for anything it can't handle." },
      { q: "Where does Answerd work?", a: "Across the UK." },
      { q: "How do I list my business?", a: "Download the app, tap “I run a business”, and find or add your business. It's free." },
    ],
  },

  footer: {
    columns: [
      { title: "Customers", links: [{ label: "How it works", href: "/#how-it-works" }, { label: "Popular services", href: "/#popular-services" }, { label: "Get the app", href: "/#download" }] },
      { title: "Businesses", links: [{ label: "List your business", href: "/#for-businesses" }, { label: "Pricing", href: "/#for-businesses" }, { label: "Help", href: "/#faqs" }] },
      { title: "Company", links: [{ label: "About", href: "/#why-answerd" }, { label: "Contact", href: "mailto:hello@vitalos.co.uk" }] },
      { title: "Legal", links: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Cookies", href: "/cookies" }] },
    ],
    bottom: "Answerd is a Vitalos product · Powered by Askbridge · © 2026 Vitalos Technologies",
  },

  askbridge: {
    pill: "Chat with Answerd",
    opening: "Need a local service? I'll help you find the right business.",
    chips: ["Boiler not working", "End of tenancy clean", "Car won't start", "Haircut today"],
    footer: "Powered by Askbridge",
    title: "Chat with Answerd",
    reply: "Thanks! The full assistant is on its way. Get the app to find local help now.",
    comingSoon: "Chat is coming soon",
    close: "Close chat",
  },

  cookies: {
    text: "We use essential cookies to make this site work. With your OK we'd also load the Askbridge chat and measure how the site is used.",
    accept: "Accept all",
    reject: "Reject non-essential",
    label: "Cookie choices",
    policy: "Cookie policy",
    settings: "Change cookie settings",
  },

  mobileBar: "Get the app",

  /** Demo content for the phone mockups (decorative, aria-hidden). Fictional businesses. */
  demo: {
    time: "9:41",
    respondsInstantly: "Responds instantly",
    search: {
      query: "Boiler service",
      location: "SE25",
      filters: ["Open now", "Gas Safe", "Top rated"],
      resultsLabel: "Results near SE25",
      results: [
        { initials: "SP", name: "Swift Plumbing & Heating", category: "Plumber", distance: "0.4 mi", rating: "4.9", reviews: 132, instant: true, badges: ["Gas Safe"], tone: "blue" },
        { initials: "CH", name: "Croydon Heating Pros", category: "Heating engineer", distance: "2.1 mi", rating: "4.6", reviews: 7, instant: false, badges: ["Gas Safe"], tone: "navy" },
        { initials: "PE", name: "Palace Electrics", category: "Electrician", distance: "1.8 mi", rating: "4.8", reviews: 5, instant: true, badges: ["NICEIC"], tone: "teal" },
      ],
      tabs: ["Home", "Search", "Messages", "Account"],
    },
    profile: {
      initials: "SP",
      name: "Swift Plumbing & Heating",
      meta: "Plumber · South Norwood · 0.4 mi",
      rating: "4.9",
      reviews: "132 reviews",
      badges: ["Gas Safe", "Insured"],
      replies: "Usually replies in 1 min",
      servicesHeading: "Services",
      services: [
        { name: "Boiler service", price: "£85" },
        { name: "Gas safety certificate", price: "£70" },
        { name: "Boiler repair", price: "from £95" },
        { name: "Radiator bleed & balance", price: "£60" },
      ],
      vat: "inc VAT",
      actions: { call: "Call", message: "Message", book: "Book" },
    },
    chat: {
      business: "Swift Plumbing & Heating",
      status: "Answerd desk · replies instantly",
      day: "Today",
      customer: "Hi, are you free this week to look at my boiler?",
      deskLabel: "Answerd desk",
      desk: "Hi! I'm Swift Plumbing's Answerd assistant. A boiler service is £85 inc VAT. Thursday 10am or 2pm are free, shall I book one?",
      slot: { title: "Boiler service", price: "£85 inc VAT", day: "Thu 29 Oct", times: ["10am", "2pm"], cta: "Book Thu 10am" },
      placeholder: "Message",
    },
    floating: {
      desk: { label: "Answerd desk", text: "Thursday 10am is free, shall I book it?" },
      booked: { label: "Booked", text: "Boiler service · Thu 10am" },
    },
    pickup: {
      callLabel: "Incoming call",
      business: "Swift Plumbing & Heating",
      answered: "Answered by Answerd desk",
      duration: "0:12",
      reply: "Hi, you're through to Swift Plumbing. They're on a job right now, but I can help or book you in.",
    },
    verified: {
      initials: "PE",
      name: "Palace Electrics",
      meta: "Electrician · 1.8 mi",
      checked: "Checked by Answerd",
      credentials: ["Gas Safe", "NICEIC", "Insured", "DBS checked"],
      verifiedLabel: "Verified",
    },
    book: {
      heading: "Choose a time",
      month: "October",
      days: [
        { dow: "Mon", date: "26" },
        { dow: "Tue", date: "27" },
        { dow: "Wed", date: "28" },
        { dow: "Thu", date: "29" },
        { dow: "Fri", date: "30" },
      ],
      selectedDay: 3,
      times: ["8:30am", "10am", "11:30am", "2pm", "3:30pm", "5pm"],
      selectedTime: 1,
      cta: "Book Thu 29 Oct, 10am",
    },
    ask: { title: "Ask Answerd", placeholder: "Describe the problem…" },
  },
} as const

export type Site = typeof site
