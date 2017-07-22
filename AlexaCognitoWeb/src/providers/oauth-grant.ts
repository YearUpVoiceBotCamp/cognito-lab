import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';

import { User } from './user';

declare var AWS: any;

/**
 * This is a simple naive implementation of OAuth implicit grants which
 * provides a Base64 encoded version of the Cognito Identity ID back as
 * the perpetual access token. For production software, the OAuth
 * authorization code process is recommended.
 */

@Injectable()
export class OAuthGrant {

  static ERR_NOT_APPLICABLE = 'Current request is not a valid OAuth Grant Request';
  static ERR_NOT_AVAILABLE = 'Current OAuth Grant Request cannot be satisfied.';

  constructor(public plt: Platform, public user: User) {
  }

  oauthRequestReturnUrl() {
    let responseType = this.plt.getQueryParam('response_type');
    let redirectUri = this.plt.getQueryParam('redirect_uri');
    let state = this.plt.getQueryParam('state');

    if (redirectUri != undefined && responseType == 'token') {
      var redirectTarget = '';
      try {
        redirectTarget = decodeURIComponent(redirectUri);
      } catch (err) {
        return false;
      }
      redirectTarget += (redirectTarget.indexOf('#') < 0) ? '#' : '';
      redirectTarget += 'state=' + (state ? state : '')
        + '&token_type=Bearer';
      return redirectTarget;
    }

    return false;
  }

  redirectGrantRequest() {
    return new Promise((resolve, reject) => {
      let baseUrl = this.oauthRequestReturnUrl();
      if (!baseUrl) {
        reject({'message': OAuthGrant.ERR_NOT_APPLICABLE});
        return;
      }
      Promise.all([
        this.user.isAuthenticated()
      ]).then(function (values) {
        let targetUrl = baseUrl + '&access_token=' + AWS.util.base64.encode(AWS.config.credentials.params.IdentityId);
        console.log('redirecting to ', targetUrl);
        location.replace(targetUrl);
        resolve();
      });
    });
  }

}
