import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge, NodeMouseHandler } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Typy danych wejściowych
export interface Scene {
  id: string;
  title: string;
  description?: string;
  characters?: string[];
  x?: number;
  y?: number;
}
export interface SceneRelation {
  id: string;
  source: string;
  target: string;
  type?: string;
}

interface GraphViewProps {
  scenes?: Scene[];
  relations?: SceneRelation[];
}

const defaultScenes: Scene[] = [
  { id: '1', title: 'Scena 1', description: 'Opis sceny 1', characters: ['Anna', 'Jan'], x: 100, y: 100 },
  { id: '2', title: 'Scena 2', description: 'Opis sceny 2', characters: ['Marek'], x: 400, y: 100 },
  { id: '3', title: 'Scena 3', description: 'Opis sceny 3', characters: ['Anna', 'Marek'], x: 250, y: 250 },
];
const defaultRelations: SceneRelation[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

const GraphView: React.FC<GraphViewProps> = ({ scenes = defaultScenes, relations = defaultRelations }) => {
  // Memoizuj nodes i edges na podstawie propsów
  const nodes: Node[] = useMemo(() =>
    scenes.map(scene => ({
      id: scene.id,
      position: { x: scene.x ?? Math.random() * 400, y: scene.y ?? Math.random() * 300 },
      data: { label: scene.title, ...scene },
      style: {
        borderRadius: 16,
        background: '#FFB300',
        color: '#181A20',
        fontWeight: 700,
      },
    })),
    [scenes]
  );

  const edges: Edge[] = useMemo(() =>
    relations.map(rel => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      animated: true,
      style: { stroke: '#FFB300', strokeWidth: 3 },
    })),
    [relations]
  );

  const [rfNodes, , onNodesChange] = useNodesState(nodes);
  const [rfEdges, , onEdgesChange] = useEdgesState(edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const handleClose = () => setSelectedNode(null);

  return (
    <Box sx={{ height: '70vh', background: '#181A20', borderRadius: 4, boxShadow: 3, p: 2 }}>
      <Typography variant="h5" color="#FFB300" mb={2} fontWeight={700}>
        Interaktywny graf scenariusza
      </Typography>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        style={{ background: '#23263A', borderRadius: 16 }}
      >
        <MiniMap nodeColor={(n: Node) => (n.style?.background as string) || '#FFB300'} maskColor="#181A20AA" />
        <Controls />
        <Background color="#FFB30022" gap={24} />
      </ReactFlow>
      <Dialog open={!!selectedNode} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          {selectedNode?.data?.title || selectedNode?.data?.label}
          <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedNode?.data?.description || 'Brak opisu'}
          </Typography>
          <Typography variant="body2" fontWeight={700} mt={2}>Postacie w scenie:</Typography>
          <List dense>
            {(selectedNode?.data?.characters || []).map((char: string) => (
              <ListItem key={char}>
                <ListItemText primary={char} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GraphView; 