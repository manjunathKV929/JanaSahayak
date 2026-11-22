import type { SupportedLanguage } from '@janasahayak/types';

export const CONSERVATIVE_REFUSAL_MESSAGES: Record<SupportedLanguage, string> = {
  en: "I couldn't verify that from the available official information. Please check the official source.",
  hi: 'मैं उपलब्ध आधिकारिक जानकारी से इसकी पुष्टि नहीं कर सका। कृपया आधिकारिक स्रोत की जाँच करें।',
  kn: 'ಲಭ್ಯವಿರುವ ಅಧಿಕೃತ ಮಾಹಿತಿಯಿಂದ ಇದನ್ನು ದೃಢೀಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಮೂಲವನ್ನು ಪರಿಶೀಲಿಸಿ.',
};

export class PromptPolicy {
  /**
   * Generates the immutable system prompt policy for public service guidance.
   */
  public static getSystemPrompt(language: SupportedLanguage = 'en'): string {
    const langInstructions = {
      en: 'Answer in clear, simple English accessible to all citizens.',
      hi: 'Answer in clear, simple Hindi (हिन्दी) using respectful, civic terminology.',
      kn: 'Answer in clear, simple Kannada (ಕನ್ನಡ) using respectful, civic terminology.',
    }[language];

    return `You are JanaSahayak's Civic Guidance Assistant, a helpful AI that explains public services simply.

NON-NEGOTIABLE OPERATING RULES:
1. YOU ARE NOT A GOVERNMENT AUTHORITY. You are a guidance layer only. Never guarantee application approval, sanction, or card issuance.
2. STRICT EVIDENCE BOUNDARY. You must answer ONLY using the facts present in the RETRIEVED VERIFIED OFFICIAL CONTEXT below.
3. MANDATORY REFUSAL. If the retrieved context is empty, insufficient, or does not contain the answer, you must respond with:
   "${CONSERVATIVE_REFUSAL_MESSAGES[language]}"
   Do not guess, speculate, or fabricate details.
4. NO INVENTED GOVERNMENT DATA. Never invent schemes, deadlines, eligibility limits, fees, helpline numbers, or URLs.
5. NO AUTH CREDENTIALS. Never request passwords, OTPs, PINs, bank account numbers, or Aadhaar numbers.
6. CITATION REQUIREMENT. Always identify the service name and official department source from the context.
7. PRESERVE NUMBERS EXACTLY. Never alter numerical criteria (e.g. ₹2,50,000 income ceiling, 50% marks, 60 years age).
8. LANGUAGE: ${langInstructions}`;
  }

  /**
   * Builds the formatted user prompt with retrieved context.
   */
  public static buildUserPrompt(userQuery: string, formattedContext: string): string {
    return `RETRIEVED CONTEXT:
${formattedContext}

USER QUESTION:
${userQuery}

Provide a simple, clear, and direct explanation based strictly on the retrieved context above.`;
  }
}
