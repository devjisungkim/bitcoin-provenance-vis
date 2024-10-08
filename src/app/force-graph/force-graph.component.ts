import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import cloneDeep from 'lodash/cloneDeep';
import { Subscription } from 'rxjs';
import { SharedDataService } from 'src/services/shared-data/shared-data.service';

declare var require: any
var iso3311a2 = require('../../../node_modules/iso-3166-1-alpha-2')

@Component({
  selector: 'app-force-graph',
  templateUrl: './force-graph.component.html',
  styleUrls: ['./force-graph.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ForceGraphComponent implements OnInit, OnDestroy {
  private svg: any;
  private g: any;
  private zoom: any;
  private simulation: any;
  private forceData: any;
  private links: any;
  private nodes: any;
  private width: any;
  private height: any;
  private screenWidth: any;
  private screenHeight: any;
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  private forceDataSubscription: Subscription | undefined;

  viewingTransaction: string = '';
  minValueThreshold: string = '0.00000001'; // one satoshi

  constructor(
    private sharedDataService: SharedDataService,
  ) {}

  ngOnInit(): void {
    this.initializeForce();
  }

  private initializeForce() {
    this.screenWidth = window.innerWidth * 0.4;
    this.screenHeight = window.innerHeight; 

    this.width = this.screenWidth - this.margin.left - this.margin.right;
    this.height = this.screenHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.selectAll('#forceContainer')
      .append('svg')
      .attr('width', this.screenWidth)
      .attr('height', this.screenHeight)
      .attr('viewBox', `-${this.screenWidth/4} -${this.screenHeight/2} ${this.screenWidth} ${this.screenHeight}`)
      .attr("style", "max-width: 100%; height: 100%; user-select: none;");

    this.g = this.svg.append('g')

    this.zoom = d3.zoom()
      .scaleExtent([0.05, 2])
      .on("zoom", (event: any) => {
        this.g.attr("transform", event.transform);
      });

    this.svg.call(this.zoom)
      .call(this.zoom.transform, d3.zoomIdentity.translate(this.width/2, 0).scale(0.5))

      this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.id).distance(500))
      .force('charge', d3.forceManyBody().strength(-20))
      .force('center', d3.forceCenter(0, 0))
      .on('tick', () => {
        //this.clusterNodes();
        this.g.selectAll(".link line")
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        this.g.selectAll(".link .link-arrow")
          .attr("transform", (d: any) => {
            const x = (d.source.x + d.target.x) / 2;
            const y = (d.source.y + d.target.y) / 2;
            // this angle heads to target (txo)
            const angle = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * (180 / Math.PI) + 90;
            const adjustedAngle = d.target.data.type === 'vin' ? angle + 180 : angle;
            return `translate(${x}, ${y}) rotate(${adjustedAngle})`;
          });
  
        this.g.selectAll(".node")
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

    this.forceDataSubscription = this.sharedDataService.forceData$.subscribe(newForceData => {
      if (this.viewingTransaction !== newForceData.txid) {
        this.viewingTransaction = newForceData.txid;
        this.forceData = newForceData;
        this.updateForce();
      }
    });
  }

  updateForce() {
    if (Number(this.minValueThreshold) <= 0) {
      alert("Please enter a valid non-negative integer value.");
      return;
    }

    this.nodes = this.forceData.nodes.filter((d: any) => !d.data.txid.includes('txo') || d.data.value >= this.minValueThreshold);
    this.links = this.forceData.links.filter((d: any) => d.target.data.value >= this.minValueThreshold);

    const allTxoNodesValue = this.forceData.nodes.filter((node: any) => node.data.txid.includes('txo')).map((node: any) => node.data.value);
    const minValue = Math.min(...allTxoNodesValue);
    const maxValue = Math.max(...allTxoNodesValue);
    const minRadius = 10;
    const maxRadius = 100;
    const valueRange = maxValue - minValue;
    const radiusRange = maxRadius - minRadius;

    this.nodes.forEach((d: any) => {
      const valuePos = (d.data.value - minValue) / valueRange;
      const radius = radiusRange * valuePos + minRadius;
      d.data.radius = radius;
    });

    this.simulation.nodes(this.nodes);
    this.simulation.force("link").links(this.links);
    this.simulation.alpha(1).restart();

    this.clusterNodes();
    this.renderLinks();
    this.renderNodes();
  }

  private clusterNodes() {  
    const coords: { [key: string]: { x: number, y: number }[] } = {};
    const groups: any[] = [];

    this.nodes.forEach((d: any) => {
      if (groups.indexOf(d.data.address) == -1) {
        groups.push(d.data.address);
        coords[d.data.address] = [];
      }
      coords[d.data.address].push({ x: d.x, y: d.y });  
    })
    
    const centroids: { [key: string]: { x: number, y: number } } = {};

    for (let group in coords) {
      const groupNodes = coords[group];
      const n = groupNodes.length;
      let cx = 0;
      let tx = 0;
      let cy = 0;
      let ty = 0;

      groupNodes.forEach((d: any) => {
        tx += d.x;
        ty += d.y;
      })
  
      cx = tx/n;
      cy = ty/n;
  
      centroids[group] = { x: cx, y: cy }   
    }

    const minDistance = 1;

    this.nodes.forEach((d: any) => {
      let cx = centroids[d.data.address].x;
      let cy = centroids[d.data.address].y;
      let x = d.x;
      let y = d.y;
      let dx = cx - x;
      let dy = cy - y;
  
      let r = Math.sqrt(dx*dx+dy*dy)
  
      if (r>minDistance) {
        d.x = x * 0.9 + cx * 0.1;
        d.y = y 
        * 0.9 + cy * 0.1;
      }
    });
  }

  private renderNodes() {
    const dragstarted = (event: any, d: any) => {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    const dragged = (event: any, d: any) => {
      d.fx = event.x;
      d.fy = event.y;
    }

    const dragended = (event: any, d: any) => {
      if (!event.active) this.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    const nodes = this.g.selectAll("g.node").data(this.nodes, (d: any) => d.id || d.data.txid);

    const nodesEnter = nodes.enter()
      .append("g")
      .attr("class", "node")
      .attr('id', (d: any) => `node-${d.data.txid}`)
      .call(drag)

    const txoNodesEnter = nodesEnter.filter((d: any) => d.data.txid.includes('txo'));
    const transactionNodesEnter = nodesEnter.filter((d: any) => !d.data.txid.includes('txo'));

    txoNodesEnter
      .on("mouseenter", (event: any, d: any) => this.mouseenter(d))
      .on("mouseleave", () => this.mouseleave())

    txoNodesEnter
      .append('circle')
      .attr('stroke', 'none')
      .attr("stroke-opacity", "1")
      .attr("r", (d: any) => d.data.radius)
      .attr("fill", (d: any) => {
        if (d.data.type === 'vout') {
          return d.data.is_utxo ? 'green' : 'red';
        }
        return 'red';
      });

    txoNodesEnter
      .append('image')
      .attr('xlink:href', (d: any) => {
        return `../../assets/flag_svg/${d.data.geolocation.toLowerCase()}.svg`;
      })
      .attr('x', (d: any) => {
        return -d.data.radius / 1.5;
      })
      .attr('y', (d: any) => {
        return -d.data.radius / 2;
      })
      .attr('width', (d: any) => {
        return d.data.radius * 1.5;
      })
      .attr('height', (d: any) => {
        return d.data.radius;
      })

    transactionNodesEnter
      .append('rect')
      .attr("class", "transactionRect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", "1")
      .attr("stroke", 'var(--bitcoin-theme)')
      .attr("width", 50) 
      .attr("height", 75)
      .attr("x", -25)
      .attr("y", -32.5)
      .style("fill", "var(--content-bg-color)");

    nodes.merge(nodesEnter);

    nodes.exit().remove();

    this.simulation.force("collide", d3.forceCollide().radius((d: any) => d.data.radius).strength(1).iterations(1))
  }

  private renderLinks() {
    const links = this.g.selectAll(".link").data(this.links, (d: any) => d.target.data.txid);

    const linksEnter = links
      .enter()
      .append("g")
      .attr("class", "link")

    linksEnter
      .append("line")
      .attr('stroke-width', 2)
      .attr('stroke', (d: any) => {
        const isSuspicious = d.target.data.supervised_alert_probability > 0.5;
        return isSuspicious ? 'red' : 'white';
      })

    linksEnter
      .append("text")
      .attr("class", "fa link-arrow")
      .attr("dy", "0.5em")
      .attr("text-anchor", "middle")
      .style("fill", (d: any) => {
        const isSuspicious = d.target.data.supervised_alert_probability > 0.5;
        return isSuspicious ? 'red' : 'white';
      })
      .text('\uf106')
      .style("font-size", "22px");

    linksEnter.merge(links);
    links.exit().remove();
  }

  private mouseenter(d: any) {
    const nodeInfoBox = this.g.selectAll(`#node-${d.data.txid}`)
      .raise()
      .append("foreignObject")
      .attr("class", "node-info-box")
      .attr("id", "node-info-box")
      .attr("width", 600)
      .attr("height", 200)
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

  private mouseleave() {
    d3.select("#node-info-box").remove();
  }

  ngOnDestroy() {
    if (this.forceDataSubscription) {
      this.forceDataSubscription.unsubscribe();
    }
  }
}
