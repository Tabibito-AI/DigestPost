import { invokeLLM } from "../_core/llm";

export interface GeneratedContent {
  tweetText: string;
  imagePrompt: string;
}

/**
 * Generate tweet summary and image prompt from article content
 * Tweet must be under 140 characters (full-width) including URL
 * URL is calculated as 23 characters
 */
export async function generateContent(
  articleTitle: string,
  articleContent: string,
  articleUrl: string
): Promise<GeneratedContent | null> {
  try {
    // Calculate available characters for tweet text (140 - 23 for URL - 1 for space)
    const maxTweetLength = 116; // 140 - 23 (URL) - 1 (space)

    const systemPrompt = `You are a professional news summarizer and creative content generator.

Your task is to create:
1. A detailed yet concise tweet summary in Japanese (max ${maxTweetLength} characters including emojis)
2. A manga/comic-style image generation prompt

Guidelines for the tweet:
- Read the article carefully and extract key details
- Explain the main points clearly and comprehensively within character limit
- Include specific facts, numbers, or outcomes when relevant
- Include 1-2 relevant emojis
- Add line breaks for readability
- Make it engaging and informative
- Do NOT include the URL in the tweet text (it will be added separately)
- Count characters carefully - use full-width characters if needed

Guidelines for the image prompt:
- Create a manga/comic-style visual (anime art style, comic book aesthetic)
- Include bold outlines, vibrant colors, and dynamic composition
- Add manga-style visual effects (speed lines, impact effects, dramatic lighting)
- Make it eye-catching and visually interesting
- Describe the scene with manga/anime art style specifics
- Keep it in English
- Example style: "manga illustration, comic book art, anime style, bold outlines, vibrant colors"`;

    const userPrompt = `Article Title: ${articleTitle}

Article Content: ${articleContent.substring(0, 2000)}

Please generate:
1. A detailed yet concise tweet summary in Japanese (max ${maxTweetLength} characters) that explains the key points, facts, and implications of the article
2. A manga/comic-style image generation prompt that captures the essence of the article

Format your response as JSON:
{
  "tweetText": "...",
  "imagePrompt": "..."
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tweetText: {
                type: "string",
                description: "Tweet summary in Japanese (max 116 characters)",
              },
              imagePrompt: {
                type: "string",
                description: "Manga/comic-style image generation prompt in English with anime art style",
              },
            },
            required: ["tweetText", "imagePrompt"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("[ContentGenerator] Empty response from LLM");
      return null;
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    // Validate tweet length
    const tweetLength = Array.from(parsed.tweetText).length; // Count characters properly
    if (tweetLength > maxTweetLength) {
      console.warn(
        `[ContentGenerator] Tweet exceeds max length: ${tweetLength} > ${maxTweetLength}`
      );
      // Truncate if necessary, preserving last emoji if present
      const chars = Array.from(parsed.tweetText);
      let truncated = chars.slice(0, maxTweetLength).join("");
      // Ensure we don't cut off in the middle of an emoji
      while (Array.from(truncated).length > maxTweetLength) {
        truncated = Array.from(truncated).slice(0, -1).join("");
      }
      parsed.tweetText = truncated.trim();
    }

    return {
      tweetText: parsed.tweetText,
      imagePrompt: parsed.imagePrompt,
    };
  } catch (error) {
    console.error("[ContentGenerator] Failed to generate content:", error);
    return null;
  }
}

/**
 * Generate a fallback tweet if AI generation fails
 */
export function generateFallbackTweet(
  articleTitle: string
): string {
  // Simple fallback: truncate title and add emoji
  const maxLength = 116;
  let tweet = "📰 " + articleTitle.substring(0, 100);

  // Count characters properly (including multi-byte characters)
  const charArray = Array.from(tweet);
  if (charArray.length > maxLength) {
    tweet = charArray.slice(0, maxLength - 1).join("") + "…";
  }

  return tweet;
}

/**
 * Generate a fallback manga-style image prompt
 */
export function generateFallbackImagePrompt(
  articleTitle: string
): string {
  return `Manga illustration, comic book art style, anime aesthetic, bold black outlines, vibrant colors, dynamic composition, dramatic lighting, speed lines, impact effects. Scene depicting: ${articleTitle.substring(0, 100)}. High energy, visually striking, professional manga art.`;
}
