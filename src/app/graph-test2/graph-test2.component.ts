import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as d3 from 'd3';
import { parse, stringify } from 'flatted';
import { DataRetrievalService } from 'src/services/data-retrieval/data-retrieval.service';
import { SharedDataService } from 'src/services/shared-data/shared-data.service';

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
  pathTree: any;
  pathRoot: any;
  pathLinks: any;
  pathNodes: any;
  gPath: any;
  gPathNode: any;
  gPathLink: any;
  pathDuplicateTxPairs: any;
};

@Component({
  selector: 'app-graph-test2',
  templateUrl: './graph-test2.component.html',
  styleUrls: ['./graph-test2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphTest2Component implements OnInit {
  private svg: any;
  private g: any;
  private gOrigin: any;
  private originTree: any;
  private originRoot: any;
  private originNodes: any;
  private originLinks: any;
  private gOriginNode: any;
  private gOriginLink: any;
  private originDuplicateTxPairs: any;
  private gDest: any;
  private destTree: any;
  private destRoot: any;
  private destNodes: any;
  private destLinks: any;
  private gDestNode: any;
  private gDestLink: any;
  private destDuplicateTxPairs: any;
  private pathTree: any;
  private pathRoot: any;
  private pathLinks: any;
  private pathNodes: any;
  private gPath: any;
  private gPathNode: any;
  private gPathLink: any;
  private pathDuplicateTxPairs: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private screenWidth: any;
  private screenHeight: any;
  private width: any;
  private height: any;
  private duration = 750;  
  private expandedCluster: any;
  private newChildren: any;
  private zoom: any;
  private transactionNodeSize = { width: 150, height: 200 };
  private groupClosed: string = ''
  searchQuery: string = '';
  showErrorMessage: boolean = false;
  searchErrorMessage: string = '';
  showStatusMessage: boolean = false;
  searchStatusMessage: string = '';
  showSuccessMessage: boolean = false;
  searchSuccessMessage: string = '';
  searchResult: any[] = [];
  transactionDetail: any;

  constructor( 
    private router: Router,
    private route: ActivatedRoute,
    private sharedDataService: SharedDataService,
    private dataRetrievalService: DataRetrievalService
  ) {  }

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    this.route.params.subscribe(params => {
      const type = params['type'];

      this.width = this.screenWidth - this.margin.left - this.margin.right;
      this.height = this.screenHeight - this.margin.top - this.margin.bottom;

      this.svg = d3.selectAll('#graphContainer')
        .append('svg')
        .attr('width', this.screenWidth)
        .attr('height', this.screenHeight)
        .attr("style", "max-width: 100%; height: auto; user-select: none;");
      
      this.g = this.svg.append('g')
        //.attr("transform", "translate(" + (this.width/2) + "," + (this.height/3) + ")");
      
      this.zoom = d3.zoom()
        .scaleExtent([0.2, 1])
        .on("zoom", (event: any) => {
          this.g.attr("transform", event.transform);
        });

      this.svg.call(this.zoom)
        .call(this.zoom.transform, d3.zoomIdentity.translate(this.width / 3, 0).scale(0.2))
        .on("dblclick.zoom", null);

      this.svg.on("dblclick", (event: any) => {
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
            if (node.data.txid.includes('group')) {
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

        const currentTransform = d3.zoomTransform(this.svg.node());
        const [mouseX, mouseY] = currentTransform.invert(d3.pointer(event, this.svg.node()));

        if (!this.expandedCluster) {
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

          this.groupClosed = oppositeSide;

          const nearestNode = findNearestCluster(this[root], mouseX, mouseY);
          this.expandedCluster = parse(stringify(nearestNode));
          
          if (nearestNode.data.txid.includes('group')) {
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
            
                  const subsequentClustersClone = subsequentClusters.map((group:any, index:number) => {
                    const clonedCluster = { ...group }
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

                  const hiddenNodeIndices = subsequentClustersClone.reduce((indices: any, group: any, index: any) => {
                    if (group.data.hiddenParent === true) {
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
        } else if (this.expandedCluster) {
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

          this.groupClosed = '';
          
          const returnNode = this.expandedCluster;
          this.expandedCluster = undefined;

          this.initializeTree(null, oppositeSide, false);

          this.updateTree(returnNode, side);
        }
      });

      this.route.queryParams.subscribe(queryParams => {
        if (type === 'path') {
          const txid1 = queryParams['tx1'];
          const txid2 = queryParams['tx2']

          this.dataRetrievalService.requestPath(txid1, txid2).subscribe((jsonData: JSON) => {
            this.initializeTree(jsonData, 'path', true);
          })
        } else if (type === 'origindest'){
          const selected_txid = queryParams['tx'];

          this.dataRetrievalService.requestOrigin(selected_txid).subscribe((jsonData: JSON) => {
            this.initializeTree(jsonData, 'origin', true);
          });

          this.dataRetrievalService.requestDestination(selected_txid).subscribe((jsonData: JSON) => {
            this.initializeTree(jsonData, 'dest', true);
          })

        };
      })
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
    this[root].descendants().forEach((d: any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    });

    this.updateTree(this[root], side)
  }

  updateTree(source: any, side: string) {
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
    
    const transactionHierarchy = this[root].descendants().filter((d: any) => d.parent && !['group', 'txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)));
   
    transactionHierarchy.forEach((d: any) => {
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

      d.data.side = side;
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

    let i = 0;
    const transition = this.svg.transition()
      .duration(this.duration)
      .attr("viewBox", [-this.margin.left, left.x - this.margin.top, this.width, height])
      .tween("resize", window.ResizeObserver ? null : () => () => this.svg.dispatch("toggle"));

    const node = this[gNode].selectAll("g.node").data(this[nodes], (d: any) => d.id || (d.id = ++i));

    const nodeEnter = node
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr('id', (d: any) => {
        if (d.data.txid.includes('txo')) {
          return `node-${d.data.address}`;
        }
        return `node-${d.data.txid}`;
      })
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .on('click', (event: any, d: any) => {
        if (!['group', 'txo', 'hidden'].some(keyword => d.data.txid.includes(keyword))) {
          this.transactionDetail = { txid: d.data.txid, fee: "0.00166757", in_degree: 2, out_degree: 2, total_degree: 4, nu_out_degree: 0 }
          console.log(this.transactionDetail)
        };
      });

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

    const txoNodesUpdate = nodeUpdate.filter((d: any) => d.data.txid.includes('txo'));
    txoNodesUpdate.selectAll('*').remove();
    txoNodesUpdate
      .append('circle')
      .attr("class", (d: any) => {
        return d.data.searched ? "highlighted-node txoCircle" : "txoCircle";
      })
      .attr('stroke', 'none')
      .attr("stroke-opacity", "1")
      .attr("r", 40)
      .attr("fill", function(d: any) {
        return d.data.txid === 'utxo' ? 'green' : 'red';
      });

    txoNodesUpdate
      .append("text")
      .attr('class', 'txoText')
      .style("fill", "white")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("text-shadow", function(d: any) {
        const fill = d.data.txid === 'utxo' ? 'green' : 'red';
        return `8px 8px 16px ${fill}`;
      })
      .text(function(d: any) {
        return d.data.value;
      });

    txoNodesUpdate
      .append("text")
      .attr('class', 'txoAddress')
      .style("fill", "white")
      .style("font-size", "13px")
      .attr("dy", "5em")
      .style("text-shadow", "8px 8px 16px var(--theme-bg-color)")
      .attr("text-anchor", "middle")
      .text(function(d: any) {
        return d.data.address;
      });
  
    const groupNodesUpdate = nodeUpdate.filter((d: any) => d.data.txid.includes('group'));
    groupNodesUpdate.selectAll('*').remove();
    groupNodesUpdate
      .append("rect")
      .attr("class", (d: any) => {
        return d.data.searched ? "highlighted-node groupRect" : "groupRect";
      })
      .style("fill", "var(--theme-bg-color)")
      .attr("stroke-width", 1)
      .attr("stroke", 'cyan')
      .attr("stroke-opacity", "1")
      .attr("x", -75)
      .attr('y', -50)
      .attr("width", 150)
      .attr("height", 100)

    const transactionNodesUpdate = nodeUpdate.filter((d: any) => !d.data.txid.includes('txo') && !d.data.txid.includes('group'));
    transactionNodesUpdate.selectAll('*').remove();
    transactionNodesUpdate
      .append("rect")
      .attr("class", (d: any) => {
        return d.data.searched ? "highlighted-node transactionRect" : "transactionRect";
      })
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", "1")
      .attr("stroke", 'var(--bitcoin-theme')
      .attr("width", 150) 
      .attr("height", 200)
      .attr("x", -75)
      .attr('y', -100)
      .style("fill", function(d: any) {
        return d.parent ? "var(--content-bg-color)" : "var(--bitcoin-theme)";
      });
    
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
      .style("overflow", "auto")
      .append("p")
      .html(function(d: any) {
        return `
          <strong>txid:</strong> ${d.data.txid} <br>
          <strong>fee:</strong> 0.00166757 <br>
          <strong>in_degree:</strong> 2 <br>
          <strong>out_degree:</strong> 2 <br>
          <strong>total_degree:</strong> 4 <br>
          <strong>nu_out_degree:</strong> 0`;
      })
      .style("color", function(d: any) {
        return d.parent ? "white" : "black";
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
        return !d.data.txid.includes('group') || d.data.txid === 'hidden' ? 'var(--bitcoin-theme)' : 'white';
      }))
      .attr('fill', 'none');

    const linkExit = link
      .exit()
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d: any) => {
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
        .data(linkData, (d: any) => d.target.id)

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

  search() {
    const searchHierarchy = (transactions: any, found: boolean, job: boolean, count: number): [boolean, number] => {
      transactions.forEach((transaction: any) => {
        if (!job) {
          transaction.searched = job;
        } else {
          if (searchType === 'Wallet Address' && transaction.txid.includes('txo')) {
            if (transaction.address === this.searchQuery) {
              transaction.searched = job;
              found = true;
              count++;
            }
          } else {
            if (transaction.txid === this.searchQuery) {
              transaction.searched = job;
              found = true;
              count++;
            }
          }
        }

        if (transaction.children) {
          const [newFound, newCount] = searchHierarchy(transaction.children, found, job, 0);
          if (newFound) {
            found = true;
            count += newCount
          };
        };
      });
      return [found, count];
    }

    // Set every searched field to false
    const removeSearched = (nodes: any): void => {
      nodes.forEach((d: any) => {
        if (d.data.txid.includes('group')) {
          searchHierarchy(d.data.transactions, false, false, 0);
        };
        d.data.searched = false;
      });
    };

    this.showErrorMessage = false;
    this.showSuccessMessage = false;
    this.searchResult = [];

    // Disable every node highlighting class.
    const removeHighlighting = (gNode: any) => {
      const shapes = ['rect', 'circle'];
      shapes.forEach((shape: string) => {
        gNode.selectAll(`.node ${shape}`).classed('highlighted-node', false)
        gNode.selectAll(`.node ${shape}`).classed('highlighted-node', false)
      });
    };

    removeHighlighting(this.gOriginNode); removeHighlighting(this.gDestNode);
    removeSearched(this.originNodes); removeSearched(this.destNodes); 

    if (this.searchQuery === '') {
      this.showErrorMessage = true;
      this.searchErrorMessage = 'Field is Empty';
      return;
    };

    const transactionIdRegex = /^[0-9a-fA-F]{64}$/;
    const walletAddressRegex = /^(1|3|bc)[a-km-zA-HJ-NP-Z1-9]{25,42}$/;

    let searchType = '';

    if (transactionIdRegex.test(this.searchQuery)) {
      searchType = 'Transaction';
    } else if (walletAddressRegex.test(this.searchQuery)) {
      searchType = 'Wallet Address';
    } else {
      this.showErrorMessage = true;
      this.searchErrorMessage = 'Please Enter a Valid Transaction ID or Address';
      return;
    };

    this.showStatusMessage = true;
    let count = 0;

    const searchNodes = (nodes: any) => {
      nodes.forEach((d: any) => {
        if (d.data.txid.includes('group')) {
          const [foundInCluster, newCount] = searchHierarchy(d.data.transactions, false, true, 0);
          d.data.searched = foundInCluster;
          count += newCount;
        } else if (searchType === 'Wallet Address' && d.data.txid.includes('txo')) {
          if (d.data.address === this.searchQuery) { 
            d.data.searched = true; 
            this.searchResult.push({d});
            count++;
          };
        } else {
          if (d.data.txid === this.searchQuery) {
            d.data.searched = true;
            this.searchResult.push(d);
            count++;
          };
        };
      });
    };

    this.searchStatusMessage = `Searching for ${searchType} in Origins`; searchNodes(this.originNodes); 
    this.searchStatusMessage = `Searching for ${searchType} in Destinations`; searchNodes(this.destNodes);

    this.showStatusMessage = false;

    if (count === 0) {
      this.showErrorMessage = true;
      this.searchErrorMessage = `No ${searchType} Found`;
    } else {
      this.searchResult.forEach((result: any, index: number) => {
        let id: string;
        let info: string;
        let isTX: boolean;
  
        if (result.data.txid.includes('txo')) {
          id = result.data.address;
          const spentString = result.data.spent ? 'Spent' : 'Unspent';
          info = `${spentString} Output Value: ${result.data.value}, TXID From: ${result.data.from}, TXID To: ${result.data.to}`;
          isTX = false;
        } else {
          id = result.data.txid;
          info = `TXID: ${result.data.txid}`;
          isTX = true;
        }
        this.searchResult[index] = { id: id, info: info, isTransaction: isTX, side: result.data.side };
      });
      
      this.showSuccessMessage = true;

      if (searchType === 'Wallet Address') {
        this.searchSuccessMessage = `Found ${count} Outputs Belonging To ${searchType}`;
      } else {
        this.searchSuccessMessage = `Found ${searchType}`;
      };

    this.updateTree(this.destRoot, 'dest');
    this.updateTree(this.originRoot, 'origin');
    };
  }

  /* This part is only for demo */
  getPath(target: string, side: string) {
    const nodes = `${side}Nodes` as keyof TreeComponent;
    const targetNode = this[nodes].find((node: any) => node.data.txid === target);
    const path = this.getAncestors(targetNode).reverse();

    function convertToHierarchy(path: any[]): any {
      const rootNode: any = { children: null };
      let currentNode = rootNode;
    
      path.forEach((node, index) => {
        const { children, ...newNode } = { ...node.data, children: index === path.length - 1 ? null : [] };
        currentNode.children = [newNode];
        currentNode = newNode;
      });
    
      return rootNode.children[0];
    }
    
    const pathData = convertToHierarchy(path);

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dev2/path'])
    );

    window.open(url, '_blank');
  }

  private getAncestors(node: any) {
    const ancestors = [];
    let currentNode = node;

    while (currentNode) {
        ancestors.push(currentNode);
        currentNode = currentNode.parent;
    }

    return ancestors;
  }

  private flattenHierarchy(data: any): any[] {
    let result: any[] = [];
  
    function flatten(item: any) {
      result.push(item);
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        item.children.forEach(flatten);
      }
    }
  
    if (Array.isArray(data)) {
      data.forEach(flatten);
    } else {
      flatten(data);
    }
    return result;
  }
}