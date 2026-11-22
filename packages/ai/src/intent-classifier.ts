import type { SupportedLanguage, UserIntentType } from '@janasahayak/types';

export interface IntentMatchResult {
  intent: UserIntentType;
  confidence: number;
  matchedKeywords: string[];
  suggestedQuestions: string[];
}

interface IntentDefinition {
  intent: UserIntentType;
  keywords: string[];
  suggestedQuestions: Record<SupportedLanguage, string[]>;
}

const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    intent: 'SCHOLARSHIP_DISCOVERY',
    keywords: [
      'scholarship',
      'post-matric',
      'post matric',
      'ssp',
      'college fee',
      'tuition',
      'student aid',
      'छात्रवृत्ति',
      'छात्रवृत्ती',
      'पोस्ट-मैट्रिक',
      'ವಿದ್ಯಾರ್ಥಿವೇತನ',
      'ಮೆಟ್ರಿಕ್ ನಂತರದ',
      'ಕಾಲೇಜು ಶುಲ್ಕ',
    ],
    suggestedQuestions: {
      en: [
        'Who is eligible for Karnataka Post-Matric Scholarship?',
        'What documents are needed for SSP scholarship?',
        'What is the last date to apply for scholarship?',
      ],
      hi: [
        'कर्नाटक पोस्ट-मैट्रिक छात्रवृत्ति के लिए कौन पात्र है?',
        'SSP छात्रवृत्ति के लिए किन दस्तावेजों की आवश्यकता है?',
        'छात्रवृत्ति आवेदन की अंतिम तिथि क्या है?',
      ],
      kn: [
        'ಕರ್ನಾಟಕ ಮೆಟ್ರಿಕ್-ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಯಾರು ಅರ್ಹರು?',
        'SSP ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?',
        'ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಕೊನೆಯ ದಿನಾಂಕ ಯಾವುದು?',
      ],
    },
  },
  {
    intent: 'DOCUMENT_GUIDANCE',
    keywords: [
      'income certificate',
      'caste certificate',
      'domicile certificate',
      'nadakacheri',
      'certificate',
      'grama one',
      'bangalore one',
      'rd number',
      'आय प्रमाण पत्र',
      'जाति प्रमाण पत्र',
      'निवास प्रमाण पत्र',
      'नाडकचेरी',
      'आದಾಯ ಪ್ರಮಾಣಪತ್ರ',
      'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ',
      'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ',
      'ವಾಸಸ್ಥಳ ಪ್ರಮಾಣಪತ್ರ',
      'ನಾಡಕಚೇರಿ',
      'ಆರ್‌ಡಿ ಸಂಖ್ಯೆ',
    ],
    suggestedQuestions: {
      en: [
        'How do I apply for an Income Certificate in Karnataka?',
        'What is the validity period of a Caste Certificate?',
        'Where can I download my certificate using the RD number?',
      ],
      hi: [
        'कर्नाटक में आय प्रमाण पत्र के लिए कैसे आवेदन करें?',
        'जाति प्रमाण पत्र की वैधता अवधि क्या है?',
        'RD नंबर का उपयोग करके प्रमाण पत्र कहां से डाउनलोड करें?',
      ],
      kn: [
        'ಕರ್ನಾಟಕದಲ್ಲಿ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?',
        'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರದ ಮಾನ್ಯತೆಯ ಅವಧಿ ಎಷ್ಟು?',
        'ಆರ್‌ಡಿ ಸಂಖ್ಯೆ ಬಳಸಿ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಎಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡುವುದು?',
      ],
    },
  },
  {
    intent: 'SENIOR_CITIZEN_SUPPORT',
    keywords: [
      'senior citizen',
      'elderly',
      'old age',
      'bus pass',
      '60 years',
      'senior card',
      'वरिष्ठ नागरिक',
      'बुजुर्ग',
      'वृद्धावस्था',
      'बस पास',
      'हಿರಿಯ ನಾಗರಿಕ',
      'ಹಿರಿಯ ನಾಗರಿಕ',
      'ವೃದ್ಧಾಪ್ಯ',
      'ಬಸ್ ಪಾಸ್',
      '೬೦ ವರ್ಷ',
    ],
    suggestedQuestions: {
      en: [
        'How to apply for Senior Citizen Card in Karnataka?',
        'What benefits are provided with the Senior Citizen Card?',
        'Which age proof documents are accepted for Senior Citizen Card?',
      ],
      hi: [
        'कर्नाटक में वरिष्ठ नागरिक पहचान पत्र के लिए कैसे आवेदन करें?',
        'वरिष्ठ नागरिक कार्ड के साथ क्या लाभ मिलते हैं?',
        'वरिष्ठ नागरिक कार्ड के लिए कौन से आयु प्रमाण पत्र मान्य हैं?',
      ],
      kn: [
        'ಕರ್ನಾಟಕದಲ್ಲಿ ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?',
        'ಹಿರಿಯ ನಾಗರಿಕರ ಕಾರ್ಡ್‌ನಿಂದ ಯಾವ ಸೌಲಭ್ಯಗಳು ಸಿಗುತ್ತವೆ?',
        'ಹಿರಿಯ ನಾಗರಿಕರ ಚೀಟಿಗಾಗಿ ಯಾವ ವಯಸ್ಸಿನ ಪುರಾವೆ ದಾಖಲೆಗಳು ಬೇಕು?',
      ],
    },
  },
  {
    intent: 'ELIGIBILITY_CHECK',
    keywords: [
      'eligible',
      'eligibility',
      'income limit',
      'qualify',
      'criteria',
      'पात्र',
      'पात्रता',
      'आय सीमा',
      'ಅರ್ಹ',
      'ಅರ್ಹತೆ',
      'ಆದಾಯ ಮಿತಿ',
    ],
    suggestedQuestions: {
      en: [
        'What is the family income ceiling for scholarship eligibility?',
        'Can non-Karnataka students apply for Karnataka state schemes?',
      ],
      hi: [
        'छात्रवृत्ति पात्रता के लिए पारिवारिक आय सीमा क्या है?',
        'क्या गैर-कर्नाटक के छात्र कर्नाटक राज्य योजनाओं के लिए आवेदन कर सकते हैं?',
      ],
      kn: [
        'ವಿದ್ಯಾರ್ಥಿವೇತನದ ಅರ್ಹತೆಗೆ ಕುಟುಂಬದ ಆದಾಯ ಮಿತಿ ಎಷ್ಟು?',
        'ಕರ್ನಾಟಕೇತರ ವಿದ್ಯಾರ್ಥಿಗಳು ಈ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದೇ?',
      ],
    },
  },
  {
    intent: 'GRIEVANCE_HELP',
    keywords: [
      'complaint',
      'status check',
      'rejected',
      'delay',
      'track application',
      'helpline',
      'शिकायत',
      'आवेदन स्थिति',
      'विलंब',
      'हेल्पलाइन',
      'ದೂರು',
      'ಅರ್ಜಿ ಸ್ಥಿತಿ',
      'ವಿಳಂಬ',
      'ಸಹಾಯವಾಣಿ',
    ],
    suggestedQuestions: {
      en: [
        'How can I track my submitted scholarship application?',
        'What is the official helpline number for SSP grievance redressal?',
      ],
      hi: [
        'मैं अपने जमा किए गए छात्रवृत्ति आवेदन को कैसे ट्रैक कर सकता हूँ?',
        'SSP शिकायत निवारण के लिए आधिकारिक हेल्पलाइन नंबर क्या है?',
      ],
      kn: [
        'ನನ್ನ ಸಲ್ಲಿಸಿದ ಅರ್ಜಿಯ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು ಹೇಗೆ?',
        'ದೂರು ಪರಿಹಾರಕ್ಕಾಗಿ ಅಧಿಕೃತ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆ ಯಾವುದು?',
      ],
    },
  },
];

