import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizAppComponent } from './quiz-app/quiz-app.component';
import { HistoryComponent } from './history/history.component';
import { SummaryComponent } from './summary/summary.component';

const routes: Routes = [
  { path: '', redirectTo: '/quiz', pathMatch: 'full' },
  { path: 'quiz', component: QuizAppComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'summary/:id', component: SummaryComponent },
  { path: '**', redirectTo: '/quiz' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
