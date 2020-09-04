import { environment } from './../../environments/environment';
import { AppleTokenResult } from './../../models/config.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  hasSaved: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private rootEndpoint = environment.endpoint;

  constructor(
    private http: HttpClient
  ) { }

  async getAppleToken() {

    const endpoint = `${this.rootEndpoint}/devtoken`;

    const res = await this.http.get<AppleTokenResult>(endpoint).toPromise();

    if (res.success) {
      return res.token;
    } else {
      return null;
    }

  }

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

  createDataID() {
    const uuid = uuidv4();
    // console.log(uuid);
    localStorage.setItem('dataID', uuid);
    return uuid;
  }

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
        console.log('Tickets created successfully');
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

    const endpoint = `${this.rootEndpoint}/ticket`;
    try {
      const res = await this.http.get(endpoint, {
        params: {
          id: uuid
        }
      }).toPromise();

      console.log(res);

    } catch (error) {

    }

  }

}
