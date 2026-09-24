import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFabButton } from '@angular/material/button';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Components
import { AppComponent } from './app.component';
import { QuizAppComponent } from './quiz-app/quiz-app.component';
import { HistoryComponent } from './history/history.component';
import { SummaryComponent } from './summary/summary.component';

// Services
import { QuizService } from './services/quiz.service';

@NgModule({
  declarations: [
    AppComponent,
    QuizAppComponent,
    HistoryComponent,
    SummaryComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  providers: [QuizService],
  bootstrap: [AppComponent]
})
export class AppModule { }
