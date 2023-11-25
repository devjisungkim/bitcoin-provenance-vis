import { Component, OnInit, ViewEncapsulation, HostListener, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  private tree: any;
  private root: any;
  private nodes: any;
  private links: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private screenWidth: any;
  private screenHeight: any;
  private width: any;
  private height: any;
  private radialCluster: any
  private diameter = 300;
  private duration = 750;  
  private gLink: any;
  private gNode: any;
  sidenavOpened = false;
  currentGraphType = 'normal';
  selectedTransactionData: any;
  graphLoading = false;
  detailLoading = false;

  constructor(
    private dataRetrieval: DataRetrievalService,
    private activatedRoute: ActivatedRoute,
    private renderer: Renderer2
  ) {  }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 
    this.activatedRoute.params.subscribe(params => { 
      this.graphLoading = true;
      this.dataRetrieval.getHierarchyData(params['id']).subscribe((data: any) => {
        setTimeout(() => {
          this.graphLoading = false;
          this.initializeTree(data);
        }, 1500);
      });
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

    this.root = d3.hierarchy(data, (d:any) => d.children);

    this.tree = d3.tree().size([this.width, this.height])
  
    this.svg = d3.selectAll('#graphContainer')
      .append('svg')
      .attr('width', this.screenWidth)
      .attr('height', this.screenHeight)
      .attr("style", "max-width: 100%; height: auto; user-select: none;");

    this.g = this.svg.append('g')
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
      .scaleExtent([0.7, 2])
      .on("zoom", (event:any) => {
        this.g.attr("transform", event.transform);
      });

    this.svg.call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(this.width/4, this.height/3).scale(0.7))
      .on("dblclick.zoom", null);

    this.radialCluster = d3.cluster()
      .size([360, this.diameter / 2])
      .separation(function(a, b) {
          return (a.parent == b.parent ? 1 : 10) / a.depth;
      });

    this.root.x0 = 0;
    this.root.y0 = 0;

    // Expand all nodes
    this.root.descendants().forEach((d:any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    });

    this.updateTreeGraph(this.root)
  }

  updateTreeGraph(source:any) {
    this.tree(this.root)

    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();

    console.log(this.width)
    const fakeNodes = this.root.descendants().reverse()
    fakeNodes.forEach((d:any) => {
      console.log(d.depth, d.x)
    })

    this.nodes.forEach((d:any) => {
      d.y = d.depth * 180;
    });

    let left = this.root;
    let right = this.root;

    this.root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + this.margin.top + this.margin.bottom;

    const transition = this.svg.transition()
      .duration(this.duration)
      .attr("viewBox", [-this.margin.left, left.x - this.margin.top, this.width, height])
      .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));

    let i = 0;
    const node = this.gNode.selectAll("g.node").data(this.nodes, (d:any) => d.id || (d.id = ++i));

    const nodeEnter = node
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr("transform", function() {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("dblclick", (event:any, d:any) => {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        if (this.currentGraphType == 'normal') {
          this.updateTreeGraph(d)
        } else {
          this.transitionToRadial(d)
        }
      })
      .on('click',(event: any, d: any) => {
        this.viewTransactionInDetail(d);
      });

    nodeEnter
      .attr("r", 1e-6)
      .style("fill", function(d:any) {
        return d.parent ? "var(--content-bg-color)" : "red";
      });

    nodeEnter
      .append("rect")
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

    const nodeUpdate = nodeEnter.merge(node)

    nodeUpdate
      .transition(transition)
      .duration(this.duration)
      .attr('transform', function(d:any) {
        return 'translate(' + d.y + ',' + d.x + ')';
      });

    const nodeExit = node
      .exit()
      .transition(transition)
      .duration(this.duration)
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    const link = this.gLink.selectAll('path.link').data(this.links, (d:any) => d.id);

    const linkEnter = link
      .enter()
      .insert("path", "g")
      .attr('class', 'link')
      .attr("d", () => {
        const o = { 
          x: source.x0, 
          y: source.y0 
        };
        return this.diagonal(o, o);
      });

    linkEnter
      .append("rect")
      .attr("class", "link-hover-boundary")
      .attr("height", 20) 
      .attr("width", 180)
      .attr("fill", "red")
      .style("z-index", 1)

    linkEnter
      .on('mouseover', (event:any, d:any) => {
        this.showAmountAboveLink(d);
        d3.select(event.currentTarget).classed('hovered', true);
      })
      .on('mouseout', (event:any, d:any) => {
        this.showAmountAboveLink(null);
        d3.select(event.currentTarget).classed('hovered', false);
      });

    const linkUpdate = linkEnter.merge(link)

    linkUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d:any) => {
        return this.diagonal(d, d.parent); 
      })
      .attr('stroke-width', (d:any) => {
        const weight = d.data.amount / 100
        return Math.max(1, Math.min(weight, 15))
      });

    const linkExit = link
      .exit()
      .transition(transition)
      .duration(this.duration)
      .attr("d", () => {
        const o = { 
          x: source.x, 
          y: source.y 
        };
        return this.diagonal(o, o);
      })
      .remove()
  
    this.nodes.forEach((d:any) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
  }

  transitionToRadial(source: any) {
    this.radialCluster(this.root)

    this.links = this.root.links();
    this.nodes = this.root.descendants().reverse();
  
    this.nodes.forEach(function (d:any) {
      d.x += Math.PI / 2;
      d.y *= 2
      //d.y = d.depth * 80
    });
  
    let i = 0;
    const node = this.gNode.selectAll('g.node').data(this.nodes, (d:any) => d.id || (d.id = ++i))

    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', 'node')

    const nodeUpdate = nodeEnter.merge(node)

    nodeUpdate
      .transition()
      .duration(this.duration)
      .attr("transform", function(d:any) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

    const link = this.gLink.selectAll('path.link').data(this.links, (d:any) => d.id)

    const linkEnter = link
      .enter()
      .insert("path", "g")
      .attr('class', 'link')
      .attr("d", d3.linkRadial().angle(() => source.x0).radius(() => source.y0));

    const linkUpdate = linkEnter.merge(link)

    linkUpdate
      .transition()
      .duration(this.duration)
      .attr('d', d3.linkRadial().angle((d:any) => d.x).radius((d:any) => d.y));

    link 
      .exit()
      .transition()
      .duration(this.duration)
      .attr("d", d3.linkRadial().angle(() => source.x).radius(() => source.y))
      .remove();

    this.nodes.forEach(function(d:any) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    this.currentGraphType = 'radial';
  }    

  viewTransactionInDetail(node:any) {
    d3.selectAll('.selected-node').classed('selected-node', false);

    this.detailLoading = true
    this.selectedTransactionData = this.dataRetrieval.getTransactionMetadata(node.data.id).subscribe((data:any) => { 
      setTimeout(() => { 
        this.selectedTransactionData = data
        this.detailLoading = false
      }, 1500);
    });

    this.gNode.selectAll('g.node')
      .filter((d: any) => d === node)
      .select('rect')
      .attr('class', 'selected-node')
  }

  showAmountAboveLink(link:any) {
    d3.selectAll('.selected-link').remove();
    
    if (link) { 
      const x = link.x
      const y = link.y

      this.g.append('text')
        .attr('class', 'selected-link')
        .attr('transform', `translate(${x},${y})`)
        .attr('text-anchor', 'middle')
        .text(`Amount Transferred: ${link.data.amount}`);
    }
  }

  diagonal(s:any, t:any) {
    // Define source and target x,y coordinates
    const x = s.y;
    const y = s.x;
    const ex = t.y;
    const ey = t.x;

    // Values in case of top reversed and left reversed diagonals
    let xrvs = ex - x < 0 ? -1 : 1;
    let yrvs = ey - y < 0 ? -1 : 1;

    // Define the preferred curve radius
    let rdef = 35;

    // Reduce curve radius if source-target x space is smaller
    let r = Math.abs(ex - x) / 2 < rdef ? Math.abs(ex - x) / 2 : rdef;

    // Further reduce curve radius if y space is smaller
    r = Math.abs(ey - y) / 2 < r ? Math.abs(ey - y) / 2 : r;

    // Define the width and height of the link, excluding the radius
    let h = Math.abs(ey - y) / 2 - r;
    let w = Math.abs(ex - x) / 2 - r;

    // Build and return a custom arc command
    return `
          M ${x} ${y}
          L ${x + w * xrvs} ${y}
          C ${x + w * xrvs + r * xrvs} ${y}
            ${x + w * xrvs + r * xrvs} ${y}
            ${x + w * xrvs + r * xrvs} ${y + r * yrvs}
          L ${x + w * xrvs + r * xrvs} ${ey - r * yrvs}
          C ${x + w * xrvs + r * xrvs}  ${ey}
            ${x + w * xrvs + r * xrvs}  ${ey}
            ${ex - w * xrvs}  ${ey}
          L ${ex} ${ey}
    `;
  }

  switchGraphType() {
    if (this.currentGraphType == 'normal') {
      this.transitionToRadial(this.root)
    } else {
      this.updateTreeGraph(this.root)
    }
  }
}
