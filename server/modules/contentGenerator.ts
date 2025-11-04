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
1. A compelling tweet summary in Japanese (max ${maxTweetLength} characters including emojis)
2. An English image generation prompt

Guidelines for the tweet:
- Keep it concise and engaging
- Include 1-2 relevant emojis (e.g., 📈, 🌍, 💡, 🚀, 📰, 🔥)
- Add line breaks for readability
- Make it interesting and shareable
- Do NOT include the URL in the tweet text (it will be added separately)
- Count characters carefully - use full-width characters if needed

Guidelines for the image prompt:
- Describe a creative, eye-catching visual concept related to the article
- Be specific and vivid
- Make it suitable for AI image generation
- Keep it in English
- Focus on visual elements, colors, composition`;

    const userPrompt = `Article Title: ${articleTitle}

Article Content: ${articleContent.substring(0, 1000)}

Please generate:
1. A tweet summary in Japanese (max ${maxTweetLength} characters)
2. An English image generation prompt

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
                description: "Image generation prompt in English",
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
      // Truncate if necessary
      const chars = Array.from(parsed.tweetText);
      parsed.tweetText = chars.slice(0, maxTweetLength).join("");
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
