export interface SentimentPoint {
  timeCode: string;
  engagementLevel: number;
  speaker: string;
}

export interface CoachingCard {
  doneWell: string[];
  missedOpportunities: string[];
}

export interface AnalysisData {
  sentiment: SentimentPoint[];
  coaching: CoachingCard;
}

export interface CallData {
  transcript: string;
  analysis: AnalysisData;
}
