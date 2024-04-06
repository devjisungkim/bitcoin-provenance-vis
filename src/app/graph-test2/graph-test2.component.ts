import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import cloneDeep from 'lodash/cloneDeep';
import { DataRetrievalService } from 'src/services/data-retrieval/data-retrieval.service';
import { PerformanceService } from 'src/services/performance/performance.service';
import { DataConversionService } from 'src/services/data-conversion/data-conversion.service';

declare var require: any
var iso3311a2 = require('../../../node_modules/iso-3166-1-alpha-2')

@Component({
  selector: 'app-graph-test2',
  templateUrl: './graph-test2.component.html',
  styleUrls: ['./graph-test2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphTest2Component implements OnInit {
  private svg: any;
  private g: any;
  private tree: any;
  private root: any;
  private nodes: any;
  private links: any;
  private gNode: any;
  private gLink: any;
  private duplicateTxPairs: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private screenWidth: any;
  private screenHeight: any;
  private width: any;
  private height: any;
  private duration = 500;  
  private expandedGroup: any;
  private newChildren: any;
  private zoom: any;
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
    private route: ActivatedRoute,
    private dataRetrievalService: DataRetrievalService,
    private dataConversionService: DataConversionService,
    //private performanceService: PerformanceService
  ) {  }

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    this.route.params.subscribe(async params => {
      this.graphLoading = true;
      const rootTxid = params['txid'];

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
        .call(this.zoom.transform, d3.zoomIdentity.translate(this.width/3, 0).scale(0.2))
        .on("dblclick.zoom", null);
      
      this.svg.on("dblclick", (event: any) => {
        if (this.dataConversionService.groupingInitiated()) {

          const currentTransform = d3.zoomTransform(this.svg.node());
          const [mouseX, mouseY] = currentTransform.invert(d3.pointer(event, this.svg.node()));

          if (this.expandedGroup) {
            const originalParent = this.expandedGroup.parent;
            const indexOfGroup = originalParent.children.indexOf(this.expandedGroup);

            this.nodes.forEach((d: any) => {
              if (d.data.txid === originalParent.data.txid) {
                this.expandedGroup.parent = d;
                d.children.splice(indexOfGroup, this.newChildren.length, this.expandedGroup);
              }
            })
          }

          const nearestGroup = this.findNearestGroup(mouseX, mouseY);
          this.expandedGroup = cloneDeep(nearestGroup);
          
          if (nearestGroup.data.txid.includes('group')) {
            const transactionsInsideGroup = nearestGroup.data.transactions;
            const subsequentGroups = nearestGroup.children;

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

            const nearestGroupDepth = nearestGroup.depth;
            const nearestGroupParent = nearestGroup.parent;
            const nearestGroupIndex = nearestGroup.parent.children.indexOf(nearestGroup);

            this.newChildren = transactionsInsideGroup.map((transaction: any) => {
              return this.releaseFromGroup(transaction, nearestGroupDepth, nearestGroupParent, innerDepth, subsequentGroups, nearestGroupDepth, flags);
            });

            this.nodes.forEach((d: any) => {
              if (d.data.txid === nearestGroupParent.data.txid) {
                d.children.splice(nearestGroupIndex, 1, ...this.newChildren);
                this.newChildren.forEach((newChild: any) => {
                  newChild.parent = d;
                });
              }
            });

            setTimeout(() => {
              this.updateTree(nearestGroup);
            }, 0);
          }
        }
      });

      const initialTransaction = await this.addTransactionsToPath([rootTxid]);
      this.root = initialTransaction[0];
      this.initializeTree();
      this.graphLoading = false;
    });
  }     

  private async addTransactionsToPath(txid_list: string[], parentTxoNode: any = null): Promise<any[]> {
    const transactions: any[] | undefined = await this.dataRetrievalService.getTransactions(txid_list).toPromise();
    const convertedTransactions: any[] = [];

    if (transactions === undefined) {
      throw new Error('Transactions are undefined');
    }
  
    txid_list.forEach((txid, index) => {
      const transaction = transactions[index];
      if (transaction) {
        const converted_tx = this.dataConversionService.convertToHierarchy(txid, transaction, parentTxoNode);
        convertedTransactions.push(converted_tx);
      } /*else {
        console.error(`Transaction data missing for txid: ${txid}`);
      }*/
    })

    return convertedTransactions;
  }

  private initializeTree() {
    this.tree = d3.tree()
                  .nodeSize([250, 200])
                  .separation((a, b) => {
                    return a.parent === b.parent ? 1.25 : 1.25;
                  });

    this.gLink = this.g.append("g")
      .attr('id', "link-group")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all"); 
      
    this.gNode = this.g.append('g')
      .attr('id', "node-group") 
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    this.root.x0 = 0;
    this.root.y0 = 0;

    // Expand all nodes
    this.root.descendants().forEach((d: any) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    });

    this.updateTree(this.root)
  }

  private updateTree(source: any) {
    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();

    this.tree(this.root);

    this.detectMutualChildInTransactions();

    this.nodes.forEach((d: any) => {
      // Depth Ensurer
      if (d.parent && (d.depth - d.parent.depth) !== 1) {
        d.depth = d.parent.depth + 1;
      }
    })

    let hiddenAverageX = 0;
    let hiddenMaxDepth = 0;
    const hiddenNodes = this.nodes.filter((d: any) => d.data.txid === 'hidden');
    if (hiddenNodes.length > 0) {
      hiddenAverageX = hiddenNodes.reduce((sum: any, node: any) => sum + node.x, 0) / hiddenNodes.length;
      hiddenMaxDepth = hiddenNodes.reduce((maxDepth: number, node: any) => Math.max(maxDepth, node.depth), Number.MIN_SAFE_INTEGER);
    };

    this.nodes.forEach((d: any) => {
      if (d.data.txid === 'hidden') {
        d.depth = hiddenMaxDepth;
        d.x = hiddenAverageX;
      }
      if (d.parent && d.parent.data.txid === 'hidden') {
        d.depth = d.parent.depth + 1;
      }
      d.y = d.depth * -300;
      /*
      if (d.data.type === 'vout') {
        d.y = d.parent.y + 300;
      }
      */
    });

    let left = this.root;
    let right = this.root;

    this.root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    this.renderLinks(source);
    this.renderNodes(source);
    this.renderAdditionalGraphElements(source);

    this.nodes.forEach((d:any) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
  }

  private checkForGrouping(updatingNode: any) {
    if (this.dataConversionService.groupingInitiated()) {
      this.nodes.forEach((d: any) => {
        if ((d.data.txid.includes('group') || d.parent.data.txid === this.root.data.txid) && d.children) {
          const nonGroupChildren = d.children.filter((child: any) => !child.data.txid.includes('group'));
          if (nonGroupChildren.length > 0) {
            const newGroupNode = this.dataConversionService.createGroupHierarchy(nonGroupChildren, d.data.txid, d.children[0].data.geolocation, d);
            const index = d.children.findIndex((child: any) => !child.data.txid.includes('group'));
            d.children.splice(index, nonGroupChildren.length, newGroupNode);
          }
        }
      });
    } else {
      if (this.dataConversionService.getTotalNumTransactionsRetrieved() > this.dataConversionService.getThreshold()) {
        this.root.children.forEach((d: any, index: number) => {
          if (d.children) {
            d.children = this.dataConversionService.createGroupHierarchy(d.children, index+1, d.data.geolocation, d);
          }
        })
        this.updateTree(this.root);
        return;
      }
    }
    this.updateTree(updatingNode)
  }

  private renderNodes(source: any) {
    const contextMenu = d3.select("#context-menu");

    const nodes = this.gNode.selectAll("g.node").data(this.nodes, (d: any) => d.id || (d.id = d.data.txid));

    const nodeEnter = nodes
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr('id', (d: any) => `node-${d.data.txid}`)
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .on('click', (event: any, d: any) => {
        console.log(d);
      })
      .on("mouseenter", (event: any, d: any) => {
        this.mouseenterHighlight(event, d);
      })
      .on("mouseleave", (event: any, d: any) => {
        this.mouseleaveHighlight(event, d);
      });
    
    d3.select("body").on("click", () => {
      contextMenu.style("display", "none");
    });
    
    const nodeUpdate = nodeEnter.merge(nodes)

    nodeUpdate
      .transition()
      .duration(this.duration)
      .style("opacity", (d: any) => {
        return d.data.txid === 'hidden' ? 0 : 1;
      })
      .attr('transform', function(d:any) {
        return 'translate(' +  d.y + ',' + d.x + ')';
      });

    nodeEnter.filter((d: any) => d.data.txid === 'hidden' && !d.data.children).remove();

    const txoNodesEnter= nodeEnter.filter((d: any) => d.data.txid.includes('txo'));

    txoNodesEnter
      .on("contextmenu", (event: any, d: any) => {
        event.preventDefault();

        if (!d.children && d.data.type === 'vin') {
          contextMenu.style("display", "block").style("left", event.pageX + "px").style("top", event.pageY + "px");

          contextMenu.select(".menu-item").on("click", async () => {
            d3.selectAll(`.loader-${d.data.txid} .loader`).style("display", "block");

            const transactionsRetrieved = await this.addTransactionsToPath(d.data.vinTxids, d);

            await new Promise(f => setTimeout(f, 100));

            await Promise.all(transactionsRetrieved.map(async (transaction: any) => {
              transaction.parent = d;
              transaction.depth = d.depth + 1;
      
              await Promise.all(transaction.children.map(async (output: any) => {
                  output.parent = transaction;
                  output.depth = transaction.depth + 1;
              }));
            }));

            d.children = transactionsRetrieved;

            contextMenu.style("display", "none");
            d3.selectAll(`.loader-${d.data.txid} .loader`).style("display", "none");

            this.tree(this.root)
            this.checkForGrouping(d);
          });
        }
      })

    txoNodesEnter
      .append('circle')
      .attr("class", (d: any) => {
        return d.data.searched ? "highlighted-node txoCircle" : "txoCircle";
      })
      .attr('stroke', 'none')
      .attr("stroke-opacity", "1")
      .attr("r", 40)
      .attr("fill", function(d: any) {
        return d.data.type === 'vin' ? 'red' : 'green';
      })

    txoNodesEnter
      .append('rect')
      .attr('class', 'safeClickBox')
      .attr("width", 220) 
      .attr("height", 125)
      .attr("x", -110)
      .attr('y', -40)
      .attr("stroke", "none")
      .attr('fill', 'none')

    txoNodesEnter
      .append('image')
      .attr('xlink:href', (d: any) => {
        return `../../assets/flag_svg/${d.data.geolocation.toLowerCase()}.svg`;
      })
      .attr('x', -30)
      .attr('y', -20)
      .attr('width', 60)
      .attr('height', 40)

    txoNodesEnter
      .append("text")
      .attr('class', 'txoAddress')
      .style("fill", "white")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .html((d: any) => {
        return `<tspan x="0" y="5em">Total Inputs: ${d.data.numInputs}</tspan>
        <tspan x="0" dy="2em">Total Value: ${d.data.totalValue} BTC</tspan>`;
      }); 
    
    txoNodesEnter
      .filter((d: any) => !d.children)
      .append('foreignObject')
      .attr('class', (d: any) => `loader-${d.data.txid}`)
      .attr('x', -150)
      .attr('y', -30)
      .attr('width', 100)
      .attr('height', 100)
      .append('xhtml:div')
      .attr('class', 'loader')
      .style('display', 'none');

    const transactionNodesEnter = nodeEnter.filter((d: any) => !['txo', 'group', 'hidden'].some(keyword => d.data.txid.includes(keyword)));
      
    transactionNodesEnter
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

    transactionNodesEnter
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

    const groupNodesEnter = nodeEnter.filter((d: any) => d.data.txid.includes('group'));

    groupNodesEnter
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

    groupNodesEnter
      .append("text")
      .attr("class", "sumText")
      .style("fill", "white")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .html((d: any) => {
        return `<tspan x="0">Geolocation</tspan>
                <tspan x="0" dy="2em">${d.data.startingGeolocation}</tspan>`;
      }); 

    const nodeExit = nodes
      .exit()
      .transition()
      .duration(this.duration)
      .style("opacity", 0)
      .attr("transform", function() {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();
  }

  private mouseenterHighlight(event: any, d: any) {
    function findAncestors(node: any) {
      const ancestors = [];
      let current = node;
      while (current.parent) {
          ancestors.push(current.parent);
          current = current.parent;
      }
      return ancestors;
    }

    const descendants = d.descendants();
    const ancestors = findAncestors(d);

    this.gNode.selectAll('g.node').style("opacity", (node: any) => {
      return descendants.includes(node) || ancestors.includes(node) ? 1 : 0.3;
    });
    this.gLink.selectAll('path.link').style("opacity", (link: any) => {
      return descendants.includes(link.parent) || ancestors.includes(link) || 
      (d.parent === link.parent && d === link) ? 1 : 0.3;
    });
    this.gLink.selectAll('.link-text-group1').style("opacity", (link: any) => {
      return descendants.includes(link.source) || ancestors.includes(link.target) ||
      (d.parent === link.source && d === link.target) ? 1 : 0.3;
    });

    if (['txo', 'group'].some(keyword => d.data.txid.includes(keyword))) {
      const nodeInfoBox = this.gNode.selectAll(`#node-${d.data.txid}`)
        .raise()
        .append("foreignObject")
        .attr("class", "node-info-box")
        .attr("id", "node-info-box")
        .attr("width", 600)
        .attr("height", 300)
        .attr("x", -300)
        .attr("y", -300)
        .append("xhtml:div")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("color", "black")
        .style("background-color", "white")
        .style("border-radius", "10px");

      const table = nodeInfoBox.append("xhtml:table")
        .attr("width", "100%")
        .attr("height", "100%")
      const tbody = table.append("xhtml:tbody");

      for (const [key, value] of Object.entries(d.data.displayData)) {
        const row = tbody.append("xhtml:tr");
        row.append("xhtml:td")
          .style('text-align', 'right')
          .style("font-weight", "bold")
          .style("padding-left", '10px')
          .style("padding-right", "10px")
          .text(key);
        row.append("xhtml:td")
          .style("padding-left", "10px")
          .style("padding-right", "10px")
          .text(value);
      }
    }
  }

  private mouseleaveHighlight(event: any, d: any) {
    this.gNode.selectAll('g.node').style("opacity", 1);
    this.gLink.selectAll('path.link').style("opacity", 1);
    this.gLink.selectAll('.link-text-group1').style("opacity", 1);
    d3.select("#node-info-box").remove();
  }

  private renderLinks(source: any) {
    const link = this.gLink.selectAll('path.link').data(this.links, (d: any) => d.id);

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
      .attr('stroke-width', (d: any) => {
        let txoNode = undefined;
        if (d.data.txid.includes('txo')) {
          txoNode = d;
        }
        return txoNode && txoNode.data.maxFraudProba > 50 ? 3 : 1;
      })
      .style('stroke', ((d: any) => {
        let txoNode = undefined;
        if (d.data.txid.includes('txo')) {
          txoNode = d;
        }
        return txoNode && txoNode.data.maxFraudProba > 50 ? 'red' : 'white';
      }))
      .attr('fill', 'none')

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

  private renderAdditionalGraphElements(source: any) {
    const manualLink = this.gLink.selectAll(".manual-link").data(this.duplicateTxPairs.filter((d: any) => !d.initial));

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
      const linkTextAndArrow = this.gLink.selectAll('.link-text-group'+i).data(linkData, (d: any) => d.target.id)

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

    createLinkTextArrow(this.root.links(), 1)
    createLinkTextArrow(this.duplicateTxPairs.filter((d: any) => !d.initial), 2)
  }

  private detectMutualChildInTransactions() {
    const nodePairs: { source: any, target: any, initial: boolean }[] = []
    const nodeUniqueMap = new Map()

    const transactionHierarchy = this.root.descendants().filter((d: any) => d.parent && !['group', 'txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)));
    
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

    this.duplicateTxPairs = nodePairs;
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

    removeHighlighting(this.gNode);
    removeSearched(this.nodes);

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

    this.searchStatusMessage = `Searching for ${this.searchType}`; 
    searchNodes(this.nodes); 

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

    this.updateTree(this.root);
    };
  }

  private findNearestGroup(mouseX: number, mouseY: number): any {
    let closestNode = null;
    let closestDistance = Number.MAX_VALUE;
  
    const calculateDistance = (node: any) => {
      if (this.expandedGroup?.data.txid !== node.data.txid && node.data.txid.includes('group')) {
        const [y, x] = [node.x, node.y];
        // Euclidean distance
        const distance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
    
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNode = node;
        };
      }
      if (node.children) {
        node.children.forEach(calculateDistance);
      };
    }
  
    if (this.root.children) {
      this.root.children.forEach(calculateDistance)
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
        const depth: number = constantNearestNodeDepth + innerDepth; // - 1

        // Update subsequent nodes
        let nextParent: any = null;
        let previousHiddenParent: boolean = true;
        let previousOriginalDepth: number = -1;
        let previousUpdatedGroup: any;
  
        subsequentGroups.map((group: any, index: number) => {
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

        const hiddenNodeIndices: number[] = subsequentGroups.reduce((indices: number[], group: any, index: number) => {
          if (group.data.hiddenParent === true) {
            indices.push(index);
          }
          return indices;
        }, []);
      

        const hiddenNode = d3.hierarchy({
          txid: 'hidden'
        });

        if (node.data.vinTxids.length > 0 && !flags.hiddenNodeAdded) {
          hiddenNode.parent = node;
          hiddenNode.children = subsequentGroups;
          //hiddenNode.depth = depth - 1;

          for (let i in hiddenNodeIndices) {
            subsequentGroups[i].parent = hiddenNode;
          };

          node.children = [hiddenNode];
          flags.hiddenNodeAdded = true;
        } else {
          hiddenNode.parent = node;
          //hiddenNode.depth = depth - 1;
        
          node.children = [hiddenNode];
        };
      };
    };
    return node;
  };

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

  public returnZero() {
    return 0
  }
}