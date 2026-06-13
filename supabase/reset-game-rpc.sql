-- ============================================================
-- RPC: reset_game
-- Atomically resets a game back to the lobby:
--   1. deletes ALL responses for the game
--   2. reactivates every player and returns their skip token
--   3. moves the game back to 'lobby' (first question)
-- Runs inside a single transaction, so it never leaves partial state.
-- Run this once in the Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION reset_game(p_game_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM responses WHERE game_id = p_game_id;

  UPDATE players
    SET is_active = TRUE,
        used_skip = FALSE
    WHERE game_id = p_game_id;

  UPDATE games
    SET status = 'lobby',
        current_question_id = NULL,
        current_question_index = 0,
        timer_deadline = NULL
    WHERE id = p_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
