import { Config } from './../../models/config.model';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirestore } from '@angular/fire/firestore';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.sass']
})
export class CallbackComponent implements OnInit {

  code: string;
  videoURL: string;
  presaveSuccessful = false;

  @ViewChild('videoPlayer') playerElement: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fns: AngularFireFunctions,
    private afs: AngularFirestore
  ) {

    this.route.queryParamMap.subscribe(params => {
      if (!params.has('code')) {
        // this.router.navigate(['/']);
      }
    })


    this.afs.collection('config').doc<Config>('video').valueChanges().pipe(take(1)).toPromise()
      .then(doc => {
        this.videoURL = doc.source;
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
            console.log('DONE');
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

}
