import { ScriptsService } from './services/scripts.service';
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
    private cookieService: CookieService,
    private scripts: ScriptsService
  ) {

    this.hasConsented = this.cookieService.checkConsent();
    this.hasConsented.subscribe(console.log);

    this.scripts.loadPixel();

    setTimeout(() => {
      this.scripts.removePixel();
    }, 20000);

  }
}
