import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  private hasConsented: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private analytics: AngularFireAnalytics
  ) {
    this.checkConsent();
   }

  checkConsent() {

    const local = localStorage.getItem('cookieConsent');
    if (local === 'true') {
      this.hasConsented.next(true);
    } else {
      this.hasConsented.next(false);
    }

    return this.hasConsented;
  }

  setConsent() {

    // Set local storage item
    localStorage.setItem('cookieConsent', 'true');

    // Enable Firebase analytics
    this.analytics.setAnalyticsCollectionEnabled(true);

    // Enable FB Pixel

    this.checkConsent();
  }

  removeConsent() {

    // Remove local storage item
    localStorage.removeItem('cookieConsent');

    // Disable Firebase analytics
    this.analytics.setAnalyticsCollectionEnabled(false);

    // Remove FB Pixel

    this.checkConsent();
  }

}
