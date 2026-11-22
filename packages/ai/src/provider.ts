import type { LLMProvider, LLMRequest, LLMResponse, SupportedLanguage } from '@janasahayak/types';
import { CONSERVATIVE_REFUSAL_MESSAGES } from './prompt-policy.js';

/**
 * High-performance, grounded mock LLM provider for local development, CI, and test environments.
 * Follows AI_RULES.md: answers strictly within provided context and refuses if context is absent or irrelevant.
 */
export class MockLLMProvider implements LLMProvider {
  public async generate(input: LLMRequest): Promise<LLMResponse> {
    const language: SupportedLanguage = input.language ?? 'en';
    const textPrompt = input.userPrompt;

    // 1. Refusal check: If context is missing or explicitly empty
    if (
      textPrompt.includes('NO_VERIFIED_CONTEXT_FOUND') ||
      !input.contextCitations ||
      input.contextCitations.length === 0
    ) {
      return {
        text: CONSERVATIVE_REFUSAL_MESSAGES[language],
        model: 'mock-grounded-rag-v1',
        provider: 'mock',
        usage: { promptTokens: 40, completionTokens: 25, totalTokens: 65 },
      };
    }

    const citation = input.contextCitations[0];
    const sourceUrl = citation?.sourceUrl ?? 'https://karnataka.gov.in';

    // 2. Synthesize grounded answer based on query keywords and context
    let answer = '';
    const lower = textPrompt.toLowerCase();

    if (
      lower.includes('scholarship') ||
      lower.includes('छात्रवृत्ति') ||
      lower.includes('ವಿದ್ಯಾರ್ಥಿವೇತನ')
    ) {
      if (language === 'hi') {
        answer = `कर्नाटक पोस्ट-मैट्रिक छात्रवृत्ति योजना उच्च शिक्षा प्राप्त कर रहे पात्र छात्रों के लिए वित्तीय सहायता और शुल्क प्रतिपूर्ति प्रदान करती है। पात्रता के लिए वार्षिक पारिवारिक आय ₹2,50,000 या उससे कम होनी चाहिए। आवेदन आधिकारिक पोर्टल ${sourceUrl} पर ऑनलाइन जमा किया जा सकता है।`;
      } else if (language === 'kn') {
        answer = `ಕರ್ನಾಟಕ ಮೆಟ್ರಿಕ್-ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆಯು ಅರ್ಹ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಶೈಕ್ಷಣಿಕ ಶುಲ್ಕ ಮರುಪಾವತಿ ಮತ್ತು ನಿರ್ವಹಣಾ ಭತ್ಯೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ. ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ₹2,50,000 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು. ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ${sourceUrl} ಮೂಲಕ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.`;
      } else {
        answer = `The Post-Matric Scholarship Scheme provides course fee reimbursement and monthly maintenance allowances for eligible students in Karnataka. The annual family income ceiling is ₹2,50,000. Applications must be submitted through the official portal at ${sourceUrl}.`;
      }
    } else if (
      lower.includes('senior citizen') ||
      lower.includes('वरिष्ठ नागरिक') ||
      lower.includes('ಹಿರಿಯ ನಾಗರಿಕ') ||
      lower.includes('old age')
    ) {
      if (language === 'hi') {
        answer = `कर्नाटक वरिष्ठ नागरिक पहचान पत्र 60 वर्ष या उससे अधिक आयु के स्थायी निवासियों के लिए आधिकारिक पहचान और रियायती लाभ (जैसे केएसआरटीसी बस यात्रा में छूट) प्रदान करता है। आधिकारिक आवेदन ${sourceUrl} पर किया जा सकता है।`;
      } else if (language === 'kn') {
        answer = `ಕರ್ನಾಟಕ ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿಯು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನ ಖಾಯಂ ನಿವಾಸಿಗಳಿಗೆ ಅಧಿಕೃತ ಗುರುತು ಮತ್ತು ರಿಯಾಯಿತಿ ಸೌಲಭ್ಯಗಳನ್ನು (ಉದಾ. ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ ಬಸ್ ಪ್ರಯಾಣ) ಒದಗಿಸುತ್ತದೆ. ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ${sourceUrl} ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.`;
      } else {
        answer = `The Senior Citizen Identity Card provides official identification and welfare benefits, including discounted KSRTC bus travel, for permanent residents of Karnataka aged 60 years or above. Applications are processed at ${sourceUrl}.`;
      }
    } else if (
      lower.includes('income certificate') ||
      lower.includes('आय प्रमाण') ||
      lower.includes('ಆದಾಯ ಪ್ರಮಾಣ') ||
      lower.includes('nadakacheri')
    ) {
      if (language === 'hi') {
        answer = `आय प्रमाण पत्र राजस्व विभाग द्वारा जारी किया जाता है और यह विभिन्न सरकारी योजनाओं के लिए पारिवारिक आय को प्रमाणित करता है। आप नाडकचेरी पोर्टल ${sourceUrl} या ग्राम वन केंद्र के माध्यम से आवेदन कर सकते हैं।`;
      } else if (language === 'kn') {
        answer = `ಆದಾಯ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಕಂದಾಯ ಇಲಾಖೆಯು ನೀಡುತ್ತದೆ ಮತ್ತು ಇದು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗೆ ಕುಟುಂಬದ ಆದಾಯವನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ. ನೀವು ನಾಡಕಚೇರಿ ಪೋರ್ಟಲ್ ${sourceUrl} ಅಥವಾ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರದ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.`;
      } else {
        answer = `The Income Certificate is issued by the Revenue Department through Nadakacheri to certify annual family income for welfare schemes and scholarships. You can apply online at ${sourceUrl} or via Grama One centers.`;
      }
    } else {
      // Default factual grounded summary
      if (language === 'hi') {
        answer = `सत्यापित आधिकारिक रिकॉर्ड के अनुसार, इस सार्वजनिक सेवा का विवरण आधिकारिक सरकारी पोर्टल ${sourceUrl} पर उपलब्ध है। कृपया आधिकारिक दिशा-निर्देशों का पालन करें।`;
      } else if (language === 'kn') {
        answer = `ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ದಾಖಲೆಗಳ ಪ್ರಕಾರ, ಈ ಸಾರ್ವಜನಿಕ ಸೇವೆಯ ವಿವರಗಳು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್ ${sourceUrl} ನಲ್ಲಿ ಲಭ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`;
      } else {
        answer = `According to verified government records, this service is administered through the official portal at ${sourceUrl}. Please refer to the verified sources for complete procedural guidance.`;
      }
    }

    const promptTokens = Math.ceil(textPrompt.length / 4);
    const completionTokens = Math.ceil(answer.length / 4);

    return {
      text: answer,
      model: 'mock-grounded-rag-v1',
      provider: 'mock',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}
