import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

import { UserApi } from '../user-api';

/**
 * Holds the logic for the sign in page view.
 */
@Component({
  selector: 'fw-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  // formError: string;
  // submitting = false;

  /**
   * Initializes the needed services.
   * @param userApi Service provided for user sign in functionalities.
   */
  constructor(public userApi: UserApi) {}

  // onSubmit(signInForm: NgForm) {
  //   if (signInForm.valid) {
  //     console.log('submitting...', signInForm);
  //     this.submitting = true;
  //     this.formError = null;

  //     // this.userApi.signIn(signInForm.value.username, signInForm.value.password, signInForm.value.rememberMe)
  //     //   .subscribe((data) => {
  //     //       console.log('got valid: ', data);
  //     //       this.router.navigate(['/authenticated']);
  //     //     },
  //     //     (err)=> {
  //     //       this.submitting = false;
  //     //       console.log('got error: ', err);
  //     //       this.formError = err;
  //     //     }
  //     //   );
  //   }
  // }
}
