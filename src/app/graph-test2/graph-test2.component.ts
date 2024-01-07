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
  destDuplicateTxPairs: any;
  originTree: any;
  originRoot: any;
  originLinks: any;
  originNodes: any;
  gOrigin: any;
  gOriginNode: any;
  gOriginLink: any;
  originDuplicateTxPairs: any;
};

@Component({
  selector: 'app-graph-test2',
  templateUrl: './graph-test2.component.html',
  styleUrls: ['./graph-test2.component.scss']
})
export class GraphTest2Component implements OnInit {
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
  private destDuplicateTxPairs: any;
  private originDuplicateTxPairs: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private screenWidth: any;
  private screenHeight: any;
  private width: any;
  private height: any;
  private duration = 500;  
  private expandedCluster: any;
  private newChildren: any;
  private zoom: any;
  private transactionNodeSize = { width: 150, height: 200 };

  constructor(
  ) {  }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    const originData = {
      txid: '1',
      children: [
        {
          txid: 'stxo',
          value: 8.801,
          children: [
            {
              txid: 'cluster',
              transactions: [
                {
                  txid: '259',
                  children: [
                    {
                      txid: 'stxo',
                      value: 0.02
                    },
                    {
                      txid: 'stxo',
                      value: 1.2
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const destData: any = {
      txid: '1',
      children: [
          {
              txid: 'stxo',
              from: '1',
              to: '2',
              value: 7,
              children: [
                  {
                      txid: 'cluster1',
                      transactions: [
                          {
                              txid: '2',
                              children: [
                                  {
                                      txid: 'stxo',
                                      from: '2',
                                      to: '4',
                                      value: 20,
                                      children: [
                                          {
                                              txid: '4',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      from: '4',
                                                      to: '6',
                                                      value: 6,
                                                      children: [
                                                          {
                                                              txid: '6',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '6',
                                                                      to: null,
                                                                      value: 0.6
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '6',
                                                                      to: null,
                                                                      value: 12
                                                                  }
                                                              ]
                                                          } 
                                                      ]
                                                  }
                                              ]
                                          }
                                      ]
                                  },
                                  {
                                      txid: 'stxo',
                                      from: '2',
                                      to: '7',
                                      value: 79,
                                      children: [
                                          {
                                              txid: '7',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      from: '7',
                                                      to: '6',
                                                      value: 0.11,
                                                      children: [
                                                          {
                                                              txid: '6',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '6',
                                                                      to: null,
                                                                      value: 0.6
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '6',
                                                                      to: null,
                                                                      value: 12
                                                                  }
                                                              ]
                                                          }
                                                      ]
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          }
                      ]
                  }
              ]
          },
          {
              txid: 'stxo',
              from: '1',
              to: '3',
              value: 8,
              children: [
                  {
                      txid: 'cluster2',
                      transactions: [
                          {
                              txid: '3',
                              children: [
                                  {
                                      txid: 'stxo',
                                      from: '3',
                                      to: '5',
                                      value: 90,
                                      children: [
                                          {
                                              txid: '5',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      from: '5',
                                                      to: '21',
                                                      value: 34
                                                  }
                                              ]
                                          }
                                      ]
                                  },
                                  {
                                      txid: 'stxo',
                                      from: '6',
                                      to: '8',
                                      value: 670,
                                      children: [
                                          {
                                              txid: '8',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      from: '8',
                                                      to: '24',
                                                      value: 1
                                                  }
                                              ]
                                          }
                                      ]
                                  },
                                  {
                                      txid: 'stxo',
                                      from: '3',
                                      to: '9',
                                      value: 1.4,
                                      children: [
                                          {
                                              txid: '9',
                                              children: [
                                                  {
                                                      txid: 'utxo',
                                                      from: '9',
                                                      to: null,
                                                      value: 91
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          }
                      ],
                      children: [
                          {
                              txid: 'cluster2-1',
                              transactions: [
                                  {
                                      txid: 'stxo',
                                      from: '8',
                                      to: '21',
                                      value: 670,
                                      children: [
                                          {
                                              txid: '21',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      from: '21',
                                                      to: '22',
                                                      value: 15,
                                                      children: [
                                                          {
                                                              txid: '22',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '22',
                                                                      to: null,
                                                                      value: 5
                                                                  }
                                                              ]
                                                          }
                                                      ]
                                                  },
                                                  {
                                                      txid: 'utxo',
                                                      from: '21',
                                                      to: null,
                                                      value: 11
                                                  }
                                              ]
                                          }
                                      ]
                                  },
                                  {
                                      txid: 'stxo',
                                      from: '8',
                                      to: '24',
                                      value: 0,
                                      children: [
                                          {
                                              txid: '24',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      from: '24',
                                                      to: '25',
                                                      value: 25,
                                                      children: [
                                                          {
                                                              txid: '25',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '25',
                                                                      to: null,
                                                                      value: 15
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '25',
                                                                      to: null,
                                                                      value: 0.1
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '25',
                                                                      to: null,
                                                                      value: 0.002
                                                                  }
                                                              ]
                                                          }
                                                      ]
                                                  },
                                                  {
                                                      txid: 'stxo',
                                                      from: '24',
                                                      to: '26',
                                                      value: 22,
                                                      children: [
                                                          {
                                                              txid: '26',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      from: '26',
                                                                      to: null,
                                                                      value: 10
                                                                  }
                                                              ]
                                                          }
                                                      ]
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          }
                      ]
                  }
              ]
          },
          {
              txid: 'utxo',
              from: '1',
              to: null,
              value: 0.009
          }
      ]
    };   
    
    this.width = this.screenWidth - this.margin.left - this.margin.right;
    this.height = this.screenHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.selectAll('#graphContainer')
      .append('svg')
      .attr('width', this.screenWidth)
      .attr('height', this.screenHeight)
      .attr("style", "max-width: 100%; height: auto; user-select: none;");
    
    this.g = this.svg.append('g')
      //.attr("transform", "translate(" + (this.width/2) + "," + (this.height/3) + ")");
    
    this.zoom = this.initializeZoomDragBehaviour()

    this.svg.call(this.zoom)
      .call(this.zoom.transform, d3.zoomIdentity.translate(this.width / 3, 0).scale(0.2))
    
    this.initializeTree(originData, 'origin', true);
    this.initializeTree(destData, 'dest', true);
  }

  initializeZoomDragBehaviour() {
    return d3.zoom()
      .scaleExtent([0.2, 1])
      .on("zoom", (event: any) => {
        const currentZoomScale = event.transform.k;

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

        function findNearestCluster(root: any, mouseX: number, mouseY: number): any {
          let closestNode = null;
          let closestDistance = Number.MAX_VALUE;
        
          function visit(node: any) {
            if (node.data.txid.includes('cluster')) {
              const [y, x] = [node.x, node.y];
              // Euclidean distance
              const distance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
          
              if (distance < closestDistance) {
                closestDistance = distance;
                closestNode = node;
              };
            }
            if (node.children) {
              node.children.forEach(visit);
            };
          }
        
          if (root.children) {
            root.children.forEach(visit)
          };
          return closestNode;
        }

        let side: string;
        let oppositeSide: string;
        const [mouseX, mouseY] = event.transform.invert(d3.pointer(event, this.svg.node()));

        if (currentZoomScale >= 0.4 && !this.expandedCluster) {
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
          
          if (nearestNode.data.txid.includes('cluster')) {
            const transactionsInsideCluster = JSON.parse(JSON.stringify(nearestNode.data.transactions));
            const subsequentClusters = nearestNode.children;

            // calculate the depth of tree
            const getDepth = (node: any): number => {
              if (!node.children || node.children.length === 0) {
                  return 1;
              } else {
                  return 1 + Math.max(...node.children.map(getDepth));
              }
            };

            const innerDepth = getDepth({ children: transactionsInsideCluster });
            let hiddenNodeAdded = false;
  
            function releaseFromCluster(node: any, depth: number, parent: any) {
              node.depth = depth;
              node.parent = parent;
              node.data = node;
  
              if (node.children && node.children.length > 0) {
                node.children.forEach((child:any) => releaseFromCluster(child, depth + 1, node));
              } else {
                if (subsequentClusters) {
                  const depth = nearestNode.depth + innerDepth; // - 1

                  // Update subsequent nodes
                  let nextParent: any = null;
                  let previousHiddenParent: boolean = true;
                  let previousOriginalDepth = -1;
                  let previousUpdatedCluster: any;
            
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

                  const hiddenNodeIndices = subsequentClustersClone.reduce((indices: any, cluster: any, index: any) => {
                    if (cluster.data.hiddenParent === true) {
                      indices.push(index);
                    };
                    return indices;
                  }, []);

                  if (node.txid !== 'utxo') {
                    if (!hiddenNodeAdded) {
                      const hiddenNodeChildren = {
                        txid: 'hidden',
                        depth: depth - 1,
                        data: {
                          txid: 'hidden',
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
                        txid: 'hidden',
                        depth: depth - 1,
                        data: {
                          txid: 'hidden',
                        },
                        parent: node
                      };
                      
                      node.children = [hiddenNodeNoChildren];
                    }
                  }
                }
              }
              return node;
            }
  
            this.newChildren = transactionsInsideCluster.map((transaction: any) => {
              return releaseFromCluster(transaction, nearestNode.depth, nearestNode.parent);
            });

            const nearestNodeParent = nearestNode.parent;
            const nearestNodeIndex = nearestNode.parent.children.indexOf(nearestNode);
            let visited = false;

            this[nodes].forEach((d: any) => {
              if (d.data.txid.includes('txo') && !visited) {
                if (d.data.from === nearestNodeParent.data.from && d.data.to === nearestNodeParent.data.to) {
                  d.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                  d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                  visited = true;
                }
              } else if (d.data.txid === nearestNodeParent.data.txid && !visited) {
                d.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                visited = true;
              };
            });

            this.updateTree(nearestNode, side);
          }
        } else if (currentZoomScale < 0.4 && this.expandedCluster) {
          side = this.expandedCluster.y < 0 ? 'origin' : 'dest';
          oppositeSide = this.expandedCluster.y > 0 ? 'origin' : 'dest';
          const nodes = `${side}Nodes` as keyof TreeComponent;

          const originalParent = this.expandedCluster.parent;
          const indexOfCluster = originalParent.children.indexOf(this.expandedCluster);
          let visited = false;

          this[nodes].forEach((d: any) => {
            if (d.data.txid.includes('txo') && !visited) {
              if (d.data.from === originalParent.data.from && d.data.to === originalParent.data.to) {
                d.children.splice(indexOfCluster, this.newChildren.length, this.expandedCluster);
                visited = true;
              }
            } else if (d.data.txid === originalParent.data.txid && !visited) {
              d.children.splice(indexOfCluster, this.newChildren.length, this.expandedCluster);
              visited = true;
            };
          });
          const returnNode = this.expandedCluster;
          this.expandedCluster = undefined;

          this.initializeTree(null, oppositeSide, false);

          this.updateTree(returnNode, side);
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
      this[tree] = d3.tree()
                    .nodeSize([this.transactionNodeSize.height, this.transactionNodeSize.width])
                    .separation((a, b) => {
                      return a.parent === b.parent ? 1.25 : 1.25;
                    });
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
    const duplicateTxPairs = `${side}DuplicateTxPairs` as keyof TreeComponent;

    // Handling multiple parent issue
    const nodePairs: { source: any, target: any, initial: boolean }[] = []
    const nodeUniqueMap = new Map()

    const transactionNodes = this[root].descendants().filter((d: any) => d.parent && !['cluster', 'txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)));

    transactionNodes.forEach((d: any) => {
      const id = d.data.txid;
      if (!nodeUniqueMap.has(id)) {
        nodeUniqueMap.set(id, d);
        nodePairs.push({
          source: d.parent,
          target: d,
          initial: true
        });
      } else {
        const existingNode = nodeUniqueMap.get(id);
        const parentNode = d.parent;
      
        if (existingNode.depth < d.depth) {
          nodeUniqueMap.set(id, d);
          nodePairs.forEach((node: any) => {
            if (node.target.data.txid === id) {
              node.target = d;
              node.initial = false;
              if (node.source.children) {
                node.source.children = node.source.children.filter((child: any) => child.data.txid !== id);
                if (node.source.children.length === 0) {
                  node.source.children = null;
                };
              };
            };
          });

          nodePairs.push({
            source: parentNode,
            target: d,
            initial: true
          });
        } else {
          nodePairs.push({
            source: parentNode,
            target: existingNode,
            initial: false
          });

          parentNode.children = parentNode.children.filter((child: any) => child.data.txid !== id);

          if (parentNode.children.length === 0) {
            parentNode.children = null;
          }
        };
      };
    })
    this[duplicateTxPairs] = nodePairs;
    // End of handling multiple parent issue
    
    this[tree](this[root]);

    this[links] = this[root].descendants().slice(1);
    this[nodes] = this[root].descendants();

    let averageX = 0;
    let maxHiddenY = 0;
    const hiddenNodes = this[nodes].filter((d: any) => d.data.txid === 'hidden');
    if (hiddenNodes.length > 0) {
      averageX = hiddenNodes.reduce((sum: any, node: any) => sum + node.x, 0) / hiddenNodes.length;
    };

    this[nodes].forEach((d: any) => {
      d.y = (side === 'origin' ? -1 : 1) * d.depth * 300;

      if (d.data.txid === 'hidden' && Math.abs(maxHiddenY) < Math.abs(d.y)) {
          maxHiddenY = d.y;
      };
    });

    hiddenNodes.forEach((d: any) => {
      d.y = maxHiddenY + (side === 'origin' ? -1 : 1) * 100;
      d.x = averageX;
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

    const node = this[gNode].selectAll("g.node").data(this[nodes], (d: any) => d.txid || (d.txid = ++i));

    const nodeEnter = node
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .on('click', (event: any, d: any) => console.log(d));

    const nodeUpdate = nodeEnter.merge(node)

    nodeUpdate
      .transition(transition)
      .duration(this.duration)
      .style("opacity", (d: any) => {
        return d.data.txid === 'hidden' ? 0 : 1;
      })
      .attr('transform', function(d:any) {
        return 'translate(' +  d.y + ',' + d.x + ')';
      });

    // Cluster and root nodes
    const clusterNodesUpdate = nodeUpdate.filter(function (d: any) {
      return d.data.txid.includes('cluster');
    })

    clusterNodesUpdate.selectAll(".transactionRect, .transactionText, .transactionFullScreenIcon")
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 0)
      .remove();

    // Transaction nodes
    const transactionNodesUpdate = nodeUpdate.filter(function (d: any) {
        return !d.data.txid.includes('cluster') && !d.data.txid.includes('txo');
    });

    transactionNodesUpdate.selectAll(".clusterRect, .clusterText")
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 0)
      .remove();

    const txoNodesUpdate = nodeUpdate.filter(function(d: any) {
      return d.data.txid.includes('txo');
    });

    txoNodesUpdate
      .append('circle')
      .attr("class", "txoCircle")
      .style("stroke", "none")
      .attr("r", 40)
      .attr("fill", function(d: any) {
        return d.data.txid === 'utxo' ? 'green' : 'red';
      })
      .attr("x", -40)
      .attr("y", -40);

    txoNodesUpdate
      .append("text")
      .style("fill", "white")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d: any) {
        return d.data.value;
      });

    clusterNodesUpdate
      .append("rect")
      .attr("class", "clusterRect")
      .style("fill", "var(--theme-bg-color)")
      .attr("stroke-width", 1)
      .attr("stroke", 'cyan')
      .attr("stroke-opacity", "1")
      .attr("x", -75)
      .attr('y', -50)
      .attr("width", 150)
      .attr("height", 100)

    transactionNodesUpdate
      .append("rect")
      .attr("class", "transactionRect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke-width", 3)
      .attr("stroke", 'var(--bitcoin-theme')
      .attr("width", 150) 
      .attr("height", 200)
      .attr("x", -75)
      .attr('y', -100)
      .style("fill", function(d: any) {
        return d.parent ? "var(--content-bg-color)" : "var(--bitcoin-theme)";
      });
      
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
      .style("box-sizing", "border-box")
      .style("padding", "10px")
      .append("p")
      .html(function(d: any) {
        return `txid: ${d.data.txid} <br> featureA <br> featureB <br> featureC <br> featureD`;
      })
      .style("color", function(d: any) {
        return d.parent ? "white" : "black";
      })

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
        };
      });

    transactionNodesUpdate.selectAll(".transactionRect, .transactionText, .transactionFullScreenIcon")
      .style("opacity", 0)
      .transition(transition)
      .duration(this.duration)
      .style("opacity", 1)

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
      });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d: any) => {
        return this.diagonal(d.parent, d); 
      })
      .attr('stroke-width', 1)
      .style('stroke', ((d: any) => {
        return !d.data.txid.includes('cluster') || d.data.txid === 'hidden' ? 'var(--bitcoin-theme)' : 'white';
      }))
      .attr('fill', 'none');

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
      .remove();

    const manualLink = this[gLink].selectAll(".manual-link").data(this[duplicateTxPairs].filter((d: any) => !d.initial));

    const manualLinkEnter = manualLink.enter()
      .append("path")
      .attr("class", "manual-link")
      .attr("d", () => {
        const pathString = `M${source.y},${source.x} H${source.y + 85} L${source.y - 85},${source.x} H${source.y}`;
        return pathString;
      });

    const manualLinkUpdate = manualLinkEnter.merge(manualLink)

    manualLinkUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d: any) => {
        const source = { x: d.source.x, y: d.source.y };
        const target = { x: d.target.x, y: d.target.y };
        const pathString = `M${source.y},${source.x} H${source.y + 85} L${target.y - 85},${target.x} H${target.y}`;
        return pathString;
      })
      .attr("stroke", "var(--bitcoin-theme)")
      .attr("stroke-width", 1)
      .attr("fill", "none")
    
