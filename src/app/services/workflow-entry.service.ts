import { Workflow } from './../editor/models/workflow';
import { Observable } from 'rxjs/Observable';
import { WorkflowEntry } from './../view-models/workflowEntry';
import { Injectable } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class WorkflowEntryService {

  dataChange: BehaviorSubject<WorkflowEntry[]> = new BehaviorSubject<WorkflowEntry[]>([]);
  entries: FirebaseListObservable<WorkflowEntry[]>;


  get data(): WorkflowEntry[] { return this.dataChange.value; }

  constructor(private db: AngularFireDatabase) {
    this.entries = this.db.list('entries');
    this.entries.subscribe(workflowEntries => {
      this.dataChange.next(workflowEntries);
    });
  }

  deleteEntry(key: string) {
    this.entries.remove(key);
  }

  saveEntry(entry: WorkflowEntry) {
    this.entries.push(entry);
  }

  initEntry() {
    return { name: '', description: '', descriptor: '', graph: '' };
  }

  getEntry(id: string) {
    return this.db.object(`/entries/${id}`);
  }

  updateEntry(entry: WorkflowEntry) {
    this.entries.update(entry.$key, entry);
  }
}
