import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { site } from "./data/site";
import { writingCategorySlugPattern } from "./data/writings";
import { hasCjkCharacters } from "./lib/english";

const englishCopy = "Use English copy. CJK characters are not allowed.";

const writings = defineCollection({
  loader: glob({
    pattern: ["*.md", "*/index.md"],
    base: "./src/content/writings",
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .refine((value) => !hasCjkCharacters(value), englishCopy),
        description: z
          .string()
          .trim()
          .max(240)
          .optional()
          .transform((value) => (value ? value : undefined))
          .refine((value) => !value || !hasCjkCharacters(value), englishCopy),
        author: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .default(site.identity.name)
          .refine((value) => !hasCjkCharacters(value), englishCopy),
        category: z
          .string()
          .trim()
          .min(1)
          .max(64)
          .regex(
            writingCategorySlugPattern,
            "Use a lowercase URL-safe category slug, for example: engineering",
          ),
        tags: z
          .array(
            z
              .string()
              .trim()
              .min(1)
              .max(48)
              .refine((value) => !hasCjkCharacters(value), englishCopy),
          )
          .max(16)
          .default([]),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        cover: image().optional(),
        coverAlt: z
          .string()
          .trim()
          .min(1)
          .max(180)
          .optional()
          .refine((value) => !value || !hasCjkCharacters(value), englishCopy),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .superRefine((data, context) => {
        if (data.cover && !data.coverAlt) {
          context.addIssue({
            code: "custom",
            message: "coverAlt is required when cover is set.",
            path: ["coverAlt"],
          });
        }

        if (data.updatedDate && data.updatedDate < data.pubDate) {
          context.addIssue({
            code: "custom",
            message: "updatedDate cannot be earlier than pubDate.",
            path: ["updatedDate"],
          });
        }

        const normalizedTags = data.tags.map((tag) =>
          tag.toLocaleLowerCase("en-US"),
        );
        if (new Set(normalizedTags).size !== normalizedTags.length) {
          context.addIssue({
            code: "custom",
            message: "Tags must be unique, ignoring letter case.",
            path: ["tags"],
          });
        }
      }),
});

export const collections = { writings };
