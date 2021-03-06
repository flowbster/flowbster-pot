import { JointService } from 'app/editor/flowbster-forms/shared/joint.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatSort, MatPaginator } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/distinctUntilChanged';

import { WorkflowDataSource } from 'app/workflow/workflow-maint/workflowDataSource';
import { CloudMessagingService } from 'app/workflow/shared/cloud-messaging.service';
import { WorkflowEntryService } from 'app/workflow/shared/workflow-entry.service';
import { OccoService } from 'app/workflow/shared/occo.service';

/**
 * Component to visualize database entries and make various operations with them.
 */
@Component({
  selector: 'toil-workflow-maint',
  templateUrl: './workflow-maint.component.html',
  styleUrls: ['./workflow-maint.component.scss']
})
export class WorkflowMaintComponent implements OnInit {
  /**
   * The Occopus's message from events.
   */
  message;

  /**
   * The holder array of the graphs.
   */
  graphs;

  /**
   * The displayed Columns in the data grid.
   */
  displayedColumns = ['select', 'name', 'description', 'edit'];

  /**
   * Properly formatted Workflow information to the data grid.
   */
  dataSource: WorkflowDataSource | null;

  /**
   * Keeps information about which checkbox is getting selected.
   */
  selection = new SelectionModel<string>(true, []);

  /**
   * 3rd party paginator component for the data grid.
   */
  @ViewChild(MatPaginator) paginator: MatPaginator;

  /**
   * 3rd party sorter component for the data grid columns.
   */
  @ViewChild(MatSort) sort: MatSort;

  /**
   * Element reference for filtering functionality.
   */
  @ViewChild('filter') filter: ElementRef;

  /**
   * Injects the needed services.
   */
  constructor(
    private workflowEntrySVC: WorkflowEntryService,
    private router: Router,
    private occoSVC: OccoService,
    private jointSVC: JointService,
    private cloudMessagingSVC: CloudMessagingService
  ) {}

  /**
   * Initializes the data grids datasource with paginated and sortable database entries
   * and subscribes to the filtering elements keyup event.
   */
  ngOnInit() {
    this.dataSource = new WorkflowDataSource(
      this.workflowEntrySVC,
      this.paginator,
      this.sort
    );
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
    this.initializeCloudMessaging();
    this.initGraphs();
  }

  /**
   * The Messaging service subscribes to the messaging feed.
   */
  private initializeCloudMessaging(): void {
    this.cloudMessagingSVC.receiveMessage();
    this.message = this.cloudMessagingSVC.currentMessage;
  }

  /**
   * Initializes the visualized graph from the service.
   */
  private initGraphs(): void {
    this.graphs = this.workflowEntrySVC.graphs;
  }

  /**
   * Decides if every element of the data grid is selected
   * @returns An indicator about all of the checkboxes state.
   */
  isAllSelected(): boolean {
    if (!this.dataSource) {
      return false;
    }
    if (this.selection.isEmpty()) {
      return false;
    }

    if (this.filter.nativeElement.value) {
      return (
        this.selection.selected.length ===
        this.dataSource.renderedEntries.length
      );
    } else {
      return (
        this.selection.selected.length === this.workflowEntrySVC.data.length
      );
    }
  }

  /**
   * Checks if its actually in the database and then shows its graph on the paper.
   * @param id Unique identifier of the data entry in the database.
   */
  onEntryClick(id: string) {
    const entryy = this.workflowEntrySVC.data.find(entry => {
      return entry.$key === id;
    });

    if (entryy) {
      this.jointSVC.uploadGraph(JSON.parse(entryy.graph));
    }
  }

  /**
   * Checks every checkboxes.
   */
  masterToggle() {
    if (!this.dataSource) {
      return;
    }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      this.dataSource.renderedEntries.forEach(data =>
        this.selection.select(data.$key)
      );
    } else {
      this.workflowEntrySVC.data.forEach(data =>
        this.selection.select(data.$key)
      );
    }
  }

  /**
   * Gets the selected workflow's entry and calls the Occopus service with its descriptor.
   */
  buildWorkflow(): void {
    if (this.selection.selected.length === 1) {
      const entryy = this.workflowEntrySVC.data.find(entry => {
        const selected = this.selection.selected.find(key => {
          return key === entry.$key;
        });
        return selected !== undefined;
      });
      console.log(entryy);
      this.occoSVC
        .buildWorkflow(entryy.descriptor)
        .subscribe(res => console.log(res));
    } else {
      window.alert('Only one workflow can be selected for build process!');
    }
  }

  /**
   * Idk.
   */
  destroyWorkflow(): void {
    if (this.selection.selected.length === 1) {
      // this.occoSVC.destroyWorkflow('');
    } else {
      window.alert('Only one workflow can be selected for delete process!');
    }
  }

  /**
   *Idk.
   */
  startProcessing(): void {}

  /**
   * Gets the selected entries and creates a clone of them to the database.
   */
  copyEntries(): void {
    this.SelectionEmptyProcess();
    const copyEntries = this.workflowEntrySVC.data.filter(entry => {
      const selected = this.selection.selected.find(key => {
        return key === entry.$key;
      });
      return selected !== undefined;
    });

    if (copyEntries.length !== 0) {
      copyEntries.forEach(entry => {
        const cleanedEntry = this.workflowEntrySVC.peelEntry(entry);
        this.workflowEntrySVC.saveEntry(cleanedEntry);
      });
    } else {
      console.log('No entries specified'); // could put up a toast message.
    }
  }

  /**
   * Navigates by given key to that Workflow's edit page.
   * @param key Unique Identifier of the Entry in the database.
   */
  editEntry(key: string): void {
    this.router.navigate(['/authenticated/workflow-detail', key, 'edit']);
  }

  /**
   * Deletes every selected workflow from the database.
   */
  deleteWorkflow(): void {
    this.SelectionEmptyProcess();

    this.selection.selected.forEach(key =>
      this.workflowEntrySVC.deleteEntry(key)
    );
    this.selection.clear();
  }

  /**
   * Checks wether there is an entry selected.
   */
  private SelectionEmptyProcess(): void {
    if (this.selection.isEmpty()) {
      window.alert('You need to select an entry to start with!');
      return;
    }
  }

  /**
   * Navigates to the workflow creation page.
   */
  createEntry(): void {
    this.workflowEntrySVC
      .saveEntry(this.workflowEntrySVC.initEntry())
      .then(doc => {
        console.log(doc.id);
        this.router.navigate([
          '/authenticated/workflow-detail',
          doc.id,
          'create'
        ]);
      });

    // const key = this.workflowEntrySVC.saveEntry(
    //   this.workflowEntrySVC.initEntry()
    // );
    // this.router.navigate(['/authenticated/workflow-detail', key, 'create']);
  }
}
