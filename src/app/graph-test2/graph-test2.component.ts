import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import * as d3 from 'd3';
import { parse, stringify } from 'flatted';
import { DataRetrievalService } from 'src/services/data-retrieval/data-retrieval.service';
import base64Icons from '../../assets/images/icons.json';
import { PerformanceService } from 'src/services/performance/performance.service';
import { DataConversionService } from 'src/services/data-conversion/data-conversion.service';

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
  private transactionNodeSize = { width: 150, height: 200 };
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
    private dataConversionService: DataConversionService,
    //private performanceService: PerformanceService
  ) {  }

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight; 

    this.route.params.subscribe(params => {
      this.graphLoading = true;
      const rootTxid = params['tx'];

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
        const currentTransform = d3.zoomTransform(this.svg.node());
        const [mouseX, mouseY] = currentTransform.invert(d3.pointer(event, this.svg.node()));

        if (!this.expandedGroup) {
          const nearestNode = this.findNearestGroup(mouseX, mouseY);
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

            this.nodes.forEach((d: any) => {
              if (d.data.txid === 'txo' && !visited && d.children && d.children.some((child: any) => child.data.txid === this.expandedGroup.data.txid)) {
                d.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                
                this.newChildren.forEach((newChild: any) => {
                  newChild.parent = d;
                });

                visited = true;
              } else if (d.data.txid.includes('group') && d.data.txid === nearestNodeParent.data.txid && !visited) {
                d.children.splice(nearestNodeIndex, 1, ...this.newChildren);
                d.data.children.splice(nearestNodeIndex, 1, ...this.newChildren);

                this.newChildren.forEach((newChild: any) => {
                  newChild.parent = d;
                });
                
                visited = true;
              };
            });

            setTimeout(() => {
              this.updateTree(nearestNode);
            }, 0);
          }
        } else if (this.expandedGroup) {
          const originalParent = this.expandedGroup.parent;
          const indexOfGroup = originalParent.children.indexOf(this.expandedGroup);
          let visited = false;

          this.nodes.forEach((d: any) => {
            if (d.data.txid === 'txo' && !visited && d.children && d.children.some((child: any) => child.data.txid === this.expandedGroup.data.txid)) {
              this.expandedGroup.parent = d;
              d.children.splice(indexOfGroup, this.newChildren.length, this.expandedGroup);
              visited = true;
            } else if (d.data.txid.includes('group') && d.data.txid === originalParent.data.txid && !visited) {
              this.expandedGroup.parent = d;
              d.children.splice(indexOfGroup, this.newChildren.length, this.expandedGroup);
              visited = true;
            };
          });

          const returnNode = this.expandedGroup;
          this.expandedGroup = undefined;

          setTimeout(() => {
            this.updateTree(returnNode);
          }, 0);
        } 
      });

      this.dataRetrievalService.requestTransaction(rootTxid).subscribe((res: any) => { 
        const initialTransaction = this.dataConversionService.convertToHierarchy(res['transaction']);
        this.initializeTree(initialTransaction);
        this.graphLoading = false;
      });
    });
  }     

  private getTransactions(txid_list: string[]): Observable<any[]> {
    const observables = txid_list.map(txid => {
      return this.dataRetrievalService.requestTransaction(txid);
    });

    return forkJoin(observables);
  }

  private async addTransactionsToPath(txid_list: string[]): Promise<any[]> {
    const transactions: any[] | undefined = await this.getTransactions(txid_list).toPromise();
    const convertedTransactions: any[] = [];

    if (transactions === undefined) {
      throw new Error('Transactions are undefined');
    }
  
    transactions.forEach((transaction: any) => {
      const converted_tx = this.dataConversionService.convertToHierarchy(transaction);
      convertedTransactions.push(converted_tx);
    });
  
    return convertedTransactions;
  }

  private initializeTree(data: any) {
    this.root = d3.hierarchy(data);
    this.tree = d3.tree()
                  .nodeSize([this.transactionNodeSize.height, this.transactionNodeSize.width])
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
    this.detectMutualChildInTransactions();

    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();

    this.tree(this.root);

    let averageX = 0;
    let maxHiddenY = 0;
    const hiddenNodes = this.nodes.filter((d: any) => d.data.txid === 'hidden');
    if (hiddenNodes.length > 0) {
      averageX = hiddenNodes.reduce((sum: any, node: any) => sum + node.x, 0) / hiddenNodes.length;
    };

    this.nodes.forEach((d: any) => {
      d.y = d.depth * -300;
      if (d.data.txid === 'hidden' && Math.abs(maxHiddenY) < Math.abs(d.y)) {
          maxHiddenY = d.y;
      };
    });

    // Ensure the x y positions are correctly set in data.
    this.nodes.forEach((parent: any) => {
      if (parent.data.txid.includes('group')) {
        this.nodes.forEach((child: any) => {
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
      d.y = maxHiddenY - 100;
      d.x = averageX;
    });

    let left = this.root;
    let right = this.root;

    this.root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    this.renderNodes(source);
    this.renderLinks(source);
    this.renderAdditionalGraphElements(source);

    this.nodes.forEach((d:any) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
  }

  private renderNodes(source: any) {
    let id = 0;
    const nodes = this.gNode.selectAll("g.node").data(this.nodes, (d: any) => d.id || (d.id = ++id));

    const nodeEnter = nodes
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
        return d.data.stxo_count > 0 ? 'red' : 'green';
      })

    /*
    txoNodesUpdate
      .append("image")
      .attr("xlink:href", (d: any) => base64Icons[(d.data.geolocation.toLowerCase().replace(' ', '') as keyof typeof base64Icons)])
      .attr("x", -25)
      .attr("y", -25)
      .attr("width", 50)
      .attr("height", 50);
    */

    txoNodesUpdate
      .append("text")
      .attr('class', 'txoAddress')
      .style("fill", "white")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .html((d: any) => {
        return `<tspan x="0" y="5em">Geolocation: ${d.data.geolocation}</tspan>
        <tspan x="0" dy="2em">Total Value:</tspan>`;
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
        /*
        const txCountInGroup = d.data.txCountInGroup ? d.data.txCountInGroup : '15';
        const fraudTxCountInGroup = d.data.fraudTxCount ? d.data.fraudTxCount : '6';
        return `<tspan x="0">Potential Fraud TX</tspan>
                <tspan x="0" dy="2em">${fraudTxCountInGroup} / ${txCountInGroup}</tspan>`;
        */
        return `<tspan x="0">Geolocation</tspan>
                <tspan x="0" dy="2em">${d.data.geolocation}</tspan>`;
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
    
    /*
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
    */

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
      .attr('stroke-width', 1)
      .style('stroke', ((d: any) => {
        if (d.parent.data.txid !== 'txo') {
          // white if no vin has fraud proba over 0.5 else red
          d.data.vin_list
        } else if (['txo', 'group', 'hidden'].some(keyword => d.children[0].data.txid.includes(keyword))) {
          // white if 
        }
        return 'red';
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
  
    if (this.root.children) {
      this.root.children.forEach(visit)
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

        if (node.data.stxo_count > 0) {
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

  public getPath(txid: string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dev2/path'], { queryParams: { tx1: this.root.data.txid, tx2: txid} })
    );
    window.open(url, '_blank');
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

  public returnZero() {
    return 0
  }
}