import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.sass']
})
export class CallbackComponent implements OnInit {

  code: string;

  constructor(
    private route: ActivatedRoute,
    private fns: AngularFireFunctions
  ) {

    console.time('login');

    this.route.queryParams.subscribe(params => {
      this.code = params.code;

      const spotifyLogin = this.fns.httpsCallable('spotifyLogin');
      spotifyLogin({ code: this.code }).toPromise()
        .then(res => {
          console.log(res);
          console.timeEnd('login');
        })
        .catch(err => console.error(err));

    });
  }

  ngOnInit(): void {
  }

}
