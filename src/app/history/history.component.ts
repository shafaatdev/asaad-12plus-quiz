import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { QuizService, QuizHistory } from '../services/quiz.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HistoryComponent implements OnInit {
  quizHistory: QuizHistory[] = [];
  statistics: any = null;

  constructor(
    private quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadStatistics();
  }

  loadHistory(): void {
    this.quizHistory = this.quizService.getQuizHistory();
  }

  loadStatistics(): void {
    this.statistics = this.quizService.getStatistics();
  }

  viewSummary(quizId: string): void {
    this.router.navigate(['/summary', quizId]);
  }

  deleteQuiz(quizId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this quiz result?')) {
      this.quizService.deleteQuiz(quizId);
      this.loadHistory();
      this.loadStatistics();
    }
  }

  clearAllHistory(event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete all quiz history? This action cannot be undone.')) {
      this.quizService.clearHistory();
      this.quizService.resetMasteredQuestions();      
      this.loadHistory();
      this.loadStatistics();
    }
  }

  resetProgress(event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to reset your learning progress? This will allow all questions to appear in future quizzes again. Your quiz history will not be deleted.')) {
      this.quizService.resetMasteredQuestions();
      alert('Progress reset successfully! All questions are now available for practice.');
    }
  }

  exportIncorrectAnswers(event: Event): void {
    event.stopPropagation();
    this.quizService.exportIncorrectAnswers();
  }

  getIncorrectAnswersCount(): number {
    return this.quizService.getAllIncorrectAnswers().length;
  }

  startNewQuiz(): void {
    this.router.navigate(['/quiz']);
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  getScoreClass(percentage: number): string {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  }
}