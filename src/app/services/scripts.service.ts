import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { DocumentReference } from '@google-cloud/firestore';

declare var document: HTMLDocument;

@Injectable({
  providedIn: 'root'
})
export class ScriptsService {

  // Track state of Music Kit
  mkHasLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);

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

  // Load FB Pixel upon cookie consent
  loadPixel(): void {

    const pixelCode = `
    function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '468887303558229');
    fbq('track', 'PageView');`;

    const script = document.createElement('script');
    script.setAttribute('id', 'pixel-script');
    script.type = 'text/javascript';
    script.innerHTML = pixelCode;
    document.getElementsByTagName('head')[0].appendChild(script);

  }

  // Remove Pixel after cookie consent revoke
  removePixel(): void {
    document.getElementById('pixel-script').remove();
  }

}
