import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

export interface QuizResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  questionId: number;
}

export interface QuizHistory {
  id: string;
  date: Date;
  score: number;
  totalQuestions: number;
  percentage: number;
  incorrectAnswers: QuizResult[];
  allResults: QuizResult[];
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly STORAGE_KEY = 'quiz_history';
  private readonly MASTERED_QUESTIONS_KEY = 'mastered_questions';

  constructor(private http: HttpClient) {}

  // Load questions from JSON file
  loadQuestions(): Observable<{ questions: Question[] }> {
    return this.http.get<{ questions: Question[] }>('assets/questions.json');
  }

  // Get mastered question IDs (questions answered correctly)
  private getMasteredQuestionIds(): Set<number> {
    const stored = localStorage.getItem(this.MASTERED_QUESTIONS_KEY);
    if (!stored) {
      return new Set<number>();
    }
    
    try {
      const ids = JSON.parse(stored);
      return new Set<number>(ids);
    } catch (e) {
      console.error('Error parsing mastered questions:', e);
      return new Set<number>();
    }
  }

  // Save mastered question IDs
  private saveMasteredQuestionIds(ids: Set<number>): void {
    localStorage.setItem(this.MASTERED_QUESTIONS_KEY, JSON.stringify(Array.from(ids)));
  }

  // Update mastered questions based on quiz results
  private updateMasteredQuestions(allResults: QuizResult[]): void {
    const masteredIds = this.getMasteredQuestionIds();
    
    allResults.forEach(result => {
      if (result.isCorrect) {
        // Add correctly answered questions to mastered set
        masteredIds.add(result.questionId);
      } else {
        // Remove incorrectly answered questions from mastered set
        // This ensures they appear in future quizzes
        masteredIds.delete(result.questionId);
      }
    });
    
    this.saveMasteredQuestionIds(masteredIds);
  }

  // Get available questions (not mastered)
  getAvailableQuestions(allQuestions: Question[]): Question[] {
    const masteredIds = this.getMasteredQuestionIds();
    return allQuestions.filter(q => !masteredIds.has(q.id));
  }

  // Get random questions from available pool (excluding mastered questions)
  getRandomQuestions(allQuestions: Question[], count: number = 10): Question[] {
    const availableQuestions = this.getAvailableQuestions(allQuestions);
    
    // If we don't have enough available questions, inform the user
    if (availableQuestions.length === 0) {
      console.warn('All questions have been mastered! Resetting progress...');
      this.resetMasteredQuestions();
      return this.getRandomQuestions(allQuestions, count);
    }
    
    // If we have fewer available questions than requested, return all available
    if (availableQuestions.length <= count) {
      return [...availableQuestions].sort(() => 0.5 - Math.random());
    }
    
    // Otherwise, return random selection
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Save quiz result to local storage and update mastered questions
  saveQuizResult(
    score: number,
    totalQuestions: number,
    incorrectAnswers: QuizResult[],
    allResults: QuizResult[]
  ): string {
    const history = this.getQuizHistory();
    
    const newResult: QuizHistory = {
      id: this.generateId(),
      date: new Date(),
      score: score,
      totalQuestions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      incorrectAnswers: incorrectAnswers,
      allResults: allResults
    };

    history.unshift(newResult); // Add to beginning of array
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    
    // Update mastered questions based on quiz results
    this.updateMasteredQuestions(allResults);
    
    return newResult.id;
  }

  // Get all quiz history from local storage
  getQuizHistory(): QuizHistory[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    try {
      const history = JSON.parse(stored);
      // Convert date strings back to Date objects
      return history.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
    } catch (e) {
      console.error('Error parsing quiz history:', e);
      return [];
    }
  }

  // Get specific quiz result by ID
  getQuizById(id: string): QuizHistory | undefined {
    const history = this.getQuizHistory();
    return history.find(item => item.id === id);
  }

  // Clear all quiz history
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Delete specific quiz from history
  deleteQuiz(id: string): void {
    const history = this.getQuizHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Reset mastered questions (start fresh)
  resetMasteredQuestions(): void {
    localStorage.removeItem(this.MASTERED_QUESTIONS_KEY);
  }

  // Get progress statistics
  getProgressStats(totalQuestions: number): {
    masteredCount: number;
    remainingCount: number;
    masteredPercentage: number;
  } {
    const masteredIds = this.getMasteredQuestionIds();
    const masteredCount = masteredIds.size;
    const remainingCount = totalQuestions - masteredCount;
    const masteredPercentage = Math.round((masteredCount / totalQuestions) * 100);
    
    return {
      masteredCount,
      remainingCount,
      masteredPercentage
    };
  }

  // Generate unique ID for quiz results
  private generateId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics
  getStatistics(): {
    totalQuizzes: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  } {
    const history = this.getQuizHistory();
    
    if (history.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0
      };
    }

    const percentages = history.map(h => h.percentage);
    
    return {
      totalQuizzes: history.length,
      averageScore: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      highestScore: Math.max(...percentages),
      lowestScore: Math.min(...percentages)
    };
  }

  // Get all unique incorrect answers across all quizzes
  getAllIncorrectAnswers(): { question: string; correctAnswer: string; count: number }[] {
    const history = this.getQuizHistory();
    const incorrectMap = new Map<string, { correctAnswer: string; count: number }>();

    history.forEach(quiz => {
      quiz.incorrectAnswers.forEach(answer => {
        const key = answer.question;
        if (incorrectMap.has(key)) {
          const existing = incorrectMap.get(key)!;
          existing.count += 1;
        } else {
          incorrectMap.set(key, {
            correctAnswer: answer.correctAnswer,
            count: 1
          });
        }
      });
    });

    // Convert map to array and sort by count (most missed first)
    return Array.from(incorrectMap.entries())
      .map(([question, data]) => ({
        question,
        correctAnswer: data.correctAnswer,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Export incorrect answers to text file
  exportIncorrectAnswers(): void {
    const incorrectAnswers = this.getAllIncorrectAnswers();
    
    if (incorrectAnswers.length === 0) {
      alert('No incorrect answers to export. Great job!');
      return;
    }

    // Build the text content
    let content = '='.repeat(80) + '\n';
    // content += 'VOCABULARY REVIEW - INCORRECT ANSWERS\n';
    // content += '='.repeat(80) + '\n\n';
    content += `Generated: ${new Date().toLocaleString()}\n`;
    // content += `Total Questions to Review: ${incorrectAnswers.length}\n`;
    content += '='.repeat(80) + '\n';

    incorrectAnswers.forEach((item, index) => {
      //content += `${index + 1}. ${item.question}\n`;
      //content += `   Answer: ${item.correctAnswer}\n`;      
      content += `${index + 1}. ${item.question} = ${item.correctAnswer} \n\n`;
      // content += `   Times Missed: ${item.count}\n`;
      // content += '-'.repeat(80) + '\n';
    });

    // content += '='.repeat(80) + '\n';
    // content += 'END OF REVIEW LIST\n';
     content += '='.repeat(80) + '\n';

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocabulary-review-${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}