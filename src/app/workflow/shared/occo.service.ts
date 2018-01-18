import { AuthService } from 'app/core/auth.service';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import {
  AngularFirestore,
  AngularFirestoreDocument
} from 'angularfire2/firestore';

/**
 * A service that holds the logic for communication with the Occopuses Rest interface.
 */
@Injectable()
export class OccoService {
  /**
   * The actual endpoint we want to reach with the http service.
   */
  url: string;

  /**The database reference for the occopus endpoint url*/
  urlDoc: AngularFirestoreDocument<string>;

  /**
   * Stores data of the error logs.
   */
  errorLog: { message: string; date: number }[];

  /**
   * Stores data of the successfull logs.
   */
  successLog: { message: string; date: number }[];

  /**
   * We inject Angular Http Service and set a default end point.
   * @param http Angular's new HttpClient
   */
  constructor(
    private http: HttpClient,
    private afs: AngularFirestore,
    private authSVC: AuthService
  ) {
    // this.url = 'http://192.168.248.129:5000'; // provide a URL that has an occopus running on it.
    this.urlDoc = this.afs.doc<string>('config');
    this.urlDoc.valueChanges().subscribe((newUrl: string) => {
      this.url = newUrl;
    });
    this.errorLog = [];
    this.successLog = [];
  }

  updateOccopusURL(url: string) {
    this.urlDoc.update(url);
  }

  /**
   * It sets the headers to be applicable to a YAML formatted string.
   * Then it sends the yaml data via http and subscribes it, waiting for response from the server.
   * @param yamldescriptor
   */
  buildWorkflow(yamldescriptor: string) {
    const endpoint = this.url + '/infrastructures/';
    const header = new HttpHeaders();
    console.log(yamldescriptor);
    header.append('Content-Type', 'application/x-yaml');

    // return this.http
    //   .post(endpoint, yamldescriptor, { headers: header })
    //   .map((res: { infraid: string }) => {
    //     console.log(res);
    //     console.log(res.infraid);
    //     this.successLog.push({
    //       message: JSON.stringify(res),
    //       date: Date.now()
    //     });
    //   }).toPromise()
    //   .catch(error => {
    //     console.log('error occured', error);
    //     this.errorLog.push({
    //       message: JSON.stringify(error),
    //       date: Date.now()
    //     });
    //     return error;
    //   });

    return this.http.post(endpoint, yamldescriptor, { headers: header }).do(
      (res: { infraid: string }) => {
        console.log(res);
        console.log(res.infraid);
        this.successLog.push({
          message: JSON.stringify(res),
          date: Date.now()
        });
        return res.infraid;
      },
      error => {
        console.log('error occured', error);
        this.errorLog.push({
          message: JSON.stringify(error),
          date: Date.now()
        });
        return error;
      },
      () => {}
    );
  }

  /**
   * It sets the header to be applicable to a simple text message.
   * Then it sends the actual infrastructures ID back to the server with a destroy commands based URL,
   * and it subscribes to any response back from the server.
   */
  destroyWorkflow(infraid: string) {
    const endpoint = this.url + '/infrastructures/' + infraid;

    return this.http.delete(endpoint, { responseType: 'text' }).subscribe(
      res => {
        console.log(res);
        this.successLog.push({
          message: JSON.stringify(res),
          date: Date.now()
        });

        return this;
      },
      error => {
        console.log('error occured', error);
        this.errorLog.push({
          message: JSON.stringify(error),
          date: Date.now()
        });
      },
      () => {}
    );
  }

  /**
   * Gets detailed JSON information about the given infrastructure.
   * @param infraid
   * @param entryId
   */
  getWorkflowInformation(infraid: string) {
    const endpoint = this.url + '/infrastructures/' + infraid;

    this.http.get(endpoint, { responseType: 'text' }).subscribe(
      res => {
        console.log(res);
      },
      error => {
        console.log('error occured', error);
      }
    );
  }
}
