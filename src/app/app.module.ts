import { environment } from './../environments/environment';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { CallbackComponent } from './callback/callback.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFireFunctionsModule, ORIGIN } from '@angular/fire/functions';
import { AngularFirestoreModule } from '@angular/fire/firestore';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CallbackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireFunctionsModule,
    AngularFirestoreModule
  ],
  providers: [
    // { provide: ORIGIN, useValue: 'http://localhost:5001'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
