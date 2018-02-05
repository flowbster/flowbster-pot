import { User } from 'app/core/models/user';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection
} from 'angularfire2/firestore';
import * as firebase from 'firebase';

import 'rxjs/add/operator/take';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AngularFireDatabase } from 'angularfire2/database';

/**
 * Handles the notification of Occopusses inner events for the user.
 */
@Injectable()
export class CloudMessagingService {
  /**Instance to hold the firebase messaging utilities */
  messaging = firebase.messaging();

  /**
   * The actual registration token that is used
   */
  currentToken = new BehaviorSubject(null);

  /**A subscribable stream for the current message */
  currentMessage = new BehaviorSubject(null);

  /**
   * Initializes the needed AngularFire services.
   */
  constructor(
    private db: AngularFireDatabase,
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  /**
   * Proposes a permission to the user, about accepting to receive push notifications.
   * If the user accepts it, we get a messaging Token from firebase and save it to our FireStore database.
   */
  getPermission(): void {
    this.messaging
      .requestPermission()
      .then(() => {
        console.log('Notification permission granted');
        return this.messaging.getToken();
      })
      .then(token => {
        console.log(token);
        this.updateToken(token);
      })
      .catch(err => {
        console.log('Unable to get permission to notifiy', err);
      });
  }

  /**
   * Whenever we receive a message it feeds the datastream.
   */
  receiveMessage() {
    this.messaging.onMessage((payload: { data: any }) => {
      console.log('Message received. ', payload.data);
      // this.currentMessage.next(payload);
    });
  }

  /**
   * Updated the messaging token of the actually logged in user by saving the token under its workspace.
   * @param token The new messaging token.
   */
  private updateToken(token) {
    this.afAuth.authState.take(1).subscribe(user => {
      if (!user) {
        console.log('returning');
        return;
      }
      const data = { [user.uid]: token };
      this.db.object('fcmTokens/').update(data);
      this.currentToken.next(token);
    });
  }
}
