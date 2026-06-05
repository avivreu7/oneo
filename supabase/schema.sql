-- ============================================================
-- האחוזון העליון (The 1% Club) - Supabase Schema
-- Execute this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE game_status AS ENUM (
  'lobby',
  'question',
  'timer',
  'results',
  'answer',
  'finished'
);

CREATE TYPE media_type AS ENUM ('image', 'audio', 'none');

CREATE TYPE answer_option AS ENUM ('A', 'B', 'C', 'SKIP');

-- ============================================================
-- TABLES
-- ============================================================

-- games: one active game at a time
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status game_status NOT NULL DEFAULT 'lobby',
  current_question_id UUID,
  current_question_index INTEGER DEFAULT 0,
  timer_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- questions: 10 per game, ordered by difficulty (90% → 1%)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index BETWEEN 1 AND 10),
  difficulty_percent INTEGER NOT NULL CHECK (difficulty_percent IN (90, 70, 55, 45, 35, 25, 15, 10, 5, 1)),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  correct_option answer_option NOT NULL CHECK (correct_option IN ('A', 'B', 'C')),
  explanation TEXT,
  media_url TEXT,
  media_type media_type NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, order_index)
);

-- players: mobile users who join
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  used_skip BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, nickname)
);

-- responses: one row per player per question
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  selected_option answer_option NOT NULL,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, player_id)
);

-- Add FK from games to questions (after questions table exists)
ALTER TABLE games
  ADD CONSTRAINT fk_current_question
  FOREIGN KEY (current_question_id) REFERENCES questions(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_game_active ON players(game_id, is_active);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_responses_player_id ON responses(player_id);
CREATE INDEX idx_questions_game_order ON questions(game_id, order_index);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RPC: process_round_results
-- Evaluates answers for the current question.
-- Edge case: if 0 active players answered correctly,
-- keep ALL active players who participated (no eliminations).
-- ============================================================

CREATE OR REPLACE FUNCTION process_round_results(p_game_id UUID, p_question_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_correct_option answer_option;
  v_correct_count  INTEGER;
  v_total_answered INTEGER;
  v_result         JSONB;
BEGIN
  -- Get the correct answer for this question
  SELECT correct_option INTO v_correct_option
  FROM questions
  WHERE id = p_question_id AND game_id = p_game_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found: %', p_question_id;
  END IF;

  -- Mark is_correct on all responses for this question
  UPDATE responses r
  SET is_correct = (r.selected_option = v_correct_option)
  WHERE r.question_id = p_question_id
    AND r.game_id = p_game_id;

  -- Count how many active players answered correctly
  SELECT COUNT(*) INTO v_correct_count
  FROM responses r
  JOIN players p ON p.id = r.player_id
  WHERE r.question_id = p_question_id
    AND r.game_id = p_game_id
    AND p.is_active = TRUE
    AND r.is_correct = TRUE;

  -- Count total active players who answered
  SELECT COUNT(*) INTO v_total_answered
  FROM responses r
  JOIN players p ON p.id = r.player_id
  WHERE r.question_id = p_question_id
    AND r.game_id = p_game_id
    AND p.is_active = TRUE;

  -- Edge case: 0 correct answers → no eliminations
  IF v_correct_count = 0 AND v_total_answered > 0 THEN
    -- No players eliminated — return early with special flag
    v_result := jsonb_build_object(
      'correct_option', v_correct_option,
      'correct_count', 0,
      'total_answered', v_total_answered,
      'eliminated_count', 0,
      'zero_correct_edge_case', TRUE
    );
    RETURN v_result;
  END IF;

  -- Normal case: eliminate active players who answered wrong or skipped
  -- (SKIP counts as wrong for elimination purposes)
  UPDATE players p
  SET is_active = FALSE
  FROM responses r
  WHERE r.player_id = p.id
    AND r.question_id = p_question_id
    AND r.game_id = p_game_id
    AND p.is_active = TRUE
    AND (r.is_correct = FALSE OR r.selected_option = 'SKIP');

  -- Also eliminate active players who did NOT answer at all
  UPDATE players
  SET is_active = FALSE
  WHERE game_id = p_game_id
    AND is_active = TRUE
    AND id NOT IN (
      SELECT player_id FROM responses
      WHERE question_id = p_question_id
        AND game_id = p_game_id
    );

  -- Build result summary
  SELECT jsonb_build_object(
    'correct_option', v_correct_option,
    'correct_count', v_correct_count,
    'total_answered', v_total_answered,
    'eliminated_count', (
      SELECT COUNT(*) FROM players
      WHERE game_id = p_game_id AND is_active = FALSE
    ),
    'remaining_count', (
      SELECT COUNT(*) FROM players
      WHERE game_id = p_game_id AND is_active = TRUE
    ),
    'zero_correct_edge_case', FALSE
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: get_game_state
-- Returns full game state with current question and player counts
-- ============================================================

CREATE OR REPLACE FUNCTION get_game_state(p_game_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_game    games%ROWTYPE;
  v_question questions%ROWTYPE;
  v_result   JSONB;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found: %', p_game_id;
  END IF;

  IF v_game.current_question_id IS NOT NULL THEN
    SELECT * INTO v_question FROM questions WHERE id = v_game.current_question_id;
  END IF;

  v_result := jsonb_build_object(
    'id', v_game.id,
    'status', v_game.status,
    'current_question_index', v_game.current_question_index,
    'timer_deadline', v_game.timer_deadline,
    'question', CASE
      WHEN v_game.current_question_id IS NOT NULL THEN jsonb_build_object(
        'id', v_question.id,
        'order_index', v_question.order_index,
        'difficulty_percent', v_question.difficulty_percent,
        'question_text', v_question.question_text,
        'option_a', v_question.option_a,
        'option_b', v_question.option_b,
        'option_c', v_question.option_c,
        'media_url', v_question.media_url,
        'media_type', v_question.media_type
      )
      ELSE NULL
    END,
    'player_counts', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM players WHERE game_id = p_game_id),
      'active', (SELECT COUNT(*) FROM players WHERE game_id = p_game_id AND is_active = TRUE)
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (game is public)
CREATE POLICY "Public read games" ON games FOR SELECT USING (TRUE);
CREATE POLICY "Public read questions" ON questions FOR SELECT USING (TRUE);
CREATE POLICY "Public read players" ON players FOR SELECT USING (TRUE);
CREATE POLICY "Public read responses" ON responses FOR SELECT USING (TRUE);

-- Insert/update restricted to service role (via API routes with service key)
-- No direct anon INSERT/UPDATE allowed on sensitive tables

-- Players can insert themselves
CREATE POLICY "Players can join" ON players FOR INSERT WITH CHECK (TRUE);

-- Players can submit responses
CREATE POLICY "Players can respond" ON responses FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- REALTIME: Enable on all tables
-- ============================================================

-- Run these in the Supabase Dashboard > Database > Replication
-- or via CLI: supabase db push with replication config
-- ALTER PUBLICATION supabase_realtime ADD TABLE games;
-- ALTER PUBLICATION supabase_realtime ADD TABLE players;
-- ALTER PUBLICATION supabase_realtime ADD TABLE responses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE questions;

-- ============================================================
-- SEED: Sample game for testing
-- ============================================================

-- Uncomment to seed a test game:
-- INSERT INTO games (status) VALUES ('lobby');
