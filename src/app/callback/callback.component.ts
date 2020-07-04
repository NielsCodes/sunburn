import { Config } from './../../models/config.model';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

      transition('loading => loaded', animate('1000ms 1000ms ease-in'))

    ])
  ]
})
export class CallbackComponent implements OnInit {

  code: string;
  videoURL: string;
  presaveSuccessful = false;
  loadingState = 'loading';

  @ViewChild('videoPlayer') playerElement: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fns: AngularFireFunctions,
    private afs: AngularFirestore
  ) {

    this.route.queryParamMap.subscribe(params => {
      if (!params.has('code')) {
        // TODO: uncomment to redirect upon error
        // this.router.navigate(['/']);
      }
    });


    this.afs.collection('config').doc<Config>('video').valueChanges().pipe(take(1)).toPromise()
      .then(doc => {
        this.videoURL = doc.source;
        this.updateLoadingState();
      })
      .catch(err => console.error(err));

    // ! REMOVE before flight
    console.time('login');

    this.route.queryParams.subscribe(params => {
      this.code = params.code;

      const spotifyLogin = this.fns.httpsCallable('spotifyLogin');
      spotifyLogin({ code: this.code }).toPromise()
        .then(res => {

          if (res.success) {
            this.presaveSuccessful = true;
            this.updateLoadingState();
          }

          // ! REMOVE before flight
          console.log(res);
          console.timeEnd('login');
        })
        .catch(err => console.error(err));

    });
  }

  ngOnInit(): void {

  }

  updateLoadingState() {

    if (this.presaveSuccessful && this.videoURL !== undefined) {
      this.loadingState = 'loaded';
    }

  }

}
