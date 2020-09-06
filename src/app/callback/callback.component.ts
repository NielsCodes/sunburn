import { environment } from './../../environments/environment';
import { CookieService } from './../services/cookie.service';
import { ApiService } from './../services/api.service';
import { PresaveResponse } from './../../models/config.model';
import { Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { detect } from 'detect-browser';

const detectBrowser = detect();

declare const fbq: any;

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.sass'],
  animations: [
    trigger('loadingState', [

      state('loading', style({
        opacity: 1,
        zIndex: 12
      })),

      state('loaded', style({
        opacity: 0,
        zIndex: -2
      })),

      transition('loading => loaded', animate('500ms ease-in'))

    ]),

    trigger('shareState', [
      state('inactive', style({
        opacity: 0,
        pointerEvents: 'none'
      })),

      state('active', style({
        opacity: 1,
        pointerEvents: 'initial'
      })),

      transition('inactive => active', animate('250ms ease-in'))
    ])
  ]
})
export class CallbackComponent implements OnInit{

  private pageURL = 'https://presave.droeloe.com';
  private presaveSuccessful = false;
  reward: string;
  loadingState = 'loading';
  shareState = 'inactive';
  referrer: string;
  windowHeight: number;
  private rootEndpoint = environment.endpoint;

  nav: any = window.navigator;

  canShare = false;

  @HostListener('window:resize', ['$event'])
  onResize(event?){
    this.windowHeight = window.innerHeight;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private afs: AngularFirestore,
    private http: HttpClient,
    private clipboard: Clipboard,
    private api: ApiService,
    private cookie: CookieService,
    private analytics: AngularFireAnalytics,
  ) {
    this.onResize();
    // Redirect to home when navigation does not come from Messenger save or Spotify login
    this.route.queryParamMap.subscribe(params => {

      // Route back to homepage if error parameter is present. This means a Spotify login attempt was cancelled
      if (params.has('error')) {
        this.router.navigate(['/']);
      }

      if (!(params.has('code') && params.has('state')) && !params.has('ref')) {
        this.router.navigate(['/']);
      }

      const ref = params.get('ref');
      const code = params.get('code');
      const URLState = params.get('state');

      if (ref === 'messenger') {
        this.referrer = 'messenger';
        this.presaveSuccessful = true;
        if (this.cookie.trackingActive) {
          fbq('trackCustom', 'presave', { platform: 'messenger' });
          this.analytics.logEvent('presave', { platform: 'messenger' });
        }
        this.updateLoadingState();
      } else if (ref === 'apple') {
        this.referrer = 'apple';

        if (params.has('status')) {
          this.presaveSuccessful = true;
        } else {

          this.api.hasSaved.subscribe( (appleState: boolean) => {
            this.presaveSuccessful = appleState;
            localStorage.setItem('appleSave', 'true');
            this.updateLoadingState();
            if (this.cookie.trackingActive) {
              fbq('trackCustom', 'presave', { platform: 'apple' });
              this.analytics.logEvent('presave', { platform: 'apple' });
            }
          });

        }


      } else if (code !== null && URLState.includes('spotify_')) {

        this.referrer = 'spotify';

        this.http.post(`${this.rootEndpoint}/spotify`, { auth_code: code }).toPromise()

          .then((res: PresaveResponse) => {

            if (res.success) {
              this.presaveSuccessful = true;
              this.updateLoadingState();

              if (this.cookie.trackingActive) {
                fbq('trackCustom', 'presave', { platform: 'spotify' });
                this.analytics.logEvent('presave', { platform: 'spotify' });
              }

            } else {
              this.router.navigate(['/']);
            }

          })
          .catch(err => {
            console.error(err);
            this.router.navigate(['/']);
          });

      } else {
        this.router.navigate(['/']);
      }

    });

    // Check if platform supports Web share API
    if (this.nav.share) {

      if (detectBrowser.os !== 'Mac OS' && detectBrowser.name !== 'safari') {
        this.canShare = true;
      }

    }

  }

  // Redirect back to home if loading state has not changed after 10 seconds
  ngOnInit(): void {
    setTimeout(() => {

      if (this.loadingState === 'loading') {
        console.error('Something went wrong...');
        this.router.navigate(['']);
      }

    }, 10000);
  }

  updateLoadingState(): void {

    if (this.presaveSuccessful) {
      this.loadingState = 'loaded';
    }

  }

  // Copy link to clipboard
  onCopyToClipboard(): void {
    this.clipboard.copy(this.pageURL);
  }

  // Share on Facebook
  onShareToFacebook(): void {
    const facebookBaseURL = 'https://www.facebook.com/sharer/sharer.php?u=';
    const shareURL = `${facebookBaseURL}${this.pageURL}`;
    window.open(shareURL, 'Share to Facebook', 'left=0,top=0,height=500,width=500');
  }

  // Share on Twitter
  onShareToTwitter(): void {
    const twitterBaseURL = 'https://twitter.com/intent/tweet?text=';
    const shareURL = `${twitterBaseURL} ⏳⏳⏳ @DROELOEMUSIC @bitbird&url=${this.pageURL}`;
    window.open(shareURL, 'Share to Twitter', 'left=0,top=0,height=500,width=500');
  }

  // Open share menu on mobile devices
  onMobileShare(): void {

    this.nav.share({
      title: '⏳',
      text: 'this is a description',
      url: this.pageURL
    });

  }

  onDownload() {
    this.api.getTickets();
  }

}
