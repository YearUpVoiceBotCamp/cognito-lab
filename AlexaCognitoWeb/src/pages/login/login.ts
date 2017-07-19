import { Component } from '@angular/core';

import { NavController, LoadingController } from 'ionic-angular';

import { TabsPage } from '../tabs/tabs';
import { SignupPage } from '../signup/signup';
import { ConfirmPage } from '../confirm/confirm';

import { User } from '../../providers/providers';
import { OAuthGrant } from '../../providers/oauth-grant';

export class LoginDetails {
  username: string;
  password: string;
}

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  
  public loginDetails: LoginDetails;

  error: any;

  constructor(public navCtrl: NavController,
              public user: User,
              public loadingCtrl: LoadingController,
              public oauthGrant: OAuthGrant) {
    this.loginDetails = new LoginDetails(); 
  }

  login() {
    let loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    loading.present();

    this.error = null;

    let details = this.loginDetails;
    console.log('login..');
    this.user.login(details.username, details.password).then((result) => {
      console.log('result:', result);
      // Redirect if this was an OAuth Grant request
      this.oauthGrant.redirectGrantRequest().catch(function() {
        loading.dismiss();
        this.navCtrl.setRoot(TabsPage);
      });
    }).catch((err) => { 
      if (err.message === "User is not confirmed.") {
        loading.dismiss();
        this.navCtrl.push(ConfirmPage, { 'username': details.username });
      } else {
        console.log('errrror', err);
        this.error = err;
        loading.dismiss();
      }
    });
  }

  signup() {
    this.navCtrl.push(SignupPage);
  }

}
