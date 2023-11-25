import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-graph-test',
  templateUrl: './graph-test.component.html',
  styleUrls: ['./graph-test.component.scss']
})
export class GraphTestComponent implements OnInit {
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
  private duration = 750;  
  private gLink: any;
  private gNode: any;
  private expandedCluster: any;
  private reservedOriginalTreeData: any;

  constructor(
  ) {  }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 
    const data = {
      id: 1,
      children: [
        {
          id: 'cluster1',
          transactions: [{ 
            id: 2,
            amount: 20,
            children: [
              {
                id: 4,
                amount: 200,
                children: [
                  {
                    id: 6,
                    amount: 1
                  }
                ]
              },
            ]
          },
          {
            id: 90,
            amount: 700
          }],
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
          }]
        }
      ]
    }

    this.initializeGraph(data)
  }

  initializeGraph(data:any) {
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
      .scaleExtent([0.4, 2])
      .on("zoom", (event:any) => {
        const currentZoomScale = event.transform.k;
        
        function findNearestCluster(root: any, mouseX: number, mouseY: number):any {
          let closestNode = null;
          let closestDistance = Number.MAX_VALUE;
        
          function visit(node: any) {
            const [y, x] = [node.x, node.y];
            // Euclidean distance
            const distance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
        
            if (distance < closestDistance) {
              closestDistance = distance;
              closestNode = node;
            }

            if (node.children) {
              node.children.forEach(visit)
            }
          }
        
          if (root.children) {
            root.children.forEach(visit)
          }
          return closestNode;
        }

        const [mouseX, mouseY] = event.transform.invert(d3.pointer(event, this.svg.node()));

        if (currentZoomScale >= 0.85 && !this.expandedCluster) {
          const nearestNode = findNearestCluster(this.root, mouseX, mouseY);
          this.expandedCluster = nearestNode

          if (typeof nearestNode.data.id === 'string' && nearestNode.data.id.includes('cluster')) {
            const transactionsInsideCluster = nearestNode.data.transactions
            const subsequentClusters = nearestNode.children
  
            // calculate the depth of tree
            const getDepth = (node:any): number => {
              if (!node.children || node.children.length === 0) {
                  return 1;
              } else {
                  return 1 + Math.max(...node.children.map(getDepth));
              }
            };
            const innerDepth = getDepth({ children: transactionsInsideCluster });
  
            function releaseFromCluster(node:any, depth:number, parent:any) {
              node.depth = depth
              node.parent = parent
              node.data = node
  
              if (node.children && node.children.length > 0) {
                node.children.forEach((child:any) => releaseFromCluster(child, depth + 1, node));
              } else {
                let nextParent = node
                const depth = nearestNode.depth + innerDepth - 1
                if (subsequentClusters) {
                  const subsequentClustersClone = subsequentClusters.map((cluster:any, index:number) => {
                    const clonedCluster = { ...cluster };
                    clonedCluster.parent = nextParent;
                    clonedCluster.depth = depth + index;
                    nextParent = clonedCluster;
                    return clonedCluster;
                  });
                  node.children = subsequentClustersClone;
                }
              }
              return node
            }
  
            const newChildren = transactionsInsideCluster.map((transaction:any) => {
              return releaseFromCluster(transaction, nearestNode.depth, nearestNode.parent);
            });
            
            nearestNode.parent.children = newChildren
            nearestNode.parent.data.children = newChildren
            this.updateTreeGraph(nearestNode);
          }
        } else if (currentZoomScale < 0.85 && this.expandedCluster) {
          this.nodes.forEach((d:any) => {
            // COMPARE PARENT
            if (d.depth > 0 && d.parent.data.id === this.expandedCluster.parent.data.id) {
              d.parent.children = [this.expandedCluster]
              d.parent.data.children =  [this.expandedCluster]
            }
          })
          const nearestNode = this.expandedCluster
          this.expandedCluster = undefined
          this.updateTreeGraph(nearestNode)
        }
        this.g.attr("transform", event.transform);
      });

    this.svg.call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(this.width/3, this.height/2).scale(0.5))
      .on("dblclick.zoom", null);

    this.root.x0 = 0;
    this.root.y0 = 0;

    // Expand all nodes
    this.root.descendants().forEach((d:any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    });

    this.reservedOriginalTreeData = this.root
    this.updateTreeGraph(this.root)
  }

  updateTreeGraph(source:any) {
    this.tree(this.root)

    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();

    //console.log("Root", this.root)
    console.log("Nodes", this.nodes)
    console.log("ExpandedCluster", this.expandedCluster)
    //console.log(this.root.descendants().reverse()) // reverse order of nodes

    let postExpandedNodes = false

    this.nodes.forEach((d:any) => {
      d.y = d.depth * 180;
      
      if (typeof d.data.id === 'number') {
        const centreX = d.parent ? d.parent.x : this.width / 2;
        const nodesAtDepth = this.nodes.filter((node:any) => node.depth === d.depth);
        const numNodesAtDepth = nodesAtDepth.length;
        const index = nodesAtDepth.indexOf(d);
        const spacing = this.width / (numNodesAtDepth + 1);
        d.x = centreX + (index - (numNodesAtDepth - 1) / 2) * spacing;
        // skip root
        if (d.depth > 0) {
          postExpandedNodes = true
        }
      } else if (postExpandedNodes && typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
        if (this.expandedCluster && this.expandedCluster.children) {
          this.expandedCluster.children.forEach((child:any) => {
            if (child.data.id == d.data.id) {
              d.x = child.x
            }
          });
        }
      } else {
        this.reservedOriginalTreeData.children.forEach((child:any) => {
          if (child.data.id == d.data.id) {
            d.x = child.x
          }
        })
      }
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
      .on("click", function(event:any, d:any) {
        console.log(d.data.id, d.amount)
      })
      
    nodeEnter
      .attr("r", 1e-6)
      .style("fill", function(d:any) {
        return d.parent ? "var(--content-bg-color)" : "red";
      });

    nodeEnter
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

    const linkUpdate = linkEnter.merge(link)

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
