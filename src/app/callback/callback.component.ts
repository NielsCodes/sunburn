import { CookieService } from './../services/cookie.service';
import { ApiService } from './../services/api.service';
import { Config, PresaveResponse } from './../../models/config.model';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Renderer2, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirestore } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
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
import { AngularFirePerformance } from '@angular/fire/performance';

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
export class CallbackComponent implements OnInit, OnDestroy, AfterViewInit {

  private pageURL = 'https://presave.droeloe.com';
  videoURL: string;
  videoLoaded = false;
  presaveSuccessful = false;
  loadingState = 'loading';
  shareState = 'inactive';
  referrer: string;
  isVertical = false;

  nav: any = window.navigator;

  canShare = false;

  private unlistener: () => void;
  private shareUnlistener: () => void;

  @ViewChild('videoPlayer') playerElement: ElementRef;
  @HostListener('window:resize', ['$event'])
  onResize(event?) {

    const height: number = window.innerHeight;
    const width: number = window.innerWidth;

    if (height > width) {
      this.isVertical = true;
    } else {
      this.isVertical = false;
    }

  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fns: AngularFireFunctions,
    private afs: AngularFirestore,
    private http: HttpClient,
    private renderer2: Renderer2,
    private clipboard: Clipboard,
    private api: ApiService,
    private cookie: CookieService,
    private analytics: AngularFireAnalytics,
  ) {

    // Redirect to home when navigation does not come from Messenger save or Spotify login
    this.route.queryParamMap.subscribe(params => {

      // Route back to homepage if error parameter is present. This means a Spotify login attempt was cancelled
      if (params.has('error')) {
        this.router.navigate(['']);
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
      } else if (ref === 'apple') {
        this.referrer = 'apple';

        this.api.hasSaved.subscribe( (appleState: boolean) => {
          this.presaveSuccessful = appleState;
          this.updateLoadingState();
          if (this.cookie.trackingActive) {
            fbq('trackCustom', 'presave', { platform: 'apple' });
            this.analytics.logEvent('presave', { platform: 'apple' });
          }
        });

      } else if (code !== null && URLState === 'bbpresave') {

        this.referrer = 'spotify';


        this.http.post('https://presave.bitbird.dev/login', { auth_code: code }).toPromise()

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
        this.router.navigate(['']);
      }

    });

    this.afs.collection('config').doc<Config>('video').valueChanges().pipe(take(1)).toPromise()
      .then(doc => {

        if (this.isVertical) {
          this.videoURL = doc.mobileSource;
        } else {
          this.videoURL = doc.source;
        }

        this.updateLoadingState();
        this.playerElement.nativeElement.load();
      })
      .catch(err => console.error(err));

    // Check if platform supports Web share API
    if (this.nav.share) {
      this.canShare = true;
    }

    this.onResize();

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

  // Listen to load state of video playaer after load
  ngAfterViewInit(): void {

    this.unlistener = this.renderer2.listen(this.playerElement.nativeElement, 'loadeddata', e => {
      this.videoLoaded = true;
      this.updateLoadingState();
    });

    this.shareUnlistener = this.renderer2.listen(this.playerElement.nativeElement, 'ended', e => {
      this.shareState = 'active';
    });

  }

  // Stop event listener on video before unload
  ngOnDestroy(): void {

    if (this.unlistener !== undefined && this.shareUnlistener !== undefined) {

      this.unlistener();
      this.shareUnlistener();
    }

  }

  updateLoadingState() {

    if (this.presaveSuccessful && this.videoURL !== undefined && this.videoLoaded) {
      this.loadingState = 'loaded';
      this.playerElement.nativeElement.play();
    }

  }

  // Copy link to clipboard
  onCopyToClipboard() {
    this.clipboard.copy(this.pageURL);
  }

  // Share on Facebook
  onShareToFacebook() {
    const facebookBaseURL = 'https://www.facebook.com/sharer/sharer.php?u=';
    const shareURL = `${facebookBaseURL}${this.pageURL}`;
    window.open(shareURL, 'Share to Facebook', 'left=0,top=0,height=500,width=500');
  }

  // Share on Twitter
  onShareToTwitter() {
    const twitterBaseURL = 'https://twitter.com/intent/tweet?text=';
    const shareURL = `${twitterBaseURL}I just presaved this mystery track for a special hint! @bitbird&url=${this.pageURL}`;
    window.open(shareURL, 'Share to Twitter', 'left=0,top=0,height=500,width=500');
  }

  // Open share menu on mobile devices
  onMobileShare() {

    this.nav.share({
      title: 'Mystery release!',
      text: 'Check out this mystery release for a hint!',
      url: this.pageURL
    });

  }

}
