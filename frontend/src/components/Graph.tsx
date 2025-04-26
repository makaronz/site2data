import React, { useEffect, useRef, useState } from 'react';
import Sigma from 'sigma';
import Graph from 'graphology';
import { Coordinates, EdgeDisplayData, NodeDisplayData } from 'sigma/types';
import ForceAtlas2 from 'graphology-layout-forceatlas2';
import circular from 'graphology-layout/circular';
import { SigmaContainer, useLoadGraph, ControlsContainer, ZoomControl, SearchControl } from '@react-sigma/core';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import { BsZoomIn, BsZoomOut, BsArrowsFullscreen } from 'react-icons/bs';
import { Slider, Button, Select, Tooltip } from '@mui/material';

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    role: string;
    centrality_score: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
    sentiment: number;
  }>;
}

interface GraphProps {
  data?: GraphData;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edge: { source: string; target: string }) => void;
}

const GraphVisualization: React.FC<GraphProps> = ({ data, onNodeClick, onEdgeClick }) => {
  const [layout, setLayout] = useState<'circular' | 'forceAtlas2'>('circular');
  const [minWeight, setMinWeight] = useState(0);
  const [showDifficultScenes, setShowDifficultScenes] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const LoadGraph = () => {
    const loadGraph = useLoadGraph();

    useEffect(() => {
      if (!data) return;

      const graph = new Graph();

      // Dodawanie węzłów
      data.nodes.forEach((node) => {
        graph.addNode(node.id, {
          label: node.label,
          size: node.centrality_score * 10,
          color: getNodeColor(node.role),
          x: Math.random(),
          y: Math.random(),
        });
      });

      // Dodawanie krawędzi
      data.edges.forEach((edge) => {
        if (edge.weight >= minWeight) {
          graph.addEdge(edge.source, edge.target, {
            weight: edge.weight,
            color: getSentimentColor(edge.sentiment),
            size: edge.weight * 2,
          });
        }
      });

      // Aplikowanie layoutu
      if (layout === 'circular') {
        circular.assign(graph);
      } else {
        ForceAtlas2.assign(graph, { iterations: 100 });
      }

      loadGraph(graph);
      graphRef.current = graph;
    }, [data, layout, minWeight]);

    return null;
  };

  const getNodeColor = (role: string): string => {
    switch (role) {
      case 'protagonist':
        return '#4CAF50';
      case 'antagonist':
        return '#f44336';
      case 'supporting':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.5) return '#4CAF50';
    if (sentiment < -0.5) return '#f44336';
    return '#9E9E9E';
  };

  const handleNodeClick = (nodeId: string) => {
    if (onNodeClick) onNodeClick(nodeId);
    setSelectedCharacter(nodeId);
  };

  const handleEdgeClick = (edge: { source: string; target: string }) => {
    if (onEdgeClick) onEdgeClick(edge);
  };

  return (
    <div className="w-full h-[600px] relative" ref={containerRef}>
      <div className="absolute top-4 left-4 z-10 space-y-4 bg-white p-4 rounded shadow">
        <Select
          value={layout}
          onChange={(e) => setLayout(e.target.value as 'circular' | 'forceAtlas2')}
          className="w-48"
        >
          <option value="circular">Układ kołowy</option>
          <option value="forceAtlas2">Force Atlas 2</option>
        </Select>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Minimalna waga relacji</label>
          <Slider
            value={minWeight}
            onChange={(_, value) => setMinWeight(value as number)}
            min={0}
            max={1}
            step={0.1}
          />
        </div>

        <div className="space-x-2">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowDifficultScenes(!showDifficultScenes)}
          >
            {showDifficultScenes ? 'Ukryj' : 'Pokaż'} trudne sceny
          </Button>
        </div>
      </div>

      <SigmaContainer
        style={{ height: '100%' }}
        settings={{
          nodeProgramClasses: {},
          edgeProgramClasses: {},
          labelRenderer: true,
          defaultNodeColor: '#999',
          defaultEdgeColor: '#999',
          defaultNodeSize: 5,
          defaultEdgeSize: 1,
          labelSize: 12,
          labelWeight: 'bold',
        }}
      >
        <LoadGraph />
        <ControlsContainer position={'bottom-right'}>
          <ZoomControl>
            <BsZoomIn />
            <BsZoomOut />
          </ZoomControl>
          <LayoutForceAtlas2Control />
        </ControlsContainer>
        <SearchControl style={{ width: '200px' }} />
      </SigmaContainer>

      {hoveredNode && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded shadow">
          <h3 className="font-bold">{hoveredNode}</h3>
          {/* Tutaj dodatkowe informacje o węźle */}
        </div>
      )}
    </div>
  );
};

export default GraphVisualization; 