    const manualLinkExit = manualLink.exit()
      .transition(transition)
      .duration(this.duration)
      .attr("d", () => {
        const pathString = `M${source.y},${source.x} H${source.y + 85} L${source.y - 85},${source.x} H${source.y}`;
        return pathString;
      })
      .remove()

    const createLinkTextArrow = (linkData: any, source: any, i: number) => {
      const linkTextAndArrow = this[gLink].selectAll('.link-text-group'+i)
        .data(linkData, (d: any) => d.id)

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

      /*
      linkTextAndArrowUpdate
        .append("text")
        .attr("class", "link-text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .style("text-shadow", "0 0 10px rgba(255, 255, 255, 0.8)")
        .text((d: any) => {
          const source = d.source.data;
          const target = d.target.data;

          if (!['cluster', 'txo', 'hidden'].some(keyword => target.txid.includes(keyword))) {
            if (side === 'origin') {
              const vinData = source.vin.find((input: any) => input.txid === target.txid);
              return vinData ? target.vout[vinData.vout].value : "";
            } else {
              const voutData = target.vin.find((input: any) => input.txid === source.txid);
              return voutData ? source.vout[voutData.vout].value : "";
            };
          };
        });
        */

      linkTextAndArrowUpdate
        .append("text")
        .attr("class", "fa link-arrow")
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text('\uf106')
        .style("font-size", "22px")
        .style("transform", (d: any) => {
          const translateY = -30;
          if (i === 1) {
            let rotateDeg = 0;
            // Left side
            if (d.target.y < 0) {
              if (d.source.x > d.target.x) {
                // Head downwards
                rotateDeg = 180;
              } else if (d.source.x === d.target.x) {
                // Head right
                rotateDeg = 90;
              };
            } else {
              if (d.source.x < d.target.x) {
                // Head upwards
                rotateDeg = 180;
              } else if (d.source.x === d.target.x) {
                // Head right
                rotateDeg = 90;
              };
            };
            return `rotate(${rotateDeg}deg) translateY(${translateY}px)`;
          } else {
            const angle = Math.atan2(d.target.y - d.source.y - 85 * 2, d.target.x - d.source.x) * (180 / Math.PI);
            const minTranslateX = -15;
            const maxTranslateX = -5;
            const translateX = (angle - 0) * (maxTranslateX - minTranslateX) / (90 - 0) + minTranslateX;
            return `rotate(${90 + (90 - angle)}deg) translateX(${translateX}px) translateY(${translateY}px)`;
          };
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
    createLinkTextArrow(this[duplicateTxPairs].filter((d: any) => !d.initial), source, 2)
  
    this[nodes].forEach((d:any) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
  }

  closeTransactionDetailPopover() {
    const transactionDetail = document.getElementById("transaction-detail");
    if (transactionDetail) {
      transactionDetail.classList.remove("show");
    };
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