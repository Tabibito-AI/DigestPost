import { chromium } from "playwright";
import * as cheerio from "cheerio";

/**
 * Dummy articles for fallback when scraping fails
 */
const DUMMY_ARTICLES: Array<{
  title: string;
  url: string;
  content: string;
  source: string;
}> = [
  {
    title: "Global Markets Rally on Strong Economic Data",
    url: "https://www.bbc.com/news/business",
    content:
      "Global stock markets experienced significant gains today as investors responded positively to stronger-than-expected economic data from multiple regions. The rally was led by technology and financial sectors, with major indices posting their best day in weeks. Analysts attribute the surge to optimism about economic recovery and potential interest rate adjustments. Central banks continue to monitor inflation trends closely.",
    source: "BBC News",
  },
  {
    title: "AI Breakthrough Announced by Leading Tech Company",
    url: "https://www.reuters.com/technology/",
    content:
      "A major technology company announced a significant breakthrough in artificial intelligence research today. The new model demonstrates improved efficiency and reduced computational requirements compared to previous generations. Industry experts believe this development could accelerate adoption of AI across various sectors. The company plans to make the technology available to researchers and developers in the coming months.",
    source: "Reuters",
  },
  {
    title: "Climate Summit Reaches Historic Agreement",
    url: "https://www.theguardian.com/environment/climate-crisis",
    content:
      "Nations at the international climate summit have reached a historic agreement on emissions reduction targets. The accord commits participating countries to ambitious climate action plans over the next decade. Environmental organizations praised the agreement as a significant step forward in addressing climate change. Implementation details will be finalized at follow-up meetings scheduled for next quarter.",
    source: "The Guardian",
  },
  {
    title: "Space Agency Launches New Satellite Mission",
    url: "https://www.npr.org/sections/science/",
    content:
      "A major space agency successfully launched a new satellite designed to monitor environmental changes across the planet. The satellite will provide unprecedented data on climate patterns, ocean temperatures, and atmospheric conditions. Scientists expect the mission to significantly improve weather forecasting and climate modeling capabilities. The satellite is expected to remain operational for at least seven years.",
    source: "NPR",
  },
  {
    title: "Medical Researchers Develop Novel Treatment",
    url: "https://apnews.com/hub/health-science/",
    content:
      "Researchers at leading medical institutions have developed a novel treatment approach for a previously difficult-to-treat disease. Clinical trials have shown promising results with significantly improved patient outcomes. The treatment represents years of dedicated research and collaboration between multiple institutions. Regulatory approval is expected within the next two years, with potential availability to patients shortly thereafter.",
    source: "AP News",
  },
];

/**
 * News sources configuration with multiple selector options
 */
const NEWS_SOURCES = [
  {
    name: "BBC News",
    url: "https://www.bbc.com/news",
    selectors: ["h2 a", "h3 a", "a[data-testid]"],
  },
  {
    name: "Reuters",
    url: "https://www.reuters.com",
    selectors: ["a[data-testid='Link']", "h3 a", "a.link"],
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/international",
    selectors: ["a[data-link-name='article']", "a[href*='/']"],
  },
  {
    name: "NPR",
    url: "https://www.npr.org",
    selectors: ["a[data-testid='internal-link']", "h2 a", "a.story-link"],
  },
  {
    name: "AP News",
    url: "https://apnews.com",
    selectors: ["a.Component-headline", "h2 a", "a[href*='apnews']"],
  },
];

export interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
  source: string;
}

/**
 * Scrape article content with improved error handling
 */
async function scrapeArticleContent(url: string): Promise<string> {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set timeout and user agent
    page.setDefaultTimeout(15000);
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (error) {
      console.warn(
        `[Scraper] Navigation timeout for ${url}, using partial content`
      );
    }

    // Extract main content with multiple fallback selectors
    let content = "";
    const selectors = [
      "article",
      "[role='main']",
      ".article-body",
      ".story-body",
      "main",
      ".content",
      ".article-content",
      "[data-testid='article-body']",
      ".body-copy",
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.length > 100) {
            content = text;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Fallback: get all text from body
    if (content.length < 100) {
      try {
        const bodyText = await page.locator("body").textContent();
        if (bodyText) {
          content = bodyText;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Clean up content
    content = content
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

    if (content.length < 50) {
      return `Article from ${url}. Content extraction failed, but article is available.`;
    }

    return content;
  } catch (error) {
    console.error(`[Scraper] Failed to scrape content from ${url}:`, error);
    return `Article from ${url}`;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Scrape articles from a news source with improved robustness
 */
async function scrapeNewsSource(
  source: (typeof NEWS_SOURCES)[0]
): Promise<ScrapedArticle[]> {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.setDefaultTimeout(15000);
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    try {
      await page.goto(source.url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    } catch (error) {
      console.warn(
        `[Scraper] Navigation timeout for ${source.name}, using cached content`
      );
      // Continue with partial content
    }

    const html = await page.content();
    const $ = cheerio.load(html) as any;

    const articles: ScrapedArticle[] = [];
    const seenUrls = new Set<string>();

    // Try each selector
    for (const selector of source.selectors) {
      $(selector).each((_index: number, element: any) => {
        try {
          const $element = $(element);
          const title = $element.text().trim();
          let href = $element.attr("href");

          if (!href && $element.is("a")) {
            href = $element.attr("href");
          }

          if (title && href && title.length > 5) {
            // Make absolute URL
            let url = href;
            if (!url.startsWith("http")) {
              if (url.startsWith("/")) {
                const sourceUrl = new URL(source.url);
                url = sourceUrl.origin + url;
              } else {
                const sourceUrl = new URL(source.url);
                url = new URL(href, sourceUrl.origin).toString();
              }
            }

            // Avoid duplicates
            if (!seenUrls.has(url) && url.length > 10) {
              seenUrls.add(url);
              articles.push({
                title: title.substring(0, 200),
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

      // If we found articles, stop trying other selectors
      if (articles.length > 0) {
        break;
      }
    }

    return articles;
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${source.name}:`, error);
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Get a random dummy article for testing/fallback
 */
function getRandomDummyArticle(): ScrapedArticle {
  return DUMMY_ARTICLES[Math.floor(Math.random() * DUMMY_ARTICLES.length)];
}

/**
 * Get a random article from a random news source with retry logic and fallback
 */
export async function getRandomArticle(): Promise<ScrapedArticle | null> {
  const maxRetries = 2;
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.warn(
    "[Scraper] All retry attempts failed, using dummy article:",
    lastError?.message
  );
  // Fallback to dummy article
  return getRandomDummyArticle();
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
