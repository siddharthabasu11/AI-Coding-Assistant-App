export interface CodeSubmission {

    code: string;
}

export interface AIResponse {
    original_code: string;
    correction: string;
}

export interface CodeReview {
  
    submission: string;
    response: string;
}