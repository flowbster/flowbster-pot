import { FlowbsterFormsModule } from './flowbster-forms.module';
import { Injectable } from '@angular/core';

import { Workflow } from 'app/editor/flowbster-forms/workflow-properties/workflow';
import { FlowbsterNode } from 'app/editor/flowbster-forms/node-properties/flowbsterNode';
import { InputPort } from 'app/editor/flowbster-forms/input-properties/inputPort';
import { OutputPort } from 'app/editor/flowbster-forms/output-properties/outputPort';

import './customArrayFeatures';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import * as joint from 'jointjs';
import * as _ from 'lodash';

/**
 * Main Service that holds operations regarding the JointJS library.
 */
@Injectable()
export class JointService {
  /**
   * The actual CellView that has been selected on the paper.
   */
  selectedCellView: joint.dia.CellView;

  /**
   * The actual Port Name that has been selected on the paper.
   */
  selectedPortName: string;

  /**
   * The actual ports type that has been selected on the paper.
   */
  selectedPortType: string;

  /**
   * Holder of the actual workflows main properties.
   */
  workflow: Workflow;

  /**
   * The Papers data model.
   */
  graph = new joint.dia.Graph();

  /**
   * The paper object that has been associated with the given HTML element.
   */
  paper: joint.dia.Paper;

  /**
   * Holder of the x and y coordinates where the user clicked on a blank paper.
   */
  actualNodePlacement: { x: number; y: number };

  /**
   * The actual node that has been selected to modify. Useful for input data changes.
   */
  actualNode: FlowbsterNode;

  /**
   * The actual port that has been selected to modify. Useful for input data changes.
   */
  actualPort: InputPort | OutputPort;

  /**
   * An Observable datasource for watching if we are clicking on the blank paper or on an actual Node.
   */
  isExistingNodeSubject: Subject<boolean>;

  /**
   * An Observable datasource for watching, if there are any changes made to the workflows main properties.
   */
  workflowChange: Subject<void>;

  /**
   * An Observable datasource for watching, if the workflow have been initialized yet.
   */
  isWorkflowInitialized: Subject<boolean>;

  // BONUS:  message events from proper linking and port creations and updates, and even nodes.
  // BONUS: on cancellation we reset the form again. a confirmation dialog.
  // BONUS: highlighting selected port.
  // BONUS: it would be nice to revert a change.
  // BONUS: confirm dialog for confirming the deletion of a given node.
  // BONUS: emit information to the main page. maybe if we want more sticky message
  // BONUS: with PrimeNG Upload we can upload more things at once, maybe create a template "NODE" of them.
  // BONUS: rename everything to match the descriptors.
  // BONUS: Clear paper function would be awesome.
  // BONUS: if we put a tick in the checkboxes the connected content is getting up.

  // BEHAVIOUR(ok): click upload somewhat gets the nativeElement undefined.
  // HINT: Wait for PrimeNG-s new release. its going to work. there is already a fix for this.
  // check primefaces github issue @3664

  // BEHAVIOUR(ok): If there is a port which hasnt got any properties its going to be delisted from the yaml description.
  // i think this is the exact behaviour we want.

  // BEHAVIOUR(ok): if Collector checkbox is disabled and something was entered then its gonna be irrelevant and deleted.
  // i think this is an OK behaviour.

  // BEHAVIOUR: My custom validators are going to subscribe everytime you click on them. cant really make it unsubscribe.

  // BEHAVIOUR: The "update dialog" will not clone the existing node if the name is changed in the meantime. can generate same names.

  // BEHAVIOUR: if you click out of the modal without submission, you wont have the visual things (the form) reset.
  // HINT: change this with md modal. or find a way to get to the canceling event.

  // REFACTOR: downloadGraph and some functions could be placed in a Utility file.
  // REFACTOR: stringlike attributes should be placed in a configuration file like (.label/text, inPortProps) in constants.
  // REFACTOR: Maybe rename JointService to GraphService and get a JointService for the helper and other operations.
  // REFACTOR: Get the exact location from the 3rd party components to reduce file size.

  // TODO: We need to have Id's for such operations on in/out , to change their name as well.
  // TODO: Mulitple linking support and convert it to yaml.
  // TODO: Change to PrimeNG-s Menubar. we need custom menuitems.
  // TODO: Refactor (downloadGraph and some functions could be in a UtilityService)

  /**
   * Neccesarily initialize nodes,outports and workflow before any associaton happens.
   */
  constructor() {
    this.actualNode = this.initNode();
    this.actualPort = this.initPort('out');
    this.workflow = this.initWorkflow();
    this.isExistingNodeSubject = new Subject();
    this.isWorkflowInitialized = new Subject();
    this.workflowChange = new Subject<void>();
  }

