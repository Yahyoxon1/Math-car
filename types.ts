
export type Screen = 'welcome' | 'playing' | 'gameover';

export interface Question {
  text: string;
  correctAnswer: number;
  options: number[];
}
