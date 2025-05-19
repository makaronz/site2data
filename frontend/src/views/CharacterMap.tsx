import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, useTheme, Button, CircularProgress } from '@mui/material';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl } from '@react-sigma/core';
import { Attributes } from 'graphology-types';
import Graph from 'graphology';
import { circular } from 'graphology-layout';
import { animateNodes } from 'graphology-layout-force';
import ForceAtlas2 from 'graphology-layout-forceatlas2';
import Tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import useGlobalStore from '../store/globalStore';
import apiClient, { LoadingIndicator, ErrorIndicator } from '../api/apiClient';

/**
 * Character Map View with dynamic graph visualization
 * 
 * Role: Director / Screenwriter
 * 
 * Features:
 * - Force-directed graph using @react-sigma/core
 * - Nodes: characters, sized by centrality
 * - Edges: sentiment-based (color-coded)
 * - Filters and export options
 */
const CharacterMap: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedCharacter } = useGlobalStore();
  
  // State for graph data and UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string | null>(null);
  const [showSentiment, setShowSentiment] = useState<boolean>(true);
  
  // Fetch character graph data
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getCharacterGraph();
        setGraphData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching character graph:', err);
        setError('Failed to load character graph data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGraphData();
  }, []);
  
  // Create and configure the graph
  const createGraph = useMemo(() => {
    if (!graphData) return null;
    
    const graph = new Graph();
    
    // Add nodes (characters)
    graphData.nodes.forEach((node: any) => {
      // Filter by selected character if any
      if (selectedCharacterFilter && node.id !== selectedCharacterFilter && 
          !graphData.edges.some((edge: any) => 
            (edge.source === selectedCharacterFilter && edge.target === node.id) || 
            (edge.source === node.id && edge.target === selectedCharacterFilter)
          )) {
        return;
      }
      
      // Filter by selected scene if any
      if (selectedScene && !node.scenes.includes(selectedScene)) {
        return;
      }
      
      graph.addNode(node.id, {
        label: node.name,
        size: 10 + (node.centrality * 20), // Size based on centrality
        color: theme.palette.primary.main,
        scenes: node.scenes,
        centrality: node.centrality,
        relationships: node.relationships || []
      });
    });
    
    // Add edges (relationships)
    graphData.edges.forEach((edge: any) => {
      // Skip if either source or target node doesn't exist (filtered out)
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
        return;
      }
      
      // Filter by selected scene if any
      if (selectedScene && !edge.scenes.includes(selectedScene)) {
        return;
      }
      
      let edgeColor = theme.palette.text.secondary;
      
      // Color based on sentiment if enabled
      if (showSentiment) {
        if (edge.sentiment > 0.3) {
          edgeColor = theme.palette.success.main; // Positive
        } else if (edge.sentiment < -0.3) {
          edgeColor = theme.palette.error.main; // Negative
        } else {
          edgeColor = theme.palette.grey[500]; // Neutral
        }
      }
      
      graph.addEdge(edge.source, edge.target, {
        size: 1 + Math.abs(edge.weight),
        color: edgeColor,
        sentiment: edge.sentiment,
        scenes: edge.scenes
      });
    });
    
    // Apply layout
    circular.assign(graph);
    
    return graph;
  }, [graphData, selectedScene, selectedCharacterFilter, showSentiment, theme]);
  
  // Apply force layout when graph changes
  useEffect(() => {
    if (!createGraph) return;
    
    const forceLayout = new ForceAtlas2({
      settings: {
        gravity: 5,
        scalingRatio: 10,
        strongGravityMode: true,
        slowDown: 10
      }
    });
    
    const cancelLayout = animateNodes(createGraph, { duration: 1000, easing: "linear" });
    
    forceLayout.assign(createGraph);
    
    return () => {
      cancelLayout();
    };
  }, [createGraph]);
  
  // Export graph as PNG
  const exportAsPNG = () => {
    const canvas = document.querySelector('.sigma-scene canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'character-map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  // Export graph as GEXF
  const exportAsGEXF = () => {
    if (!createGraph) return;
    
    const gexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
  <graph mode="static" defaultedgetype="directed">
    <nodes>
      ${Array.from(createGraph.nodeEntries()).map(([id, attrs]) => 
        `<node id="${id}" label="${attrs.label}" size="${attrs.size}" />`)
        .join('\n      ')}
    </nodes>
    <edges>
      ${Array.from(createGraph.edgeEntries()).map(([id, edge, attrs], i) => 
        `<edge id="${i}" source="${edge.source}" target="${edge.target}" weight="${attrs.size}" />`)
        .join('\n      ')}
    </edges>
  </graph>
</gexf>`;
    
    const blob = new Blob([gexf], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'character-map.gexf';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Custom sigma component with tooltips
  const CustomSigma = () => {
    const registerTooltips = (sigma: any) => {
      // Setup tooltips
      const tooltipElem = document.createElement("div");
      tooltipElem.className = "sigma-tooltip";
      tooltipElem.style.position = "absolute";
      tooltipElem.style.padding = "10px";
      tooltipElem.style.backgroundColor = theme.palette.background.paper;
      tooltipElem.style.color = theme.palette.text.primary;
      tooltipElem.style.borderRadius = "4px";
      tooltipElem.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      tooltipElem.style.pointerEvents = "none";
      tooltipElem.style.zIndex = "1000";
      tooltipElem.style.transition = "opacity 0.2s";
      tooltipElem.style.opacity = "0";
      document.body.appendChild(tooltipElem);
      
      // Create tooltip instance
      const tooltip = Tippy(tooltipElem, {
        trigger: "manual",
        placement: "right",
        arrow: true,
        offset: [0, 20],
        hideOnClick: false,
        followCursor: true,
        appendTo: document.body
      });
      
      // Node hover
      sigma.on("enterNode", (event: any) => {
        const node = event.node;
        const nodeAttributes = sigma.getGraph().getNodeAttributes(node);
        
        tooltipElem.innerHTML = `
          <div>
            <strong>${nodeAttributes.label}</strong>
            <div>Scenes: ${nodeAttributes.scenes.length}</div>
            <div>Centrality: ${nodeAttributes.centrality.toFixed(2)}</div>
            <div>Relationships: ${nodeAttributes.relationships.length}</div>
          </div>
        `;
        
        tooltipElem.style.opacity = "1";
        tooltip.show();
      });
      
      // Node leave
      sigma.on("leaveNode", () => {
        tooltipElem.style.opacity = "0";
        tooltip.hide();
      });
      
      // Edge hover
      sigma.on("enterEdge", (event: any) => {
        const edge = event.edge;
        const edgeAttributes = sigma.getGraph().getEdgeAttributes(edge);
        const sourceAttributes = sigma.getGraph().getNodeAttributes(sigma.getGraph().source(edge));
        const targetAttributes = sigma.getGraph().getNodeAttributes(sigma.getGraph().target(edge));
        
        let sentimentText = "Neutral";
        if (edgeAttributes.sentiment > 0.3) sentimentText = "Positive";
        else if (edgeAttributes.sentiment < -0.3) sentimentText = "Negative";
        
        tooltipElem.innerHTML = `
          <div>
            <strong>${sourceAttributes.label} → ${targetAttributes.label}</strong>
            <div>Sentiment: ${sentimentText} (${edgeAttributes.sentiment.toFixed(2)})</div>
            <div>Scenes together: ${edgeAttributes.scenes.length}</div>
          </div>
        `;
        
        tooltipElem.style.opacity = "1";
        tooltip.show();
      });
      
      // Edge leave
      sigma.on("leaveEdge", () => {
        tooltipElem.style.opacity = "0";
        tooltip.hide();
      });
      
      // Node click
      sigma.on("clickNode", (event: any) => {
        const node = event.node;
        const nodeAttributes = sigma.getGraph().getNodeAttributes(node);
        
        // Get character data from original data
        const characterData = graphData.nodes.find((n: any) => n.id === node);
        
        // Update global store
        setSelectedCharacter(characterData);
      });
    };
    
    return (
      <SigmaContainer 
        graph={createGraph}
        style={{ height: 500, width: '100%' }}
        settings={{
          renderEdgeLabels: false,
          defaultNodeColor: theme.palette.primary.main,
          defaultEdgeColor: theme.palette.text.secondary,
          labelSize: 14,
          labelColor: {
            color: highContrast 
              ? theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
              : theme.palette.text.primary
          },
          labelWeight: "bold",
          nodeBorderColor: {
            color: theme.palette.background.paper
          },
          nodeHoverColor: {
            color: theme.palette.secondary.main
          }
        }}
        onSigmaReady={registerTooltips}
      >
        <ControlsContainer position="bottom-right">
          <ZoomControl />
          <FullScreenControl />
        </ControlsContainer>
      </SigmaContainer>
    );
  };
  
  // Mock data for scenes (will be replaced with API data)
  const mockScenes = [
    { id: "scene1", number: 1, location: 'INT. APARTMENT - DAY' },
    { id: "scene2", number: 2, location: 'EXT. STREET - NIGHT' },
    { id: "scene3", number: 3, location: 'INT. OFFICE - DAY' },
    { id: "scene4", number: 4, location: 'EXT. PARK - DAY' },
    { id: "scene5", number: 5, location: 'INT. RESTAURANT - NIGHT' },
  ];
  
  // Mock data for characters (will be replaced with API data)
  const mockCharacters = graphData?.nodes || [];
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Character Map
      </Typography>
      
      <Typography variant="body1" paragraph>
        Visualize character relationships and interactions throughout the script.
      </Typography>
      
      {/* Filter Controls */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 4,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="caption" display="block" gutterBottom>
              Filter by Character
            </Typography>
            <select
              value={selectedCharacterFilter || ''}
              onChange={(e) => setSelectedCharacterFilter(e.target.value || null)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }}
            >
              <option value="">All Characters</option>
              {mockCharacters.map((character: any) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </Box>
          
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="caption" display="block" gutterBottom>
              Filter by Scene
            </Typography>
            <select
              value={selectedScene || ''}
              onChange={(e) => setSelectedScene(e.target.value || null)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }}
            >
              <option value="">All Scenes</option>
              {mockScenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  Scene {scene.number}: {scene.location}
                </option>
              ))}
            </select>
          </Box>
          
          <Box>
            <Typography variant="caption" display="block" gutterBottom>
              Sentiment Coloring
            </Typography>
            <Button 
              variant={showSentiment ? "contained" : "outlined"} 
              size="small"
              onClick={() => setShowSentiment(!showSentiment)}
            >
              {showSentiment ? "Sentiment On" : "Sentiment Off"}
            </Button>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box>
            <Button variant="contained" size="small" onClick={exportAsPNG} sx={{ mr: 1 }}>
              Export PNG
            </Button>
            <Button variant="contained" size="small" onClick={exportAsGEXF}>
              Export GEXF
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Character Graph */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          height: 550, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        {loading ? (
          <LoadingIndicator />
        ) : error ? (
          <ErrorIndicator message={error} />
        ) : createGraph ? (
          <CustomSigma />
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', my: 'auto' }}>
            No character data available
          </Typography>
        )}
      </Paper>
      
      {/* Character List */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Characters
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : error ? (
          <Typography color="error">Failed to load characters</Typography>
        ) : (
          mockCharacters.map((character: any) => (
            <Paper 
              key={character.id}
              elevation={1}
              sx={{ 
                p: 2, 
                width: 200,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                backgroundColor: highContrast 
                  ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                  : theme.palette.background.paper,
              }}
              onClick={() => setSelectedCharacter(character)}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {character.name}
              </Typography>
              <Typography variant="body2">
                Scenes: {character.scenes?.length || 0}
              </Typography>
              <Typography variant="body2">
                Centrality: {character.centrality?.toFixed(2) || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Relationships: {character.relationships?.length || 0}
              </Typography>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
};

export default CharacterMap;
