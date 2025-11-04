import { chromium } from "playwright";
import * as cheerio from "cheerio";

/**
 * News sources configuration
 * Each source has a URL and CSS selectors for extracting articles
 */
const NEWS_SOURCES = [
  {
    name: "CNN",
    url: "https://www.cnn.com",
    articleSelector: "span[data-test='headline-link']",
    titleSelector: "span[data-test='headline-link']",
    linkSelector: "a[data-test='internal-link']",
  },
  {
    name: "BBC",
    url: "https://www.bbc.com/news",
    articleSelector: "h2, h3",
    titleSelector: "h2, h3",
    linkSelector: "a",
  },
  {
    name: "Reuters",
    url: "https://www.reuters.com",
    articleSelector: "h3",
    titleSelector: "h3",
    linkSelector: "a",
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/international",
    articleSelector: "a[data-link-name='article']",
    titleSelector: "span",
    linkSelector: "a[data-link-name='article']",
  },
  {
    name: "The New York Times",
    url: "https://www.nytimes.com",
    articleSelector: "a[data-test='internal-link']",
    titleSelector: "span",
    linkSelector: "a[data-test='internal-link']",
  },
];

export interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
  source: string;
}

/**
 * Scrape a news article from a given URL
 */
async function scrapeArticleContent(url: string): Promise<string> {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Extract main content - try common selectors
    let content = "";
    const selectors = [
      "article",
      "[role='main']",
      ".article-body",
      ".story-body",
      "main",
      ".content",
    ];

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        content = await element.textContent() || "";
        if (content.length > 100) break;
      }
    }

    // Fallback to body text if no content found
    if (content.length < 100) {
      const bodyElement = await page.$('body');
      if (bodyElement) {
        content = await bodyElement.textContent() || "";
      }
    }

    // Clean up content
    content = content
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

    await browser.close();
    return content;
  } catch (error) {
    console.error(`[Scraper] Failed to scrape content from ${url}:`, error);
    return "";
  }
}

/**
 * Scrape articles from a news source
 */
async function scrapeNewsSource(
  source: (typeof NEWS_SOURCES)[0]
): Promise<ScrapedArticle[]> {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(source.url, { waitUntil: "networkidle", timeout: 30000 });

    const html = await page.content();
    const $ = cheerio.load(html) as any;

    const articles: ScrapedArticle[] = [];

    // Extract articles
    $(source.linkSelector).each((_index: number, element: any) => {
      const $element = $(element);
      const title = $element.text().trim();
      const href = $element.attr("href");

      if (title && href && title.length > 10) {
        // Make absolute URL
        let url = href;
        if (!url.startsWith("http")) {
          const sourceUrl = new URL(source.url);
          url = new URL(href, sourceUrl.origin).toString();
        }

        articles.push({
          title,
          url,
          content: "", // Will be filled later
          source: source.name,
        });
      }
    });

    await browser.close();
    return articles;
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${source.name}:`, error);
    return [];
  }
}

/**
 * Get a random article from a random news source
 */
export async function getRandomArticle(): Promise<ScrapedArticle | null> {
  try {
    // Select a random news source
    const source = NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)];
    console.log(`[Scraper] Scraping from ${source.name}...`);

    // Scrape articles from the source
    const articles = await scrapeNewsSource(source);

    if (articles.length === 0) {
      console.warn(`[Scraper] No articles found from ${source.name}`);
      return null;
    }

    // Select a random article
    const article = articles[Math.floor(Math.random() * articles.length)];

    // Scrape the article content
    console.log(`[Scraper] Scraping article content from ${article.url}...`);
    const content = await scrapeArticleContent(article.url);

    return {
      ...article,
      content,
    };
  } catch (error) {
    console.error("[Scraper] Failed to get random article:", error);
    return null;
  }
}

/**
 * Get multiple random articles from different sources
 */
export async function getRandomArticles(count: number = 1): Promise<ScrapedArticle[]> {
  const articles: ScrapedArticle[] = [];

  for (let i = 0; i < count; i++) {
    const article = await getRandomArticle();
    if (article) {
      articles.push(article);
    }
  }

  return articles;
}