  /**
   * Decides wether the given port name is already in use and returns a subscribable stream of the indication.
   * @param portName The name you want to get checked against the list of names.
   */
  isPortNameUniqueObservable(portName: string): Observable<boolean> {
    return new Observable(observer => {
      console.log('validate name against ports on the actual FlowbsterNode');
      const element = this.getElementById(
        this.selectedCellView.model.id
      ) as joint.shapes.devs.Model;

      if (element) {
        const ports = element.getPorts();
        let isUsed = false;
        for (const port of ports) {
          if (portName === port.id && this.selectedPortName !== portName) {
            isUsed = true;
            console.log('set to true');
          }
        }
        if (isUsed) {
          observer.next(false);
        }
        {
          observer.next(true);
        }
      }
    });
  }

  // returns an observable with the information of the updated node
  /**
   * Validates the given node name against every node (even its last name) and the workflows name property.
   * @param nodeName the Node's name you want to filter on.
   * @returns an Observable with the information if the updateble Node's name is unique.
   */
  isUpdateNodeNameUniqueObservable(nodeName: string): Observable<boolean> {
    return new Observable(observer => {
      console.log('validate against updated nodes and workflowName');
      const element = this.getFlowbsterNodeElement(nodeName);
      if (element) {
        if (element.id === this.selectedCellView.model.id) {
          observer.next(true);
        } else {
          observer.next(false);
        }
      } else if (this.isWorkflowName(nodeName)) {
        observer.next(false);
      } else {
        observer.next(true);
      }
    });
  }

  /**
   * Decides wether it is a used workflow name.
   * @param name The questionable name
   * @returns A boolean value if it is taken or not-
   */
  private isWorkflowName(name: string): boolean {
    return this.graph.get('wf_name') === name;
  }

  /**
   * Validate the given node against every other node and the workflow.
   * @param nodeName The node's name you want to filter on
   * @returns an Observable with the information about the nodeNames uniqueness
   */
  isNodeNameUniqueObservable(nodeName: string): Observable<boolean> {
    return new Observable(observer => {
      console.log('validate against nodes and workflowName');
      const element = this.getFlowbsterNodeElement(nodeName);
      if (element || this.isWorkflowName(nodeName)) {
        observer.next(false);
      } else {
        observer.next(true);
      }
    });
  }

  /**
   * Validates the proposed workflow Name against the nodes.
   * @param workflowName The workflow's name you want to filter on
   * @returns an Observable with the information if the workflowname is unique.
   */
  isWorkflowNameUniqueObservable(workflowName: string): Observable<boolean> {
    return new Observable(observer => {
      console.log('validate against nodes');
      const element = this.getFlowbsterNodeElement(workflowName);
      if (element) {
        observer.next(false);
      } else {
        observer.next(true);
      }
    });
  }

  /**
   * Clear the data model.
   */
  clearGraph(): void {
    this.graph.clear();
  }

  /**
   * Gets every element from the data model.
   * @returns A collection of the node's name.
   */
  getNodeNames(): string[] {
    console.log(
      this.graph.getElements().map(element => element.attr('.label/text'))
    );
    return this.graph.getElements().map(element => element.attr('.label/text'));
  }

  /**
   * Resets the workflow property with a pristine one.
   */
  reinitializeWorkflow() {
    this.workflow = this.initWorkflow();
  }

  /**
   * Creates a pristine workflow.
   * @returns a clean Workflow object
   */
  initWorkflow(): Workflow {
    return {
      infraid: null,
      userid: '',
      infraname: '',
      gatherip: null,
      gatherport: null,
      receiverport: null
    };
  }

  /**
   * Associates the new workflows properties to the papers data model.
   * Emits information that the initialization happened and the workflow has changed.
   * @param newWorkflow Workflow modal input data.
   */
  updateWorkflowProperties(newWorkflow: Workflow) {
    this.workflow = newWorkflow;
    this.graph.set('infra_id', newWorkflow.infraid);
    this.graph.set('user_id', newWorkflow.userid);
    this.graph.set('wf_name', newWorkflow.infraname);
    this.graph.set('coll_ip', newWorkflow.gatherip);
    this.graph.set('coll_port', newWorkflow.gatherport);
    this.graph.set('recv_port', newWorkflow.receiverport);
    this.isWorkflowInitialized.next(true);
    this.emitWorkflowChange();
  }

