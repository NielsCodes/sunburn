import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent {

  constructor(
  ) { }

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

  onMessengerNotify() {
    window.location.href = 'https://m.me/bitbirdofficial?ref=MGFSRHl1UlIrZWg1T291VGIvSmJQVTNnYW9FMEdrekFJMkFuT3dJaHhOND0tLVBrM2tSV1krM1ovdVVYWFozSll2OXc9PQ==--0309a911624ec92383e0f60877cd5bebff5ef041';
  }

}
