import { Injectable } from '@angular/core';

declare var document: HTMLDocument;

@Injectable({
  providedIn: 'root'
})
export class ScriptsService {

  // Track state of Music Kit
  mkHasLoaded = false;

  constructor() { }

  // Load Music Kit script
  async loadMusicKit() {

    return new Promise( (resolve, reject) => {

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';

      document.getElementsByTagName('head')[0].appendChild(script);

      document.addEventListener('musickitloaded', () => {
        this.mkHasLoaded = true;
        resolve();
      });

    });

  }

  // TODO: Load FB Pixel upon cookie consent

}
