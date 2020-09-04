import { environment } from './../environments/environment';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { CallbackComponent } from './callback/callback.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAnalyticsModule, COLLECTION_ENABLED } from '@angular/fire/analytics';

import { HttpClientModule } from '@angular/common/http';
import { ClipboardModule } from '@angular/cdk/clipboard';

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
    AngularFirestoreModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ClipboardModule,
    AngularFireAnalyticsModule,
    FormsModule
  ],
  providers: [
    { provide: COLLECTION_ENABLED, useValue: false },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
