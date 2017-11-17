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

@Injectable()
export class CloudMessagingService {
  messaging = firebase.messaging();
  currentMessage = new BehaviorSubject(null);

  constructor(
    private db: AngularFireDatabase,
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

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

  receiveMessage() {
    this.messaging.onMessage(payload => {
      console.log('Message received. ', payload);
      this.currentMessage.next(payload);
    });
  }

  private updateToken(token) {
    this.afAuth.authState.take(1).subscribe(user => {
      if (!user) {
        console.log('returning');
        return;
      }

      const data = { [user.uid]: token };
      this.db.object('fcmTokens/').update(data);
    });
  }
}
