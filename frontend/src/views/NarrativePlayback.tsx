import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, useTheme, Button, Slider, IconButton } from '@mui/material';
import { PlayArrow, Pause, SkipPrevious, SkipNext } from '@mui/icons-material';
import { SigmaContainer, ControlsContainer, ZoomControl } from '@react-sigma/core';
import Graph from 'graphology';
import { circular } from 'graphology-layout';
import { animateNodes } from 'graphology-layout-force';
import ForceAtlas2 from 'graphology-layout-forceatlas2';
import Tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import useGlobalStore from '../store/globalStore';
import apiClient, { LoadingIndicator, ErrorIndicator } from '../api/apiClient';

/**
 * Narrative Playback Mode View
 * 
 * Features:
 * - Timeline-based scene exploration
 * - Dynamic character relationship graph
 * - Scene details panel
 * - Play/pause/navigation controls
 */
const NarrativePlayback: React.FC = () => {
  const theme = useTheme();
  const { highContrast } = useGlobalStore();
  
  // State for API data and UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sceneGraph, setSceneGraph] = useState<any>(null);
  const [sceneGraphLoading, setSceneGraphLoading] = useState<boolean>(false);
  const [sceneGraphError, setSceneGraphError] = useState<string | null>(null);
  
  // Refs for animation
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Current scene
  const currentScene = scenes[currentSceneIndex] || null;
  
  // Fetch all scenes
  useEffect(() => {
    const fetchScenes = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getScenes();
        setScenes(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching scenes:', err);
        setError('Failed to load scenes data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScenes();
  }, []);
  
  // Fetch scene graph for current scene
  useEffect(() => {
    if (!currentScene) return;
    
    const fetchSceneGraph = async () => {
      try {
        setSceneGraphLoading(true);
        const data = await apiClient.getSceneCharacterGraph(currentScene.id);
        setSceneGraph(data);
        setSceneGraphError(null);
      } catch (err) {
        console.error(`Error fetching graph for scene ${currentScene.id}:`, err);
        setSceneGraphError('Failed to load character graph for this scene.');
      } finally {
        setSceneGraphLoading(false);
      }
    };
    
    fetchSceneGraph();
  }, [currentScene]);
  
  // Get mood emoji
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'tense': return '😰';
      case 'mysterious': return '🤔';
      case 'professional': return '🧐';
      case 'romantic': return '❤️';
      case 'happy': return '😄';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'fearful': return '😨';
      case 'surprised': return '😮';
      default: return '😐';
    }
  };
  
  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  // Handle previous scene
  const handlePrevScene = useCallback(() => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  }, [currentSceneIndex]);
  
  // Handle next scene
  const handleNextScene = useCallback(() => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentSceneIndex, scenes.length]);
  
  // Handle timeline change
  const handleTimelineChange = useCallback((_event: Event, newValue: number | number[]) => {
    setCurrentSceneIndex(newValue as number);
  }, []);
  
  // Effect for auto-play
  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 3000);
    } else if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
      playbackInterval.current = null;
    }
    
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
        playbackInterval.current = null;
      }
    };
  }, [isPlaying, currentSceneIndex, scenes.length]);
  
  // Effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        handlePrevScene();
      } else if (e.code === 'ArrowRight') {
        handleNextScene();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handlePrevScene, handleNextScene]);
  
  // Create and configure the graph
  const createGraph = React.useMemo(() => {
    if (!sceneGraph) return null;
    
    const graph = new Graph();
    
    // Add nodes (characters)
    sceneGraph.nodes.forEach((node: any) => {
      graph.addNode(node.id, {
        label: node.name,
        size: 10 + (node.importance * 20), // Size based on importance in the scene
        color: theme.palette.primary.main,
        importance: node.importance,
        lines: node.lines || 0
      });
    });
    
    // Add edges (interactions)
    sceneGraph.edges.forEach((edge: any) => {
      let edgeColor = theme.palette.text.secondary;
      
      // Color based on sentiment
      if (edge.sentiment > 0.3) {
        edgeColor = theme.palette.success.main; // Positive
      } else if (edge.sentiment < -0.3) {
        edgeColor = theme.palette.error.main; // Negative
      } else {
        edgeColor = theme.palette.grey[500]; // Neutral
      }
      
      graph.addEdge(edge.source, edge.target, {
        size: 1 + Math.abs(edge.weight),
        color: edgeColor,
        sentiment: edge.sentiment,
        interactions: edge.interactions || 0
      });
    });
    
    // Apply layout
    circular.assign(graph);
    
    return graph;
  }, [sceneGraph, theme]);
  
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
            <div>Importance: ${nodeAttributes.importance.toFixed(2)}</div>
            <div>Lines: ${nodeAttributes.lines}</div>
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
            <div>Interactions: ${edgeAttributes.interactions}</div>
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
    };
    
    return (
      <SigmaContainer 
        graph={createGraph}
        style={{ height: 400, width: '100%' }}
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
        </ControlsContainer>
      </SigmaContainer>
    );
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Narrative Playback Mode
      </Typography>
      
      <Typography variant="body1" paragraph>
        Explore the screenplay timeline dynamically with character relationships and scene progression.
      </Typography>
      
      {loading ? (
        <LoadingIndicator />
      ) : error ? (
        <ErrorIndicator message={error} />
      ) : scenes.length > 0 ? (
        <>
          {/* Timeline */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 2, 
              mb: 3,
              backgroundColor: highContrast 
                ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                : theme.palette.background.paper,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Scene Timeline
            </Typography>
            
            <Slider
              value={currentSceneIndex}
              onChange={handleTimelineChange}
              step={1}
              marks
              min={0}
              max={scenes.length - 1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `Scene ${scenes[value].number}`}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption">
                Scene {scenes[0].number}
              </Typography>
              <Typography variant="caption">
                Scene {scenes[scenes.length - 1].number}
              </Typography>
            </Box>
          </Paper>
          
          {/* Main Content */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Character Graph */}
            <Paper 
              elevation={2}
              sx={{ 
                p: 2, 
                flex: 2,
                height: 450,
                backgroundColor: highContrast 
                  ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                  : theme.palette.background.paper,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Character Relationships - Scene {currentScene?.number}
              </Typography>
              
              {sceneGraphLoading ? (
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={40} />
                </Box>
              ) : sceneGraphError ? (
                <Box sx={{ 
                  height: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: theme.palette.error.main,
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                }}>
                  <Typography variant="body1">
                    {sceneGraphError}
                  </Typography>
                </Box>
              ) : createGraph ? (
                <CustomSigma />
              ) : (
                <Box sx={{ 
                  height: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                }}>
                  <Typography variant="body1">
                    No character relationships in this scene
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {/* Scene Card */}
            <Paper 
              elevation={2}
              sx={{ 
                p: 2, 
                flex: 1,
                height: 450,
                backgroundColor: highContrast 
                  ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                  : theme.palette.background.paper,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Scene {currentScene?.number}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                {currentScene?.location}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" component="span">
                  Mood: 
                </Typography>
                <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                  {getMoodEmoji(currentScene?.mood)} {currentScene?.mood}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Characters:
                </Typography>
                <Typography variant="body1">
                  {currentScene?.characters.join(', ')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Summary:
                </Typography>
                <Typography variant="body1">
                  {currentScene?.summary || 'No summary available'}
                </Typography>
              </Box>
              
              {currentScene?.notes && (
                <Box>
                  <Typography variant="subtitle2">
                    Notes:
                  </Typography>
                  <Typography variant="body1">
                    {currentScene.notes}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
          
          {/* Playback Controls */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 2, 
              mt: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              backgroundColor: highContrast 
                ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                : theme.palette.background.paper,
            }}
          >
            <IconButton onClick={handlePrevScene} disabled={currentSceneIndex === 0}>
              <SkipPrevious />
            </IconButton>
            
            <Button 
              variant="contained" 
              startIcon={isPlaying ? <Pause /> : <PlayArrow />}
              onClick={handlePlayPause}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <IconButton onClick={handleNextScene} disabled={currentSceneIndex === scenes.length - 1}>
              <SkipNext />
            </IconButton>
            
            <Typography variant="caption" sx={{ ml: 2 }}>
              Keyboard shortcuts: Space (Play/Pause), ← (Previous), → (Next)
            </Typography>
          </Paper>
        </>
      ) : (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center',
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1,
        }}>
          <Typography variant="body1" color="text.secondary">
            No scenes available for playback
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NarrativePlayback;
