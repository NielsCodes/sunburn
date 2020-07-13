import { Config, PresaveResponse } from './../../models/config.model';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Renderer2, AfterViewInit } from '@angular/core';
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

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.sass'],
  animations: [
    trigger('loadingState', [

      state('loading', style({
        opacity: 1
      })),

      state('loaded', style({
        opacity: 0
      })),

      transition('loading => loaded', animate('500ms ease-in'))

    ]),

    trigger('shareState', [
      state('inactive', style({
        opacity: 0
      })),

      state('active', style({
        opacity: 1
      })),

      transition('inactive => active', animate('500ms ease-in'))
    ])
  ]
})
export class CallbackComponent implements OnDestroy, AfterViewInit {

  private pageURL = 'https://presave-app.web.app';
  videoURL: string;
  videoLoaded = false;
  presaveSuccessful = false;
  loadingState = 'loading';
  shareState = 'inactive';
  referrer: string;

  canShare = false;

  private unlistener: () => void;
  private shareUnlistener: () => void;

  @ViewChild('videoPlayer') playerElement: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fns: AngularFireFunctions,
    private afs: AngularFirestore,
    private http: HttpClient,
    private renderer2: Renderer2,
    private clipboard: Clipboard
  ) {

    // Redirect to home when navigation does not come from Messenger save or Spotify login
    this.route.queryParamMap.subscribe(params => {
      if (!(params.has('code') && params.has('state')) && !params.has('ref')) {
        // TODO: uncomment to redirect upon error
        this.router.navigate(['/']);
      }

      const ref = params.get('ref');
      const code = params.get('code');
      const URLState = params.get('state');

      if (ref === 'messenger') {
        this.referrer = 'messenger';
        this.presaveSuccessful = true;
      } else if (code !== null && URLState === 'bbpresave') {

        this.referrer = 'spotify';

        // ! REMOVE before flight
        console.time('login');

        this.http.post('https://presave.bitbird.dev/login', { auth_code: code }).toPromise()

          .then((res: PresaveResponse) => {

            // ! REMOVE before flight
            console.timeEnd('login');

            if (res.success) {
              this.presaveSuccessful = true;
              this.updateLoadingState();
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
        this.videoURL = doc.source;
        this.updateLoadingState();
        this.playerElement.nativeElement.load();
      })
      .catch(err => console.error(err));

    // Check if platform supports Web share API
    if (navigator.share) {
      this.canShare = true;
    }

  }

  // Listen to load state of video playaer after load
  ngAfterViewInit(): void {

    this.unlistener = this.renderer2.listen(this.playerElement.nativeElement, 'loadeddata', e => {
      this.videoLoaded = true;
      this.updateLoadingState();
    });

    this.shareUnlistener = this.renderer2.listen(this.playerElement.nativeElement, 'ended', e => {
      this.shareState = 'active';
    })

  }

  // Stop event listener on video before unload
  ngOnDestroy(): void {
    this.unlistener();
    this.shareUnlistener();
  }

  updateLoadingState() {

    if (this.presaveSuccessful && this.videoURL !== undefined && this.videoLoaded) {
      this.loadingState = 'loaded';
    }

  }

  // Copy link to clipboard
  onCopyToClipboard() {

    // TODO: Change link to final destination
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

    navigator.share({
      title: 'Mystery release!',
      text: 'Check out this mystery release for a hint!',
      url: this.pageURL
    });

  }

}
