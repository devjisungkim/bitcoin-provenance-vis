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
  private newChildren: any;

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

        if (currentZoomScale >= 0.6 && !this.expandedCluster) {
          const nearestNode = findNearestCluster(this.root, mouseX, mouseY);
          this.expandedCluster = parse(stringify(nearestNode))
          
          if (typeof nearestNode.data.id === 'string' && nearestNode.data.id.includes('cluster')) {
            const transactionsInsideCluster = JSON.parse(JSON.stringify(nearestNode.data.transactions))
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
            let hiddenNodeAdded = false;
  
            function releaseFromCluster(node:any, depth:number, parent:any) {
              node.depth = depth
              node.parent = parent
              node.data = node
  
              if (node.children && node.children.length > 0) {
                node.children.forEach((child:any) => releaseFromCluster(child, depth + 1, node));
              } else {

                if (subsequentClusters) {
                  const depth = nearestNode.depth + innerDepth; // - 1

                  // Update subsequent nodes
                  let nextParent:any = null
                  let previousHiddenParent:boolean = true
                  let previousOriginalDepth = -1
                  let previousUpdatedCluster: any
            
                  const subsequentClustersClone = subsequentClusters.map((cluster:any, index:number) => {
                    const clonedCluster = { ...cluster }
                    if (index > 0 && nextParent) {
                      if (clonedCluster.depth === previousOriginalDepth) {
                        clonedCluster.parent = previousUpdatedCluster.parent
                        clonedCluster.data.hiddenParent = previousHiddenParent
                        clonedCluster.depth = previousUpdatedCluster.depth
                      } else {
                        previousOriginalDepth = clonedCluster.depth
                        clonedCluster.parent = nextParent
                        clonedCluster.data.hiddenParent = false
                        clonedCluster.depth = depth + index
                      }
                    } else {
                      previousOriginalDepth = clonedCluster.depth
                      clonedCluster.parent = nextParent
                      clonedCluster.data.hiddenParent = previousHiddenParent
                      clonedCluster.depth = depth + index
                    }
                    previousUpdatedCluster = clonedCluster
                    nextParent = clonedCluster;
                    return clonedCluster;
                  });

                  const hiddenNodeIndices = subsequentClustersClone.reduce((indices:any, cluster:any, index:any) => {
                    if (cluster.data.hiddenParent === true) {
                      indices.push(index);
                    }
                    return indices;
                  }, []);

                  if (!hiddenNodeAdded) {
                    const hiddenNodeChildren = {
                      id: 'hidden',
                      depth: depth - 1,
                      data: {
                        id: 'hidden',
                        children: subsequentClustersClone
                      },
                      parent: node,
                      children: subsequentClustersClone
                    };

                    for (let i in hiddenNodeIndices) {
                      subsequentClustersClone[i].parent = hiddenNodeChildren
                    }

                    node.children = [hiddenNodeChildren];
                    hiddenNodeAdded = true

                  } else {
                    const hiddenNodeNoChildren = {
                      id: 'hidden',
                      depth: depth - 1,
                      data: {
                        id: 'hidden',
                      },
                      parent: node
                    };
                    
                    node.children = [hiddenNodeNoChildren];
                  }
                }
              }
              return node
            }
  
            this.newChildren = transactionsInsideCluster.map((transaction:any) => {
              return releaseFromCluster(transaction, nearestNode.depth, nearestNode.parent);
            });
            
            const indexOfNearestNode = nearestNode.parent.children.indexOf(nearestNode);
            nearestNode.parent.children.splice(indexOfNearestNode, this.newChildren.length, ...this.newChildren);
            nearestNode.parent.data.children = nearestNode.parent.children;
            console.log(parse(stringify(nearestNode)))
            this.updateTreeGraph(nearestNode);
          }
        } else if (currentZoomScale < 0.6 && this.expandedCluster) {
          const originalParent = this.expandedCluster.parent;
          const index = originalParent.children.indexOf(this.expandedCluster);

          let visited = false
          this.nodes.forEach((d:any) => {
            if (d.depth > 0 && d.parent.data.id === originalParent.data.id && !visited) {
              for (let i = index; i < index + this.newChildren.length; i++) {
                if (i === index) {
                  d.parent.children[i] = this.expandedCluster
                  d.parent.data.children[i] = this.expandedCluster
                } else {
                  d.parent.children[i] = null
                  d.parent.data.children[i] = null
                }
              }
              d.parent.children = d.parent.children.filter((child:any) => child !== null);
              d.parent.data.children = d.parent.data.children.filter((child:any) => child !== null);

              visited = true
            }
          });
          
          const returnNode = this.expandedCluster
          this.expandedCluster = undefined

          this.updateTreeGraph(returnNode)
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

    this.updateTreeGraph(this.root)
  }

  updateTreeGraph(source:any) {
    console.log(parse(stringify(this.root)))
    this.tree(this.root);
    
    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();
    
    if (!this.reservedOriginalTreeData) {
      this.reservedOriginalTreeData = parse(stringify(this.root.descendants()));
    };

    //console.log("Root", this.root)
    console.log("Nodes", this.nodes);
    //console.log("ExpandedCluster", this.expandedCluster)

    let postExpandedNodes = false;

    let averageX = 0;
    const hiddenNodes = this.nodes.filter((d:any) => typeof d.data.id === 'string' && d.data.id === 'hidden');
    if (hiddenNodes.length > 0) {
      averageX = hiddenNodes.reduce((sum:any, node:any) => sum + node.x, 0) / hiddenNodes.length;
    };

    const positionDifference = this.reservedOriginalTreeData[0].x - this.root.x

    this.nodes.forEach((d:any) => {
      d.y = d.depth * 180;  
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
      });
      
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
      })
      .style('opacity', function(d:any) {
        // Check if the node has the id 'hidden' and make it invisible
        return d.data && d.data.id === 'hidden' ? 0 : 1;
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
