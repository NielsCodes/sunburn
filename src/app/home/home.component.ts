import { ApiService } from './../services/api.service';
import { ScriptsService } from './../services/scripts.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';

declare var MusicKit: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent {

  appleToken: string;
  music: any;

  constructor(
    private scripts: ScriptsService,
    private api: ApiService,
    private router: Router
  ) {
    this.scripts.loadMusicKit().pipe(filter((status: boolean) => status === true)).subscribe( (status: boolean) => {

      this.api.getAppleToken()
        .then( (token) => {
          this.appleToken = token;
          MusicKit.configure({
            developerToken: this.appleToken,
            app: {
              name: 'bitbird presaves',
              build: '0.0.2'
            }
          });
          this.music = MusicKit.getInstance();
        });

    });
  }

  onSpotifyLogin() {

    const rootUrl = 'https://accounts.spotify.com/authorize';
    const clientID = 'e927df0934d7411181641fbd99a56f3c';
    const redirectURL = 'https://presave-app.web.app/callback';
    const scope = 'user-library-modify user-read-private user-follow-modify';
    const state = 'bbpresave';

    // tslint:disable-next-line: max-line-length
    const loginUrl = `${rootUrl}?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = loginUrl;

  }

  onAppleLogin() {

    if (this.scripts.mkHasLoaded.getValue() === false) {

      this.scripts.mkHasLoaded.pipe(filter( (status: boolean) => status === true)).subscribe( (status: boolean) => {
        this.loginWithApple();
      });

    } else {

      this.loginWithApple();

    }

  }

  onMessengerNotify() {
    window.location.href = 'https://m.me/bitbirdofficial?ref=MGFSRHl1UlIrZWg1T291VGIvSmJQVTNnYW9FMEdrekFJMkFuT3dJaHhOND0tLVBrM2tSV1krM1ovdVVYWFozSll2OXc9PQ==--0309a911624ec92383e0f60877cd5bebff5ef041';
  }

  private loginWithApple() {
    this.music.authorize().then((token: string) => {
      this.api.registerApplePresave(token);
      this.router.navigate(['/callback'], { queryParams: { ref: 'apple'} });
    });
  }

}
