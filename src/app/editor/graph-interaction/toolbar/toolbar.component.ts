import { Component, OnInit } from '@angular/core';

import { Message } from 'primeng/components/common/message';
import { MenuItem } from 'primeng/components/common/menuitem';

import { DescriptorService } from 'app/editor/graph-interaction/shared/descriptor.service';
import { JointService } from 'app/editor/flowbster-forms/shared/joint.service';

import { Workflow } from 'app/editor/flowbster-forms/workflow-properties/workflow';

/**
 * Displays the toolbar for the {@link EditorComponent}.
 * To interact with the graph more precisely.
 *
 * @example
 * <toil-editor-toolbar></toil-editor-toolbar>
 */
@Component({
  selector: 'toil-editor-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  /**
   * The array to hold Toastr messages.
   */
  msgs: Message[] = [];

  /**
   * Special items for the Menu bar.
   */
  items: MenuItem[];

  /**
   * A switch which indicates wether the {@link WorkflowPropertiesComponent} should be
   * displayed or not.
   */
  editClicked: boolean;

  /**
   * An array to hold the uploaded files.
   */
  uploadedFiles: any[] = [];

  /**
   * Provide the dependency injection of services.
   * @param jointSVC Maintain graph related actions and serve data to the WorkflowProperties Modal.
   */
  constructor(
    private descriptorSVC: DescriptorService,
    public jointSVC: JointService
  ) {}

  /**
   * Sets the modal click indicator and initializes
   * the menu's items.
   */
  ngOnInit() {
    this.editClicked = false;
    this.items = this.createToolBarItems();
  }

  /**
   * When the modal has changed the services attributes are getting updated
   * and Toastr message is pushed to the screen.
   * @param newWorkflow The workflows attributes that were granted from the modal.
   */
  workflowDialogChange(newWorkflow: Workflow) {
    this.editClicked = false;
    this.jointSVC.updateWorkflowProperties(newWorkflow);
    this.descriptorSVC.updateDescriptorProperties(newWorkflow);
    this.msgs.push({
      severity: 'success',
      summary: 'Success',
      detail: 'Workflow properties updated!'
    });
    // deploy to some outside method to let them call with your own details.
  }

  /**
   * Reads the JSON file and uploads the represented graph into the paper.
   */
  myUploader(event) {
    const file = event.files[0];
    const reader = new FileReader();
    const self = this;

    reader.onload = (function(theFile) {
      return function(e) {
        console.log(e);
        self.jointSVC.uploadGraph(JSON.parse(e.target.result));
      };
    })(file);

    reader.readAsText(file); // confirm dialog before this.
  }

  /**
   * Initializes the basic Menu's Items with proper clicking commands.
   */
  createToolBarItems(): MenuItem[] {
    return [
      {
        label: 'Workflow Settings',
        items: [
          {
            label: 'Edit Properties',
            icon: 'fa-microchip',
            command: event => {
              this.editClicked = true;
            }
          }
        ]
      },
      {
        label: 'Drawing Controls',
        items: [
          {
            label: 'Add Input port',
            icon: 'fa-plus-circle',
            command: event => {
              this.jointSVC.addPort('inPorts');
            }
          },
          {
            label: 'Add Output port',
            icon: 'fa-plus-circle',
            command: event => {
              this.jointSVC.addPort('outPorts');
            }
          },
          {
            label: 'Delete port',
            icon: 'fa-times-circle',
            command: event => {
              this.jointSVC.deletePort();
            }
          },
          {
            label: 'Delete node',
            icon: 'fa-times-circle',
            command: event => {
              console.log('Im about to delete a node');
              this.jointSVC.deleteNode();
            }
          }
        ]
      },
      {
        label: 'File Sharing',
        items: [
          {
            label: 'Download Descriptor',
            icon: 'fa-download',
            command: event => {
              this.descriptorSVC.updateDescriptorProperties(
                this.jointSVC.workflow
              );
              this.descriptorSVC.downloadYamlDescriptor(
                'occopus.yaml',
                'application/x-yaml'
              );
            }
          },
          {
            label: 'Download Graph',
            icon: 'fa-download',
            command: event => {
              this.jointSVC.downloadGraph('graph.json', 'application/json');
            }
          },
          {
            label: 'NodeNames',
            icon: 'fa-donwload',
            command: event => {
              console.log(this.jointSVC.getNodeNames());
            }
          }
        ]
      }
    ];
  }
}
