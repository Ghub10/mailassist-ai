export interface DraftConfidence {
  score: number;
  feedback: string;
  isScoring: boolean;
}

export interface Draft {
  emailId: string;
  content: string;
  isLoading: boolean;
  error: string | null;
  confidence: DraftConfidence | null;
}
