/**
 * Mock AI service.
 *
 * In the future, this function will call a real AI provider
 * (Gemini, Perplexity, OpenAI, etc.).
 *
 * For now, it returns a deterministic, nice-looking description
 * based on the prompt so the rest of the app can be developed.
 */

async function generateProductDescription(prompt) {
  // Very simple extraction of product name from the prompt
  const nameMatch = prompt.match(/Product name:\s*(.+)/i);
  const productName = nameMatch ? nameMatch[1].trim() : 'this product';

  return (
    `Introducing ${productName}, designed to deliver reliable performance in everyday use. ` +
    `Built with quality materials and a focus on user convenience, it helps streamline your workflow ` +
    `while maintaining a clean, professional look. Ideal for teams that want tools that are easy to use ` +
    `and simple to maintain over time.`
  );
}

module.exports = {generateProductDescription};
