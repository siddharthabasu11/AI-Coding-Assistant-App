
import { CodeSubmission, AIResponse, CodeReview } from './types';


export function validateCode(input: string): boolean {

  if(typeof input !== "string" || input.trim().length ===0){
    return false;
  }
  return true;
}

export function formatResponse(aiResponse: string): string {
  
    return aiResponse.trim();
}


export function createReview(originalCode: string, aiCorrection: string): CodeReview {

  const review: CodeReview  = {
    submission : originalCode, response: aiCorrection
  };
  return review;
}