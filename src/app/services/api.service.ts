import { environment } from './../../environments/environment';
import { AppleTokenResult } from './../../models/config.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { FileSaverService } from 'ngx-filesaver';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  hasSaved: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private rootEndpoint = environment.endpoint;

  constructor(
    private http: HttpClient,
    private filesaver: FileSaverService
  ) { }

  /** Get Apple Developer token from server */
  async getAppleToken() {

    const endpoint = `${this.rootEndpoint}/devtoken`;
    const res = await this.http.get<AppleTokenResult>(endpoint).toPromise();

    if (res.success) {
      return res.token;
    } else {
      return null;
    }

  }

  /**
   * Register Apple presave
   * @param token Apple Music User token
   */
  async registerApplePresave(token: string) {

    const endpoint = `${this.rootEndpoint}/apple`;
    try {
      const res = await this.http.post<{success: boolean, message: string}>(endpoint, { token }).toPromise();
      if (res.success) {
        this.hasSaved.next(true);
      } else {
        throw new Error('Failed to register Apple Music presave');
      }
    } catch (error) {
      console.error(error);
    }

  }

  /** Create unique ID to retrieve rendered tickets from server */
  createDataID(): string {
    const uuid = uuidv4();
    localStorage.setItem('dataID', uuid);
    return uuid;
  }

  /**
   * Register ticket data on server and generate tickets
   * @param name User defined name
   * @param origin User defined origin location
   * @param destination User defined destination location
   * @param email User defined email address
   * @param id Generated unique ID
   */
  async registerData(name: string, origin: string, destination: string, email: string, id: string) {

    const endpoint = `${this.rootEndpoint}/register`;

    try {
      const res = await this.http.post<{success: boolean, message: string}>(endpoint, {
        name,
        origin,
        destination,
        email,
        id
      }).toPromise();

      if (res.success) {
        console.log(res);
      }

    } catch (error) {
      console.error(error);
    }

  }

  async getTickets() {

    const uuid = localStorage.getItem('dataID');
    if (uuid === null) {
      throw Error('No local data ID found');
    }

    const endpoint = `${this.rootEndpoint}/tickets`;
    try {
      const res = await this.http.get<{success: boolean, urls: { vertical: string, horizontal: string}}>(endpoint, {
        params: {
          id: uuid
        }
      }).toPromise();

      console.log(res);

      const urls = res.urls;
      const ticketRes = await this.http.get(urls.vertical, {
        responseType: 'arraybuffer',
        headers: new HttpHeaders({
          'Content-Type': 'image/jpeg'
        }),
      }).toPromise();
      console.log(ticketRes);

      const blob = new Blob([ticketRes], { type: 'image/jpeg' });
      this.filesaver.save(blob, 'test.jpg');



    } catch (error) {
      console.error(error);
    }

  }

}
