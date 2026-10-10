export type PaperStyle = 'plain' | 'ruled' | 'dotgrid';

export type HandwritingFont = 'patrick' | 'kalam' | 'caveat';

export interface AccentColor {
  id: string;
  name: string;
  hex: string;
  light: string;
  border: string;
  text: string;
}

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom_weekdays' | 'every_x_days';

export interface RepeatRule {
  type: RepeatType;
  interval?: number; // for every_x_days
  weekdays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat for custom_weekdays
  startDate: string; // YYYY-MM-DD
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export interface Task {
  id: string;
  text: string;
  categoryId: string;
  createdDate: string; // YYYY-MM-DD
  repeatRule?: RepeatRule;
  completedDates: string[]; // List of YYYY-MM-DD dates marked completed
  order: number;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isGuest?: boolean;
}

export interface UserSettings {
  paperStyle: PaperStyle;
  font: HandwritingFont;
  accentColorId: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: 'sage',
    name: 'Sage Green',
    hex: '#6A8E7F',
    light: '#EEF4F1',
    border: '#B6CBC1',
    text: '#2D4E41',
  },
  {
    id: 'blue',
    name: 'Dusty Blue',
    hex: '#5B879E',
    light: '#EEF4F7',
    border: '#B2CBD9',
    text: '#2C4E61',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    hex: '#8A7BA5',
    light: '#F3F0F7',
    border: '#C9BFD9',
    text: '#443460',
  },
  {
    id: 'peach',
    name: 'Warm Peach',
    hex: '#D77F67',
    light: '#FAF1EE',
    border: '#ECC3B7',
    text: '#6A3122',
  },
  {
    id: 'mustard',
    name: 'Soft Mustard',
    hex: '#C49439',
    light: '#FAF5EA',
    border: '#E8D09E',
    text: '#583F11',
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-study', name: 'Study', color: '#6A8E7F', isDefault: true },
  { id: 'cat-personal', name: 'Personal', color: '#5B879E', isDefault: true },
  { id: 'cat-reading', name: 'Reading', color: '#8A7BA5', isDefault: true },
  { id: 'cat-health', name: 'Health', color: '#D77F67', isDefault: true },
];
