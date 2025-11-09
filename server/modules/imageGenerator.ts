import { generateImage } from "../_core/imageGeneration";

/**
 * Generate an image for a tweet based on a prompt
 * Enhances the prompt with manga/comic-style specifications
 */
export async function generateTweetImage(prompt: string): Promise<string | null> {
  try {
    // Enhance prompt with manga/comic-style specifications
    const enhancedPrompt = `${prompt}. Manga illustration style, comic book art, anime aesthetic, bold black outlines, vibrant colors, dynamic composition, dramatic lighting, speed lines, impact effects, professional manga art, high quality illustration.`;
    
    console.log("[ImageGenerator] Generating manga-style image with prompt:", enhancedPrompt);

    const result = await generateImage({
      prompt: enhancedPrompt,
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
