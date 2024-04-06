import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as d3 from 'd3';
import { parse, stringify } from 'flatted';
import { DataRetrievalService } from 'src/services/data-retrieval/data-retrieval.service';

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
  selector: 'app-graph-test3',
  templateUrl: './graph-test3.component.html',
  styleUrls: ['./graph-test3.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphTest3Component implements OnInit {
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
  private duration = 500;  
  private expandedGroup: any;
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
  searchType: string = '';
  searchResult: any[] = [];
  transactionDetail: any;
  graphLoading: boolean = false;

  constructor( 
    private router: Router,
    private route: ActivatedRoute,
    private dataRetrievalService: DataRetrievalService,
    //private performanceService: PerformanceService
  ) {  }

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    this.route.params.subscribe(params => {
      this.graphLoading = true;

      const type = params['type'];

      this.width = this.screenWidth - this.margin.left - this.margin.right;
      this.height = this.screenHeight - this.margin.top - this.margin.bottom;

      this.svg = d3.selectAll('#graphContainer')
        .append('svg')
        .attr('width', this.screenWidth)
        .attr('height', this.screenHeight)
        .attr('viewBox', `-${this.screenWidth/4} -${this.screenHeight/2} ${this.screenWidth} ${this.screenHeight}`)
        .attr("style", "max-width: 100%; height: auto; user-select: none;");
      
      this.g = this.svg.append('g')
        //.attr("transform", "translate(" + this.width + "," + this.height + ")");
      
      this.zoom = d3.zoom()
        .scaleExtent([0.001, 2])
        .on("zoom", (event: any) => {
          this.g.attr("transform", event.transform);
        });

      this.svg.call(this.zoom)
        .call(this.zoom.transform, d3.zoomIdentity.translate(this.width / 3, 0).scale(0.2))
        .on("dblclick.zoom", null);

      this.svg.on("dblclick", (event: any) => {
        if (!this.expandedGroup) {
          // Remove tree if not in viewport
          const originGroup = document.getElementById("origin-group");
          const destGroup = document.getElementById("dest-group");
        
          if (originGroup && this.elementOutOfViewport(originGroup, true)) {
            this.gOrigin
              .transition()
              .duration(this.duration)
              .remove();
          } else if (!originGroup && destGroup && !this.elementOutOfViewport(destGroup, false)) {
            this.initializeTree(null, 'origin', false)
          }

          if (destGroup && this.elementOutOfViewport(destGroup, true)) {
            this.gDest
              .transition()
              .duration(this.duration)
              .remove();
          } else if (!destGroup && originGroup && !this.elementOutOfViewport(originGroup, false)) {
            this.initializeTree(null, 'dest', false);
          }
        }

        let side: string;
        let oppositeSide: string;

        const currentTransform = d3.zoomTransform(this.svg.node());
        const [mouseX, mouseY] = currentTransform.invert(d3.pointer(event, this.svg.node()));

        if (!this.expandedGroup) {
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

          const nearestNode = this.findNearestGroup(this[root], mouseX, mouseY);
          this.expandedGroup = parse(stringify(nearestNode));
          
          if (nearestNode.data.txid.includes('group')) {
            const transactionsInsideGroup = parse(stringify(nearestNode.data.transactions));
            const subsequentGroups = nearestNode.children;

            // calculate the depth of tree
            const getDepth = (node: any): number => {
              if (!node.children || node.children.length === 0) {
                  return 1;
              } else {
                  return 1 + Math.max(...node.children.map(getDepth));
              }
            };

            const innerDepth = getDepth({ children: transactionsInsideGroup });
            const flags = { hiddenNodeAdded: false };

            const nearestNodeDepth = nearestNode.depth;
            const nearestNodeParent = nearestNode.parent;
            const nearestNodeIndex = nearestNode.parent.children.indexOf(nearestNode);
            let visited = false;

            this.newChildren = transactionsInsideGroup.map((transaction: any) => {
              const newTransaction = d3.hierarchy(transaction);
              return this.releaseFromGroup(newTransaction, nearestNodeDepth, nearestNodeParent, innerDepth, subsequentGroups, nearestNodeDepth, flags);
            });

            this[nodes].forEach((d: any) => {
              if (d.data.txid.includes('txo') && !visited) {
                if (d.data.from === nearestNodeParent.data.from && d.data.to === nearestNodeParent.data.to) {
                  d.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                  d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                  
                  this.newChildren.forEach((newChild: any) => {
                    newChild.parent = d;
                  });

                  visited = true;
                }
              } else if (d.data.txid === nearestNodeParent.data.txid && !visited) {
                d.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren);

                this.newChildren.forEach((newChild: any) => {
                  newChild.parent = d;
                });
                
                visited = true;
              };
            });

            setTimeout(() => {
              this.updateTree(nearestNode, side);
            }, 0);
          }
        } else if (this.expandedGroup) {
          side = this.expandedGroup.y < 0 ? 'origin' : 'dest';
          oppositeSide = this.expandedGroup.y > 0 ? 'origin' : 'dest';
          const nodes = `${side}Nodes` as keyof TreeComponent;

          const originalParent = this.expandedGroup.parent;
          const indexOfGroup = originalParent.children.indexOf(this.expandedGroup);
          let visited = false;

          this[nodes].forEach((d: any) => {
            if (d.data.txid.includes('txo') && !visited) {
              if (d.data.from === originalParent.data.from && d.data.to === originalParent.data.to) {
                this.expandedGroup.parent = d;
                d.children.splice(indexOfGroup, this.newChildren.length, this.expandedGroup);
                visited = true;
              }
            } else if (d.data.txid === originalParent.data.txid && !visited) {
              this.expandedGroup.parent = d;
              d.children.splice(indexOfGroup, this.newChildren.length, this.expandedGroup);
              visited = true;
            };
          });

          this.groupClosed = '';
          
          const returnNode = this.expandedGroup;
          this.expandedGroup = undefined;

          this.initializeTree(null, oppositeSide, false);

          setTimeout(() => {
            this.updateTree(returnNode, side);
          }, 0);
        } 
      });

      this.route.queryParams.subscribe(queryParams => {
        const selected_txid = queryParams['tx'];
        /*
        this.dataRetrievalService.requestTransaction(selected_txid).subscribe(async (data: any) => { 
          await this.initializeTree(data['originData'], 'origin', true);
          this.graphLoading = false;
        });
        */
      })
    });
  }     

  private initializeTree(data: any, side: string, firstTime: boolean) {
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

  private updateTree(source: any, side: string) {
    const tree = `${side}Tree` as keyof TreeComponent;
    const root = `${side}Root` as keyof TreeComponent;
    const links = `${side}Links` as keyof TreeComponent;
    const nodes = `${side}Nodes` as keyof TreeComponent;
    const gNode = `g${side.charAt(0).toUpperCase() + side.slice(1)}Node` as keyof TreeComponent;
    const gLink = `g${side.charAt(0).toUpperCase() + side.slice(1)}Link` as keyof TreeComponent;

    this.detectMutualChildInTransactions(side, this[root]);

    this[links] = this[root].descendants().slice(1);
    this[nodes] = this[root].descendants();

    this[tree](this[root]);

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

    // Ensure the x y positions are correctly set in data.
    this[nodes].forEach((parent: any) => {
      if (parent.data.txid.includes('group')) {
        this[nodes].forEach((child: any) => {
          if (child.parent && parent.data.txid === child.parent.data.txid) {
            if (parent.y !== child.parent.y) {
              child.parent.y = parent.y;
            }
            if (parent.x !== child.parent.x) {
              child.parent.x = parent.x;
            }
          }
        })
      }
    })

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

    this.renderNodes(source, side, this[nodes]);
    this.renderLinks(source, side, this[links]);
    this.renderAdditionalGraphElements(source, side, this[root]);

    this[nodes].forEach((d:any) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
  }

  private renderNodes(source: any, side: string, nodes: any) {
    const gNode = `g${side.charAt(0).toUpperCase() + side.slice(1)}Node` as keyof TreeComponent;

    let id = 0;
    const node = this[gNode].selectAll("g.node").data(nodes, (d: any) => d.id || (d.id = ++id));

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
        console.log(d);
      });

    const nodeUpdate = nodeEnter.merge(node)

    nodeUpdate
      .transition()
      .duration(this.duration)
      .style("opacity", (d: any) => {
        return d.data.txid === 'hidden' ? 0 : 1;
      })
      .attr('transform', function(d:any) {
        return 'translate(' +  d.y + ',' + d.x + ')';
      });

    nodeUpdate.filter((d: any) => d.data.txid === 'hidden' && !d.data.children).remove();

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
      })

    txoNodesUpdate
      .append("text")
      .attr('class', 'txoAddress')
      .style("fill", "white")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .html((d: any) => {
        return `<tspan x="0" y="5em">Type: ${d.data.vout_transaction_type}</tspan>
                <tspan x="0" dy="2em">Address: ${d.data.address}</tspan>
                <tspan x="0" dy="2em">Amount: ${d.data.value} BTC</tspan>`;
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

    groupNodesUpdate
      .append("text")
      .attr("class", "sumText")
      .style("fill", "white")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .html((d: any) => {
        const txCountInGroup = d.data.txCountInGroup ? d.data.txCountInGroup : '15';
        const fraudTxCountInGroup = d.data.fraudTxCount ? d.data.fraudTxCount : '6';
        return `<tspan x="0">Potential Fraud TX</tspan>
                <tspan x="0" dy="2em">${fraudTxCountInGroup} / ${txCountInGroup}</tspan>`;
      }); 

    const transactionNodesUpdate = nodeUpdate.filter((d: any) => !['txo', 'group', 'hidden'].some(keyword => d.data.txid.includes(keyword)));
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
      .style("fill", "var(--content-bg-color)");
    
    transactionNodesUpdate
      .append("rect")
      .attr("class", "probaRect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke", 'none')
      .attr("width", 150)
      .attr("height", (d: any) => {
        const parentHeight = 200;
        return Math.round(parentHeight * d.data.fraud_proba);
      })
      .attr("x", -75)
      .attr("y", (d: any) => {
        const parentHeight = 200;
        const height = Math.round(parentHeight * d.data.fraud_proba || 0);
        const yOffset = parentHeight - height
        return -100 + yOffset;
      })
      .style("fill", "red");

    transactionNodesUpdate
      .append("text")
      .attr("class", "probaText")
      .attr("x", 0)
      .attr('y', 0)
      .text((d: any) => {
        return d.data.fraud_proba ? `${Math.round(d.data.fraud_proba * 100)}%` : 'Unknown';
      })
      .style("fill", "white")
      .style("font-size", '40px')
      .attr("text-anchor", 'middle')

    transactionNodesUpdate
      .append("foreignObject")
      .attr("class", "txidText")
      .attr("width", 215)
      .attr("height", 200)
      .attr("x", -110)
      .attr('y', -215)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("word-wrap", "break-word") 
      .append("p")
      .style('text-align', 'center')
      .html(function(d: any) {
        return `TXID: ${d.data.txid}`;
      })

    const nodeExit = node
      .exit()
      .transition()
      .duration(this.duration)
      .style("opacity", 0)
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();
  }

  private renderLinks(source: any, side: string, links: any) {
    const gLink = `g${side.charAt(0).toUpperCase() + side.slice(1)}Link` as keyof TreeComponent;

    const link = this[gLink].selectAll('path.link').data(links, (d: any) => d.id);

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
      .transition()
      .duration(this.duration)
      .attr("d", (d: any) => {
        return this.diagonal(d.parent, d); 
      })
      .attr('stroke-width', 1)
      .style('stroke', ((d: any) => {
        return d.data.txid === 'utxo' ? 'white' : 'var(--bitcoin-theme';
      }))
      .attr('fill', 'none');

    const linkExit = link
      .exit()
      .transition()
      .duration(this.duration)
      .remove()
      .attr("d", (d: any) => {
        const o = { 
          x: source.x, 
          y: source.y
        };
        return this.diagonal(o, o);
      });
  }

  private renderAdditionalGraphElements(source: any, side: string, root: any) {
    const gLink = `g${side.charAt(0).toUpperCase() + side.slice(1)}Link` as keyof TreeComponent;
    const duplicateTxPairs = `${side}DuplicateTxPairs` as keyof TreeComponent;

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
      .transition()
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
      .transition()
      .duration(this.duration)
      .attr("d", () => {
        const pathString = `M${source.y},${source.x} H${source.y + 85} L${source.y - 85},${source.x} H${source.y}`;
        return pathString;
      })
      .remove()

    const createLinkTextArrow = (linkData: any, i: number) => {
      const linkTextAndArrow = this[gLink].selectAll('.link-text-group'+i).data(linkData, (d: any) => d.target.id)

      const linkTextAndArrowEnter = linkTextAndArrow.enter()
        .append("g")
        .attr("class", "link-text-group"+i)
        .attr("transform", "translate(" + source.y + "," + source.x + ")")

      const linkTextAndArrowUpdate = linkTextAndArrowEnter.merge(linkTextAndArrow)

      linkTextAndArrowUpdate.selectAll(".link-arrow, .inputText")
        .transition()
        .duration(this.duration)
        .style("opacity", 0)
        .remove();

      linkTextAndArrowUpdate
        .append('text')
        .attr("class", "inputText")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("x", -60)
        .attr("y", 5)
        .attr("text-align", "end")
        .text((d: any) => {
          return d.source.data.txid === 'stxo' && !['group', 'hidden'].some(keyword => d.target.data.txid.includes(keyword)) ? d.source.data.vin_transaction_type : '';
        })

      linkTextAndArrowUpdate
        .filter((d: any) => d.source.children.length === 1 && d.target.data.txid !== 'hidden')
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
        .transition()
        .duration(this.duration)
        .attr("transform", function (d:any) {
          return "translate(" + (d.source.y + d.target.y) / 2 + "," + (d.source.x + d.target.x) / 2 + ")";
        });

      linkTextAndArrow.exit()
        .transition()
        .duration(this.duration)
        .style("opacity", 0)
        .attr("transform", "translate(" + source.y + "," + source.x + ")")
        .remove();
    }

    createLinkTextArrow(root.links(), 1)
    createLinkTextArrow(this[duplicateTxPairs].filter((d: any) => !d.initial), 2)
  }

  private detectMutualChildInTransactions(side: string, root: any) {
    const duplicateTxPairs = `${side}DuplicateTxPairs` as keyof TreeComponent;

    const nodePairs: { source: any, target: any, initial: boolean }[] = []
    const nodeUniqueMap = new Map()

    const transactionHierarchy = root.descendants().filter((d: any) => d.parent && !['group', 'txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)));
    
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
          };
        };
      };
    });

    this[duplicateTxPairs] = nodePairs;
  }

  private diagonal(s: any, t: any) {
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

  public search() {
    const searchTransactionHierarchy = (transactions: any, found: boolean, searching: boolean, count: number): [boolean, number, any[]] => {
      const nodesFound: any[] = [];
      transactions.forEach((transaction: any) => {
        // Set searched field to false (reset)
        if (!searching) {
          transaction.searched = searching;
        } else {
          if (this.searchType === 'Wallet Address' && transaction.txid.includes('txo')) {
            if (transaction.address === this.searchQuery) {
              transaction.searched = searching;
              found = true;
              count++;
            }
          } else {
            if (transaction.txid === this.searchQuery) {
              transaction.searched = searching;
              found = true;
              count++;
            }
          }
        }

        if (this.searchType === 'Transaction' && found) {
          nodesFound.push(transaction.txid);
        }

        if (transaction.children) {
          const [newFound, newCount, newNodesFound] = searchTransactionHierarchy(transaction.children, found, searching, 0);
          if (newFound) {
            found = true;
            count += newCount
          };
        };
      });
      return [found, count, nodesFound];
    }

    // Set every searched field to false
    const removeSearched = (nodes: any): void => {
      nodes.forEach((d: any) => {
        if (d.data.txid.includes('group')) {
          searchTransactionHierarchy(d.data.transactions, false, false, 0);
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

    this.searchType = '';

    if (transactionIdRegex.test(this.searchQuery)) {
      this.searchType = 'Transaction';
    } else if (walletAddressRegex.test(this.searchQuery)) {
      this.searchType = 'Wallet Address';
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
          const [foundInGroup, newCount, nodesFound] = searchTransactionHierarchy(d.data.transactions, false, true, 0);
          d.data.searched = foundInGroup;
          count += newCount;
          nodesFound.forEach((node: any) => {
            this.searchResult.push(node);
          })
          console.log(this.searchResult)
        } else if (this.searchType === 'Wallet Address' && d.data.txid.includes('txo')) {
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

    this.searchStatusMessage = `Searching for ${this.searchType} in Origins`; searchNodes(this.originNodes); 
    this.searchStatusMessage = `Searching for ${this.searchType} in Destinations`; searchNodes(this.destNodes);

    this.showStatusMessage = false;

    if (count === 0) {
      this.showErrorMessage = true;
      this.searchErrorMessage = `No ${this.searchType} Found`;
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

      if (this.searchType === 'Wallet Address') {
        this.searchSuccessMessage = `Found ${count} Outputs Belonging To ${this.searchType}`;
      } else {
        this.searchSuccessMessage = `Found ${this.searchType}`;
      };

    console.log(this.searchResult)

    this.updateTree(this.originRoot, 'origin');
    this.updateTree(this.destRoot, 'dest');
    };
  }

  private findNearestGroup(root: any, mouseX: number, mouseY: number): any {
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

  private releaseFromGroup(node: any, incrementDepth: number, parent: any, innerDepth: number, subsequentGroups: any, constantNearestNodeDepth: number, flags: any) {
    node.depth = incrementDepth;
    node.parent = parent;

    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => this.releaseFromGroup(child, incrementDepth + 1, node, innerDepth, subsequentGroups, constantNearestNodeDepth, flags));
    } else {
      // If no children -> connect to subsequentGroups
      if (subsequentGroups) {
        const depth = constantNearestNodeDepth + innerDepth; // - 1

        // Update subsequent nodes
        let nextParent: any = null;
        let previousHiddenParent: boolean = true;
        let previousOriginalDepth = -1;
        let previousUpdatedGroup: any;
  
        const subsequentGroupsClone = subsequentGroups.map((group: any, index: number) => {
          const clonedGroup = { ...group };
          if (index > 0 && nextParent) {
            if (clonedGroup.depth === previousOriginalDepth) {
              clonedGroup.parent = previousUpdatedGroup.parent;
              clonedGroup.data.hiddenParent = previousHiddenParent;
              clonedGroup.depth = previousUpdatedGroup.depth;
            } else {
              previousOriginalDepth = clonedGroup.depth;
              clonedGroup.parent = nextParent;
              clonedGroup.data.hiddenParent = false;
              clonedGroup.depth = depth + index;
            };
          } else {
            previousOriginalDepth = clonedGroup.depth;
            clonedGroup.parent = nextParent;
            clonedGroup.data.hiddenParent = previousHiddenParent;
            clonedGroup.depth = depth + index;
          }
          previousUpdatedGroup = clonedGroup;
          nextParent = clonedGroup;
          return clonedGroup;
        });

        /*
        const depthEnsurer = (child: any, parent: any = null) => {
          if (parent) {
            child.depth = parent.depth + 1;
            child.parent = parent;
          };

          if (child.children && child.children.length > 0) {
            child.children.forEach((c: any) => {
                depthEnsurer(c, child)
            });
          } 
        }

        subsequentGroupsClone.forEach((node: any) => {
          depthEnsurer(node);
        });
        */
      
        const hiddenNodeIndices = subsequentGroupsClone.reduce((indices: any, group: any, index: any) => {
          if (group.data.hiddenParent === true) {
            indices.push(index);
          };
          return indices;
        }, []);

        if (node.data.txid !== 'utxo') {
          if (!flags.hiddenNodeAdded) {
            const hiddenNodeChildren = {
              data: {
                txid: 'hidden',
                children: subsequentGroupsClone
              },
              depth: depth - 1,
              parent: node,
              children: subsequentGroupsClone
            };

            for (let i in hiddenNodeIndices) {
              subsequentGroupsClone[i].parent = hiddenNodeChildren;
            };

            node.children = [hiddenNodeChildren];
            flags.hiddenNodeAdded = true;

          } else {
            const hiddenNodeNoChildren = {
              data: {
                txid: 'hidden',
              },
              depth: depth - 1,
              parent: node
            };
            
            node.children = [hiddenNodeNoChildren];
          };
        };
      };
    };
    return node;
  };

  private elementOutOfViewport(element: any, remove: boolean) {
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

  public getPath(txid: string, side: string) {
    const root = `${side}Root` as keyof TreeComponent;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dev2/path'], { queryParams: { tx1: this[root].data.txid, tx2: txid} })
    );
    window.open(url, '_blank');
  }

  public returnZero() {
    return 0
  }
}