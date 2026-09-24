import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';
import { QuizService, Question, QuizResult } from '../services/quiz.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz-app.component.html',
  styleUrls: ['./quiz-app.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(80, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class QuizAppComponent implements OnInit {
  questions: Question[] = [];
  allQuestions: Question[] = [];
  currentQuestionIndex = 0;
  quizCompleted = false;
  score = 0;
  results: QuizResult[] = [];
  selectedOption: number | null = null;
  answerSubmitted = false;
  showStartScreen = true;
  loading = true;
  savedQuizId: string = '';
  progressStats: any = null;
  availableQuestionsCount: number = 0;

  constructor(
    private quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.quizService.loadQuestions().subscribe({
      next: (data) => {
        this.allQuestions = data.questions;
        this.progressStats = this.quizService.getProgressStats(data.questions.length);
        this.availableQuestionsCount = this.quizService.getAvailableQuestions(data.questions).length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.loading = false;
      }
    });
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get progress(): number {
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  startQuiz(): void {
    this.showStartScreen = false;
    this.questions = this.quizService.getRandomQuestions(this.allQuestions, 10);
    this.resetQuiz();
  }

  selectOption(index: number): void {
    if (!this.answerSubmitted) {
      this.selectedOption = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedOption === null) return;

    this.answerSubmitted = true;
    this.currentQuestion.userAnswer = this.selectedOption;

    const isCorrect = this.selectedOption === this.currentQuestion.correctAnswer;
    if (isCorrect) {
      this.score++;
    }

    this.results.push({
      question: this.currentQuestion.question,
      userAnswer: this.currentQuestion.options[this.selectedOption],
      correctAnswer: this.currentQuestion.options[this.currentQuestion.correctAnswer],
      isCorrect: isCorrect,
      questionId: this.currentQuestion.id
    });
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedOption = null;
      this.answerSubmitted = false;
    } else {
      this.completeQuiz();
    }
  }

  completeQuiz(): void {
    this.quizCompleted = true;
    
    // Save to local storage
    const incorrectAnswers = this.results.filter(r => !r.isCorrect);
    this.savedQuizId = this.quizService.saveQuizResult(
      this.score,
      this.questions.length,
      incorrectAnswers,
      this.results
    );
  }

  resetQuiz(): void {
    this.currentQuestionIndex = 0;
    this.quizCompleted = false;
    this.score = 0;
    this.results = [];
    this.selectedOption = null;
    this.answerSubmitted = false;
    if (this.questions.length > 0) {
      this.questions.forEach(q => delete q.userAnswer);
    }
  }

  restartQuiz(): void {
    this.showStartScreen = true;
  }

  viewHistory(): void {
    this.router.navigate(['/history']);
  }

  viewQuizSummary(): void {
    if (this.savedQuizId) {
      this.router.navigate(['/summary', this.savedQuizId]);
    }
  }

  getIncorrectAnswers(): QuizResult[] {
    return this.results.filter(r => !r.isCorrect);
  }

  getScorePercentage(): number {
    return Math.round((this.score / this.questions.length) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getScorePercentage();
    if (percentage === 100) return 'Perfect Score! Outstanding! 🎉';
    if (percentage >= 80) return 'Excellent Work! 🌟';
    if (percentage >= 60) return 'Good Job! 👍';
    if (percentage >= 40) return 'Keep Practicing! 💪';
    return 'Don\'t Give Up! 📚';
  }

  exportIncorrectAnswers(): void {
    this.quizService.exportIncorrectAnswers();
  }

  getIncorrectAnswersCount(): number {
    return this.quizService.getAllIncorrectAnswers().length;
  }
}