  /**
   * Creates a link and attaches it to the DOM and downloads the data model's json content, and it when it is done, removes it form the DOM
   * @param fileName demanded file name with the extension to be downloaded
   * @param mimeType the given mimeType for the header
   */
  downloadGraph(fileName: string, mimeType: string): void {
    if (this.graph) {
      const elHtml = JSON.stringify(this.getDownloadableGraph());
      const link = document.createElement('a');
      mimeType = mimeType || 'text/plain';

      link.setAttribute('download', fileName);
      link.setAttribute(
        'href',
        'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml)
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('Graph is not present');
    }
  }

  /**
   * Gets the workflow attributes as an object from the paper data model.
   * @returns A fully set workflow object
   */
  private getWorkflowAttributes(): Workflow {
    return {
      infraid: this.graph.get('infra_id'),
      infraname: this.graph.get('wf_name'),
      userid: this.graph.get('user_id'),
      gatherip: this.graph.get('coll_ip'),
      gatherport: this.graph.get('coll_port'),
      receiverport: this.graph.get('recv_port')
    };
  }

  /**
   * Unhighlights the actual element to return a proper formatted Data Model JSON and then highlights the selected element again
   */
  private getDownloadableGraph(): string {
    let downloadableGraph = this.graph.toJSON();

    if (this.selectedCellView) {
      this.unhighlightCellView(this.selectedCellView);
      downloadableGraph = this.graph.toJSON();
      this.highlightCellView(this.selectedCellView);
    }

    return downloadableGraph;
  }

  /**
   * Sets the CellViews borders width to 1px and color to black.
   * @param cellView selected CellView thats going to be unhighlighted.
   */
  private unhighlightCellView(cellView: joint.dia.CellView): void {
    cellView.model.attr('rect/stroke', 'black');
    cellView.model.attr('rect/stroke-width', '1px');
  }

  /**
   * Sets the CellViews borders width to 5px and color to red.
   * @param cellView selected CellView thats going to be highlighted.
   */
  private highlightCellView(cellView: joint.dia.CellView): void {
    cellView.model.attr('rect/stroke', 'red');
    cellView.model.attr('rect/stroke-width', '5px');
  }

  /**
   * Gets the data model in JSON format and converts it to a string. If there is a selected Cell it is going to be unhighlighted before the
   * conversion happens.
   * @returns data Model's JSON in string format.
   */
  getGraphJSON(): string {
    let graphJSON = JSON.stringify(this.graph.toJSON());

    if (this.selectedCellView) {
      this.unhighlightCellView(this.selectedCellView);
      graphJSON = JSON.stringify(this.graph.toJSON());
      this.highlightCellView(this.selectedCellView);
    }

    return graphJSON;
  }

  /**
   * Gets the data modell's cells.
   * @returns A Collection of the graphs cells.
   */
  getCells(): joint.dia.Cell[] {
    return this.graph.getCells();
  }

  /**
   * Gets the associated Links from the paper
   * @returns A collection of the graphs links.
   */
  getLinks(): joint.dia.Link[] {
    return this.graph.getLinks();
  }

  // initializes a graph from a given JSON formatted Graph.
  /**
   * Sets the data modell and the workflow object properties from a JSON formatted data modell.
   * Because we get an extra warning of graph change with the upload which is not neccessary.
   * We are turning the eventListening on these changes off before actually updating the graph,
   * and then listen on it again.
   * @param graphJson Data Model JSON in string format.
   */
  uploadGraph(graphJson: string): void {
    this.stopListeningOnGraphChange(); // when you upload you are getting an extra warning.
    this.graph.fromJSON(graphJson);
    this.listenOnGraphChange();
    this.workflow = this.getWorkflowAttributes();
  }

  /**
   * Sets the scaling of the paper by the given level.
   * @param newLevel The level of the rescale on the paper.
   */
  reScalePaper(newLevel: number): void {
    if (this.paper) {
      const newScale = newLevel / 100;
      this.paper.scale(newScale, newScale);
    }
  }

  /**
   * Gives back the demanded Node Count on the infrastructure.
   */
  getDeploymentNodeCount(): number {
    let nodeCount = 0;

    for (const nodeName of this.getNodeNames()) {
      const flowbsterNode = this.getFlowbsterNodeElement(nodeName);
      // console.log(flowbsterNode.attr('.scaling/min'));
      nodeCount += flowbsterNode.attr('.scaling/min');
      console.log(nodeCount);
    }
    return nodeCount;
  }

  /**
   * Create a new flowbster node with unique name on the paper. Informs the user if it was done.
   * @param flowbsterNode Node input form data.
   * @returns an indicator about its success.
   */
  createNode(flowbsterNode: FlowbsterNode): boolean {
    const existingNodeElement: joint.dia.Element = this.getFlowbsterNodeElement(
      flowbsterNode.name
    );

    if (
      !existingNodeElement &&
      this.actualNodePlacement.x &&
      this.actualNodePlacement.y
    ) {
      const rect = this.initNodeModel(
        flowbsterNode,
        this.actualNodePlacement.x,
        this.actualNodePlacement.y
      );
      this.graph.addCell(rect);
      this.emitWorkflowChange();
      return true;
    }
    return false;
  }

  /**
   * Unhighlights the selected Cell, checks if it is really a node and makes a copy of it in a translated location.
   * The actual cell gets highlighted again, and it notifies subscribers about the changes made to the model.
   * WARNING: here we violate our rule for duplicate nodeName
   * @param flowbsterNode Node input form data.
   * @returns Indicator about completion.
   */
  cloneNode(flowbsterNode: FlowbsterNode): boolean {
    this.unhighlightCellView(this.selectedCellView);

    const existingNodeElement = this.getFlowbsterNodeElement(
      flowbsterNode.name
    );

    if (existingNodeElement) {
      const clonedElement = (existingNodeElement.clone() as joint.dia.Element)
        .translate(20, 0)
        .attr('.label/text', flowbsterNode.name + 'CLONE');

      this.graph.addCell(clonedElement);
      this.highlightCellView(this.selectedCellView);
      this.emitWorkflowChange();
      return true;
    }
    return false;
  }

  // updates the selectedNodes model.
  /**
   * Updates the selected Node's data model with the new values and notifies subscribers about the change to the model.
   * @param flowbsterNode Node input form data.
   * @returns Indicator about completion.
   */
  updateNode(flowbsterNode: FlowbsterNode): boolean {
    // const existingNodeElement: joint.dia.Element = this.getFlowbsterNodeElement(flowbsterNode.name);

    // if (!existingNodeElement) {
    this.selectedCellView.model.attr('.label/text', flowbsterNode.name);
    this.selectedCellView.model.attr('.exename/text', flowbsterNode.execname);
    this.selectedCellView.model.attr('.args/text', flowbsterNode.args);
    this.selectedCellView.model.attr('.exetgz/text', flowbsterNode.execurl);
    this.selectedCellView.model.attr('.scaling/min', flowbsterNode.scalingmin);
    this.selectedCellView.model.attr('.scaling/max', flowbsterNode.scalingmax);
    this.emitWorkflowChange();
    return true;
    // }

    // return false;
  }

  /**
   * If there is a node selected, it is going to be removed and it notifies subscribers about the change to the model.
   */
  deleteNode(): void {
    if (this.selectedCellView) {
      this.selectedCellView.model.remove();
      this.selectedCellView = null;
      this.emitWorkflowChange();
    } else {
      console.log('no selected node present to remove');
    }
  }

  /**
   * Updates the attributes of the selected port, taking into consideration an actual name change
   * and notifies subscribers about changes made to the model.
   * @param portAttributes The Actual Ports properties.
   * @param isInput Indicator wether its an In or Out port.
   * @returns Indicator about completion.
   */
  updatePort(portAttributes, isInput: boolean): boolean {
    const oldName = this.selectedPortName;
    const newName = portAttributes.displayName;
    const modelAttribute = isInput ? 'inPortsProps' : 'outPortsProps';
    let portProps = this.selectedCellView.model.get(modelAttribute);

    if (oldName !== newName) {
      if (isInput) {
        this.reRenderInPortAndLink(oldName, newName);
      } else {
        this.reRenderOutPortAndLink(oldName, newName);
      }

      const handledInportsProps = this.handlePortNameChange(
        oldName,
        newName,
        portProps,
        isInput
      );
      if (handledInportsProps === null) {
        return false;
      } else {
        portProps = handledInportsProps;
      }
    }

    portProps[newName] = portAttributes;
    this.selectedCellView.model.set(modelAttribute, portProps);
    this.emitWorkflowChange();
    return true;
  }

  /**
   * ReRenders the old ports links and multicast links with the newly generated port and deletes the old port from the cell.
   * @param oldId The legacy name of the Outport
   * @param newId The new name to be added to the Outport
   */
  private reRenderOutPortAndLink(oldId: string, newId: string) {
    const element = this.getElementById(
      this.selectedCellView.model.id
    ) as joint.shapes.devs.Model;

    const links = this.getLinks();

    const linkstoBeAdded = [];

    for (let i = 0; i < links.length; i++) {
      const targetAttrs = links[i].get('target');
      const sourceAttrs = links[i].get('source');
      const sourceElementId = links[i].getSourceElement().id;
      const targetElementId = links[i].getTargetElement().id;

      if (
        sourceAttrs.port === element.getPort(oldId).id &&
        sourceElementId === element.id
      ) {
        const link = new joint.dia.Link({
          source: {
            id: sourceAttrs.id,
            port: newId
          },
          target: {
            id: targetAttrs.id,
            port: targetAttrs.port
          },
          attrs: {
            '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
          }
        });

        linkstoBeAdded.push(link);
      }
    }

    this.changeIdOfPort(this.selectedPortName, newId);

    if (linkstoBeAdded.length > 0) {
      this.graph.addCells(linkstoBeAdded);
    }
  }

  // multiple linking problems.
  /**
   * ReRenders the old ports links and multicast links with the newly generated port and deletes the old port from the cell.
   * @param oldId The legacy name of the Outport
   * @param newId The new name to be added to the Outport
   */
  private reRenderInPortAndLink(oldId: string, newId: string) {
    const element = this.getElementById(
      this.selectedCellView.model.id
    ) as joint.shapes.devs.Model;

    const links = this.getLinks();

    for (let i = 0; i < links.length; i++) {
      const targetAttrs = links[i].get('target');
      const sourceAttrs = links[i].get('source');
      const sourceElementId = links[i].getSourceElement().id;
      const targetElementId = links[i].getTargetElement().id;

      if (
        targetAttrs.port === element.getPort(oldId).id &&
        targetElementId === element.id
      ) {
        const link = new joint.dia.Link({
          source: {
            id: sourceAttrs.id,
            port: sourceAttrs.port
          },
          target: {
            id: targetAttrs.id,
            port: newId
          },
          attrs: {
            '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
          }
        });
        this.changeIdOfPort(this.selectedPortName, newId);
        this.graph.addCell(link);
        break;
      }
    }
  }

  /**
   * Changes the ports 'id' property to the added ID.
   * @param oldId To be changed port name.
   * @param newId To be used port name.
   */
  private changeIdOfPort(oldId: string, newId: string): void {
    const flowsbterNodeModel = this.getElementById(
      this.selectedCellView.model.id
    ) as joint.shapes.devs.Model;
    flowsbterNodeModel.portProp(oldId, 'id', newId);
  }

  // creates a new entry in our Property holder object and deletes the old one. triggers the visual representation.
  /**
   * Creates a new entry in our Property holder object and deletes the old one. triggers the visual represantation(paper).
   * @param oldName The used port name.
   * @param newName The wanted port name.
   * @param portProps The actual port's properties.
   * @param isInput Indicator wether its an In or Out port.
   * @returns The updated property holder object.
   */
  private handlePortNameChange(
    oldName: string,
    newName: string,
    portProps: InputPort[] | OutputPort[],
    isInput: boolean
  ): InputPort[] | OutputPort[] {
    const portType = isInput ? 'inPorts' : 'outPorts';
    const ports = this.selectedCellView.model.get(portType);
    let foundPortIdx = -1;

    for (let i = 0; i < ports.length; i++) {
      if (ports[i] === newName) {
        alert('The port name set already exists!'); // some better error handling here. or miss this if we have the validation.
        return null;
      }
      if (ports[i] === oldName) {
        foundPortIdx = i;
      }
    }

    portProps[oldName] = undefined;

    if (foundPortIdx !== -1) {
      ports[foundPortIdx] = newName;
    }

    this.selectedCellView.model.set(portType, ports);
    this.selectedCellView.model.trigger('change:' + portType);
    this.graph.trigger('change');
    return portProps;
  }

  /**
   * Iterates through the elements of the data model.
   * @param id The id of the item you want to get from the graph.
   * @returns The found element if there is any.
   */
  private getElementById(id: string): joint.dia.Element {
    let element: joint.dia.Element;
    this.graph.getElements().forEach(el => {
      if (el.id === id) {
        element = el;
      }
    });
    return element;
  }

  /**
   * If there is a selected Node, it creates a new port with the given type and initializes its attributes on the cellview's model,
   * otherwise its gonna log a message to the console.
   * @param type The property holder objects property type for the given port.
   */
  // nem tudunk csak eltérő nevű portokat létrehozni.
  // adjunk hozzá egy sima portot, adjuk hozzá az id-t az i/o arrayhez, id- alapján állítsuk a propertyket.
  addPort(type: string): void {
    if (this.selectedCellView) {
      const element = this.getElementById(
        this.selectedCellView.model.id
      ) as joint.shapes.devs.Model;

      const portCollection = element.attributes[type];
      const portName = _.uniqueId('Port');

      console.log(portName);
      if (type === 'inPorts' && !element.hasPort(portName)) {
        element.addInPort(portName);
      } else if (type === 'outPorts' && !element.hasPort(portName)) {
        element.addOutPort(portName);
      }

      this.setPortProperties(type, portName);
      this.emitWorkflowChange();
    } else {
      console.log('select a cell first'); // we need better error handling
    }
  }

  /**
   * Resets the actual ports properties.
   * @param type The to be setted ports type (inPorts or outPorts)
   * @param portName  The to be changed ports name.
   */
  private setPortProperties(type: string, portName: string) {
    const portGroup = type === 'inPorts' ? 'inPortsProps' : 'outPortsProps';
    const portsProps = this.selectedCellView.model.get(portGroup);
    portsProps[portName] = {};

    this.selectedCellView.model.set(portGroup, portsProps);
  }

  /**
   * Notifies subscriber's about changes made to the workflow.
   */
  private emitWorkflowChange(): void {
    this.workflowChange.next();
  }

  // deletes the selected port.
  /**
   * If there is a node and a port selected, its going to delete it and notifies the subscribers about the changes made to the model,
   * Otherwise its gonna log a message to the console.
   */
  deletePort(): void {
    if (this.selectedCellView && this.selectedPortType) {
      const portType = this.selectedPortType === 'out' ? 'outPorts' : 'inPorts';
      const ports = this.selectedCellView.model.get(portType);
      ports.remove(this.selectedPortName);
      this.selectedCellView.model.set(portType, ports);
      this.selectedCellView.model.trigger('change:' + portType);
      this.emitWorkflowChange();
    } else {
      console.log('select a port first'); // we need better error handling.
    }
  }

  /**
   * Initializes a clean {@link FlowbsterNode}.
   * @returns A pristine FlowbsterNode object.
   */
  private initNode(): FlowbsterNode {
    return {
      args: '',
      name: '',
      execname: '',
      execurl: '',
      scalingmax: 1,
      scalingmin: 1
    };
  }

  /**
   * Initializes a rect on the paper from the flowbsterNode's attributes and position,
   * while setting the rects size, the label and rects color.Also define the rect's inputs and outputs colors,magnitude and filling color.
   * @param flowbsterNode Node input form data
   * @param x X axis coordinate
   * @param y Y axis coordinate
   * @returns a data model for a Flowbster Node to be used within the paper.
   */
  initNodeModel(
    flowbsterNode: FlowbsterNode,
    x: number,
    y: number
  ): joint.shapes.devs.Model {
    return new joint.shapes.devs.Model({
      position: { x, y },
      size: { width: 100, height: 100 },
      inPorts: [],
      outPorts: [],
      inPortsProps: {},
      outPortsProps: {},
      ports: {
        groups: {
          in: {
            attrs: {
              '.port-body': {
                fill: '#16A085',
                magnet: 'passive'
              }
            }
          },
          out: {
            attrs: {
              '.port-body': {
                fill: '#E74C3C'
              }
            }
          }
        }
      },
      attrs: {
        '.label': { text: flowbsterNode.name },
        '.exename': { text: flowbsterNode.execname },
        '.args': { text: flowbsterNode.args },
        '.exetgz': { text: flowbsterNode.execurl },
        '.scaling': {
          min: flowbsterNode.scalingmin,
          max: flowbsterNode.scalingmax
        },
        rect: { fill: 'green' },
        text: { fill: '#f4f4f4' }
      }
    });
  }

  /**
   * From the given DOM element we initialize the papers default attributes.
   * @param domElement the JQuery element we can bind our Paper class to.
   * @param readOnly Indicator wether you can interact with the paper.
   */
  initPaper(domElement: JQuery, readOnly: boolean): void {
    const self = this;

    this.paper = new joint.dia.Paper({
      el: domElement,
      width: domElement.width(),
      height: domElement.height(),
      gridSize: 5,
      model: this.graph,
      linkPinning: false,
      interactive: !readOnly,
      defaultLink: new joint.dia.Link({
        attrs: {
          '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
        }
      }),
      validateConnection: function(
        cellViewS,
        magnetS,
        cellViewT,
        magnetT,
        end,
        linkView
      ) {
        if (magnetS && magnetS.getAttribute('port-group') === 'in') {
          return false;
        }
        if (cellViewS === cellViewT) {
          return false;
        }

        const links = self.getLinks();
        for (let i = 0; i < links.length; i++) {
          if (
            cellViewT.model.id === links[i].get('target').id &&
            magnetT.getAttribute('port') === links[i].get('target').port
          ) {
            console.log('nem engedi');
            return false;
          }
        }

        return magnetT && magnetT.getAttribute('port-group') === 'in';
      },
      validateMagnet: function(cellView, magnet) {
        const links = self.getLinks();
        for (let i = 0; i < links.length; i++) {
          if (
            cellView.model.id === links[i].get('target').id &&
            magnet.getAttribute('port') === links[i].get('target').port
          ) {
            return false;
          }
        }
        return magnet.getAttribute('magnet') !== 'passive';
      },
      snapLinks: { radius: 25 },
      markAvailable: true
    });
  }

  // checks if the flowbsterNodes name is unique and returns the actual element.
  /**
   * Checks if the given name is in the list of the data models Elements and returns it if it is present.
   * @param name The name to search for in the list of nodes.
   * @returns The element used on the paper, if there is one, otherwise null.
   */
  getFlowbsterNodeElement(name: string): joint.dia.Element {
    const elements: joint.dia.Element[] = this.graph.getElements();
    for (const element of elements) {
      if (element.attr('.label/text') === name) {
        return element;
      }
    }
    return null;
  }

  /**
   * Ensures we are listening on all events happening on the paper.
   */
  logAllEventsOnPaper() {
    this.paper.on('all', function(event, cell) {
      console.log(arguments);
    });
  }

  /**
   * Ensures we are listening on all events happening to the data model.
   */
  logAllEventsOnGraph() {
    this.graph.on('all', function(event, cell) {
      console.log(arguments);
    });
  }

  /**
   * Ensures we are listening on the blank click event. Whenever it is happening we want to store the X,Y axis coordinates,
   * Trigger the caller's attribute, notify subscribers that it isnt an existing Node at the moment,
   * and set the modifiable node property to a clean representation.
   * @param listener A class or function who listens on this event.
   * @param modalTriggerAttribute The listeners attribute's name, that is going to be set to true.
   */
  listenOnBlankClick(listener: any, modalTriggerAttribute: string): void {
    const self = this;

    // we are going to catch the x,y information from this event to get it ready on the paper.
    this.paper.on('blank:pointerclick', function(event, x, y) {
      self.initPlacement(x, y);
      listener[modalTriggerAttribute] = true;
      self.isExistingNodeSubject.next(false);
      self.actualNode = self.initNode();
    });
  }

  /**
   * Ensures we are listening on the data models changes.
   * Whenever it happens it is going to notify the subscribers about that the workflow have been changed.
   */
  listenOnGraphChange() {
    const self = this;

    this.graph.on('change', function(cell: joint.dia.Cell) {
      console.log(this);
      self.emitWorkflowChange();
    });
  }

  /**
   * Turns off the listening on the data models changes.
   */
  stopListeningOnGraphChange() {
    this.graph.off('change');
  }

  /**
   * Ensures we are listening on the pointer up event and triggers the proper modal based on input/output ports.
   * @param listener A class or function who listens on this event.
   * @param inputTriggerAttributeName The property's name on the listener that is going to be triggered if it is an input.
   * @param outputTriggerAttributeName The property's name on the listener that is going to be triggered if it is an output.
   * @param readOnly Indicator about the papers interactivity.
   */
  listenOnPointerUp(
    listener: any,
    inputTriggerAttributeName: string,
    outputTriggerAttributeName: string,
    readOnly: boolean
  ): void {
    const self = this;

    this.paper.on('cell:pointerup', function(cellView, event, x, y) {
      const portName = event.target.getAttribute('port');
      if (portName !== null) {
        // save these from the event to the service
        self.selectedPortName = portName;
        self.selectedPortType = event.target.getAttribute('port-group'); // not sure if i need this in the service,maybe a local is enough

        if ('out' === self.selectedPortType) {
          if (cellView.sourceView) {
            self.selectCellView(cellView.sourceView, readOnly); // if the source view exists we need to select that cellview.
          }
          self.setPort(cellView, 'outPortsProps');
          listener[outputTriggerAttributeName] = true; // trigger output modal.
        } else if ('in' === self.selectedPortType) {
          self.setPort(cellView, 'inPortsProps');
          listener[inputTriggerAttributeName] = true; // trigger input modal.
        }

        console.log(self.selectedPortName + ' ' + self.selectedPortType);
        console.log(self.actualPort);
      }
    });
  }

  /**
   * Gets the attributes from the Cell View's model and sets the modifiable port's properties based on I/O
   * @param cellView The selected Cell View.
   * @param attributeName The holder object attributes name you want to use.
   */
  setPort(cellView, attributeName: string): void {
    const portAttributes = this.setPortAttributes(cellView, attributeName);

    if (undefined !== portAttributes && this.isEmpty(portAttributes)) {
      if (attributeName === 'inPortsProps') {
        console.log('setting input');
        this.actualPort = this.initPort('in');
      } else if (attributeName === 'outPortsProps') {
        this.actualPort = this.initPort('out');
        console.log('setting output');
      }
    } else {
      console.log('getting the same guy');
      this.actualPort = portAttributes;
    }
  }

  // sets the port Attributes by the given attributeName (in and output model difers)
  /**
   * Sets the port attributes by the given attributeName (in and output model difers because of events)
   * @param cellView The selected Cell View.
   * @param attributeName The holder object attributes name you want to use.
   */
  setPortAttributes(cellView, attributeName: string) {
    if (attributeName === 'inPortsProps') {
      return cellView.model.get(attributeName)[this.selectedPortName];
    }
    if (cellView.sourceView) {
      return cellView.sourceView.model.get(attributeName)[
        this.selectedPortName
      ];
    } else {
      return cellView.model.get(attributeName)[this.selectedPortName];
    }
  }

  /**
   * Checks if your object holds any attributes.
   * @param object Any object.
   * @returns An Indicator about its emptiness.
   */
  isEmpty(object: Object): boolean {
    return Object.keys(object).length === 0 && object.constructor === Object;
  }

  /**
   * Initializes a fresh port by the given type.
   * @param type Type of the port.
   * @returns a pristine In or Out port.
   */
  private initPort(type: string): InputPort | OutputPort {
    if (type === 'in') {
      return this.initInputPort();
    }

    return this.initOutputPort();
  }

  /**
   * Initializes a clean input port.
   * @returns A pristine InputPort object.
   */
  private initInputPort(): InputPort {
    return {
      name: '',
      collector: false,
      format: '',
      displayName: this.selectedPortName
    };
  }

  /**
   * Initializes a clean output port.
   * @returns A pristine OutputPort object.
   */
  private initOutputPort(): OutputPort {
    return {
      displayName: this.selectedPortName,
      name: '',
      targetname: '',
      targetip: '',
      targetport: '',
      isGenerator: false,
      filter: '',
      distribution: null
    };
  }

  /**
   * Ensures we are listening on the papers click events of the cells. Whenever it fires the actual clicked Cell is going to be selected.
   * @param readOnly Indicator about the papers inactivity.
   */
  listenOnCellClick(readOnly: boolean): void {
    const self = this;
    this.paper.on('cell:pointerclick', function(cellView, event, x, y) {
      self.selectCellView(cellView, readOnly);
    });
  }

  // listens on the double click event and updates the newNode's attributes.
  /**
   * Ensures we are listening on the double click events on the cells. Whenever it fires updates the modifiable node's properties to the
   * double clicked nodes properties,
   * triggers the modal for editing, and notifies subscribers about that it is an Existing Node that we are looking at.
   * @param listener The class or function that is listening to this event.
   * @param modalTriggerAttribute The class's attribute name that is going to be triggered.
   */
  listenOnCellDoubleClick(listener: any, modalTriggerAttribute: string): void {
    const self = this;
    this.paper.on('cell:pointerdblclick', function(cellView, event, x, y) {
      self.actualNode = {
        name: self.getSelectedJobsProperty('label', false),
        execname: self.getSelectedJobsProperty('exename', false),
        args: self.getSelectedJobsProperty('args', false),
        execurl: self.getSelectedJobsProperty('exetgz', false),
        scalingmin: +self.getSelectedJobsProperty('min', true),
        scalingmax: +self.getSelectedJobsProperty('max', true)
      };
      listener[modalTriggerAttribute] = true;
      self.isExistingNodeSubject.next(true);
      console.log(self.actualNode);
    });
  }

  /**
   * If there is a new Cell selected then its going to highlight the new one and unhighlight the previous one.
   * If the paper is read only, then its not getting highlighted at all.
   * @param cellView The Cell View we want to select.
   * @param readOnly Indicator about the interactivity.
   */
  private selectCellView(
    cellView: joint.dia.CellView,
    readOnly: boolean
  ): void {
    if (cellView !== this.selectedCellView) {
      if (this.selectedCellView != null && !readOnly) {
        this.unhighlightCellView(this.selectedCellView);
      }
      if (cellView.model !== undefined) {
        this.selectedCellView = cellView;
        if (!readOnly) {
          this.highlightCellView(this.selectedCellView);
        }
      }
    }
  }

  /**
   * Sets the actual Node's location on the paper.
   * @param x X axis coordinate
   * @param y Y axis coordinate
   */
  private initPlacement(x: number, y: number): void {
    this.actualNodePlacement = { x, y };
  }

  /**
   * Gets data from the selected Cell's model by the attribute's name.
   * @param name The attribute name you want to get from the data model.
   * @param isScale Indicator about that it is a scaling property.
   * @returns The value of the property.
   */
  private getSelectedJobsProperty(name: string, isScale: boolean): string {
    if (!this.selectedCellView) {
      return '';
    }

    if (!isScale) {
      return this.selectedCellView.model.attr('.' + name + '/text');
    }

    return this.selectedCellView.model.attr('.scaling/' + name);
  }
}
