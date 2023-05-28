export interface User {
    points?: number;
    displayName?: string
}

export interface LeaderboardUser extends Required<User> {
    address: string
}

export interface NewQuiz {
    question: string;
    options: string[];
    correctOption: number | null;
}

export interface QuizResponseObject {
    id: number;
    question: string;
    options: string[];
    correctOption: number;
    totalRatings: number;
    positiveRatings: number;
    numberOfResponses: number;
    creator: string;
    userHasAnswered: boolean;
    userHasRated: boolean;
}
  