// AI Theme Color System
export const AI_THEME_OPTIONS = {
  'purple-pink': {
    name: 'Purple to Pink',
    description: 'Classic AI branding with purple to pink gradient',
    primary: 'from-purple-500 to-pink-600',
    primaryHover: 'hover:from-purple-600 hover:to-pink-700',
    preview: 'bg-gradient-to-r from-purple-500 to-pink-600'
  },
  'blue-indigo': {
    name: 'Blue to Indigo',
    description: 'Professional blue to indigo gradient',
    primary: 'from-blue-500 to-indigo-600',
    primaryHover: 'hover:from-blue-600 hover:to-indigo-700',
    preview: 'bg-gradient-to-r from-blue-500 to-indigo-600'
  },
  'emerald-teal': {
    name: 'Emerald to Teal',
    description: 'Natural emerald to teal gradient',
    primary: 'from-emerald-500 to-teal-600',
    primaryHover: 'hover:from-emerald-600 hover:to-teal-700',
    preview: 'bg-gradient-to-r from-emerald-500 to-teal-600'
  },
  'orange-red': {
    name: 'Orange to Red',
    description: 'Energetic orange to red gradient',
    primary: 'from-orange-500 to-red-600',
    primaryHover: 'hover:from-orange-600 hover:to-red-700',
    preview: 'bg-gradient-to-r from-orange-500 to-red-600'
  },
  'violet-purple': {
    name: 'Violet to Purple',
    description: 'Rich violet to purple gradient',
    primary: 'from-violet-500 to-purple-600',
    primaryHover: 'hover:from-violet-600 hover:to-purple-700',
    preview: 'bg-gradient-to-r from-violet-500 to-purple-600'
  },
  'cyan-blue': {
    name: 'Cyan to Blue',
    description: 'Fresh cyan to blue gradient',
    primary: 'from-cyan-500 to-blue-600',
    primaryHover: 'hover:from-cyan-600 hover:to-blue-700',
    preview: 'bg-gradient-to-r from-cyan-500 to-blue-600'
  }
} as const;

export type AIThemeColor = keyof typeof AI_THEME_OPTIONS;

export function getAIThemeClasses(themeColor: AIThemeColor = 'purple-pink') {
  // Always return CSS variable classes to prevent color flashing
  return {
    primary: 'ai-gradient-bg',
    primaryHover: 'ai-gradient-bg',
    text: 'text-white'
  };
}

export function getAIThemeClassString(themeColor: AIThemeColor = 'purple-pink', includeHover: boolean = true) {
  // Always return CSS variable classes to prevent color flashing
  return `ai-gradient-bg text-white`;
}