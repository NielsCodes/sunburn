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

    ])
  ]
})
export class CallbackComponent implements OnInit, OnDestroy, AfterViewInit {

  code: string;
  videoURL: string;
  videoLoaded = false;
  presaveSuccessful = false;
  loadingState = 'loading';

  private unlistener: () => void;

  @ViewChild('videoPlayer') playerElement: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fns: AngularFireFunctions,
    private afs: AngularFirestore,
    private http: HttpClient,
    private renderer2: Renderer2
  ) {

    this.route.queryParamMap.subscribe(params => {
      if (!params.has('code')) {
        // TODO: uncomment to redirect upon error
        this.router.navigate(['/']);
      }
    });

    this.afs.collection('config').doc<Config>('video').valueChanges().pipe(take(1)).toPromise()
      .then(doc => {
        this.videoURL = doc.source;
        this.updateLoadingState();
        this.playerElement.nativeElement.load();
      })
      .catch(err => console.error(err));

    // ! REMOVE before flight
    console.time('login');

    this.route.queryParams.subscribe(params => {
      this.code = params.code;

      this.http.post('https://presave.bitbird.dev/login', { auth_code: this.code }).toPromise()

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

    });
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {

    this.unlistener = this.renderer2.listen(this.playerElement.nativeElement, 'loadeddata', e => {
      this.videoLoaded = true;
      this.updateLoadingState();
    });

  }

  ngOnDestroy(): void {
    this.unlistener();
  }

  updateLoadingState() {

    if (this.presaveSuccessful && this.videoURL !== undefined && this.videoLoaded) {
      this.loadingState = 'loaded';
    }

  }

}
