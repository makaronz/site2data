import React, { useEffect, useState, useRef } from "react";
import { Box, Button, ButtonGroup, FormControl, InputLabel, MenuItem, Select, Tooltip, Typography, CircularProgress, Alert } from "@mui/material";
import { SigmaContainer, ControlsContainer, ZoomControl, SearchControl } from "@react-sigma/core";
import { LayoutForceAtlas2Control } from "@react-sigma/layout-forceatlas2";
import Graph, { UndirectedGraph } from "graphology";
import { BsZoomIn, BsZoomOut, BsDownload, BsArrowsFullscreen } from "react-icons/bs";

// Types for graph data
interface NodeData {
  id: string;
  label: string;
  role: string;
  centrality_score: number;
}
interface EdgeData {
  source: string;
  target: string;
  weight: number;
  sentiment: number;
}
interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

interface GraphVisualizationProps {
  scriptId: string;
}

const roleColors: Record<string, string> = {
  protagonist: "#1976d2",
  antagonist: "#d32f2f",
  law: "#388e3c",
  crowd: "#bdbdbd",
  default: "#616161",
};

function exportGraphToCSV(graph: Graph): void {
  let csv = "id,label,role,centrality_score\n";
  graph.forEachNode((key, attrs) => {
    csv += `${key},${attrs.label},${attrs.role},${attrs.centrality_score}\n`;
  });
  csv += "source,target,weight,sentiment\n";
  graph.forEachEdge((key, attrs, source, target) => {
    csv += `${source},${target},${attrs.weight},${attrs.sentiment}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ scriptId }) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const sigmaRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setGraphData(null);
    fetch(`/api/script/${scriptId}/graph`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: GraphData) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch graph data");
        setLoading(false);
      });
  }, [scriptId]);

  // Build graphology graph
  useEffect(() => {
    if (!graphData) return;
    const graph = new UndirectedGraph();
    graphData.nodes.forEach((node) => {
      graph.addNode(node.id, {
        label: node.label,
        role: node.role,
        centrality_score: node.centrality_score,
        color: roleColors[node.role] || roleColors.default,
        size: 10 + node.centrality_score * 20,
      });
    });
    graphData.edges.forEach((edge) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          weight: edge.weight,
          sentiment: edge.sentiment,
          color: edge.sentiment > 0.5 ? "#388e3c" : edge.sentiment < -0.5 ? "#d32f2f" : "#90caf9",
        });
      }
    });
    graphRef.current = graph;
  }, [graphData]);

  const handleExportImage = (type: "png" | "svg") => {
    if (!sigmaRef.current) return;
    const renderer = sigmaRef.current.getRenderer();
    if (type === "png") {
      const url = renderer.toDataURL();
      const a = document.createElement("a");
      a.href = url;
      a.download = "graph.png";
      a.click();
    } else if (type === "svg") {
      alert("SVG export is not implemented in this demo.");
    }
  };

  if (loading) {
    return <Box p={4} display="flex" alignItems="center" justifyContent="center"><CircularProgress /><Box ml={2}>Loading graph...</Box></Box>;
  }
  if (error) {
    return <Box p={4}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!graphData || !graphRef.current) {
    return <Box p={4}><Typography>No graph data available.</Typography></Box>;
  }

  return (
    <Box>
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        {/* Filters will be added in the next step */}
        <ButtonGroup variant="outlined">
          <Tooltip title="Export PNG"><Button onClick={() => handleExportImage("png")}><BsDownload /> PNG</Button></Tooltip>
          <Tooltip title="Export CSV"><Button onClick={() => graphRef.current && exportGraphToCSV(graphRef.current)}><BsDownload /> CSV</Button></Tooltip>
        </ButtonGroup>
      </Box>
      <Box height={500} borderRadius={2} boxShadow={2} position="relative">
        <SigmaContainer
          style={{ height: "100%" }}
          graph={graphRef.current}
          ref={sigmaRef}
          settings={{
            labelSize: 14,
            labelWeight: "bold",
          }}
        >
          <ControlsContainer position={"bottom-right"}>
            <ZoomControl>
              <BsZoomIn />
              <BsZoomOut />
              <BsArrowsFullscreen />
            </ZoomControl>
            <LayoutForceAtlas2Control />
          </ControlsContainer>
          <SearchControl style={{ width: "200px" }} />
        </SigmaContainer>
      </Box>
    </Box>
  );
};

export default GraphVisualization; 