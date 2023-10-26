import { NullVisitor } from '@angular/compiler/src/render3/r3_ast';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import * as go from 'gojs';
import { DataSyncService, DiagramComponent } from 'gojs-angular';
import produce from 'immer';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css'],
})
export class LibraryComponent {
  @Input() set nodeList(list) {
    this.state.diagramNodeData = list;
  }
  @Input() set linkList(list) {
    this.state.diagramLinkData = list;
  }
  @ViewChild('myDiagram', { static: true })
  public myDiagramComponent: DiagramComponent;
  @Output() rightClick = new EventEmitter();
  public goObject = go;

  // Big object that holds app-level state data
  // As of gojs-angular 2.0, immutability is expected and required of state for ease of change detection.
  // Whenever updating state, immutability must be preserved. It is recommended to use immer for this, a small package that makes working with immutable data easy.
  public state = {
    // Diagram state props
    diagramNodeData: [],
    diagramLinkData: [],
    diagramModelData: {},
    skipsDiagramUpdate: false,
  };

  public diagramDivClassName: string = 'myDiagramDiv';

  constructor(private cdr: ChangeDetectorRef) {
    // setTimeout(() => {
    //   this.addNewNode(nodeData, listData);
    //   console.log("timedout");
    // }, 5000);
    this.initDiagram = this.initDiagram.bind(this);
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit library');
    this.cdr.detectChanges(); // IMPORTANT: without this, Angular will throw ExpressionChangedAfterItHasBeenCheckedError (dev mode only)
  }

  // initialize diagram / templates
  public initDiagram(): go.Diagram {
    const self = this;
    const $ = go.GraphObject.make;
    const dia = $(go.Diagram, {
      'undoManager.isEnabled': true,
      initialAutoScale: go.Diagram.Uniform,
      'contextMenuTool.findObjectWithContextMenu': function (obj) {
        var result =
          go.ContextMenuTool.prototype.findObjectWithContextMenu.call(
            this,
            obj
          );
        console.log('xxx', result?.part?.data?.id == 3);
        if (result?.part?.data?.id == 3) {
          return null;
        }
        console.log(self.myDiagramComponent.diagram.lastInput.documentPoint);
        return result;
      },
      'contextMenuTool.showContextMenu': function (cm, obj) {
        go.ContextMenuTool.prototype.showContextMenu.call(this, cm, obj);
      },
      layout: $(go.TreeLayout, { angle: 90 }),
      model: $(go.GraphLinksModel, {
        nodeKeyProperty: 'id',
        linkKeyProperty: 'key', // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
      }),
    });
    dia.contextMenu = $(
      'ContextMenu',
      $(
        'ContextMenuButton',
        $(go.TextBlock, { margin: 5, alignment: go.Spot.Left }, 'Dummy action')
      )
    );

    const preBuiltemplate = $(
      go.Node,
      'Auto',
      {
        contextMenu: $(
          'ContextMenu',
          $(
            'ContextMenuButton',
            $(
              go.TextBlock,
              { margin: 5, alignment: go.Spot.Left },
              'Dummy action'
            )
          )
        ),
      },
      $(go.Shape, 'Ellipse', new go.Binding('fill', 'color')),
      $(
        go.TextBlock,
        { margin: 8, editable: true },
        new go.Binding('text').makeTwoWay()
      )
    );

    // create the nodeTemplateMap, holding one prebuilt node templates:
    const templmap = new go.Map<string, go.Node>();
    // for each of the node categories, specify which template to use
    templmap.add('simple', preBuiltemplate);
    // for the default category, "", use the same template that Diagrams use by default;
    // this just shows the key value as a simple TextBlock
    templmap.add('', dia.nodeTemplate as go.Node);
    dia.nodeTemplateMap = templmap;
    return dia;
  }

  // When the diagram model changes, update app data to reflect those changes. Be sure to use immer's "produce" function to preserve immutability
  diagramModelChange(changes: go.IncrementalData) {
    console.log('modelchange', changes);
    this.state = produce(this.state, (draft) => {
      // set skipsDiagramUpdate: true since GoJS already has this update
      // this way, we don't log an unneeded transaction in the Diagram's undoManager history
      draft.skipsDiagramUpdate = true;
      draft.diagramNodeData = DataSyncService.syncNodeData(
        changes,
        draft.diagramNodeData,
        this.myDiagramComponent.diagram.model
      );
      draft.diagramLinkData = DataSyncService.syncLinkData(
        changes,
        draft.diagramLinkData,
        this.myDiagramComponent.diagram.model as go.GraphLinksModel
      );
      draft.diagramModelData = DataSyncService.syncModelData(
        changes,
        draft.diagramModelData
      );
    });
  }

  addCustomTemplates(templateList: Array<{ name: string; template: go.Node }>) {
    templateList.forEach((templateData) => {
      this.myDiagramComponent.diagram.nodeTemplateMap.add(
        templateData.name,
        templateData.template
      );
    });
    this.myDiagramComponent.diagram.rebuildParts();
  }

  addNewNode(nodeData, linkData?) {
    this.myDiagramComponent.diagram.startTransaction('make new node');
    this.myDiagramComponent.diagram.model.addNodeData(nodeData);
    if (linkData) {
      (this.myDiagramComponent.diagram.model as go.GraphLinksModel).addLinkData(
        linkData
      );
    }
    this.myDiagramComponent.diagram.commitTransaction('make new node');
  }
}
