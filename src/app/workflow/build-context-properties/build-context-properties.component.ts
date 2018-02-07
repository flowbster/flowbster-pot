import { JointService } from 'app/editor/flowbster-forms/shared/joint.service';
import { Deployment, DeploymentType } from './../shared/deployment';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators
} from '@angular/forms';
import { WorkflowEntry } from 'app/workflow/shared/workflowEntry';
import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  ViewChild
} from '@angular/core';
import { OccoService } from 'app/workflow/shared/occo.service';
import { AngularFirestore } from 'angularfire2/firestore';
import { NodeInfo } from 'app/workflow/shared/nodeInfo';

/**
 * Holds logic of the Deployments layer build context.
 */
@Component({
  selector: 'toil-build-context-properties',
  templateUrl: './build-context-properties.component.html',
  styleUrls: ['./build-context-properties.component.scss']
})
export class BuildContextPropertiesComponent implements OnInit {
  /**
   * The input template from which the build context is going to be created.
   */
  @Input() buildTemplate: WorkflowEntry;

  /**
   * The FormGroup that holds the input logic of the form.
   */
  form: FormGroup;

  /**
   * A modifiable deployment entity of the form data.
   */
  deployment: Deployment;

  /**
   * Enumeration of the deployment types.
   */
  DeploymentTypes = DeploymentType;

  /**
   * The programmatically avaliable ngForm component of the view.
   */
  @ViewChild('f') myNgForm;

  /**
   *An event that informs the outside world about the Submission of the dialog.
   */
  @Output() onSubmitDialog = new EventEmitter<Deployment>();

  /**
   * Initializes the required singleton services.
   * @param fb
   * @param occoSVC
   */
  constructor(
    private fb: FormBuilder,
    private occoSVC: OccoService,
    private jointSVC: JointService
  ) {}

  /**
   * Initializes the formGroup and its Form Controls.
   * Initializes an initial deployment.
   */
  ngOnInit() {
    this.form = this.fb.group({
      name: new FormControl('', Validators.required)
      // deployType: new FormControl('', Validators.required)
    });

    this.deployment = {
      name: null
    };
  }

  /**
   * When the Build Context form gets submitted, information will be sent to Occopus,
   * and information will be emitted to the main manager module about the deployment.
   * The form gets reseted everytime the form is submitted.
   */
  onSubmit() {
    this.deployment = this.form.value;

    this.occoSVC.buildWorkflow(this.buildTemplate.descriptor).subscribe(
      (res: any) => {
        // We emit to the parent component the neccessary data.
        console.log(res);
        this.deployment.infraid = res.infraid;
        this.deployment.templateKey = this.buildTemplate.$key;
        this.deployment.graph = this.buildTemplate.graph;
        this.deployment.nodeCollection = this.populateCollection(
          this.buildTemplate.graph
        );
        this.onSubmitDialog.emit(this.deployment);

        // reset the form.
        this.myNgForm.resetForm();

        // subscribe to notifications.
        this.occoSVC
          .subscribeToInfraChanges(res.infraid)
          .subscribe((response: any) => {});
      },
      error => {
        console.log(this.deployment);
        window.alert(error);
      }
    );
  }

  private populateCollection(graphText: string): string[] {
    this.jointSVC.uploadGraph(JSON.parse(graphText));
    return this.jointSVC.getNodeNames();
  }
}
