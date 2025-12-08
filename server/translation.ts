import OpenAI from 'openai';
import { DEFAULT_MODEL } from './config/ai-model';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// Language name mapping for better user experience
const languageNames: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'pl': 'Polish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mt': 'Maltese',
  'tr': 'Turkish',
  'el': 'Greek',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'he': 'Hebrew',
  'fa': 'Persian',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'gu': 'Gujarati',
  'mr': 'Marathi',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'my': 'Burmese',
  'km': 'Khmer',
  'lo': 'Lao',
  'ka': 'Georgian',
  'am': 'Amharic',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'af': 'Afrikaans',
  'eu': 'Basque',
  'ca': 'Catalan',
  'gl': 'Galician',
  'is': 'Icelandic',
  'ga': 'Irish',
  'cy': 'Welsh',
  'lb': 'Luxembourgish',
  'mk': 'Macedonian',
  'sq': 'Albanian',
  'bs': 'Bosnian',
  'sr': 'Serbian',
  'me': 'Montenegrin',
  'uk': 'Ukrainian',
  'be': 'Belarusian',
  'kk': 'Kazakh',
  'ky': 'Kyrgyz',
  'uz': 'Uzbek',
  'tg': 'Tajik',
  'tk': 'Turkmen',
  'mn': 'Mongolian',
  'az': 'Azerbaijani',
  'hy': 'Armenian',
};

export function getLanguageName(code: string): string {
  return languageNames[code] || code.toUpperCase();
}

export function getAvailableLanguages(): { code: string; name: string }[] {
  return Object.entries(languageNames).map(([code, name]) => ({ code, name }));
}

export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    if (!openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Skip translation if target is the same as source
    if (request.sourceLanguage && request.sourceLanguage === request.targetLanguage) {
      return {
        translatedText: request.text,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage
      };
    }

    const targetLanguageName = getLanguageName(request.targetLanguage);
    
    const prompt = request.sourceLanguage 
      ? `Translate the following text from ${getLanguageName(request.sourceLanguage)} to ${targetLanguageName}. Preserve the original meaning, tone, and context. Only return the translated text, nothing else:\n\n${request.text}`
      : `Translate the following text to ${targetLanguageName}. Preserve the original meaning, tone, and context. Only return the translated text, nothing else:\n\n${request.text}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate text accurately while preserving meaning, tone, and context. Return only the translated text without explanations or additional formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 1000,
      temperature: 0.3,
    });

    const translatedText = response.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('Failed to get translation from OpenAI');
    }

    return {
      translatedText,
      sourceLanguage: request.sourceLanguage || 'auto-detected',
      targetLanguage: request.targetLanguage
    };

  } catch (error) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Translation failed: ${errorMessage}`);
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    if (!openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a language detection expert. Respond with only the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'de', 'ja', 'zh') for the given text. If you cannot determine the language, respond with 'en'."
        },
        {
          role: "user",
          content: `Detect the language of this text: ${text}`
        }
      ],
      max_completion_tokens: 10,
      temperature: 0,
    });

    const detectedLanguage = response.choices[0]?.message?.content?.trim()?.toLowerCase();
    
    if (!detectedLanguage || !languageNames[detectedLanguage]) {
      return 'en'; // Default to English if detection fails
    }

    return detectedLanguage;

  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English on error
  }
}