import { AppleTokenResult } from './../../models/config.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient
  ) { }

  async getAppleToken() {

    const endpoint = 'https://presave.bitbird.dev/devtoken';

    const res = await this.http.get<AppleTokenResult>(endpoint).toPromise();

    if (res.success) {
      return res.token;
    } else {
      return null;
    }

  }

  async registerApplePresave(token: string) {

    let success = false;

    const endpoint = 'https://presave.bitbird.dev/apple';
    try {
      const res = await this.http.post<{success: boolean, message: string}>(endpoint, { token }).toPromise();
      if (res.success) {
        success = true;
        return success;
      }
    } catch (error) {
      console.error(error);
      return success;
    }

  }

}
