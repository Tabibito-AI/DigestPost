import { generateImage } from "../_core/imageGeneration";

/**
 * Generate an image for a tweet based on a prompt
 */
export async function generateTweetImage(prompt: string): Promise<string | null> {
  try {
    console.log("[ImageGenerator] Generating image with prompt:", prompt);

    const result = await generateImage({
      prompt,
    });

    if (!result || !result.url) {
      console.error("[ImageGenerator] Failed to generate image: no URL returned");
      return null;
    }

    console.log("[ImageGenerator] Image generated successfully:", result.url);
    return result.url;
  } catch (error) {
    console.error("[ImageGenerator] Failed to generate image:", error);
    return null;
  }
}
