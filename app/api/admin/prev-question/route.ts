import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type QuestionRow = { id: string; order_index: number };
type PlayerRow = {
  id: string;
  game_id: string;
  nickname: string;
  is_active: boolean;
  used_skip: boolean;
  joined_at: string;
};
type PastResponse = {
  player_id: string;
  question_id: string;
  is_correct: boolean | null;
  selected_option: string;
};

// Roll the game back one question — and restore the game state to exactly
// how it looked at the START of that question (before it was answered):
//   • players who only got eliminated in the round(s) we're undoing become active again
//   • skip tokens spent in the undone round(s) are returned
//   • responses for the rolled-back question (and anything after) are cleared
//     so the round can be replayed cleanly.
export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const supabase = createAdminClient();

  const { data: game } = await supabase
    .from('games')
    .select('current_question_index')
    .eq('id', gameId)
    .single();

  if (!game) return NextResponse.json({ error: 'משחק לא נמצא' }, { status: 404 });
  if ((game.current_question_index ?? 0) <= 1) {
    return NextResponse.json({ error: 'כבר בשאלה הראשונה' }, { status: 400 });
  }

  const prevIndex = (game.current_question_index ?? 1) - 1;

  // All questions for this game, so we can split past vs. rolled-back/future.
  const { data: questionsData } = await supabase
    .from('questions')
    .select('id, order_index')
    .eq('game_id', gameId);
  const questions = (questionsData ?? []) as QuestionRow[];

  const prevQ = questions.find(q => q.order_index === prevIndex);
  if (!prevQ) return NextResponse.json({ error: 'שאלה קודמת לא נמצאה' }, { status: 404 });

  // Rounds that REMAIN completed (strictly before the question we go back to).
  const pastQuestionIds = questions
    .filter(q => q.order_index < prevIndex)
    .map(q => q.id);
  // The question we return to + everything after — to be wiped.
  const clearQuestionIds = questions
    .filter(q => q.order_index >= prevIndex)
    .map(q => q.id);

  // Fetch players and the responses for the rounds that stay completed.
  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId);
  const players = (playersData ?? []) as PlayerRow[];

  let pastResponses: PastResponse[] = [];
  if (pastQuestionIds.length) {
    const { data } = await supabase
      .from('responses')
      .select('player_id, question_id, is_correct, selected_option')
      .eq('game_id', gameId)
      .in('question_id', pastQuestionIds);
    pastResponses = (data ?? []) as PastResponse[];
  }

  // Recompute each player's state from the responses of the completed rounds.
  const restored = players.map(p => {
    const mine = pastResponses.filter(r => r.player_id === p.id);
    // Active iff they have a correct answer for EVERY completed round.
    const isActive = pastQuestionIds.every(qid =>
      mine.some(r => r.question_id === qid && r.is_correct === true)
    );
    // Skip token is "used" only if they spent it in a round that stays completed.
    const usedSkip = mine.some(r => r.selected_option === 'SKIP');
    return { ...p, is_active: isActive, used_skip: usedSkip };
  });

  // Clear responses for the rolled-back question and everything after it.
  if (clearQuestionIds.length) {
    const { error: delError } = await supabase
      .from('responses')
      .delete()
      .eq('game_id', gameId)
      .in('question_id', clearQuestionIds);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  // Restore players in a single upsert.
  if (restored.length) {
    const { error: upError } = await supabase
      .from('players')
      .upsert(restored, { onConflict: 'id' });
    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 });
  }

  // Move the game pointer back to the previous question (un-started).
  const { error } = await supabase
    .from('games')
    .update({
      status: 'question',
      current_question_id: prevQ.id,
      current_question_index: prevIndex,
      timer_deadline: null,
    })
    .eq('id', gameId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
