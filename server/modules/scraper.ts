import Parser from "rss-parser";

const parser = new Parser();

/**
 * News sources with RSS feeds
 */
const NEWS_SOURCES = [
  {
    name: "CNN",
    rssUrl: "http://rss.cnn.com/rss/cnn_topstories.rss",
  },
  {
    name: "BBC News",
    rssUrl: "http://feeds.bbc.co.uk/news/rss.xml",
  },
  {
    name: "Reuters",
    rssUrl: "https://www.reuters.com/finance",
  },
  {
    name: "Fox News",
    rssUrl: "http://feeds.foxnews.com/foxnews/latest",
  },
  {
    name: "The Guardian",
    rssUrl: "https://www.theguardian.com/international/rss",
  },
  {
    name: "NPR",
    rssUrl: "https://feeds.npr.org/1001/rss.xml",
  },
  {
    name: "AP News",
    rssUrl: "https://apnews.com/apf-services/v2/feeds/rss/news.rss",
  },
];

export interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
  source: string;
}

/**
 * Fetch articles from RSS feed
 */
async function fetchFromRssFeed(
  source: (typeof NEWS_SOURCES)[0]
): Promise<ScrapedArticle[]> {
  try {
    console.log(`[Scraper] Fetching from RSS: ${source.name}`);
    const feed = await parser.parseURL(source.rssUrl);

    const articles: ScrapedArticle[] = [];

    if (feed.items && feed.items.length > 0) {
      for (const item of feed.items.slice(0, 10)) {
        // Take first 10 items
        const title = item.title || "No title";
        const url = item.link || "";
        const content = item.content || item.contentSnippet || item.summary || "";

        if (title && url && title.length > 5) {
          articles.push({
            title: title.substring(0, 300),
            url,
            content: content.substring(0, 2000),
            source: source.name,
          });
        }
      }
    }

    console.log(
      `[Scraper] Successfully fetched ${articles.length} articles from ${source.name}`
    );
    return articles;
  } catch (error) {
    console.error(`[Scraper] Failed to fetch RSS from ${source.name}:`, error);
    return [];
  }
}

/**
 * Get a random article from a random news source
 */
export async function getRandomArticle(): Promise<ScrapedArticle | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Select a random news source
      const source =
        NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)];
      console.log(
        `[Scraper] Attempt ${attempt + 1}: Fetching from ${source.name}...`
      );

      // Fetch articles from RSS feed
      const articles = await fetchFromRssFeed(source);

      if (articles.length === 0) {
        console.warn(`[Scraper] No articles found from ${source.name}`);
        lastError = new Error(`No articles found from ${source.name}`);
        continue;
      }

      // Select a random article
      const article = articles[Math.floor(Math.random() * articles.length)];

      console.log(
        `[Scraper] Successfully selected article: ${article.title.substring(0, 50)}...`
      );
      return article;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Scraper] Attempt ${attempt + 1} failed:`,
        lastError.message
      );

      // Wait before retry
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.error("[Scraper] All retry attempts failed:", lastError?.message);
  return null;
}

/**
 * Get multiple random articles from different sources
 */
export async function getRandomArticles(
  count: number = 1
): Promise<ScrapedArticle[]> {
  const articles: ScrapedArticle[] = [];

  for (let i = 0; i < count; i++) {
    const article = await getRandomArticle();
    if (article) {
      articles.push(article);
    } else {
      console.warn(`[Scraper] Could not fetch article ${i + 1}/${count}`);
    }
  }

  return articles;
}
