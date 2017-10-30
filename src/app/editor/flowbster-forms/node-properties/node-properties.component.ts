import {
  Component,
  OnInit,
  Output,
  Input,
  EventEmitter,
  ViewChild
} from '@angular/core';
import {
  Validators,
  FormControl,
  FormGroup,
  FormBuilder,
  AbstractControl
} from '@angular/forms';

import { FlowbsterNode } from './flowbsterNode';
import { JointService } from 'app/editor/flowbster-forms/shared/joint.service';
import { NodeValidator } from 'app/editor/flowbster-forms/shared/customValidators';


@Component({
  selector: 'toil-editor-node-properties',
  templateUrl: './node-properties.component.html',
  styleUrls: ['./node-properties.component.scss']
})
export class NodePropertiesComponent implements OnInit {
  @Input() readOnly: boolean;

  userform: FormGroup;
  nodeProps: FlowbsterNode;

  isExistingNode: boolean;
  // @Input() isExistingNode: boolean;

  @Output() onUpdateDialog = new EventEmitter<FlowbsterNode>();
  @Output() onCreateDialog = new EventEmitter<FlowbsterNode>();
  @Output() onCloneDialog = new EventEmitter<FlowbsterNode>();
  @Output() NodePropsChange = new EventEmitter<FlowbsterNode>(); // not neccessary

  @ViewChild('f') myNgForm; // check issue#4190 on Angular material2 github site.

  @Input()
  get NodeProps() {
    return this.nodeProps;
  }

  set NodeProps(val: FlowbsterNode) {
    this.nodeProps = val;
    this.NodePropsChange.emit(this.nodeProps);
  }

  private nameControl: AbstractControl;

  constructor(private fb: FormBuilder, private jointSVC: JointService) {}

  ngOnInit() {
    this.userform = this.initForm();
    this.nameControl = this.userform.controls['name'];
    this.subscribeToNodeChanges();
  }

  private subscribeToNodeChanges() {
    this.jointSVC.isExistingNodeSubject.subscribe(isExistingNode => {
      if (isExistingNode) {
        this.setExistingNodeValidators();
      } else {
        this.setNewNodeValidators();
      }
      this.isExistingNode = isExistingNode;
    });
  }

  private setExistingNodeValidators() {
    console.log('doing the job');
    this.nameControl.clearAsyncValidators();
    this.nameControl.setAsyncValidators([
      NodeValidator.isUpdateUnique(this.jointSVC)
    ]);
    this.nameControl.updateValueAndValidity();
  }

  private setNewNodeValidators() {
    this.nameControl.clearAsyncValidators();
    this.nameControl.setAsyncValidators([
      NodeValidator.isNodeUnique(this.jointSVC)
    ]);
    this.nameControl.updateValueAndValidity();
  }

  initForm() {
    const formState = { value: '', disabled: this.readOnly };
    const numberFormState = { value: '1', disabled: this.readOnly };

    return this.fb.group({
      name: new FormControl(formState, Validators.required),
      execname: new FormControl(formState, Validators.required),
      args: new FormControl(formState),
      execurl: new FormControl(formState, Validators.required),
      scalingmin: new FormControl(numberFormState, [
        Validators.min(1),
        Validators.required
      ]), // TODO:custom validator for  whole number
      scalingmax: new FormControl(numberFormState, [
        Validators.min(1),
        Validators.required
      ]) // TODO: custom validator for whole number
    });
  }

  // emits FlowbsterNode information from the component and resets the form.
  onCreate() {
    this.onCreateDialog.emit(this.userform.value);
    this.myNgForm.resetForm();
  }

  onUpdate() {
    this.onUpdateDialog.emit(this.userform.value);
    this.myNgForm.resetForm();
  }

  onClone() {
    this.onCloneDialog.emit(this.userform.value);
    this.myNgForm.resetForm();
  }

  // hasonlóra van szükség a isExistingNode-al egyetemben, de nem biztos hogy ez rendjén való.
  // this.userform.get('infraname').valueChanges.subscribe(
  //   (infraname: string) => {
  //     this.userform.get('infraname').setValidators([Validators.required, forbiddenNameValidator(this.jointSVC.getNodeNames())]);
  //     this.userform.get('infraname').updateValueAndValidity();
  //   }
  // );
}