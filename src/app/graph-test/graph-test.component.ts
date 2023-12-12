import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { parse, stringify } from 'flatted';

@Component({
  selector: 'app-graph-test',
  templateUrl: './graph-test.component.html',
  styleUrls: ['./graph-test.component.scss']
})
export class GraphTestComponent implements OnInit {
  private svg: any;
  private g: any;
  private tree: any;
  private root: any
  private nodes: any;
  private links: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private screenWidth: any;
  private screenHeight: any;
  private width: any;
  private height: any;
  private duration = 750;  
  private gLink: any;
  private gNode: any;
  private expandedCluster: any;
  private reservedOriginalTreeData: any;
  private newChildren: any;
  private zoom: any;
  private currentZoomScale = 0.4;
  private currentMousePosition: number[] = []

  constructor(
  ) {  }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 
    const data = {
      id: 1,
      children: [
        {
          id: 2,
          transactions: [],
          children: [{
            id: 'cluster2',
            transactions: [{
              id: 3,
              amount: 90,
              children: [ 
                {
                  id: 5,
                  amount: 34,
                },
                {
                  id: 8,
                  amount: 89
                }
              ]
            }]
          },
          {
            id: 'cluster3',
            transactions: [{
              id: 3,
              amount: 90,
              children: [ 
                {
                  id: 5,
                  amount: 34,
                }
              ]
            }]
          }],
        }
      ]
    }

