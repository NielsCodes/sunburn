import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  private hasConsented: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor() {
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
    localStorage.setItem('cookieConsent', 'true');
    this.checkConsent();
  }

  removeConsent() {
    localStorage.removeItem('cookieConsent');
    this.checkConsent();
  }

}
