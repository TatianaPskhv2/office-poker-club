/**
 * Формула рейтинга Office Poker Club.
 *
 * Это единственная точка, где можно менять веса.
 *
 * Очки за одну завершённую игру:
 *  - BASE_POINTS — за участие;
 *  - PLACE_WEIGHT × (размер поля − место + 1) — за позицию;
 *  - WIN_BONUS — за первое место;
 *  - FIELD_WEIGHT × min(игроков, 10) — небольшая корректировка за размер стола.
 *
 * Стартовый рейтинг игрока: STARTING_RATING.
 * Итоговый рейтинг = STARTING_RATING + сумма очков по выбранному периоду.
 */
export const STARTING_RATING = 1000;
const BASE_POINTS = 10;
const PLACE_WEIGHT = 8;
const WIN_BONUS = 25;
const FIELD_WEIGHT = 1;

export function scoreGameResult(
  place: number,
  fieldSize: number,
  isWinner: boolean
): number {
  const safePlace = Math.max(1, place);
  const safeField = Math.max(1, fieldSize);
  const placePoints = (safeField - safePlace + 1) * PLACE_WEIGHT;
  const winBonus = isWinner ? WIN_BONUS : 0;
  const fieldBonus = Math.min(safeField, 10) * FIELD_WEIGHT;
  return BASE_POINTS + placePoints + winBonus + fieldBonus;
}

export function describeRatingFormula(): string {
  return `Старт ${STARTING_RATING} + ${BASE_POINTS} за участие + ${PLACE_WEIGHT}×(поле − место + 1) + ${WIN_BONUS} за победу + до ${FIELD_WEIGHT * 10} за размер стола.`;
}
