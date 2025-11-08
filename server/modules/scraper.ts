import { chromium } from "playwright";
import * as cheerio from "cheerio";

/**
 * News sources configuration with real selectors
 */
const NEWS_SOURCES = [
  {
    name: "CNN",
    url: "https://www.cnn.com",
    articleSelector: "span.container__headline-text",
    linkSelector: "a[data-analytics-title]",
    contentSelector: "article, .article__content, .article-body, [data-testid='article-body']",
  },
  {
    name: "BBC News",
    url: "https://www.bbc.com/news",
    articleSelector: "h2, h3",
    linkSelector: "a[data-testid='internal-link']",
    contentSelector: "article, [role='main'], .article-content",
  },
  {
    name: "Bloomberg",
    url: "https://www.bloomberg.com",
    articleSelector: "h3",
    linkSelector: "a",
    contentSelector: "article, .article, [data-component-type='article']",
  },
  {
    name: "Fox News",
    url: "https://www.foxnews.com",
    articleSelector: "h2, h3",
    linkSelector: "a",
    contentSelector: "article, .article-body, .article-content",
  },
  {
    name: "Reuters",
    url: "https://www.reuters.com",
    articleSelector: "h3, a[data-testid='Link']",
    linkSelector: "a[data-testid='Link']",
    contentSelector: "article, [role='main']",
  },
];

export interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
  source: string;
}

/**
 * Scrape article content from URL
 */
async function scrapeArticleContent(url: string): Promise<string> {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.setDefaultTimeout(10000);
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
      // Wait for content to load
      await page.waitForTimeout(1000);
    } catch (error) {
      console.warn(`[Scraper] Navigation timeout for ${url}`);
    }

    let content = "";

    // Try multiple selectors
    const selectors = [
      "article",
      "[role='main']",
      ".article-body",
      ".article-content",
      ".story-body",
      "main",
      ".content",
      "[data-testid='article-body']",
      ".body-copy",
      ".article",
      ".post-content",
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim().length > 200) {
            content = text.trim();
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // Fallback: get body text
    if (content.length < 200) {
      try {
        const bodyText = await page.locator("body").textContent();
        if (bodyText && bodyText.trim().length > 200) {
          content = bodyText.trim();
        }
      } catch (e) {
        // Ignore
      }
    }

    // Clean up content
    content = content
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 3000);

    if (content.length < 100) {
      return `Article content from ${url}`;
    }

    return content;
  } catch (error) {
    console.error(`[Scraper] Failed to scrape content from ${url}:`, error);
    return "";
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }
  }
}

/**
 * Scrape articles from a news source
 */
async function scrapeNewsSource(
  source: (typeof NEWS_SOURCES)[0]
): Promise<ScrapedArticle[]> {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.setDefaultTimeout(10000);
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    try {
      await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 10000 });
      // Wait for content to load
      await page.waitForTimeout(1500);
    } catch (error) {
      console.warn(`[Scraper] Navigation timeout for ${source.name}`);
    }

    const html = await page.content();
    const $ = cheerio.load(html) as any;

    const articles: ScrapedArticle[] = [];
    const seenUrls = new Set<string>();

    // Get all links and extract article information
    $(source.linkSelector).each((_index: number, element: any) => {
      try {
        const $element = $(element);
        let title = $element.text().trim();
        let href = $element.attr("href");

        // Clean up title
        title = title.substring(0, 300).trim();

        if (!href) {
          href = $element.attr("href");
        }

        // Filter out invalid entries
        if (title && href && title.length > 10 && !title.includes("Advertisement")) {
          // Make absolute URL
          let url = href;
          if (!url.startsWith("http")) {
            if (url.startsWith("/")) {
              const sourceUrl = new URL(source.url);
              url = sourceUrl.origin + url;
            } else if (url.startsWith("//")) {
              url = "https:" + url;
            } else {
              try {
                const sourceUrl = new URL(source.url);
                url = new URL(href, sourceUrl.origin).toString();
              } catch (e) {
                return; // Skip invalid URLs
              }
            }
          }

          // Validate URL
          try {
            new URL(url);
          } catch (e) {
            return; // Skip invalid URLs
          }

          // Avoid duplicates and invalid URLs
          if (!seenUrls.has(url) && url.length > 15 && !url.includes("javascript:")) {
            seenUrls.add(url);
            articles.push({
              title,
              url,
              content: "",
              source: source.name,
            });
          }
        }
      } catch (e) {
        // Continue with next element
      }
    });

    console.log(`[Scraper] Found ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${source.name}:`, error);
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }
  }
}

/**
 * Get a random article from a random news source with retry logic
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
        `[Scraper] Attempt ${attempt + 1}: Scraping from ${source.name}...`
      );

      // Scrape articles from the source
      const articles = await scrapeNewsSource(source);

      if (articles.length === 0) {
        console.warn(`[Scraper] No articles found from ${source.name}`);
        lastError = new Error(`No articles found from ${source.name}`);
        continue;
      }

      // Select a random article
      const article = articles[Math.floor(Math.random() * articles.length)];

      // Scrape the article content
      console.log(
        `[Scraper] Scraping article content from ${article.url}...`
      );
      const content = await scrapeArticleContent(article.url);

      if (!content || content.length < 50) {
        console.warn(`[Scraper] Content too short for ${article.url}, retrying...`);
        lastError = new Error(`Content too short for article`);
        continue;
      }

      console.log(`[Scraper] Successfully scraped article: ${article.title}`);
      return {
        ...article,
        content,
      };
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
