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
      }

    } catch (error) {
      console.error(error);
    }

  }

  /**
   * Download ticket
   * - Get file URLs from Google Cloud Storage by unique data ID
   * - Retrieve images by URL
   * - Convert to blob
   * - Download blob
   */
  async getTickets() {

    const uuid = localStorage.getItem('dataID');
    if (uuid === null) {
      throw Error('No local data ID found');
    }

    console.log(uuid);

    const endpoint = `${this.rootEndpoint}/tickets`;
    try {
      const res = await this.http.get<{success: boolean, urls: { vertical: string, horizontal: string}}>(endpoint, {
        params: {
          id: uuid
        }
      }).toPromise();
      console.log(res);
      const blobPromises = [];
      const verticalRes = this.http.get(res.urls.vertical, {
        responseType: 'arraybuffer',
        headers: new HttpHeaders({
          'Content-Type': 'image/jpeg'
        }),
      }).toPromise();
      const horizontalRes = this.http.get(res.urls.horizontal, {
        responseType: 'arraybuffer',
        headers: new HttpHeaders({
          'Content-Type': 'image/jpeg'
        }),
      }).toPromise();

      blobPromises.push(verticalRes);
      blobPromises.push(horizontalRes);

      const [ verticalBlob, horizontalBlob ] = await Promise.all(blobPromises);
      this.downloadFile(horizontalBlob, 'DROELOE Railways 2020 16x9.jpg');
      this.downloadFile(verticalBlob, 'DROELOE Railways 2020 9x16.jpg');

    } catch (error) {
      console.error(error);
    }

  }

  private downloadFile(data: string, filename: string) {
    const blob = new Blob([data], { type: 'image/jpeg' });
    this.filesaver.save(blob, `${filename}.jpg`);
  }

}
