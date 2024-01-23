import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
  selector: 'app-graph-test3',
  templateUrl: './graph-test3.component.html',
  styleUrls: ['./graph-test3.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphTest3Component implements OnInit {
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
  private duration = 750;  
  private expandedCluster: any;
  private newChildren: any;
  private zoom: any;
  private transactionNodeSize = { width: 150, height: 200 };
  private groupClosed: string = '';
  searchQuery: string = '';
  showErrorMessage: boolean = false;
  searchErrorMessage: string = '';
  showStatusMessage: boolean = false;
  searchStatusMessage: string = '';
  showSuccessMessage: boolean = false;
  searchSuccessMessage: string = '';

  constructor(
  ) {  }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    const originData = {
      txid: '1db0c47d1c7898e29c0c8b10c5f4528e3a7c273168614f048699f76922683f32',
      children: [
        {
          txid: 'stxo',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          from: 259,
          to: 1,
          value: 8.801,
          children: [
            {
              txid: 'cluster',
              transactions: [
                {
                  txid: '2a5b367e8d6c78e8b7dfde1f607dc3ebe458e56a27850e1d5c3eaf54b25f141',
                  children: [
                    {
                      txid: 'stxo',
                      address: '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64',
                      from: null,
                      to: 259,
                      value: 0.02
                    },
                    {
                      txid: 'stxo',
                      address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
                      from: null,
                      to: 259,
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
      txid: '1db0c47d1c7898e29c0c8b10c5f4528e3a7c273168614f048699f76922683f32',
      children: [
          {
              txid: 'stxo',
              address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
              from: '1',
              to: '2',
              value: 7,
              children: [
                  {
                      txid: 'cluster1',
                      transactions: [
                          {
                              txid: '3f68b9b2f2a67c7b0562c8f4582371802da7907950a8509c67f0d0ba0f06e7aa',
                              children: [
                                  {
                                      txid: 'stxo',
                                      address: '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64',
                                      from: '2',
                                      to: '4',
                                      value: 20,
                                      children: [
                                          {
                                              txid: '4c1b99b5b8a2e6096d2f2e66175035e546f1a4fbc3940ec651baabbaf343fd7b',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
                                                      from: '4',
                                                      to: '6',
                                                      value: 6,
                                                      children: [
                                                          {
                                                              txid: '5f6b46e6798aebf17d897c1e5f58b4e6f7875a84c66f1f4e854738f3e8a3b6f8',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
                                                                      from: '6',
                                                                      to: null,
                                                                      value: 0.6
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
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
                                      address: '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm',
                                      from: '2',
                                      to: '7',
                                      value: 79,
                                      children: [
                                          {
                                              txid: '6f3b6e6f8e7f3a5b3a8a8e3f2b4e8f9e8f7a4f3e7a2b5a3b5f1e8f6f3a1e9a61',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      address: '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm',
                                                      from: '7',
                                                      to: '6',
                                                      value: 0.11,
                                                      children: [
                                                          {
                                                              txid: '5f6b46e6798aebf17d897c1e5f58b4e6f7875a84c66f1f4e854738f3e8a3b6f8',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm',
                                                                      from: '6',
                                                                      to: null,
                                                                      value: 0.6
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '1JKJgFuqUmoY9d9kL2PUmPoDz4knDgAKB',
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
              address: '3EhWPgqz8D2ZPShJd6UqcpCr3daj3vCo7k',
              from: '1',
              to: '3',
              value: 8,
              children: [
                  {
                      txid: 'cluster2',
                      transactions: [
                          {
                              txid: '8f2b4e8f9e8f7a4f3e7a2b5a3b5f1e8f6f3a1e9a6b3e9e7f8e1a5e1a7b1e2123',
                              children: [
                                  {
                                      txid: 'stxo',
                                      address: '3FFp9uS1UqCiTNZbQiG1ue2UqUdDdJXY9D',
                                      from: '3',
                                      to: '5',
                                      value: 90,
                                      children: [
                                          {
                                              txid: '9e6f2a8e9a6e3b5f2b3e7e8e1f4a3e5b1f3a2f2b4e8f9e8f7a4f3e7a2b5a3c33',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      address: '13p1ijLwsnrcuyqcTvJXkq2ASdXqcnEBLE',
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
                                      address: '32ixVtW7pNfuv8R6wPfc6AqG3HvG8YbuFp',
                                      from: '6',
                                      to: '8',
                                      value: 670,
                                      children: [
                                          {
                                              txid: 'a1e9a6b3e9e7f8e1a5e1a7b1e2a9e6f2a8e9a6e3b5f2b3e7e8e1f4a3e5b10smd',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      address: '38Pt2Kki2veFrVq9PGGXkJVSJPy3jhmTwF',
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
                                      address: '38Pt2Kki2veFrVq9PGGXkJVSJPy3jhmTwF',
                                      from: '3',
                                      to: '9',
                                      value: 1.4,
                                      children: [
                                          {
                                              txid: 'b3e7a2b5a3b5f1e8f6f3a1e9a6f2b4e8f9e8f7a4f3e7a2b5a3b5f1e8f6f31234',
                                              children: [
                                                  {
                                                      txid: 'utxo',
                                                      address: '1EV8hdrBQwaMdFi5xZU3r9HGY31QzP78xD',
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
                                      address: '1EduQkRiMdaLXySDnwNAAy6AoE2MPXf2Yx',
                                      from: '8',
                                      to: '21',
                                      value: 34,
                                      children: [
                                          {
                                              txid: 'c1b9e2a9e6f2a8e9a6e3b5f2b3e7e8e1f4a3e5b1f3a2f2b4e8f9e8f7a4f31111',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      address: '1EduQkRiMdaLXySDnwNAAy6AoE2MPXf2Yx',
                                                      from: '21',
                                                      to: '22',
                                                      value: 15,
                                                      children: [
                                                          {
                                                              txid: 'd1c1b9e2a9e6f2a8e9a6e3b5f2b3e7e8e1f4a3e5b1f3a2f2b4e8f9e8f7a42345',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '1EduQkRiMdaLXySDnwNAAy6AoE2MPXf2Yx',
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
                                                      address: '15okgyzqBc5deTEpR3v3fBM4UU4oTBv2qa',
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
                                      address: '15okgyzqBc5deTEpR3v3fBM4UU4oTBv2qa',
                                      from: '8',
                                      to: '24',
                                      value: 1,
                                      children: [
                                          {
                                              txid: 'e1a5e1a7b1e2a9e6f2a8e9a6e3b5f2b3e7e8e1f4a3e5b1f3a2f2b4e8f9e81222',
                                              children: [
                                                  {
                                                      txid: 'stxo',
                                                      address: '15okgyzqBc5deTEpR3v3fBM4UU4oTBv2qa',
                                                      from: '24',
                                                      to: '25',
                                                      value: 25,
                                                      children: [
                                                          {
                                                              txid: 'f7a4f3e7a2b5a3b5f1e8f6f3a1e9a6f2b4e8f9e8f7a4f3e7a2b5a3b5f11234',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
                                                                      from: '25',
                                                                      to: null,
                                                                      value: 15
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '16o7YB9S4F5jMBFSycPrbKtJUUPfP7RyBp',
                                                                      from: '25',
                                                                      to: null,
                                                                      value: 0.1
                                                                  },
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '3EhWPgqz8D2ZPShJd6UqcpCr3daj3vCo7k',
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
                                                      address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
                                                      from: '24',
                                                      to: '26',
                                                      value: 22,
                                                      children: [
                                                          {
                                                              txid: '60f7a4f3e7a2b5a3b5f1e8f6f3a1e9a6f2b4e8f9e8f7a4f3e7a2b5a3b5f11111',
                                                              children: [
                                                                  {
                                                                      txid: 'utxo',
                                                                      address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
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
              address: '3EhWPgqz8D2ZPShJd6UqcpCr3daj3vCo7k',
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
    
    //this.initializeTree(originData, 'origin', true);
    this.initializeTree(destData, 'dest', true);
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
                      .size([2 * Math.PI, 250])
                      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);             
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

    const transactionHierarchy = this[root].descendants().filter((d: any) => d.parent && !['cluster', 'txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)));

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
      .attr("transform", (d: any) => `rotate(${d.x * 180 / Math.PI - 90})translate(${d.y},0)`)
      .on('click', (event: any, d: any) => console.log(d));

    const nodeUpdate = nodeEnter.merge(node)

    nodeUpdate
      .transition(transition)
      .duration(this.duration)
      .style("opacity", (d: any) => {
        return d.data.txid === 'hidden' ? 0 : 1;
      })
      .attr('transform', function (d: any) {
        return 'rotate(' + (d.x * 180 / Math.PI - 90) + ')translate(' + d.y + ')'; // Adjust the transformation
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
      .text(function(d: any) {
        return d.data.value;
      });
  
    const clusterNodesUpdate = nodeUpdate.filter((d: any) => d.data.txid.includes('cluster'));
    clusterNodesUpdate.selectAll('*').remove();
    clusterNodesUpdate
      .append("rect")
      .attr("class", (d: any) => {
        return d.data.searched ? "highlighted-node clusterRect" : "clusterRect";
      })
      .style("fill", "var(--theme-bg-color)")
      .attr("stroke-width", 1)
      .attr("stroke", 'cyan')
      .attr("stroke-opacity", "1")
      .attr("x", -75)
      .attr('y', -50)
      .attr("width", 150)
      .attr("height", 100)

    const transactionNodesUpdate = nodeUpdate.filter((d: any) => !d.data.txid.includes('txo') && !d.data.txid.includes('cluster'));
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
      .append("p")
      .html(function(d: any) {
        return `txid: ${d.data.txid} <br> featureA <br> featureB <br> featureC <br> featureD`;
      })
      .style("color", function(d: any) {
        return d.parent ? "white" : "black";
      });
    
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
      .attr("d", (d: any) => {
        const o = { x: source.x, y: source.y }; // Assuming source is defined
        return d3.linkRadial().angle(o.x).radius(o.y)(d);
      });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d: any) => d3.linkRadial().angle(d.x).radius(d.y)(d))
      .attr('stroke-width', 3)
      .attr('stroke', ((d: any) => {
        return !d.data.txid.includes('cluster') || d.data.txid === 'hidden' ? 'var(--bitcoin-theme)' : 'white';
      }))
      .attr('fill', 'none');

    const linkExit = link
      .exit()
      .transition(transition)
      .duration(this.duration)
      .attr("d", (d: any) => {
        const o = { x: source.x, y: source.y };
        return d3.linkRadial().angle(o.x).radius(o.y)(d);
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

    const removeSearched = (nodes: any): void => {
      nodes.forEach((d: any) => {
        if (d.data.txid.includes('cluster')) {
          searchHierarchy(d.data.transactions, false, false, 0);
        };
        d.data.searched = false;
      });
    };

    if (this.searchQuery === '') {
      this.showErrorMessage = true;
      this.searchErrorMessage = 'Field is Empty';
      return
    }

    removeSearched(this.originNodes); removeSearched(this.destNodes);

    const transactionIdRegex = /^[0-9a-fA-F]{64}$/;
    const walletAddressRegex = /^(1|3|[13])[a-km-zA-HJ-NP-Z1-9]{25,34}$/;

    this.showErrorMessage = false;
    this.showSuccessMessage = false;

    let searchType = '';

    if (transactionIdRegex.test(this.searchQuery)) {
      searchType = 'Transaction';
    } else if (walletAddressRegex.test(this.searchQuery)) {
      searchType = 'Wallet Address';
    } else {
      this.showErrorMessage = true;
      this.searchErrorMessage = 'Please Enter a Valid Transaction ID or Address';
      return
    }

    this.showStatusMessage = true;
    let count = 0;

    const searchNodes = (nodes: any) => {
      nodes.forEach((d: any) => {
        if (d.data.txid.includes('cluster')) {
          const [foundInCluster, newCount] = searchHierarchy(d.data.transactions, false, true, 0);
          d.data.searched = foundInCluster;
          count += newCount;
        } else if (searchType === 'Wallet Address' && d.data.txid.includes('txo')) {
          if (d.data.address === this.searchQuery) { 
            d.data.searched = true; 
            count++;
          };
        } else {
          if (d.data.txid === this.searchQuery) {
            d.data.searched = true;
            count++;
          };
        };
      });
    };

    this.searchStatusMessage = `Searching for ${searchType} in Origins`; searchNodes(this.originNodes); 
    this.searchStatusMessage = `Searching for ${searchType} in Destinations`; searchNodes(this.destNodes)

    this.showStatusMessage = false;

    if (count === 0) {
      this.showErrorMessage = true;
      this.searchErrorMessage = `No ${searchType} Found`;
    } else {
      this.showSuccessMessage = true;
      if (searchType === 'Wallet Address') {
        this.searchSuccessMessage = `Found ${count} Outputs Belonging To ${searchType}`;
      } else {
        this.searchSuccessMessage = `Found ${searchType}`;
      }

    this.updateTree(this.destRoot, 'dest')
    this.updateTree(this.originRoot, 'origin');
    }
  }

  flattenHierarchy(data: any): any[] {
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