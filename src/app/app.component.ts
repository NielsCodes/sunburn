import { BehaviorSubject } from 'rxjs';
import { CookieService } from './services/cookie.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  hasConsented: BehaviorSubject<boolean>;

  constructor(
    private cookieService: CookieService
  ) {

    this.hasConsented = this.cookieService.checkConsent();
    this.hasConsented.subscribe(console.log);

  }
}
