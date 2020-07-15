import { ApiService } from './../services/api.service';
import { ScriptsService } from './../services/scripts.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

declare var MusicKit: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {

  appleToken: string;

  constructor(
    private scripts: ScriptsService,
    private api: ApiService,
    private router: Router
  ) {
    this.scripts.loadMusicKit();
    this.api.getAppleToken()
      .then( (token) => {
        this.appleToken = token;
      });
  }

  ngOnInit(): void {
  }

  onSpotifyLogin() {

    const rootUrl = 'https://accounts.spotify.com/authorize';
    const clientID = 'e927df0934d7411181641fbd99a56f3c';
    const redirectURL = 'https://presave-app.web.app/callback';
    const scope = 'user-library-modify user-read-private user-follow-modify';
    const state = 'bbpresave';

    // tslint:disable-next-line: max-line-length
    const loginUrl = `${rootUrl}?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&scope=${encodeURIComponent(scope)}&state=${state}&show_dialog=true`;
    window.location.href = loginUrl;

  }

  async onAppleLogin() {

    if (!this.scripts.mkHasLoaded) {
      await this.scripts.loadMusicKit();
    }

    if (this.appleToken === null) {
      this.appleToken = await this.api.getAppleToken();
    }

    MusicKit.configure({
      developerToken: this.appleToken,
      app: {
        name: 'bitbird presaves',
        build: '0.0.1'
      }
    });

    const music = MusicKit.getInstance();

    music.unauthorize();

    music.authorize().then( async (token: string) => {
      const hasSaved = await this.api.registerApplePresave(token);
      if (hasSaved) {
        music.unauthorize();
        this.router.navigate(['/callback'], { queryParams: { ref: 'apple'} });
      }
    });

  }

  onMessengerNotify() {
    window.location.href = 'https://m.me/bitbirdofficial?ref=MGFSRHl1UlIrZWg1T291VGIvSmJQVTNnYW9FMEdrekFJMkFuT3dJaHhOND0tLVBrM2tSV1krM1ovdVVYWFozSll2OXc9PQ==--0309a911624ec92383e0f60877cd5bebff5ef041';
  }

}
