import { Component, OnInit, Input } from '@angular/core';
import { NodeInfo } from 'app/workflow/shared/nodeInfo';

@Component({
  selector: 'toil-infra-details',
  templateUrl: './infra-details.component.html',
  styleUrls: ['./infra-details.component.scss']
})
export class InfraDetailsComponent implements OnInit {
  @Input() nodeCollection: NodeInfo[];

  constructor() {}

  ngOnInit() {}
}