export class IntentClassifier {
  /**
   * Classifies a natural-language query and returns intent, confidence, and suggested questions.
   */
  public static classify(query: string, language: SupportedLanguage = 'en'): IntentMatchResult {
    const normalized = query.toLowerCase().trim();

    // Check for out-of-scope queries (e.g. crypto, entertainment, illegal requests)
    const outOfScopePatterns = [
      /crypto|bitcoin|ethereum|forex|invest|casino|lottery|gambling/i,
      /movie ticket|ipl match|cricket score|weather forecast/i,
      /hack|bypass portal|fake certificate|bribe|buy certificate/i,
    ];
    for (const pattern of outOfScopePatterns) {
      if (pattern.test(normalized)) {
        return {
          intent: 'OUT_OF_SCOPE',
          confidence: 0.95,
          matchedKeywords: ['out_of_scope_pattern'],
          suggestedQuestions: [],
        };
      }
    }

    let bestIntent: UserIntentType = 'GENERAL_INQUIRY';
    let highestScore = 0;
    let matchedKeywords: string[] = [];
    let bestSuggested: string[] = [];

    for (const def of INTENT_DEFINITIONS) {
      const matched = def.keywords.filter((kw) => normalized.includes(kw.toLowerCase()));
      if (matched.length > 0) {
        const score = Math.min(1.0, 0.4 + matched.length * 0.25);
        if (score > highestScore) {
          highestScore = score;
          bestIntent = def.intent;
          matchedKeywords = matched;
          bestSuggested = def.suggestedQuestions[language] ?? def.suggestedQuestions['en'];
        }
      }
    }

    if (highestScore === 0) {
      return {
        intent: 'GENERAL_INQUIRY',
        confidence: 0.5,
        matchedKeywords: [],
        suggestedQuestions: [
          'Find scholarship schemes for post-matric students',
          'Learn how to obtain an Income Certificate',
          'Explore benefits of the Senior Citizen Identity Card',
        ],
      };
    }

    return {
      intent: bestIntent,
      confidence: Math.round(highestScore * 100) / 100,
      matchedKeywords,
      suggestedQuestions: bestSuggested,
    };
  }
}
