import { InfraInfo } from './../infra-details/infraInfo';
import { Deployment } from './../shared/deployment';
import { OccoService } from './../shared/occo.service';
import { WorkflowEntry } from './../shared/workflowEntry';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { DeploymentService } from 'app/workflow/shared/deployment.service';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { ManagerComponent } from 'app/workflow/shared/manager.component';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { NodeInfo, StateInfo } from 'app/workflow/shared/nodeInfo';

import { map } from 'rxjs/operators';
import { CloudMessagingService } from 'app/workflow/shared/cloud-messaging.service';

/**
 * Holds logic of the datatable of the deployment records and its interactions.
 */
@Component({
  selector: 'toil-deployment-manager',
  templateUrl: './deployment-manager.component.html',
  styleUrls: ['./deployment-manager.component.scss'],
  providers: [DeploymentService]
})
export class DeploymentManagerComponent extends ManagerComponent<
  Deployment,
  WorkflowEntry
> {
  infoModalVisible: boolean;

  /**
   * Emits informations outside of the component whenever the 'Eye' icon is clicked.
   */
  @Output() onWatchClicked = new EventEmitter<string>();

  nodeCollection: NodeInfo[] = [];

  /**
   * Initializes the used services. Propagates context information for the base class.
   * @param deploymentSVC
   * @param confirmSVC
   * @param occoSVC
   */
  constructor(
    private deploymentSVC: DeploymentService,
    private confirmSVC: ConfirmationService,
    private occoSVC: OccoService,
    private cloudMessagingSVC: CloudMessagingService
  ) {
    super(deploymentSVC);
    this.infoModalVisible = false;
    this.cloudMessagingSVC.currentMessage.subscribe(data => {
      if (data) {
        const payload = JSON.parse(data.payload);
        console.log(payload); // az első nodecreatingről nem kapunk eseményt.

        if (
          data.event_name === 'nodecreating' ||
          data.event_name === 'nodecreated'
        ) {
          const deployment = this.dataTableEntries.find(
            deploy => deploy.infraid === payload.infra_id
          ); // megszerezzuk az aktuális deploymentet
          console.log(deployment);
          this.occoSVC
            .getWorkflowInformation(deployment.infraid)
            .subscribe((infraCollection: InfraInfo[]) => {
              this.updateNodeCollection(deployment, infraCollection);
            });
        } else if (data.event_name === 'nodedropped') {
          // this.occoSVC
          //   .getWorkflowInformation(deployment.infraid)
          //   .subscribe((infraCollection: InfraInfo[]) => {
          //     this.updateNodeCollection(deployment, infraCollection);
          //   });
        }
      }
    });
  }

  /**
   * To be decided how do we wanna edit a node.
   * @param entry
   */
  onInfoClicked(entry: Deployment) {
    this.occoSVC
      .getWorkflowInformation(entry.infraid)
      .subscribe((infraCollection: InfraInfo[]) => {
        this.updateNodeCollection(entry, infraCollection);
        this.infoModalVisible = true;
      });
  }

  /**
   * If the magnifies icon is clicked, the component emits information on its output.
   * @param entry
   */
  onMagnifierClicked(entry: Deployment) {
    this.onWatchClicked.emit(entry.graph);
  }

  /**
   * When the user clicks on the delete button, a confirmation dialog is shown wether you are
   * sure about deleting the record, if you confirm it, it gets removed from the database and also
   * Occopus tears the infrastructure down.
   * @param entry
   */
  confirmDeletion(entry: Deployment) {
    this.confirmSVC.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'fa fa-trash',
      accept: () => {
        this.occoSVC.destroyWorkflow(entry.infraid).subscribe(
          succes => {
            console.log(
              'The Occopus deletion was successfull, deletes database entry...'
            );
            this.deploymentSVC.deleteEntry(entry.$key);
          },
          error => {
            console.log(
              'Some error happened, the deletion on the Occopus side failed!',
              error
            );
            window.alert(
              'Some error happened, the deletion on the Occopus side failed!'
            );
          }
        );
        // only delete the entry when the workflow is actually destroyed
      }
    });
  }

  /**
   * Updates the deploymentManagers nodeCollection information.
   * @param infraStatus
   */
  private updateNodeCollection(
    entry: Deployment,
    infraStatus: InfraInfo[]
  ): void {
    this.nodeCollection = [];
    console.log(infraStatus);
    infraStatus.forEach(node => {
      const states = this.getStates(node.instances);
      this.nodeCollection.push({
        states: states,
        instances: states.length,
        name: node.name
      });
    });
    console.log(this.nodeCollection);
  }

  /**
   * Gets the actual state information about the node type and its instances
   * @param instances
   */
  private getStates(instances): StateInfo[] {
    const stateCollection: StateInfo[] = [];
    Object.keys(instances).forEach(instance => {
      const instanceObject = instances[`${instance}`];
      const state: StateInfo = {
        ip_address: instanceObject.resource_address,
        state: instanceObject.state,
        node_id: instance
      };
      stateCollection.push(state);
    });
    return stateCollection;
  }
}
