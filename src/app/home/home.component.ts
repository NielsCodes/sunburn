import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  onSpotifyLogin() {

    const rootUrl = 'https://accounts.spotify.com/authorize';
    const clientID = 'e927df0934d7411181641fbd99a56f3c';
    const redirectURL = 'http://localhost:4200/callback';
    const scope = 'user-library-modify';
    const state = 'foobar';

    const loginUrl = `${rootUrl}?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&scope=${scope}&state=${state}&show_dialog=true`;

    window.location.href = loginUrl;

  }

}


// http://localhost:4200/callback?code=AQDq98jvGzq_PiqJf0vGMfQopdGyf-k52sTRarRaysNhZMv3RDlRuY7jDCOnLaL-K91ZiSn1k76MDSvOccb64pBY60AtDljZ9CKKlbBfOw3LzF0KXzeFLFXnVhxYoY0zazeHxpRPV8dgLAqKgQN5Lo7J4mIIHfNZisAAhHgfgAg8UIa01xz2gSFLrtOG8lDExdGeVeIlsA&state=foobar
