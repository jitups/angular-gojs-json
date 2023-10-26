/**
 * Sample app showcasing gojs-angular components
 * For use with gojs-angular version 2.x
 */

import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { LibraryComponent } from './library/library.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(LibraryComponent) graphComponent: LibraryComponent;
  nodeList = [
    { id: '1', text: '1', color: 'lightblue' },
    { id: '2', text: '2', color: 'orange' },
    {
      id: '3',
      text: 'jhasdhasjdbasj',
      color: 'lightgreen',
      category: 'simple',
    },
    { id: '4', text: '4', color: 'pink', category: 'simple' },
    {
      id: '5',
      category: 'custom',
      fig: 'RoundedTopRectangle',
      p1: 300,
      metaData: {
        additionalMetric: [
          {
            label: 'AHT',
            icon: 'assessment',
            value: '1m 28s',
            index: 0,
          },
          {
            label: 'Effort',
            icon: 'schedule',
            value: '29m 27s',
            index: 1,
          },
        ],
      },
    },
    { id: '6', text: '6', color: 'pink' },
  ];
  linkList = [
    { key: -1, from: '1', to: '2' },
    { key: -2, from: '2', to: '3' },
    { key: -3, from: '2', to: '4' },
    { key: -4, from: '3', to: '5' },
    { key: -5, from: '4', to: '6' },
  ];

  ngAfterViewInit() {
    const go = this.graphComponent.goObject;
    const $ = this.graphComponent.goObject.GraphObject.make;
    go.Shape.defineFigureGenerator(
      'RoundedTopRectangle',
      function (shape, w, h) {
        var p1 = h / 2; // limit by whole height or by half height?
        var geo = new go.Geometry();
        geo.add(
          new go.PathFigure(0, p1)
            .add(
              new go.PathSegment(go.PathSegment.Arc, 180, 90, p1, p1, p1, p1)
            )
            .add(
              new go.PathSegment(
                go.PathSegment.Arc,
                270,
                90,
                w - p1,
                p1,
                p1,
                p1
              )
            )
            .add(
              new go.PathSegment(
                go.PathSegment.Arc,
                0,
                90,
                w - p1,
                h - p1,
                p1,
                p1
              )
            )
            .add(
              new go.PathSegment(
                go.PathSegment.Arc,
                90,
                90,
                p1,
                h - p1,
                p1,
                p1
              ).close()
            )
        );
        // don't intersect with two top corners when used in an "Auto" Panel
        geo.spot1 = new go.Spot(0, 0, 0.3 * p1, 0.3 * p1);
        geo.spot2 = new go.Spot(1, 1, -0.3 * p1, 0);
        return geo;
      }
    );
    const customtemplate = $(
      go.Node,
      'Auto',
      $(
        go.Shape,
        {
          name: 'SHAPE',
          fill: '#F7F9FE',
          stroke: '#D6E2FA',
          strokeWidth: 2,
          figure: 'RoundedTopRectangle',
        },
        new go.Binding('parameter1', 'p1')
      ),
      $(
        go.Panel,
        'Horizontal',
        new go.Binding('itemArray', 'metaData', (metaData) => {
          return metaData?.additionalMetric;
        }),
        {
          itemTemplate: $(
            go.Panel,
            'Horizontal',
            new go.Binding('padding', '', (c) => {
              if (c.index === 0) {
                return 0;
              }
              return new go.Margin(0, 0, 0, 10);
            }),
            $(
              go.TextBlock,
              {
                stroke: '#85A9EF',
                font: '14px Open Sans',
                margin: new go.Margin(0, 5, 0, 0),
              },
              new go.Binding('text', 'label')
            ),
            $(
              go.TextBlock,
              {
                stroke: '#9B9AA7',
                font: '14px Open Sans',
                margin: new go.Margin(0, 5, 0, 0),
              },
              new go.Binding('text', 'value')
            )
          ),
        }
      )
    );
    this.graphComponent.addCustomTemplates([
      { name: 'custom', template: customtemplate },
    ]);
    // Wrapping the below line in settimout will add the node properly
    // this.addDummyNode();
  }

  addDummyNode() {
    const nodeData = {
      id: '7',
      text: '7',
      color: 'red',
    };
    const listData = {
      key: -6,
      from: '6',
      to: '7',
    };
    this.graphComponent.addNewNode(nodeData, listData);
  }
}
