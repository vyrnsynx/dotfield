/**
 * Build-time rank for the writings index.
 *
 * A featured flag used to pin a post above every newer one, so an older
 * featured article stayed first. Freshness is the main signal. Featured is
 * a small lift, about six days of the half-life, not a permanent pin.
 * Category pages, tag pages, and RSS keep the archive order. The score is
 * identical for every visitor and is never written to a cookie.
 */

export interface RecommendableWriting {
  title: string;
  pubDate: Date;
  updatedDate?: Date;
  wordCount: number;
  featured: boolean;
}

const dayMs = 86_400_000;
const halfLifeDays = 21;
const depthTargetWords = 1800;
const depthWeight = 0.22;
const featuredLift = 0.12;
const maintainedLift = 0.05;
const maintainedAfterMs = 2 * dayMs;

const titleCollator = new Intl.Collator("en-US", {
  sensitivity: "base",
});

export function scoreWritingRecommendation(
  article: RecommendableWriting,
  now = new Date(),
): number {
  const ageDays = Math.max(
    0,
    (now.getTime() - lastModified(article).getTime()) / dayMs,
  );
  const freshness = 2 ** (-ageDays / halfLifeDays);
  const depth = Math.min(
    1,
    Math.log2(article.wordCount + 1) / Math.log2(depthTargetWords),
  );
  const featured = article.featured ? featuredLift : 0;
  const maintained = wasMaintained(article) ? maintainedLift : 0;

  return freshness + depth * depthWeight + featured + maintained;
}

export function rankWritingsForIndex<T extends RecommendableWriting>(
  articles: readonly T[],
  now = new Date(),
): T[] {
  return articles
    .map((article) => ({
      article,
      score: scoreWritingRecommendation(article, now),
    }))
    .sort((first, second) => {
      const byScore = second.score - first.score;
      if (byScore !== 0) {
        return byScore;
      }

      const byDate =
        lastModified(second.article).getTime() -
        lastModified(first.article).getTime();
      if (byDate !== 0) {
        return byDate;
      }

      return titleCollator.compare(first.article.title, second.article.title);
    })
    .map(({ article }) => article);
}

function lastModified(article: RecommendableWriting): Date {
  return article.updatedDate ?? article.pubDate;
}

function wasMaintained(article: RecommendableWriting): boolean {
  if (!article.updatedDate) {
    return false;
  }

  return (
    article.updatedDate.getTime() - article.pubDate.getTime() >=
    maintainedAfterMs
  );
}
