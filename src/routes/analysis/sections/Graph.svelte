<script>
  import { onMount } from 'svelte';
  import Sigma from 'sigma';
  import Graph from 'graphology';

  let container;
  let sigmaInstance;

  // Mock data import
  import nodes from './druga-furioza-graph-nodes.json';
  import edges from './druga-furioza-graph-edges.json';

  function getNodeColor(node) {
    if (node.difficult) return '#ff3b3b';
    if (node.role === 'protagonist') return '#2e86ff';
    if (node.role === 'antagonist') return '#ffb300';
    if (node.role === 'law') return '#00b894';
    if (node.role === 'crowd') return '#b2bec3';
    return '#636e72';
  }

  function getEdgeColor(edge) {
    if (edge.difficult) return '#ff7675';
    if (edge.sentiment > 0.5) return '#00b894';
    if (edge.sentiment < -0.5) return '#d63031';
    return '#636e72';
  }

  onMount(() => {
    const graph = new Graph();
    nodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label,
        size: 10 + node.centrality * 20,
        color: getNodeColor(node),
        ...node
      });
    });
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, {
        label: edge.id,
        size: 1 + edge.weight * 2,
        color: getEdgeColor(edge),
        ...edge
      });
    });
    sigmaInstance = new Sigma(graph, container, {
      renderEdgeLabels: false,
      minCameraRatio: 0.1,
      maxCameraRatio: 10
    });
    // TODO: Add overlays, timeline, risk-radar, what-if, tooltips, export, etc.
    return () => sigmaInstance.kill();
  });
</script>

<div class="graph-section">
  <div bind:this={container} class="sigma-container"></div>
  <div class="graph-overlays">
    <!-- Timeline, risk-radar, what-if, eksport, dramat, tooltipy, itd. -->
    <div class="overlay timeline">Timeline (coming soon)</div>
    <div class="overlay risk-radar">Risk-Radar (coming soon)</div>
    <div class="overlay what-if">What-if (coming soon)</div>
    <div class="overlay export">Eksport (coming soon)</div>
    <div class="overlay dramat">Dramat! (coming soon)</div>
  </div>
</div>

<style>
.graph-section {
  position: relative;
  width: 100%;
  height: 70vh;
  background: linear-gradient(120deg, #232526 0%, #414345 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
}
.sigma-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
.graph-overlays {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 2rem;
  gap: 1rem;
}
.overlay {
  background: rgba(30, 30, 40, 0.85);
  color: #fff;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  font-size: 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  margin-bottom: 0.5rem;
  pointer-events: auto;
  opacity: 0.92;
  transition: background 0.2s;
}
.overlay.timeline { background: #2e86ffcc; }
.overlay.risk-radar { background: #ff3b3bcc; }
.overlay.what-if { background: #00b894cc; }
.overlay.export { background: #b2bec3cc; color: #232526; }
.overlay.dramat { background: #d63031cc; }
</style>