    this.initializeGraph(data)
  }

  initializeGraph(data:any) {
    this.width = this.screenWidth - this.margin.left - this.margin.right;
    this.height = this.screenHeight - this.margin.top - this.margin.bottom;

    this.root = d3.hierarchy(data);

    this.tree = d3.tree().size([this.width, this.height])

    this.svg = d3.selectAll('#graphContainer')
    .append('svg')
    .attr('width', this.screenWidth)
    .attr('height', this.screenHeight)
    .attr("style", "max-width: 100%; height: auto; user-select: none;");

    this.g = this.svg.append('g')
      .attr("transform", "translate(" + (this.width/2) + "," + (this.height/3) + ")");
    
    this.gLink = this.g.append('g')
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.gNode = this.g.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all"); 

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
    this.tree(this.root);
    
    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();
    
    if (!this.reservedOriginalTreeData) {
      this.reservedOriginalTreeData = parse(stringify(this.root.descendants()));
    };

    //console.log("Root", this.root)
    //console.log("Nodes After Update", this.nodes);
    //console.log("ExpandedCluster", this.expandedCluster)

    let postExpandedNodes = false;

    let averageX = 0;
    const hiddenNodes = this.nodes.filter((d:any) => typeof d.data.id === 'string' && d.data.id === 'hidden');
    if (hiddenNodes.length > 0) {
      averageX = hiddenNodes.reduce((sum:any, node:any) => sum + node.x, 0) / hiddenNodes.length;
    };

    const positionDifference = this.reservedOriginalTreeData[0].x - this.root.x

    this.nodes.forEach((d:any) => {
      d.y = d.depth * 180
      d.x += positionDifference

      if (typeof d.data.id === 'string' && d.data.id === 'hidden') {
        d.x = averageX + positionDifference
        postExpandedNodes = true
      } else if (postExpandedNodes && typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
        this.reservedOriginalTreeData.forEach((cluster:any) => {
          if (cluster.data.id === d.data.id) {
            d.x = cluster.x
          }
        })
      };
    });

    let left = this.root;
    let right = this.root;

    this.root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + this.margin.top + this.margin.bottom;

    let i = 0
    const transition = this.svg.transition()
      .duration(this.duration)
      .attr("viewBox", [-this.margin.left, left.x - this.margin.top, this.width, height])
      .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));

    const node = this.gNode.selectAll("g.node").data(this.nodes, (d:any) => d.id || (d.id = ++i));

    node.select('rect')
      .attr('stroke', (d:any) => {
        if (d.data && d.data.id && typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
            return 'cyan';
        }
        return 'var(--bitcoin-theme)';
      });

    const nodeEnter = node
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr("transform", function() {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('dblclick', (event:any, d:any) => {
        if (d.depth > 0 && this.currentZoomScale < 0.6) {
          const [x, y] = d3.pointer(event, this.svg.node())
          const translateX = this.width / 2 - y;
          const translateY = this.height / 2 - x;
          this.currentMousePosition = [x, y];

          this.svg.transition().duration(this.duration)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(0.6));
        }
      })
      .on('click', function(event:any, d:any) {
        console.log(d)
      })

    nodeEnter
      .attr("r", 1e-6)
      .style("fill", function(d:any) {
        return d.parent ? "var(--theme-bg-color)" : "red";
      });

    nodeEnter
      .filter(function (d: any) {
        return typeof d.data.id === 'string' || d.depth === 0;
      })
      .append("rect")
      .attr("rx", function(d:any) {
        if (d.data && d.data.id) {
          if (typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
            return 0;
          }
        }
        if (d.parent) return d.children || d._children ? 0 : 6;
        return 10;
      })
      .attr("ry", function(d:any) {
        if (d.data && d.data.id) {
          if (typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
            return 0;
          }
        }
        if (d.parent) return d.children || d._children ? 0 : 6;
        return 10;
      })
      .attr("stroke-width", function(d:any) {
        return d.parent ? 1 : 0;
      })
      .attr("stroke", function(d:any) {
        if (d.data && d.data.id) {
          if (typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
            return 'cyan';
          }
        }
        return 'var(--bitcoin-theme)';
      })
      .attr("stroke-dasharray", function(d:any) {
        if (d.data && d.data.id) {
          if (typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
            return 0;
          }
        }
        return d.children || d._children ? "0" : "2.2";
      })
      .attr("stroke-opacity", "1")
      .attr("x", 0)
      .attr("y", -10)
      .attr("width", function(d:any) {
        return d.parent ? 40 : 20;
      })
      .attr("height", function(d:any) {
        return d.parent ? 20 : 20;
      });    

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
      })
      .style('opacity', function(d:any) {
        // Check if the node has the id 'hidden' and make it invisible
        return d.data && d.data.id === 'hidden' ? 0 : 1;
      });

    nodeUpdate
      .filter(function (d: any) {
        return d.depth > 0 && typeof d.data.id === 'number';
      })
      .append("rect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke-width", 1)
      .attr("stroke", 'var(--bitcoin-theme)')
      .attr("width", 150) 
      .attr("height", 200)
      .attr('y', -100)
      .style("fill", "var(--content-bg-color)")
      
    // Transaction info summary
    nodeUpdate
      .filter(function (d: any) {
        return d.depth > 0 && typeof d.data.id === 'number';
      })
      .append("foreignObject")
      .attr("width", 150)
      .attr("height", 200)
      .attr('y', -100)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("overflow", "auto")
      .style("box-sizing", "border-box")
      .style("padding", "10px")
      .append("p")
      .text(function(d: any) {
        return 'featureA \n featureB \n featureC \n featureD \n featureE \n featureF \n Summarization'
      });

    // Full screen icon on the top right
    nodeUpdate
      .filter(function (d: any) {
        return d.depth > 0 && typeof d.data.id === 'number';
      })
      .append("foreignObject")
      .attr("width", 150)
      .attr("height", 200)
      .attr('y', -100)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("position", "relative")
      .append("div")
      .style("position", "absolute")
      .style("top", "10px") 
      .style("right", "10px")
      .append("i")
      .attr("class", "fa-solid fa-up-right-and-down-left-from-center")
      .on('click', function(d: any) {
        const transactionDetail = document.getElementById("transaction-detail");
        if (transactionDetail) {
          transactionDetail.classList.add("show");
        }
      });

    const nodeExit = node
      .exit()
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 0)
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

    const linkUpdate = linkEnter.merge(link);

    linkUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d:any) => {
        return this.diagonal(d, d.parent); 
      })
      .attr('stroke-width', (d:any) => {
        /*
        let weight = 0
        if (d.data && d.data.amount) {
          weight = d.data.amount / 100
        }
        return Math.max(1, Math.min(weight, 15))
        */
       return 1
      })
      .style('stroke', ((d:any) => {
        return d.data && typeof d.data.id === 'number' || d.data.id === 'hidden' ? 'var(--bitcoin-theme)' : 'white';
      }))

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

    const linkText = this.gLink.selectAll('text.link-text')
      .data(this.root.links(), (d:any) => d.id);

    const linkTextEnter = linkText.enter()
      .append('text')
      .attr('class', 'link-text')
      .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d:any) {
        return d.target.data.amount;
      });

    const linkTextUpdate = linkTextEnter.merge(linkText)

    linkTextUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("transform", function (d:any) {
        return "translate(" + (d.source.y + d.target.y) / 2 + "," + (d.source.x + d.target.x) / 2 + ")";
      });

    linkText.exit()
      .transition(transition)
      .duration(this.duration)
      .attr("transform", "translate(" + source.y + "," + source.x + ")")
      .remove();
  
    this.nodes.forEach((d:any) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
  }

  closeTransactionDetailPopover() {
    const transactionDetail = document.getElementById("transaction-detail");
    if (transactionDetail) {
      transactionDetail.classList.remove("show");
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
}