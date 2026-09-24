import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { QuizService, QuizHistory, QuizResult } from '../services/quiz.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class SummaryComponent implements OnInit {
  quiz: QuizHistory | null = null;
  quizId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.quizId = params['id'];
      this.loadQuizSummary();
    });
  }

  loadQuizSummary(): void {
    const result = this.quizService.getQuizById(this.quizId);
    
    if (result) {
      this.quiz = result;
    } else {
      // Quiz not found, redirect to history
      this.router.navigate(['/history']);
    }
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }

  startNewQuiz(): void {
    this.router.navigate(['/quiz']);
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  getScoreMessage(): string {
    if (!this.quiz) return '';
    
    const percentage = this.quiz.percentage;
    if (percentage === 100) return 'Perfect Score! Outstanding! 🎉';
    if (percentage >= 80) return 'Excellent Work! 🌟';
    if (percentage >= 60) return 'Good Job! 👍';
    if (percentage >= 40) return 'Keep Practicing! 💪';
    return 'Don\'t Give Up! 📚';
  }

  getCorrectAnswers(): QuizResult[] {
    if (!this.quiz) return [];
    return this.quiz.allResults.filter(r => r.isCorrect);
  }
}
