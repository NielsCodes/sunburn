import { CookieService } from './../services/cookie.service';
import { environment } from './../../environments/environment';
import { ApiService } from './../services/api.service';
import { ScriptsService } from './../services/scripts.service';
import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

declare var MusicKit: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass'],
  animations: [

    trigger('policyAnimation', [

      transition(':enter', [
        style({ opacity: 0 }),
        animate('.2s ease', style({ opacity: 1 }))
      ]),

      transition(':leave', [
        style({ opacity: 1 }),
        animate('.2s ease', style({ opacity: 0 }))
      ]),

    ])

  ]
})
export class HomeComponent {

  appleToken: string;
  music: any;
  isMobile: boolean;
  windowHeight: number;
  windowWidth: number;
  isVertical: boolean;

  formData = {
    origin: '',
    destination: '',
    name: '',
    email: ''
  };

  stage = '';
  showPolicy = false;

  private dataId: string;

  @HostListener('window:resize', ['$event'])
  onResize(event?){
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;

    if (this.windowWidth < 600) {
      this.isVertical = true;
    } else {
      if ((window.innerHeight > window.innerWidth)) {
        this.isVertical = true;
      } else {
        this.isVertical = false;
      }
    }

  }

  constructor(
    private scripts: ScriptsService,
    private api: ApiService,
    private router: Router,
    private cookieService: CookieService
  ) {
    this.onResize();
    this.scripts.loadMusicKit().pipe(filter((status: boolean) => status === true)).subscribe(async (status: boolean) => {
      this.appleToken = await this.api.getAppleToken();
      MusicKit.configure({
        developerToken: this.appleToken,
        app: {
          name: 'bitbird presaves',
          build: '2.0.0'
        }
      });
      this.music = MusicKit.getInstance();
    });

    // Only show the first UI step once the background image has loaded
    // Otherwise the onscreen UI elements would show before the background
    const img = new Image();
    img.src = '../../assets/background.jpg';
    img.onload = () => {
      this.stage = 'start';
    };
  };


  /**
   * Submit the form to generate customized tickets
   *
   * Progresses to next step of the UI
   *
   * @param form the NgForm
   */
  async onSubmit(form: NgForm) {
    const d = form.value;
    this.dataId =  this.api.createDataId();
    this.stage = 'save';
    await this.api.registerData(d.name, d.origin, d.destination, d.email, this.dataId);
  }

  /** Redirect user to the Spotify Auth screen */
  onSpotifyLogin() {
    const rootUrl = 'https://accounts.spotify.com/authorize';
    const clientId = '26f68dd9f50f4defbb31908146defed2';
    const redirectURL = environment.redirect;
    const scope = 'user-library-modify';
    const state = `spotify_${this.dataId}`;
    const loginUrl = `${rootUrl}?client_id=${clientId}&response_type=code&redirect_uri=${redirectURL}&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = loginUrl;
  }

  /**
   * Apple Login handler. Either sends user to callback page or calls loginWithApple to launch login flow.
   *
   * - If previously saved with Apple, immediately send to callback page
   *
   * - If MusicKit JS has not yet loaded, wait for it to load
   */
  onAppleLogin() {
    const hasSaved = localStorage.getItem('appleSave');

    if (hasSaved === 'true') {
      this.router.navigate(['/callback'], { queryParams: { ref: 'apple', status: '2', dataId: this.dataId } });
    } else {
      // If MusicScript has not loaded yet, load it before calling the login function
      if (this.scripts.mkHasLoaded.getValue() === false) {
        this.scripts.mkHasLoaded.pipe(filter((status: boolean) => status === true)).subscribe((status: boolean) => {
          this.loginWithApple();
        });
      } else {
        this.loginWithApple();
      }
    }
  }

  /** Launch MusicKit JS login flow and redirects to callback page */
  private loginWithApple() {
    this.music.authorize().then((token: string) => {
      this.api.registerApplePresave(token);
      this.router.navigate(['/callback'], { queryParams: { ref: 'apple', dataId: this.dataId } });
    });
  }

  /** Progress to next step from 'start' screen
   *
   * - This also consents to third-party cookies
   */
  onStart() {
    this.stage = 'data';
    this.cookieService.setConsent();
  }

  /** Show the privacy policy */
  onShowPolicy() {
    this.showPolicy = true;
  }

  /** Hide the privacy policy */
  onHidePolicy() {
    this.showPolicy = false;
  }

}
