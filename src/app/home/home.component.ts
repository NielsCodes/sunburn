import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit, OnDestroy {

  private unlistener: () => void;

  constructor(
    private fns: AngularFireFunctions,
    private router: Router,
    private renderer2: Renderer2
  ) { }

  ngOnInit(): void {
  }

  onSpotifyLogin() {

    const rootUrl = 'https://accounts.spotify.com/authorize';
    const clientID = 'e927df0934d7411181641fbd99a56f3c';
    // const redirectURL = 'http://localhost:4200/callback';
    const redirectURL = 'https://presave-app.web.app/callback';
    const scope = 'user-library-modify user-read-private user-follow-modify';
    const state = 'bbpresave';

    // tslint:disable-next-line: max-line-length
    const loginUrl = `${rootUrl}?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&scope=${encodeURIComponent(scope)}&state=${state}&show_dialog=true`;

    window.location.href = loginUrl;

  }

  onMessengerNotify() {
    const popupWindow = window.open('https://google.com', 'Test', 'width=500,height=600,left=50%,top=50%');

    // this.unlistener = this.renderer2.listen(popupWindow, 'beforeunload', e => console.log(e));
    popupWindow.addEventListener('beforeunload', () => console.log('close'));

    // this.router.navigate(['/callback'], { queryParams: { ref: 'messenger' } });
  }

  ngOnDestroy() {
    this.unlistener();
  }

}
