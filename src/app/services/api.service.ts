import { environment } from './../../environments/environment';
import { AppleTokenResult } from './../../models/config.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

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

  /** Get reward token from server */
  async getRewardToken(): Promise<string> {

    const endpoint = `${this.rootEndpoint}/reward`;
    try {
      const res = await this.http.get<{success: boolean, reward: string}>(endpoint).toPromise();
      if (res.success) {
        return res.reward;
      } else {
        throw new Error('Failed to retrieve reward');
      }
    } catch (error) {
      console.error(error);
    }

  }

}
