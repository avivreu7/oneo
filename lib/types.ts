// ============================================================
// Database Types
// ============================================================

export type GameStatus = 'lobby' | 'question' | 'timer' | 'results' | 'answer' | 'finished';
export type MediaType = 'image' | 'audio' | 'none';
export type AnswerOption = 'A' | 'B' | 'C' | 'SKIP';

export interface Game {
  id: string;
  status: GameStatus;
  current_question_id: string | null;
  current_question_index: number;
  timer_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  game_id: string;
  order_index: number;
  difficulty_percent: 90 | 70 | 55 | 45 | 35 | 25 | 15 | 10 | 5 | 1;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: 'A' | 'B' | 'C';
  explanation: string | null;
  media_url: string | null;
  media_type: MediaType;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  nickname: string;
  is_active: boolean;
  used_skip: boolean;
  joined_at: string;
}

export interface Response {
  id: string;
  game_id: string;
  question_id: string;
  player_id: string;
  selected_option: AnswerOption;
  is_correct: boolean | null;
  answered_at: string;
}

// ============================================================
// Enriched / Derived Types
// ============================================================

export interface PlayerWithResponse extends Player {
  response?: Response;
}

export type PlayerStatus = 'correct' | 'wrong' | 'skip' | 'waiting' | 'eliminated';

export interface GridPlayer {
  id: string;
  nickname: string;
  status: PlayerStatus;
}

export interface RoundResult {
  correct_option: 'A' | 'B' | 'C';
  correct_count: number;
  total_answered: number;
  eliminated_count: number;
  remaining_count: number;
  zero_correct_edge_case: boolean;
}

export interface GameStateRPC {
  id: string;
  status: GameStatus;
  current_question_index: number;
  timer_deadline: string | null;
  question: {
    id: string;
    order_index: number;
    difficulty_percent: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    media_url: string | null;
    media_type: MediaType;
  } | null;
  player_counts: {
    total: number;
    active: number;
  };
}

// ============================================================
// Difficulty config
// ============================================================

export const DIFFICULTY_LEVELS = [90, 70, 55, 45, 35, 25, 15, 10, 5, 1] as const;

export const DIFFICULTY_LABELS: Record<number, string> = {
  90: 'שאלת 90%',
  70: 'שאלת 70%',
  55: 'שאלת 55%',
  45: 'שאלת 45%',
  35: 'שאלת 35%',
  25: 'שאלת 25%',
  15: 'שאלת 15%',
  10: 'שאלת 10%',
  5: 'שאלת 5%',
  1: 'שאלת 1%',
};

// Skip is available from question 7 (difficulty 15%) onwards
export const SKIP_AVAILABLE_FROM_INDEX = 7;
export const TIMER_SECONDS = 30;
