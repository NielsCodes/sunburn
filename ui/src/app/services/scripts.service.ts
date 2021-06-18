import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

declare var document: HTMLDocument;

@Injectable({
  providedIn: 'root'
})
export class ScriptsService {

  // Track state of Music Kit
  mkHasLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  pixelLoaded = false;

  constructor() { }

  // Load Music Kit script
  loadMusicKit(): BehaviorSubject<boolean> {
    const script = document.createElement('script');
    script.setAttribute('id', 'music-kit-script');
    script.type = 'text/javascript';
    script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
    document.getElementsByTagName('head')[0].appendChild(script);

    document.addEventListener('musickitloaded', () => {
      this.mkHasLoaded.next(true);
    });

    return this.mkHasLoaded;
  }

}
