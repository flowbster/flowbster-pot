import { CloudMessagingService } from './../shared/cloud-messaging.service';
import { DataAccessHelper } from './../shared/DataAccessHelper';
import { Component, OnInit } from '@angular/core';
import { WorkflowEntryService } from 'app/workflow/shared/workflow-entry.service';
import { WorkflowEntry } from 'app/workflow/shared/workflowEntry';
import { MenuItem } from 'primeng/primeng';
import { Router } from '@angular/router';
import { OccoService } from 'app/workflow/shared/occo.service';
import { WorkflowDetailComponent } from 'app/workflow/workflow-detail/workflow-detail.component';
import { JointService } from 'app/editor/flowbster-forms/shared/joint.service';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { TemplateService } from 'app/workflow/shared/template.service';
import { DeploymentService } from 'app/workflow/shared/deployment.service';
import { Deployment } from 'app/workflow/shared/deployment';
import { Observable } from 'rxjs/Observable';

/**
 * Holds the logic for the whole Workflow Manager datatable.
 */
@Component({
  selector: 'toil-workflow-manager',
  templateUrl: './workflow-manager.component.html',
  styleUrls: ['./workflow-manager.component.scss'],
  providers: [ConfirmationService]
})
export class WorkflowManagerComponent implements OnInit {
  /**
   * Holds information about the Occopus tools event messages
   */
  message: string;

  /**
   * Holds information about the Occopus tools event messages
   */
  message$;

  /**
   * The holder array of the database records that is shown in the datatable.
   */
  workflowEntries: WorkflowEntry[];

  /**
   *The holder array of the datatable's selected records.
   */
  selectedWorkflowEntries: WorkflowEntry[];

  /**
   * The indicator for popping up and shutting down the build Context modal.
   */
  buildContextDialogVisible: boolean;

  /**
   * The settable WorkflowEntry entity for the build contextualization.
   */
  buildContextEntry: WorkflowEntry;

  /**
   * Initializes the needed services
   */
  constructor(
    private templateSVC: TemplateService,
    private router: Router,
    private jointSVC: JointService,
    private confirmSVC: ConfirmationService,
    private deploymentSVC: DeploymentService,
    private cloudMessagingSVC: CloudMessagingService // private workflowEntrySVC: WorkflowEntryService
  ) {}

  /**
   * We subscibe to any changes made to the Entry FireStore collection.
   */
  ngOnInit() {
    this.templateSVC.dataChange.subscribe(entries => {
      this.workflowEntries = entries;
    });

    this.buildContextDialogVisible = false;
    this.buildContextEntry = DataAccessHelper.initTemplate();
    this.initializeCloudMessaging();
  }

  /**
   * TODO Should be Modified to do not disturb visually.
   */
  onAddClick() {
    this.templateSVC.saveEntry(DataAccessHelper.initTemplate()).then(doc => {
      console.log(doc.id);
      this.router.navigate([
        '/authenticated/workflow-detail',
        doc.id,
        'create'
      ]);
    });
  }

  /**
   * When the deployment components 'Watch' button is clicked,
   * it sets the Joint Graph for the clicked deployments graph.
   * @param graph
   */
  onDeploymentWatchClicked(graph: string) {
    this.updateViewerPaper(graph);
  }

  /**
   * When the Deployments build context dialog is submitted, the dialog gets shut,
   * and the deployment gets saved to the database under the buildContext.
   * @param deployment
   */
  onDeployContextSubmit(deployment: Deployment) {
    this.buildContextDialogVisible = false;

    this.deploymentSVC.saveEntry(deployment);
  }

