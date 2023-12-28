import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { parse, stringify } from 'flatted';

type TreeComponent = {
  destTree: any;
  destRoot: any;
  destLinks: any;
  destNodes: any;
  gDest: any;
  gDestNode: any;
  gDestLink: any;
  destDuplicatePairs: any;
  initialDestTreeData: any;
  originTree: any;
  originRoot: any;
  originLinks: any;
  originNodes: any;
  gOrigin: any;
  gOriginNode: any;
  gOriginLink: any;
  originDuplicatePairs: any;
  initialOriginTreeData: any;
};

@Component({
  selector: 'app-graph-test',
  templateUrl: './graph-test.component.html',
  styleUrls: ['./graph-test.component.scss']
})
export class GraphTestComponent implements OnInit {
  private svg: any;
  private g: any;
  private gDest: any;
  private gOrigin: any;
  private destTree: any;
  private originTree: any;
  private destRoot: any;
  private originRoot: any;
  private destNodes: any;
  private originNodes: any;
  private destLinks: any;
  private originLinks: any;
  private gDestLink: any;
  private gDestNode: any;
  private gOriginLink: any;
  private gOriginNode: any;
  private destDuplicatePairs: any;
  private originDuplicatePairs: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private screenWidth: any;
  private screenHeight: any;
  private width: any;
  private height: any;
  private duration = 750;  
  private expandedCluster: any;
  private initialOriginTreeData: any;
  private initialDestTreeData: any;
  private newChildren: any;
  private currentZoomScale = 0.4;
  private currentMousePosition: number[] = [];

  constructor(
  ) {  }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    const originData = {
      id: 1,
      children: [{
        id: 'cluster1',
        transactions: []
      }]
    }

    const destData = {
      id: 1,
      amount: 1,
      children: [{
        id: 'cluster1',
        transactions: [],
        children: [{
          id: 'cluster2',
          transactions: [],
          children: [{
            id: 'cluster3',
            transactions: []
          }]
        }, {
          id: 'cluster4',
          transactions: [],
          children: [{
            id: 'cluster3',
            transactions: []
          }]
        }, {
          id: 'cluster5',
          transactions: [],
          children: [{
              id: 'cluster6',
              transactions: [],
              children: [{
                id: 'cluster3',
                transactions: []
              }]
            }]
         }]
      }]
    };

    this.width = this.screenWidth - this.margin.left - this.margin.right;
    this.height = this.screenHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.selectAll('#graphContainer')
      .append('svg')
      .attr('width', this.screenWidth)
      .attr('height', this.screenHeight)
      .attr("style", "max-width: 100%; height: auto; user-select: none;");
    
    this.g = this.svg.append('g')
      .attr("transform", "translate(" + (this.width/2) + "," + (this.height/3) + ")");
    
    const zoom = this.initializeZoomDragBehaviour()

