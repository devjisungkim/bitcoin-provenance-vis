import { Component, OnInit, ViewEncapsulation, HostListener, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import { DataRetrievalService } from 'src/services/data-retrieval/data-retrieval.service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphComponent implements OnInit {
    private svg: any;
    private g: any;
    private normalTree: any;
    private root: any;
    private nodes: any;
    private links: any;
    private margin = { top: 20, right: 90, bottom: 30, left: 90 };
    private screenWidth: any;
    private screenHeight: any;
    private width: any;
    private height: any;
    private radialTree: any
    private diameter = 300;
    private duration = 750;  
    private dx: any;
    private dy: any;
    private gLink: any;
    private gNode: any;
    sidenavOpened = false;
    currentGraphType = 'normal';
    selectedNodeData = {id: "not selected"};

    constructor(
      private dataRetrieval: DataRetrievalService,
      private router: Router,
      private renderer: Renderer2
    ) {  }

    ngOnInit() {
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight; 
      this.dataRetrieval.requestHierarchyData().subscribe((data: any) => {
        //console.log(data)
        //const startTime = performance.now();
        this.initializeTree(data);
        //const endTime = performance.now();
        //const generationTime = endTime - startTime;
        //console.log(`Render time: ${generationTime/100} seconds`);
      });
    }

    @HostListener('window:scroll', ['$event'])
    onScroll(event: Event): void {
      event.preventDefault();
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }

    initializeTree(data: any) {    
      this.width = this.screenWidth - this.margin.left - this.margin.right;
      this.height = this.screenHeight - this.margin.top - this.margin.bottom;

      this.root = d3.hierarchy(data);
      this.dx = 40;
      this.dy = (this.width - this.margin.right - this.margin.left) / (1 + this.root.height);
      this.normalTree = d3.tree().nodeSize([this.dx, this.dy]);

      this.normalTree(this.root);

      this.svg = d3.selectAll('#graphContainer')
        .append('svg')
        .attr('width', this.screenWidth)
        .attr('height', this.screenHeight)
        .attr("style", "max-width: 100%; height: auto; user-select: none;");

      this.g = this.svg.append('g')
        //.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
        .attr("transform", "translate(" + (this.width/2) + "," + (this.height/2) + ")");
      
      this.gLink = this.g.append('g')
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

      this.gNode = this.g.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

      const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", (event:any) => {
          this.g.attr("transform", event.transform);
      });

      this.svg.call(zoom)
        .call(zoom.transform, d3.zoomIdentity.translate(this.width/2, this.height/2).scale(1))
        .on("dblclick.zoom", null);

      this.radialTree = d3.tree()
        .nodeSize([this.dx, this.dy])
        .separation(function(a, b) {
          return (a.parent == b.parent ? 1 : 2) / a.depth;
        });

      this.root.x0 = this.dy / 2;
      this.root.y0 = 0;
      this.root.descendants().forEach((d:any, i:any) => {
        d.id = i
        if (d._children) {
          d.children = d._children;
          d._children = null;
        }
      });
      this.updateTreeGraph(null, this.root)
    }

    updateTreeGraph(event:any, source:any) {
      this.duration = event?.altKey ? 2500 : 750;
      this.links = this.root.descendants().slice(1);
      this.nodes = this.root.descendants();

      let left = this.root;
      let right = this.root;
      this.root.eachBefore((node:any) => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      this.root.each(function(d:any) {
        d.y = d.depth * 180;
      });

/*
      const height = right.x - left.x + this.margin.top + this.margin.bottom;

      const transition = this.svg.transition()
        .duration(this.duration)
        .attr("height", height)
        .attr("viewBox", [-this.margin.left, left.x - this.margin.top, this.width, height])
        .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));
*/

      const link = this.gLink.selectAll('path')
        .data(this.links, (d:any) => d.id)

      const linkEnter = link.enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", () => {
          const o = { x: source.x0, y: source.y0 };
          return this.diagonal(o, o);
        });

      const linkUpdate = linkEnter.merge(link);

      linkUpdate.transition()
        .duration(this.duration)
        .attr("d", (d:any) => this.diagonal(d, d.parent)); 

      link.exit()
        .transition()
        .duration(this.duration)
        .remove()
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return this.diagonal(o, o);
        });

      const node = this.gNode.selectAll("g")
        .data(this.nodes, (d:any) => d.id);

      const nodeEnter = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.y0},${source.x0})`)
        .on("dblclick", (event:any, d:any) => {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          this.updateTreeGraph(event, d)
        })
        .on('click',(event: any, d: any) => {
          this.selectNode(d);
        });

      nodeEnter
        .attr("class", "node")
        .attr("r", 1e-6)
        .style("fill", function(d:any) {
          return d.parent ? "var(--content-bg-color)" : "red";
        });

      nodeEnter.append("rect")
        .attr("rx", function(d:any) {
          if (d.parent) return d.children || d._children ? 0 : 6;
          return 10;
        })
        .attr("ry", function(d:any) {
          if (d.parent) return d.children || d._children ? 0 : 6;
          return 10;
        })
        .attr("stroke-width", function(d:any) {
          return d.parent ? 1 : 0;
        })
        .attr("stroke", "#FFD700")
        .attr("stroke-dasharray", function(d:any) {
          return d.children || d._children ? "0" : "2.2";
        })
        .attr("stroke-opacity", "1")
        .attr("x", 0)
        .attr("y", -10)
        .attr("width", function(d:any) {
          return d.parent ? 40 : 20;
        })
        .attr("height", 20);    

      nodeEnter
        .append("text")
        .style("fill", "white")
        .attr("dy", ".35em")
        .attr("x", function(d:any) {
          return d.parent ? 20 : 10;
        })
        .attr("text-anchor", "middle")
        .text(function(d:any) {
          return d.parent ? "" : "T";
        });

      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition()
        .duration(this.duration)
        .attr("transform", function(d:any) {
          return "translate(" + d.y + "," + d.x + ")";
      });

      const nodeExit = node.exit()
        .transition()
        .duration(this.duration)
        .remove()
        .attr("transform", function() {
          return "translate(" + source.y + "," + source.x + ")";
        });

      this.nodes.forEach(function(d:any) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    transitionToRadial(event:any, source:any) {
      this.currentGraphType = 'radial';
      this.radialTree(this.root);

      const link = this.gLink.selectAll('path')
        .data(this.links, (d: any) => d.id);

      const linkEnter = link.enter()
      
      linkEnter.transition()
        .duration(this.duration)
        .attr("d", d3.linkRadial()
          .angle((d:any) => d.x)
          .radius((d:any) => d.y));

      const linkUpdate = linkEnter.merge(link)

      linkUpdate.transition()
        .duration(this.duration)
        .attr("d", d3.linkRadial()
          .angle((d:any) => source.x)
          .radius((d:any) => source.y));
    
      const node = this.gNode.selectAll('g')
        .data(this.links, (d: any) => d.id);
    
      node.transition()
        .duration(this.duration)
        .attr("transform", (d:any) => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
    }    

    selectNode(node:any) {
      d3.selectAll('.selected-node').classed('selected-node', false);
      this.svg.selectAll('.node')
        .filter((d: any) => d === node)
        .select('circle')
        .classed('selected-node', true);

      this.selectedNodeData = { id: node.data.name };
    }

    transitionToTree() {
      this.currentGraphType = "normal";
      this.normalTree(this.root);

      this.gLink.selectAll("path")
        .data(this.links)
        .transition()
        .duration(this.duration)
        .attr('d', d3.linkHorizontal()
          .x((d:any) => d.y)
          .y((d:any) => d.x)); 

      this.gNode.selectAll("g")
        .data(this.nodes)
        .transition()
        .duration(this.duration)
        .attr("transform", function (d:any) {
            return "translate(" + d.y + "," + d.x + ")";
        });
    }

    diagonal(s:any, d:any) {
      let path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
      return path;
    }

    switchGraphType() {
      if (this.currentGraphType == 'normal') {
        this.transitionToRadial(null, this.root)
      } else {
        this.transitionToTree()
      }
    }

    navigateToDetail() {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/detail'])
      );
      window.open(url, '_blank');
    }
}
