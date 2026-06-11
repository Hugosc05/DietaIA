import {
  GoogleGenerativeAI,
  type GenerationConfig,
  type Part
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODEL_CHAIN = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const RETRYABLE = /503|429|500|overloaded|unavailable|internal error/i;

export async function generateJSON(opts: {
  systemInstruction: string;
  generationConfig: GenerationConfig;
  request: (string | Part)[];
}): Promise<string> {
  let lastError: unknown;

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const attempts = i === 0 ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: MODEL_CHAIN[i],
          systemInstruction: opts.systemInstruction,
          generationConfig: opts.generationConfig
        });
        const result = await model.generateContent(opts.request);
        return result.response.text();
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : '';
        if (!RETRYABLE.test(msg)) throw err;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
