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
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphComponent implements OnInit {
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
  private uniqueTimeToDepthsMap: Map<string, number[]> = new Map();
  private sequenceMarkers: any[] = [];
  private realTimeZoomEvent: any;
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
        .attr('id', 'svg-container')
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
          this.realTimeZoomEvent = event;
          this.updateSequenceBar(event);
        });

      this.svg.call(this.zoom)
        .call(this.zoom.transform, d3.zoomIdentity.translate(this.width/3, 0).scale(0.2))
        //.on("dblclick.zoom", null);
    
      const initialTransaction = await this.addTransactionsToPath([rootTxid]);
      this.root = initialTransaction[0];
      this.initializeTree();
      this.graphLoading = false;
    });
  }     

  private updateSequenceBar(event: any) {
    const sequenceBar = d3.select('#sequence-bar');

    if (this.sequenceMarkers.length > 0) {
      const sequenceMarkers = sequenceBar.selectAll('.sequence-marker').data(this.sequenceMarkers, (d: any) => d.id);

      const sequenceMarkersEnter = sequenceMarkers
        .enter()
        .append('div')
        .attr('class', 'sequence-marker')
        .attr('id', (d: any) => `sequence-marker-${d.id}`)

      sequenceMarkersEnter
        .append('text')
        .attr('class', 'marker-text')
        .text((d: any) => d.monthYear);

      const sequenceMarkersUpdate = sequenceMarkersEnter.merge(sequenceMarkers as any);

      sequenceMarkersUpdate
        .style('left', (d: any) => {
          const node = d3.select(`#node-${d.followNode.data.txid}`);
          const rect = (node.node() as SVGElement).getBoundingClientRect();
          const rectNode = node.select('rect');
          const rectX = +rectNode.attr('y')
          let addPx = 0
          if (d.doubleMarked) {
            addPx = d.id === d.followNode.data.displayData['Earliest Time (Left)'].replace(" ", "") ? 0 : 50;
          }
          return `${rect.left + Math.abs(rectX*event.transform.k) + addPx*event.transform.k}px`;
        });

      sequenceMarkers.exit().remove()
    }
  }

  private async addTransactionsToPath(txidList: string[], parentTxoNode: any = null): Promise<any[]> {
    const transactions: any[] | undefined = await this.dataRetrievalService.getTransactions(txidList).toPromise();
    const convertedTransactions: any[] = [];

    if (transactions === undefined) {
      throw new Error('Transactions are undefined');
    }
  
    txidList.forEach((txid, index) => {
      const transaction = transactions[index];
      if (transaction) {
        const converted_tx = this.dataConversionService.convertToHierarchy(txid, transaction, parentTxoNode);
        convertedTransactions.push(converted_tx);
      } else {
        console.error(`Transaction data missing for txid: ${txid}`);
      }
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

  private updateTree(expandingSource: any, closingSource: any = undefined) {
    this.links = this.root.descendants().slice(1);
    this.nodes = this.root.descendants();

    this.tree(this.root);

    this.detectMutualChildInTransactions();
    this.recalculatePosition();

    let left = this.root;
    let right = this.root;

    this.root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });
    
    this.sequenceMarkers = [];
    this.nodes.filter((d: any) => !['txo', 'hidden'].some(keyword => d.data.txid.includes(keyword))).forEach((d: any) => {
      const unixTimes = d.data.time ? [d.data.time] : [d.data.earliestTime, d.data.latestTime];
      let doubleMarked = false;
      unixTimes.forEach(unixTime => {
        if (unixTime) {
          const monthYear = new Date(unixTime * 1000).toLocaleString('default', { month: 'long', year: 'numeric' });
          const existingMarkerIndex = this.sequenceMarkers.findIndex((marker: any) => marker.monthYear === monthYear);

          if (existingMarkerIndex === -1) {
            const uniqueSequenceMarker = { id: monthYear.replace(" ", "") , monthYear: monthYear, followNode: d, doubleMarked: doubleMarked }
            this.sequenceMarkers.push(uniqueSequenceMarker);
            doubleMarked = true;
          } else if (existingMarkerIndex !== -1 && this.sequenceMarkers[existingMarkerIndex].followNode.depth < d.depth) {
            this.sequenceMarkers[existingMarkerIndex].followNode = d;
            this.sequenceMarkers[existingMarkerIndex].doubleMarked = doubleMarked;
            doubleMarked = true;
          }
        }
      })
    })

    this.renderLinks(expandingSource, closingSource);
    this.renderNodes(expandingSource, closingSource);
    this.renderAdditionalGraphElements(expandingSource, closingSource);
    this.updateSequenceBar(this.realTimeZoomEvent);
  }

  private positionRelativeToTime() {
    this.uniqueTimeToDepthsMap = new Map();
    this.nodes.filter((d: any) => !['txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)))
      .forEach((node: any) => {
        const unixTime = node.data.time || node.data.latestTime;
        if (unixTime) {
          const monthYear = new Date(unixTime * 1000).toLocaleString('default', { month: 'long', year: 'numeric' });
          const depthsArray = this.uniqueTimeToDepthsMap.get(monthYear) || [];
          if (!depthsArray.includes(node.depth)) {
            depthsArray.push(node.depth);
          }
          this.uniqueTimeToDepthsMap.set(monthYear, depthsArray);
        }
      });

    const sortedNodes = this.nodes.filter((d: any) => !['txo', 'hidden'].some(keyword => d.data.txid.includes(keyword)))
      .sort((a: any, b: any) => {
        const unixTimeA = a.data.time || a.data.latestTime;
        const unixTimeB = b.data.time || b.data.latestTime;
        return unixTimeB - unixTimeA;
      });

    let lastDepthTaken = -1;
    const rootDateKey = new Date(this.root.data.time * 1000).toLocaleString('default', { month: 'long', year: 'numeric' });
    sortedNodes.forEach((d: any) => {
      const unixTime = d.data.time || d.data.latestTime;
      const dateKey = new Date(unixTime * 1000).toLocaleString('default', { month: 'long', year: 'numeric' });
      const depthsList = this.uniqueTimeToDepthsMap.get(dateKey);
      const originalDepthIndex = depthsList?.indexOf(d.depth)

      if (dateKey === rootDateKey) {
        // root month
        lastDepthTaken = Math.max(lastDepthTaken, d.depth);
        return;
      } else {
        let depthGap = 0;
        if (originalDepthIndex === 0) {
          if (d.data.txid.includes('group')) {
            if (d.parent.data.txid.includes('txo')) {
              depthGap = 2;
            } else {
              depthGap = 1;
            }
          } else {
            depthGap = 2;
          }
          d.depth = lastDepthTaken + depthGap;
        } else {
          if (d.data.txid.includes('group')) {
            if (d.parent.data.txid.includes('group')) {
              d.depth = d.parent.depth + 1;
            }
          } else {
            d.depth = d.parent.parent.depth + 2;
          }
        }
      }
      lastDepthTaken = Math.max(lastDepthTaken, d.depth);
    })

    this.nodes.filter((d: any) => ['txo', 'hidden'].some(keyword => d.data.txid.includes(keyword))).forEach((d: any) => {
      d.depth = d.parent.depth + 1;
    })
  }

  private recalculatePosition() {
    this.tree(this.root);
    this.nodes = this.root.descendants();

    this.nodes.forEach((d: any) => {
      // Depth Ensurer
      if (d.parent && (d.depth - d.parent.depth) !== 1) {
        d.depth = d.parent.depth + 1;
      }
    })

    this.positionRelativeToTime();
  
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
    });

    const positionXOverlapCheck: any[] = [];
    this.root.children.forEach((d: any, i: number) => {
      const descendants = d.descendants();
      let maxX = -Infinity;
      let minX = Infinity;
      descendants.forEach((d: any) => {
        minX = d.x < minX ? d.x : minX;
        maxX = d.x > maxX ? d.x : maxX;
      })
      const positionX: { node: any, index: number, minX: number; maxX: number } = {
        node: d,
        index: i,
        minX: minX,
        maxX: maxX
      };
      positionXOverlapCheck.push(positionX)
    })

    function checkOverlap(posX1: any, posX2: any) {
      const hasOverlap = (posX1.minX <= posX2.maxX && posX1.maxX >= posX2.minX) ||
                        (posX2.minX <= posX1.maxX && posX2.maxX >= posX1.minX);
      return hasOverlap;
    } 
    function calculateOverlapDistance(posX1: any, posX2: any) {
      const distance = Math.abs(posX1.maxX - posX2.minX);
      return distance;
    }
  
    positionXOverlapCheck.forEach((pos: any, i: number) => {
      if (i+1 < positionXOverlapCheck.length) {
        const overlapExists = checkOverlap(positionXOverlapCheck[i], positionXOverlapCheck[i+1]);
        if (overlapExists) {
          const distance = calculateOverlapDistance(positionXOverlapCheck[i], positionXOverlapCheck[i+1]);
          positionXOverlapCheck[i+1].node.descendants().forEach((d: any) => {
            d.x += distance + 300;
          })
          positionXOverlapCheck[i+1].maxX += distance + 300;
          positionXOverlapCheck[i+1].minX += distance + 300;
        }
      }
    })

    this.nodes.forEach((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  private renderNodes(expandingSource: any, closingSource: any) {
    const contextMenu = d3.select("#context-menu");
    d3.select("body").on("click", () => {
      contextMenu.style("display", "none");
    });

    const nodes = this.gNode.selectAll("g.node").data(this.nodes, (d: any) => d.id || (d.id = d.data.txid));

    const nodeEnter = nodes
      .enter()
      .append("g")
      .attr('class', 'node')
      .attr('id', (d: any) => `node-${d.data.txid}`)
      .style("opacity", 0)
      .attr("transform", (d: any) => {
        const x = closingSource && d.data.txid.includes('group') ? closingSource.x0 : expandingSource.x0;
        const y = closingSource && d.data.txid.includes('group') ? closingSource.y0 : expandingSource.y0;
        return "translate(" + y + "," + x + ")";
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
    
    const nodeUpdate = nodeEnter.merge(nodes)

    nodeUpdate
      .transition()
      .duration(this.duration)
      .style("opacity", 1)
      .attr('transform', function(d:any) {
        return 'translate(' + d.y + ',' + d.x + ')';
      });

    nodeEnter.filter((d: any) => d.data.txid === 'hidden' && !d.children).remove();

    const txoNodesEnter= nodeEnter.filter((d: any) => d.data.txid.includes('txo'));

    txoNodesEnter.on("contextmenu", (event: any, d: any) => {
      event.preventDefault();

      if (!d.children && d.data.type === 'vin') {
        contextMenu.style("display", "block").style("left", event.pageX + "px").style("top", event.pageY + "px");

        contextMenu.select(".menu-item").on("click", async () => {
          d3.selectAll(`.loader-${d.data.txid} .loader`).style("display", "block");

          const transactionsRetrieved = await this.addTransactionsToPath(d.data.vinTxids, d);

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
          this.tree(this.root);
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
      .attr('class', 'safeMouseEnterBox')
      .attr("width", 220) 
      .attr("height", 125)
      .attr("x", -110)
      .attr('y', -40)
      .attr("stroke", "none")
      .attr('fill', 'none')
      .style('pointer-events', 'all');

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
      .attr("width", 220)
      .attr("height", 200)
      .attr("x", -110)
      .attr('y', -220)
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

    groupNodesEnter.on("dblclick", (event: any, d: any) => {
      event.stopPropagation();
      this.closeAndExpandGroup(d);
    })

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

    const nodeExit = nodes.exit()
      .transition()
      .duration(this.duration)
      .style("opacity", 0)
      .attr("transform", (d: any) => {
        const x = closingSource ? closingSource.x : expandingSource.x;
        const y = closingSource ? closingSource.y : expandingSource.y;
        return "translate(" + y + "," + x + ")";
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

    let descendantsOfHidden: any[] = [];
    let ancestorsOfHidden: any[] = [];
    const hasHiddenDescendant = descendants.some((des: any) => des.data.txid === 'hidden');
    const hasHiddenAncestor = ancestors.some((anc: any) => anc.data.txid === 'hidden');
    if (hasHiddenDescendant) {
      const trueHiddenNode = this.nodes.find((des: any) => des.data.txid === 'hidden' && des.children);
      descendantsOfHidden = trueHiddenNode.descendants();
    } else if (hasHiddenAncestor) {
      const trueHiddenNode = this.nodes.find((anc: any) => anc.data.txid === 'hidden');
      ancestorsOfHidden = findAncestors(trueHiddenNode);
    }

    this.gNode.selectAll('g.node').style("opacity", (node: any) => {
      return descendants.includes(node) || ancestors.includes(node) || descendantsOfHidden.includes(node) || ancestorsOfHidden.includes(node) ? 1 : 0.25;
    });
    this.gLink.selectAll('path.link').style("opacity", (link: any) => {
      return descendants.includes(link.parent) || ancestors.includes(link) || descendantsOfHidden.includes(link.parent) || ancestorsOfHidden.includes(link) ||
      (d.parent === link.parent && d === link) ? 1 : 0.25;
    });
    this.gLink.selectAll('.link-text-group1').style("opacity", (link: any) => {
      return descendants.includes(link.source) || ancestors.includes(link.target) || descendantsOfHidden.includes(link.source) || ancestorsOfHidden.includes(link.target) ||
      (d.parent === link.source && d === link.target) ? 1 : 0.25;
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

  private checkForGrouping(updatingNode: any) {
    if (this.dataConversionService.groupingInitiated()) {
      if (updatingNode.parent.data.txid === this.root.data.txid) {
        this.closeAndExpandGroup();
        this.expandedGroup = { parent: updatingNode };
      } else {
        const nonTransactionNodes = this.nodes.filter((d: any) => d.parent && (d.data.txid.includes('group') || d.parent.data.txid === this.root.data.txid) && d.children);
        nonTransactionNodes.forEach((d: any) => {
          let geoTxoList = d.children.filter((child: any) => child.data.txid.includes('txo'));
          geoTxoList = geoTxoList.length > 0 ? geoTxoList : undefined;
          const transactionList = geoTxoList ? geoTxoList.filter((item: any) => item && Array.isArray(item.children)).map((item: any) => item.children).flat() : d.children.filter((child: any) => !['group', 'txo'].some(keyword => child.data.txid.includes(keyword)));
          if (transactionList.length > 0 && this.dataConversionService.countNumTransactions(transactionList) > this.dataConversionService.getThreshold()) {
            const index = d.children.findIndex((child: any) => !child.data.txid.includes('group'));
            const parentIndex = d.parent.children.findIndex((child: any) => child.data.txid === d.data.txid);
            const newGroupId = d.data.txid.includes('group') ? parseInt(d.data.txid.match(/\d+/g)[0] + (index+1).toString()) : (parentIndex+1).toString();
            const startingGeolocation = geoTxoList ? geoTxoList[0].data.geolocation : d.data.geolocation;
            const newGroupNode = this.dataConversionService.createGroupHierarchy(transactionList, newGroupId, startingGeolocation, d, geoTxoList);
            const spliceLength = geoTxoList ? geoTxoList.length : transactionList.length;
            d.children.splice(index, spliceLength, ...newGroupNode);
            this.recalculatePosition();
            this.expandedGroup = undefined;
            if (newGroupNode[0].children && newGroupNode[0].children.length > 0) {
              const groupToExpand = newGroupNode[0].children.reduce((maxItem: any, currentItem: any) => {
                return currentItem.data.totalNumTransactions > maxItem.data.totalNumTransactions ? currentItem : maxItem;
              });
              this.closeAndExpandGroup(groupToExpand);
            } else {
              this.updateTree(d);
            }
            return;
          }
        });
      }
    } else {
      if (this.dataConversionService.getTotalNumTransactionsRetrieved() > this.dataConversionService.getThreshold()) {
        this.root.children.forEach((d: any, index: number) => {
          if (d.children) {
            const newGroupNode = this.dataConversionService.createGroupHierarchy(d.children, index+1, d.data.geolocation, d)
            d.children = newGroupNode;
            this.recalculatePosition();
            if (newGroupNode[0].children && newGroupNode[0].children.length > 0) {
              const groupToExpand = newGroupNode[0].children.reduce((maxItem: any, currentItem: any) => {
                return currentItem.data.totalNumTransactions > maxItem.data.totalNumTransactions ? currentItem : maxItem;
              });
              this.closeAndExpandGroup(groupToExpand);
            } else {
              this.updateTree(d);
            }
          }
        })
        return;
      }
    }
    this.updateTree(updatingNode)
  }

  private closeAndExpandGroup(expandingGroup: any = undefined) {
    let closingGroupParent: any = undefined;

    if (this.expandedGroup) {
      if (this.expandedGroup.children) {
        const groupParent = this.expandedGroup.parent;
        const indexOfGroup = groupParent.children.indexOf(this.expandedGroup);
        const originalParent = this.nodes.find((node: any) => node.data.txid === groupParent.data.txid);
        this.expandedGroup.parent = originalParent;
        originalParent.children.splice(indexOfGroup, this.newChildren.length, this.expandedGroup);
        closingGroupParent = cloneDeep(originalParent);

      } else {
        const groupParent = this.nodes.find((node: any) => node.data.txid === this.expandedGroup.parent.data.txid);
        let geoTxoList = groupParent.children.filter((child: any) => child.data.txid.includes('txo'));
        geoTxoList = geoTxoList.length > 0 ? geoTxoList : undefined;
        const index = groupParent.children.findIndex((child: any) => !child.data.txid.includes('group'));
        const parentIndex = groupParent.parent.children.findIndex((child: any) => child.data.txid === groupParent.data.txid);
        const newGroupId = groupParent.data.txid.includes('group') ? parseInt(groupParent.data.txid.match(/\d+/g)[0] + (index+1).toString()) : (parentIndex+1).toString();
        const transactionList = geoTxoList ? geoTxoList.filter((item: any) => item && Array.isArray(item.children)).map((item: any) => item.children).flat() : groupParent.children.filter((child: any) => !['group', 'txo'].some(keyword => child.data.txid.includes(keyword)));
        const startingGeolocation = geoTxoList ? geoTxoList[0].data.geolocation : groupParent.data.geolocation;
        const newGroupNode = this.dataConversionService.createGroupHierarchy(transactionList, newGroupId, startingGeolocation, groupParent, geoTxoList);
        const spliceLength = geoTxoList ? geoTxoList.length : transactionList.length;
        groupParent.children.splice(index, spliceLength, ...newGroupNode);
        closingGroupParent = cloneDeep(groupParent);
      }

      this.recalculatePosition();
      if (expandingGroup) {
        expandingGroup = this.nodes.find((node: any) => node.data.txid === expandingGroup.data.txid);
      }
    }

    if (expandingGroup) {
      this.expandedGroup = cloneDeep(expandingGroup);
      const transactionsInsideGroup = cloneDeep(expandingGroup.data.transactions);
      const subsequentGroups = expandingGroup.children;

      const getDepth = (node: any): number => {
        if (!node.children || node.children.length === 0) {
          return 1;
        } else {
          return 1 + Math.max(...node.children.map(getDepth));
        }
      };

      const innerDepth = getDepth({ children: transactionsInsideGroup });
      const flags = { hiddenNodeAdded: false };

      const groupNodeDepth = expandingGroup.depth;
      const groupNodeParent = expandingGroup.parent;
      const groupNodeIndex = expandingGroup.parent.children.indexOf(expandingGroup);

      this.newChildren = transactionsInsideGroup.map((transaction: any) => {
        return this.releaseFromGroup(transaction, groupNodeDepth, groupNodeParent, innerDepth, subsequentGroups, groupNodeDepth, flags);
      });

      this.nodes.forEach((d: any) => {
        if (d.data.txid === groupNodeParent.data.txid) {
          d.children.splice(groupNodeIndex, 1, ...this.newChildren);
          this.newChildren.forEach((newChild: any) => {
            newChild.parent = d;
          });
        }
      });

      this.updateTree(expandingGroup, closingGroupParent);
    }
  }

  private renderLinks(expandingSource: any, closingSource: any) {
    const link = this.gLink.selectAll('path.link').data(this.links, (d: any) => d.id);

    const linkEnter = link.enter()
      .insert("path", "g")
      .attr('class', 'link')
      .style("opacity", 0)
      .attr("d", (d: any) => {
        const x = closingSource && d.data.txid.includes('group') ? closingSource.x0 : expandingSource.x0;
        const y = closingSource && d.data.txid.includes('group') ? closingSource.y0 : expandingSource.y0;
        const o = { x, y };
        return this.diagonal(o, o);
      });

    const linkUpdate = linkEnter.merge(link);

    linkUpdate
      .transition()
      .duration(this.duration)
      .style("opacity", 1)
      .attr("d", (d: any) => {
        const isHidden = d.data.txid === 'hidden';
        return this.diagonal(d.parent, d, isHidden); 
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
      .style("opacity", 0)
      .attr("d", (d: any) => {
        const x = closingSource ? closingSource.x : expandingSource.x;
        const y = closingSource ? closingSource.y : expandingSource.y;
        const o = { x, y };
        return this.diagonal(o, o);
      })
      .remove();
  }

  private renderAdditionalGraphElements(expandingSource: any, closingSource: any) {
    const manualLink = this.gLink.selectAll(".manual-link").data(this.duplicateTxPairs.filter((d: any) => !d.initial));

    const manualLinkEnter = manualLink.enter()
      .append("path")
      .attr("class", "manual-link")
      .style("opacity", 0)
      .attr("d", (d: any) => {
        const x = closingSource && d.target.data.txid.includes('group') ? closingSource.x0 : expandingSource.x0;
        const y = closingSource && d.target.data.txid.includes('group') ? closingSource.y0 : expandingSource.y0;
        const pathString = `M${y},${x} H${y + 85} L${y - 85},${x} H${y}`;
        return pathString;
      });

    const manualLinkUpdate = manualLinkEnter.merge(manualLink)

    manualLinkUpdate
      .transition()
      .duration(this.duration)
      .style("opacity", 1)
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
      .style("opacity", 0)
      .attr("d", (d: any) => {
        const x = closingSource && !d.target.data.txid.includes('group') ? closingSource.x : expandingSource.x;
        const y = closingSource && !d.target.data.txid.includes('group') ? closingSource.y : expandingSource.y;
        const pathString = `M${y},${x} H${y + 85} L${y - 85},${x} H${y}`;
        return pathString;
      })
      .remove()

    const createLinkTextArrow = (linkData: any, i: number) => {
      const linkTextAndArrow = this.gLink.selectAll('.link-text-group'+i).data(linkData, (d: any) => d.target.id);

      const linkTextAndArrowEnter = linkTextAndArrow.enter()
        .append("g")
        .attr("class", "link-text-group"+i)
        .style("opacity", 0)
        .attr("transform", (d: any) => {
          const x = closingSource && d.target.data.txid.includes('group') ? closingSource.x0 : expandingSource.x0;
          const y = closingSource && d.target.data.txid.includes('group') ? closingSource.y0 : expandingSource.y0;
          return "translate(" + y + "," + x + ")";
        });

      linkTextAndArrowEnter
        .append("text")
        .attr("class", "fa link-arrow")
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text('\uf106')
        .style("font-size", "22px");

      const linkTextAndArrowUpdate = linkTextAndArrowEnter.merge(linkTextAndArrow)

      linkTextAndArrowUpdate
        .transition()
        .duration(this.duration)
        .style("opacity", 1)
        .style("transform", (d: any) => {
          const translateX = d.target.data.txid === 'hidden' ? d.target.y + 150 : d.source.y - 150;
          const translateY = (d.source.x + d.target.x) / 2;
          let rotateDeg = 0;
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
            return `translate(${translateX}px, ${translateY}px) rotate(${rotateDeg}deg) translateY(-30px)`;
          } else {
            const angle = Math.atan2(d.target.y - d.source.y - 85 * 2, d.target.x - d.source.x) * (180 / Math.PI);
            const minTranslateX = -15;
            const maxTranslateX = -5;
            const translateXOffset = (angle - 0) * (maxTranslateX - minTranslateX) / (90 - 0) + minTranslateX;
            rotateDeg = 90 + (90 - angle);
            return `translate(${translateX}px, ${translateY}px) rotate(${rotateDeg}deg) translate(${translateXOffset}px, -30px)`;
          }
        });

      linkTextAndArrow.exit()
        .transition()
        .duration(this.duration)
        .style("opacity", 0)
        .style("transform", (d: any) => {
          const x = closingSource ? closingSource.x : expandingSource.x;
          const y = closingSource ? closingSource.y : expandingSource.y;
          return `translate(${y}px, ${x}px)`;
        })
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

  private releaseFromGroup(node: any, incrementDepth: number, parent: any, innerDepth: number, subsequentGroups: any, constantNearestNodeDepth: number, flags: any, stopIter: boolean=false) {
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
        let previousOriginalDepth: number = -1;
        let previousUpdatedGroup: any;
  
        subsequentGroups.map((group: any, index: number) => {
          const clonedGroup = { ...group };
          if (index > 0 && nextParent) {
            if (clonedGroup.depth === previousOriginalDepth) {
              clonedGroup.parent = previousUpdatedGroup.parent;
              clonedGroup.depth = previousUpdatedGroup.depth;
            } else {
              previousOriginalDepth = clonedGroup.depth;
              clonedGroup.parent = nextParent;
              clonedGroup.depth = depth + index;
            };
          } else {
            previousOriginalDepth = clonedGroup.depth;
            clonedGroup.parent = nextParent;
            clonedGroup.depth = depth + index;
          }
          previousUpdatedGroup = clonedGroup;
          nextParent = clonedGroup;
          return clonedGroup;
        });

        const hiddenNode = d3.hierarchy({
          txid: 'hidden'
        });

        if (node.data.vinTxids.length > 0 && !flags.hiddenNodeAdded) {
          hiddenNode.parent = node;
          hiddenNode.children = subsequentGroups;
          //hiddenNode.depth = depth - 1;

          for (const group of subsequentGroups) {
            group.parent = hiddenNode;
          };

          node.children = [hiddenNode];
          flags.hiddenNodeAdded = true;
        } else {
          hiddenNode.parent = node;
          //hiddenNode.depth = depth - 1;
        
          node.children = [hiddenNode];
        };

        stopIter = true;
      };
    };
    return node;
  };

  private diagonal(s: any, t: any, isHidden: boolean=false) {
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

    let fc = isHidden ? Math.abs(ex - x) - 150 - r : 150 - r;
    let sc = isHidden ? 150 - r : Math.abs(ex - x) - 150 - r;

    // Build and return a custom arc command
    return `
          M ${x} ${y}
          L ${x + fc * xrvs} ${y}
          C ${x + fc * xrvs + r * xrvs} ${y}
            ${x + fc * xrvs + r * xrvs} ${y}
            ${x + fc * xrvs + r * xrvs} ${y + r * yrvs}
          L ${x + fc * xrvs + r * xrvs} ${ey - r * yrvs}
          C ${x + fc * xrvs + r * xrvs}  ${ey}
            ${x + fc * xrvs + r * xrvs}  ${ey}
            ${ex - sc * xrvs}  ${ey}
          L ${ex} ${ey}
    `;
  }
}