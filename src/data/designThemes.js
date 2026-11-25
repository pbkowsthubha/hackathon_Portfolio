/**
 * Portfolio Studio — Design Theme Library & Presets
 * Defines 5 distinct themes, typography options, component styles, and section metadata.
 */

export const DEFAULT_SECTION_ORDER = [
  'about',
  'projects',
  'skills',
  'education',
  'achievements',
  'certifications',
  'blog',
]

export const SECTION_LABELS = {
  about: 'About Me',
  projects: 'Projects Showcase',
  skills: 'Technical Skills',
  education: 'Academic Education',
  achievements: 'Achievements & Honors',
  certifications: 'Certifications',
  blog: 'Published Blog',
}

export const FONT_FAMILY_OPTIONS = [
  { id: 'Inter', label: 'Inter (Clean Sans)', stack: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'Space Grotesk', label: 'Space Grotesk (Geometric)', stack: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'JetBrains Mono', label: 'JetBrains Mono (Technical)', stack: "'JetBrains Mono', Menlo, Monaco, monospace" },
  { id: 'Georgia', label: 'Georgia (Editorial Serif)', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'System UI', label: 'System Sans', stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
]

export const DESIGN_THEMES = [
  {
    id: 'modern-editorial',
    name: 'Modern Editorial',
    description: 'Swiss grid precision with warm ivory paper, deep charcoal ink, and cobalt accents.',
    previewSwatches: ['#F6F5F0', '#E9E7DF', '#171717', '#315BEA'],
    config: {
      colors: {
        primary: '#171717',
        secondary: '#E9E7DF',
        background: '#F6F5F0',
        text: '#171717',
        accent: '#315BEA',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Space Grotesk',
      },
      components: {
        buttonStyle: 'solid',
        borderRadius: 'sm',
        cardStyle: 'bordered',
        spacing: 'normal',
      },
      layout: {
        heroLayout: 'split',
        projectLayout: 'grid',
        navStyle: 'standard',
      },
    },
  },
  {
    id: 'minimal-professional',
    name: 'Minimal Professional',
    description: 'Ultra-clean white canvas with airy whitespace, slate typography, and crisp hairline dividers.',
    previewSwatches: ['#FFFFFF', '#F8FAFC', '#0F172A', '#0284C7'],
    config: {
      colors: {
        primary: '#0F172A',
        secondary: '#F8FAFC',
        background: '#FFFFFF',
        text: '#0F172A',
        accent: '#0284C7',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Inter',
      },
      components: {
        buttonStyle: 'outline',
        borderRadius: 'sm',
        cardStyle: 'minimal',
        spacing: 'spacious',
      },
      layout: {
        heroLayout: 'centered',
        projectLayout: 'list',
        navStyle: 'minimal',
      },
    },
  },
  {
    id: 'creative-designer',
    name: 'Creative Designer',
    description: 'Expressive editorial serif headings, warm studio blush surfaces, rounded cards, and pill CTAs.',
    previewSwatches: ['#FDF8F5', '#F5ECE6', '#1F1614', '#E11D48'],
    config: {
      colors: {
        primary: '#1F1614',
        secondary: '#F5ECE6',
        background: '#FDF8F5',
        text: '#1F1614',
        accent: '#E11D48',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Georgia',
      },
      components: {
        buttonStyle: 'pill',
        borderRadius: 'lg',
        cardStyle: 'elevated',
        spacing: 'spacious',
      },
      layout: {
        heroLayout: 'centered',
        projectLayout: 'grid',
        navStyle: 'centered',
      },
    },
  },
  {
    id: 'developer-portfolio',
    name: 'Developer Portfolio',
    description: 'Monospace-driven engineering layout with cool slate surfaces, emerald accents, and tight density.',
    previewSwatches: ['#F1F5F9', '#E2E8F0', '#0F172A', '#059669'],
    config: {
      colors: {
        primary: '#0F172A',
        secondary: '#E2E8F0',
        background: '#F1F5F9',
        text: '#0F172A',
        accent: '#059669',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'JetBrains Mono',
      },
      components: {
        buttonStyle: 'solid',
        borderRadius: 'none',
        cardStyle: 'bordered',
        spacing: 'compact',
      },
      layout: {
        heroLayout: 'minimal',
        projectLayout: 'list',
        navStyle: 'standard',
      },
    },
  },
  {
    id: 'dark-professional',
    name: 'Dark Professional',
    description: 'High-contrast obsidian dark mode with elevated midnight surfaces and luminous blue accents.',
    previewSwatches: ['#0B0F19', '#131B2E', '#F8FAFC', '#60A5FA'],
    config: {
      colors: {
        primary: '#F8FAFC',
        secondary: '#131B2E',
        background: '#0B0F19',
        text: '#F8FAFC',
        accent: '#60A5FA',
      },
      typography: {
        fontFamily: 'Inter',
        headingFont: 'Space Grotesk',
      },
      components: {
        buttonStyle: 'solid',
        borderRadius: 'md',
        cardStyle: 'elevated',
        spacing: 'normal',
      },
      layout: {
        heroLayout: 'split',
        projectLayout: 'grid',
        navStyle: 'standard',
      },
    },
  },
]

export function getThemeById(themeId) {
  return DESIGN_THEMES.find((t) => t.id === themeId) || DESIGN_THEMES[0]
}

export function getDefaultDesign(themeId = 'modern-editorial') {
  const theme = getThemeById(themeId)
  return {
    themeId: theme.id,
    colors: { ...theme.config.colors },
    typography: { ...theme.config.typography },
    components: { ...theme.config.components },
    layout: {
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      hiddenSections: [],
      heroLayout: theme.config.layout.heroLayout,
      projectLayout: theme.config.layout.projectLayout,
      navStyle: theme.config.layout.navStyle,
    },
  }
}

export function getFontStack(fontId) {
  const found = FONT_FAMILY_OPTIONS.find((f) => f.id === fontId)
  return found ? found.stack : FONT_FAMILY_OPTIONS[0].stack
}
