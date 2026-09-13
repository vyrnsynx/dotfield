export interface ImportantLink {
  label: string;
  href: string;
  display: string;
  external?: boolean;
}

export const site = {
  metadata: {
    title: "VyrnSynx",
    description:
      "Student \u00b7 writer \u00b7 operator. I\u2019m still early in the path. Most days I bounce between vibe coding, backend experiments, short write-ups, and the ops work that keeps communities and content moving \u2014 learning in public when it helps.",
    origin: "https://vyrnsynx.com",
    ogImage: "/og.png",
  },
  identity: {
    name: "VyrnSynx",
    initial: "V",
  },
  bio: {
    lead: "Student \u00b7 writer \u00b7 operator.",
    body:
      "I\u2019m still early in the path. Most days I bounce between vibe coding, backend experiments, short write-ups, and the ops work that keeps communities and content moving \u2014 learning in public when it helps.",
    practices: ["Vibe coding", "Backend", "Writing", "Ops"],
  },
  importantLinks: {
    heading: "Important Links:",
    items: [
      {
        label: "Twitter:",
        href: "https://x.com/VyrnSynx",
        display: "@VyrnSynx",
        external: true,
      },
      {
        label: "Github:",
        href: "https://github.com/vyrnsynx",
        display: "@VyrnSynx",
        external: true,
      },
      {
        label: "Blog:",
        href: "/writings/",
        display: "Writings",
        external: false,
      },
    ] satisfies ImportantLink[],
  },
} as const;
