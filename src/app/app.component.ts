import { ScriptsService } from './services/scripts.service';
import { BehaviorSubject } from 'rxjs';
import { CookieService } from './services/cookie.service';
import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  animations: [

    trigger('cookieAnimation', [

      transition(':leave', [
        style({ opacity: 1 }),
        animate('.2s ease-in', style({ opacity: 0 }))
      ]),

      transition(':enter', [
        style({ opacity: 0 }),
        animate('.2s ease-out', style({ opacity: 1 }))
      ]),

    ])

  ]
})
export class AppComponent {

  hasConsented: BehaviorSubject<boolean>;

  constructor(
    private cookieService: CookieService,
  ) {
    this.hasConsented = this.cookieService.checkConsent();
  }

  acceptCookies() {
    this.cookieService.setConsent();
  }

}