  /**
   * When a record delete button is clicked, it asks for a confirmation. If it succeeds,
   * then it gets deleted.
   * @param entry
   */
  confirmDeletion(entry: WorkflowEntry) {
    this.confirmSVC.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'fa fa-trash',
      accept: () => {
        this.deleteEntry(entry.$key);
      }
    });
  }

  /**
   * Brings up a confirmation dialog for multiple deletion.
   */
  confirmMultiDelete() {
    if (
      this.selectedWorkflowEntries &&
      this.selectedWorkflowEntries.length !== 0
    ) {
      this.confirmSVC.confirm({
        message: 'Do you want to delete selected records?',
        header: 'Delete Confirmation',
        icon: 'fa fa-trash',
        accept: () => {
          this.onMultiDeleteClick();
        }
      });
    } else {
      console.log('Select anything from the table');
    }
  }

  /**
   * If there is any entry selected it gets saved under a new id into the fireStore database.
   */
  onMultiCopyClick() {
    this.IfAnyItemIsSelected(entry => {
      this.copyEntry(entry);
    });
  }

  /**
   * If there is any entry selected it gets removed from the fireStore database and also from the selection.
   */
  onMultiDeleteClick() {
    const toBeDeletedFromSelection: WorkflowEntry[] = [];

    this.IfAnyItemIsSelected(entry => {
      this.deleteEntry(entry.$key);
      toBeDeletedFromSelection.push(entry);
    });

    this.cleanSelection(toBeDeletedFromSelection);
  }

  /**
   * The Messaging service subscribes to the messaging feed.
   */
  private initializeCloudMessaging(): void {
    this.cloudMessagingSVC.receiveMessage();
    this.message$ = this.cloudMessagingSVC.currentMessage;
  }

  /**
   * If there is any entry selected its infrastructure data gets sent via Http to Occopus.
   */
  onMultiBuildClick() {
    this.IfAnyItemIsSelected(entry => {
      // this.buildEntry(entry);
      console.log(entry);
    });
  }

  /**
   * Checks if there is any workflow selected and gets any job done for each individual item.
   * @param atomicJob
   */
  private IfAnyItemIsSelected(atomicJob: (entry: WorkflowEntry) => any) {
    if (
      this.selectedWorkflowEntries &&
      this.selectedWorkflowEntries.length !== 0
    ) {
      this.selectedWorkflowEntries.forEach(entry => {
        atomicJob(entry);
      });
    } else {
      console.log('No Item is selected in the Data Table');
    }
  }

  /**
   * Deletes the given array of items from the selection.
   * @param toBeDeletedFromSelection
   */
  private cleanSelection(toBeDeletedFromSelection: WorkflowEntry[]) {
    toBeDeletedFromSelection.forEach(deletedEntry => {
      this.removeByWorkflowEntryKey(this.selectedWorkflowEntries, deletedEntry);
    });
  }

  /**
   * Removes the Workflow Entry by its key from the given Workflow Entries.
   * @param array
   * @param entry
   */
  private removeByWorkflowEntryKey(
    array: WorkflowEntry[],
    entry: WorkflowEntry
  ) {
    if (entry.$key !== undefined) {
      array.some((item, index) => {
        return array[index].$key === entry.$key
          ? !!array.splice(index, 1)
          : false;
      });
    }
  }

  /**
   * Navigates by given key to that Workflow's edit page.
   * @param key Unique Identifier of the Entry in the database.
   */
  navigateToEditPage(key: string) {
    this.router.navigate(['/authenticated/workflow-detail', key, 'edit']);
  }

  /**
   * Cleans the selection with the actual element if it was selected, then deletes the entry.
   * @param entry
   */
  onDeleteClicked(entry: WorkflowEntry) {
    this.cleanSelection([entry]);
    this.deleteEntry(entry.$key);
  }

  /**
   * Copies the actual entry to the database.
   */
  onCopyClicked(entry: WorkflowEntry) {
    this.copyEntry(entry);
  }

  /**
   * Navigates to the Edit Page.
   * @param entry
   */
  onEditClicked(entry: WorkflowEntry) {
    this.navigateToEditPage(entry.$key);
  }

  /**
   * Sends the build information of the actual entry from the actually clicked entry.
   * @param entry
   */
  onBuildClicked(entry: WorkflowEntry) {
    this.deploymentSVC.subscribeToDataChanges(entry.$key);
    this.buildContextEntry = entry;
    this.buildContextDialogVisible = true;
  }

  /**
   * Propagates data to the Read Only editor.
   * @param entry
   */
  onMagnifierClicked(entry: WorkflowEntry) {
    this.updateViewerPaper(entry.graph);
  }

  /**
   * updates the Drawing area with the entry's graph definition.
   * @param entry
   */
  updateViewerPaper(graph: string) {
    this.jointSVC.uploadGraph(JSON.parse(graph));
  }

  /**
   * Deletes an individual record from the fireStore Database.
   * @param key
   */
  deleteEntry(key: string) {
    // this.workflowEntrySVC.deleteEntry(key);
    this.templateSVC.deleteEntry(key);
  }

  /**
   * It peels the entry from the ID property and saves it to the FireStore database.
   * @param entry
   */
  copyEntry(entry: WorkflowEntry) {
    // const peeledEntry = this.workflowEntrySVC.peelEntry(entry);
    const peeledEntry = DataAccessHelper.peelTemplate(entry);
    this.templateSVC.saveEntry(peeledEntry);
    // this.workflowEntrySVC.saveEntry(peeledEntry);
  }
}