    this.svg.call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(this.width/2, this.height/2).scale(0.4))
      .on("dblclick.zoom", null);
    
    this.initializeTree(originData, 'origin', true);
    this.initializeTree(destData, 'dest', true);
  }

  initializeZoomDragBehaviour() {
    return d3.zoom()
      .scaleExtent([0.4, 2])
      .on("zoom", (event:any) => {
        this.currentZoomScale = event.transform.k;

        function elementOutOfViewport(element: any, remove: boolean) {
          const rect = element.getBoundingClientRect();
          if (remove) {
            return (
              rect.bottom < 0 ||
              rect.right < 0 ||
              rect.top > (window.innerHeight || document.documentElement.clientHeight) ||
              rect.left > (window.innerWidth || document.documentElement.clientWidth)
            );
          } else {
            return (rect.left < 100 || rect.right > (window.innerWidth || document.documentElement.clientWidth) - 100);
          }
        }

        if (!this.expandedCluster) {
          // Remove tree if not in viewport
          const originGroup = document.getElementById("origin-group");
          const destGroup = document.getElementById("dest-group");
        
          if (originGroup && elementOutOfViewport(originGroup, true)) {
            this.gOrigin
              .transition()
              .duration(this.duration)
              .remove();
          } else if (!originGroup && destGroup && !elementOutOfViewport(destGroup, false)) {
            this.initializeTree(null, 'origin', false)
          }

          if (destGroup && elementOutOfViewport(destGroup, true)) {
            this.gDest
              .transition()
              .duration(this.duration)
              .remove();
          } else if (!destGroup && originGroup && !elementOutOfViewport(originGroup, false)) {
            this.initializeTree(null, 'dest', false);
          }
        }

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

        let side: string;
        let oppositeSide: string;
        const [mouseX, mouseY] = this.currentMousePosition.length > 0 ? event.transform.invert(this.currentMousePosition) : event.transform.invert(d3.pointer(event, this.svg.node()))

        if (this.currentZoomScale >= 0.6 && !this.expandedCluster) {
          side = mouseX < 0 ? 'origin' : 'dest';

          const root = `${side}Root` as keyof TreeComponent;
          const nodes = `${side}Nodes` as keyof TreeComponent;

          // Remove the opposite tree while other tree is focused (purpose: to reduce the number of nodes)
          oppositeSide = mouseX > 0 ? 'origin' : 'dest';
          const oppositeGroup = `g${oppositeSide.charAt(0).toUpperCase() + oppositeSide.slice(1)}` as keyof TreeComponent;
          this[oppositeGroup]
            .transition()
            .duration(this.duration)
            .style("opacity", 0)
            .remove();

          const nearestNode = findNearestCluster(this[root], mouseX, mouseY);
          this.expandedCluster = parse(stringify(nearestNode));
          
          if (typeof nearestNode.data.id === 'string' && nearestNode.data.id.includes('cluster')) {
            const transactionsInsideCluster = JSON.parse(JSON.stringify(nearestNode.data.transactions));
            const subsequentClusters = nearestNode.children;

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
                        clonedCluster.parent = previousUpdatedCluster.parent;
                        clonedCluster.data.hiddenParent = previousHiddenParent;
                        clonedCluster.depth = previousUpdatedCluster.depth;
                      } else {
                        previousOriginalDepth = clonedCluster.depth;
                        clonedCluster.parent = nextParent;
                        clonedCluster.data.hiddenParent = false;
                        clonedCluster.depth = depth + index;
                      };
                    } else {
                      previousOriginalDepth = clonedCluster.depth;
                      clonedCluster.parent = nextParent;
                      clonedCluster.data.hiddenParent = previousHiddenParent;
                      clonedCluster.depth = depth + index;
                    }
                    previousUpdatedCluster = clonedCluster;
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
                      subsequentClustersClone[i].parent = hiddenNodeChildren;
                    };

                    node.children = [hiddenNodeChildren];
                    hiddenNodeAdded = true;

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
              return node;
            }
  
            this.newChildren = transactionsInsideCluster.map((transaction:any) => {
              return releaseFromCluster(transaction, nearestNode.depth, nearestNode.parent);
            });

            const nearestNodeParent = nearestNode.parent;
            const nearestNodeIndex = nearestNode.parent.children.indexOf(nearestNode);
            let visited = false;

            this[nodes].forEach((d:any) => {
              if (d.data.id === nearestNodeParent.data.id && !visited) {
                d.children.splice(nearestNodeIndex, 1, ...this.newChildren)
                d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren)
                visited = true
              }
            });

            this.currentMousePosition = [];
            this.updateTree(nearestNode, side);
          }
        } else if (this.currentZoomScale < 0.6 && this.expandedCluster) {
          side = this.expandedCluster.y < 0 ? 'origin' : 'dest';
          oppositeSide = this.expandedCluster.y > 0 ? 'origin' : 'dest';
          const nodes = `${side}Nodes` as keyof TreeComponent;

          const originalParent = this.expandedCluster.parent;
          const indexOfCluster = originalParent.children.indexOf(this.expandedCluster);
          let visited = false

          this[nodes].forEach((d:any) => {
            if (d.data.id === originalParent.data.id && !visited) {
              d.children.splice(indexOfCluster, this.newChildren.length, this.expandedCluster)
              visited = true
            }
          });
          const returnNode = this.expandedCluster;
          this.expandedCluster = undefined;

          this.initializeTree(null, oppositeSide, false)

          this.updateTree(returnNode, side)
        }
        this.g.attr("transform", event.transform);
      });
  }

  initializeTree(data: any, side: string, firstTime: boolean) {
    const tree = `${side}Tree` as keyof TreeComponent;
    const root = `${side}Root` as keyof TreeComponent;
    const g = `g${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof TreeComponent;
    const gNode = `g${side.charAt(0).toUpperCase() + side.slice(1)}Node` as keyof TreeComponent;
    const gLink = `g${side.charAt(0).toUpperCase() + side.slice(1)}Link` as keyof TreeComponent;

    if (firstTime) {
      this[root] = d3.hierarchy(data);
      this[tree] = d3.tree().size([this.width, this.height])
    }

    this[g] = this.g.append('g')
      .attr("class", side + "-group")
      .attr('id', side + "-group")
      //.attr("transform", "translate(" + (this.width/2) + "," + (this.height/3) + ")");
    
    this[gLink] = this[g].append("g")
      .attr('id', side + "-link-group")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all"); 
      
    this[gNode] = this[g].append('g')
      .attr('id', side + "-node-group") 
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this[root].x0 = 0;
    this[root].y0 = 0;

    // Expand all nodes
    this[root].descendants().forEach((d:any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    });

    this.updateTree(this[root], side)
  }

  updateTree(source:any, side: string) {
    const tree = `${side}Tree` as keyof TreeComponent;
    const root = `${side}Root` as keyof TreeComponent;
    const links = `${side}Links` as keyof TreeComponent;
    const nodes = `${side}Nodes` as keyof TreeComponent;
    const gNode = `g${side.charAt(0).toUpperCase() + side.slice(1)}Node` as keyof TreeComponent;
    const gLink = `g${side.charAt(0).toUpperCase() + side.slice(1)}Link` as keyof TreeComponent;
    const originalTreeData = `initial${side.charAt(0).toUpperCase() + side.slice(1)}TreeData` as keyof TreeComponent;
    const duplicatePairs = `${side}DuplicatePairs` as keyof TreeComponent;

    if (!this[duplicatePairs]) {
      const nodePairs: { source: any, target: any }[] = []
      const nodeUniqueMap = new Map()

      this[root].descendants().forEach((d: any) => {
        if (d.parent) {
          const id = d.data.id;
          if (!nodeUniqueMap.has(id)) {
            nodeUniqueMap.set(id, d);
            nodePairs.push({
              source: d.parent,
              target: d
            });
          } else {
            const existingNode = nodeUniqueMap.get(id);
            const parentNode = d.parent;
          
            if (existingNode.depth < d.depth) {
              nodeUniqueMap.set(id, d);
              nodePairs.forEach((node: any) => {
                if (node.target.data.id === id) {
                  node.target = d;
                  if (node.source.children) {
                    node.source.children = node.source.children.filter((child: any) => child.data.id !== id);

                    if (node.source.children.length === 0) {
                      node.source.children = null;
                    }
                  }
                };
              });

              nodePairs.push({
                source: parentNode,
                target: d
              });
            } else {
              nodePairs.push({
                source: parentNode,
                target: existingNode
              });

              parentNode.children = parentNode.children.filter((child: any) => child.data.id !== id);

              if (parentNode.children.length === 0) {
                parentNode.children = null;
              }
            };
          };
        };
      })
      this[duplicatePairs] = nodePairs;
    };

    console.log(this[duplicatePairs])
    
    //console.log(this[root].descendants())

    this[tree](this[root]);

    this[links] = this[root].descendants().slice(1);
    this[nodes] = this[root].descendants();
      
    if (!this[originalTreeData]) {
      this[originalTreeData] = parse(stringify(this[root].descendants()));
    }

    let postExpandedNodes = false;

    let averageX = 0;
    let maxHiddenY = 0;
    const hiddenNodes = this[nodes].filter((d:any) => typeof d.data.id === 'string' && d.data.id === 'hidden');
    if (hiddenNodes.length > 0) {
      averageX = hiddenNodes.reduce((sum:any, node:any) => sum + node.x, 0) / hiddenNodes.length;
    };

    const positionDifference = this[originalTreeData][0].x - this[root].x;

    this[nodes].forEach((d:any) => {

      if (d.parent && d.parent.children.length > 1 && typeof d.data.id === 'number') {
         const midPoint = d.parent.children.length / 2;
         const indexInParent = d.parent.children.indexOf(d);
         const parentDiff = Math.abs(d.x - d.parent.x);
         if (indexInParent > midPoint) {
          if (Math.ceil(midPoint) === indexInParent) {
            d.x += parentDiff;
          } else {
            d.x += parentDiff * 2;
          };
        } else if (indexInParent < midPoint) {
          if (Math.floor(midPoint) === indexInParent) {
            d.x -= parentDiff;
          } else {
            d.x -= parentDiff * 2;
          };
        };
      };

      if (d.depth > 0) {
        const distanceY = d.parent && typeof d.data.id === 'number' ? 280 : 180;
        d.y = d.parent.y + ((side === 'origin' ? -1 : 1) * distanceY);
      }

      d.x += positionDifference;

      if (typeof d.data.id === 'string' && d.data.id === 'hidden') {
        if (Math.abs(maxHiddenY) < Math.abs(d.y)) {
          maxHiddenY = d.y
        }
        postExpandedNodes = true
      } else if (postExpandedNodes && typeof d.data.id === 'string' && d.data.id.includes('cluster')) {
        this[originalTreeData].forEach((cluster:any) => {
          if (cluster.data.id === d.data.id) {
            d.x = cluster.x
          }
        })
      };
    });

    hiddenNodes.forEach((d: any) => {
      d.y = maxHiddenY + (side === 'origin' ? -1 : 1) * 100
      d.x = averageX + positionDifference
    });

    let left = this[root];
    let right = this[root];

    this[root].eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + this.margin.top + this.margin.bottom;

    let i = 0
    const transition = this.svg.transition()
      .duration(this.duration)
      .attr("viewBox", [-this.margin.left, left.x - this.margin.top, this.width, height])
      .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));

    const node = this[gNode].selectAll("g.node").data(this[nodes], (d:any) => d.id || (d.id = ++i));

    const nodeEnter = node
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .on("click", (event: any, d:any) => {
        console.log(d)
      })
 /*     .on('dblclick', (event:any, d:any) => {
        if (d.depth > 0 && this.currentZoomScale < 0.6) {
          const [x, y] = d3.pointer(event, this.svg.node())
          const translateX = this.width / 2 - y;
          const translateY = this.height / 2 - x;
          this.currentMousePosition = [x, y];

          this.svg.transition().duration(this.duration)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(0.6));
        }
      });
*/
    const nodeUpdate = nodeEnter.merge(node)

    nodeUpdate
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 1)
      .attr('transform', function(d:any) {
        return 'translate(' +  d.y + ',' + d.x + ')';
      })

    const hiddenNodesUpdate = nodeUpdate.filter(function(d :any) {
      return d.data && d.data.id === 'hidden'
    })

    hiddenNodesUpdate
      .style("opacity", 0)

    // Cluster and root nodes
    const clusterNodesUpdate = nodeUpdate.filter(function (d: any) {
      return typeof d.data.id === 'string' || d.depth === 0;
    })

    clusterNodesUpdate.selectAll(".transactionRect, .transactionText, .transactionFullScreenIcon")
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 0)
      .remove();

    // Transaction nodes
    const transactionNodesUpdate = nodeUpdate.filter(function (d: any) {
        return d.depth > 0 && typeof d.data.id === 'number';
    });

    transactionNodesUpdate.selectAll(".clusterRect, .clusterText")
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 0)
      .remove();

    clusterNodesUpdate
      .attr("r", 1e-6)
      .style("fill", function(d:any) {
        return d.parent ? "var(--theme-bg-color)" : "red";
      });

    clusterNodesUpdate
      .append("rect")
      .attr("class", "clusterRect")
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

    clusterNodesUpdate
      .append("text")
      .attr("class", "clusterText")
      .style("fill", "white")
      .attr("dy", ".35em")
      .attr("x", function(d:any) {
        return d.parent ? 20 : 10;
      })
      .attr("text-anchor", "middle")
      .text(function(d:any) {
        return d.parent ? "" : "T";
      });

    transactionNodesUpdate
      .append("rect")
      .attr("class", "transactionRect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke-width", 1)
      .attr("stroke", 'var(--bitcoin-theme)')
      .attr("width", 150) 
      .attr("height", 200)
      .attr("x", -75)
      .attr('y', -100)
      .style("fill", "var(--content-bg-color)")
      
    // Transaction info summary
    transactionNodesUpdate
      .append("foreignObject")
      .attr("class", "transactionText")
      .attr("width", 150)
      .attr("height", 200)
      .attr("x", -75)
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
    transactionNodesUpdate
      .append("foreignObject")
      .attr("class", "transactionFullScreenIcon")
      .attr("width", 150)
      .attr("height", 200)
      .attr("x", -75)
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

    const link = this[gLink].selectAll('path.link').data(this[links], (d: any) => d.id);

    const linkEnter = link
      .enter()
      .insert("path", "g")
      .attr('class', 'link')
      .attr("d", () => {
        const o = { 
          x: source.x, 
          y: source.y 
        };
        return this.diagonal(o, o);
      })

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
      .attr('fill', 'none')

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

    const manualLink = this[gLink].selectAll(".manual-link").data(this[duplicatePairs]);

    const manualLinkEnter = manualLink.enter()
      .append("path")
      .attr("class", "manual-link")
      .attr("d", (d: any) => {
        const o = { 
          x: source.x, 
          y: source.y 
        };
        return this.diagonal(o, o);
      });

    const manualLinkUpdate = manualLinkEnter.merge(manualLink)

    manualLinkUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d: any) => {
        const source = { x: d.source.x, y: d.source.y };
        const target = { x: d.target.x, y: d.target.y };
        return this.diagonal(source, target);
      })
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .attr("fill", "none")
    
    const manualLinkExit = manualLink.exit()
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

    const createLinkTextArrow = (linkData: any, source: any, i: number) => {
      const linkTextAndArrow = this[gLink].selectAll('.link-text-group'+i)
        .data(linkData, (d:any) => d.id)

      const linkTextAndArrowEnter = linkTextAndArrow.enter()
        .append("g")
        .attr("class", "link-text-group"+i)
        .attr("transform", "translate(" + source.y + "," + source.x + ")")

      const linkTextAndArrowUpdate = linkTextAndArrowEnter.merge(linkTextAndArrow)

      linkTextAndArrowUpdate.selectAll(".link-arrow, .link-text")
        .transition(transition)
        .duration(this.duration)
        .style("opacity", 0)
        .remove();

      linkTextAndArrowUpdate.append("text")
        .attr("class", "link-text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("text-shadow", "0 0 10px rgba(255, 255, 255, 0.8)")
        .text(function(d:any) {
          return d.target.data.amount;
        });

      linkTextAndArrowUpdate.append("text")
        .attr("class", "fa link-arrow")
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text('\uf106')
        .style("font-size", "22px")
        .style("transform", (d: any) => {
          let rotateDeg = 0;
          let translateY = -30;
          // Left side
          if (d.target.y < 0) {
            if (d.source.x > d.target.x) {
              // Head downwards
              rotateDeg = 180;
            } else if (d.source.x === d.target.x) {
              // Head right
              rotateDeg = 90;
            }
          } else {
            if (d.source.x < d.target.x) {
              // Head upwards
              rotateDeg = 180;
            } else if (d.source.x === d.target.x) {
              // Head right
              rotateDeg = 90;
            }
          }
          return `rotate(${rotateDeg}deg) translateY(${translateY}px)`;
        });

      linkTextAndArrowUpdate
        .transition(transition)
        .duration(this.duration)
        .attr("transform", function (d:any) {
          return "translate(" + (d.source.y + d.target.y) / 2 + "," + (d.source.x + d.target.x) / 2 + ")";
        });

      linkTextAndArrow.exit()
        .transition(transition)
        .duration(this.duration)
        .style("opacity", 0)
        .attr("transform", "translate(" + source.y + "," + source.x + ")")
        .remove();
    }

    createLinkTextArrow(this[root].links(), source, 1)
    createLinkTextArrow(this[duplicatePairs], source, 2)
  
    this[nodes].forEach((d:any) => {
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