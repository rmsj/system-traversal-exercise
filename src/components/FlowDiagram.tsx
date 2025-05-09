'use client'

import {type MouseEvent as ReactMouseEvent, useCallback, useEffect, useState} from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  getAllInterfacesForSystemAndDescendants,
  getCurrentSystemAndDescendents,
  getTopLevelInterfacesAndDescendants,
  getTopLevelSystemsAndChildren,
  SystemRow
} from '@/lib/supabase';
import {InterfacesData} from "@/types/interface";
import dagre from '@dagrejs/dagre';

interface Props {
  currentSystemId: number | null;
  chartVersion: number;
  onSystemChange: (newID: number | null) => void;
}

const colors = [
  '#3ECF8E', '#0070f3', '#f97316', '#9333ea', '#10b981', '#0ea5e9', '#facc15', '#ef4444'
];

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

export default function FlowDiagram({ currentSystemId, chartVersion, onSystemChange }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');

  const generateColor = (index: number) => colors[index % colors.length];

  const layoutElements = (nodes: Node[], edges: Edge[]): Node[] => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: layoutDirection });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 60 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 30,
      };
      return node;
    });
  };

  const transformToFlow = (systems: SystemRow[], interfaces: InterfacesData[]) => {
    const flowNodes: Node[] = systems.map((sys, idx) => {
      return {
        id: sys.id.toString(),
        data: { label: sys.name },
        position: { x: 0, y: 0 },
        targetPosition:layoutDirection == "TB" ? Position.Top : Position.Left,
        sourcePosition:layoutDirection == "TB" ? Position.Bottom : Position.Right,
        style: {
          background: generateColor(idx),
          color: 'white',
          border: '1px solid #222',
          borderRadius: '8px',
          padding: '10px',
          width: 180,
        },
        // parentId: sys.parent_id ? sys.parent_id.toString() : undefined,
        // extent: sys.parent_id ? 'parent' : undefined,
      };
    });

    // for (let i = 0; i < flowNodes.length; i++) {
    //   for (let j = i + 1; j < flowNodes.length; j++) {
    //     if (flowNodes[i].id === flowNodes[j].parentId) {
    //       flowNodes[i].type = 'group';
    //       flowNodes[i].style!.width = 300;
    //       flowNodes[i].style!.height = 300;
    //     }
    //   }
    // }

    const flowEdges: Edge[] = interfaces.map((i, idx) => ({
      id: `e-${i.source_system_id}-${i.target_system_id}-${idx}`,
      source: i.source_system_id.toString(),
      target: i.target_system_id.toString(),
      animated: true,
      label: i.connection_type,
      style: {
        stroke: generateColor(idx + 5),
        strokeWidth: 2,
      },
    }));

    const childEdges: Edge[] = systems.filter(sys => sys.parent_id).map((sys, idx) => ({
      id: `e-${sys.id}-${sys.parent_id}-${idx}`,
      source: sys.parent_id!.toString(),
      target: sys.id.toString(),
      animated: false,
      label: 'child',
      style: {
        stroke: generateColor(idx + 5),
        strokeWidth: 1,
      },
    }));

    if (childEdges.length > 0) {
      flowEdges.push(...childEdges);
    }

    const layoutedNodes = layoutElements(flowNodes, flowEdges);

    return { flowNodes: layoutedNodes, flowEdges };
  };

  useEffect(() => {
    const load = async () => {

      console.log("Loading chart version: " + chartVersion);

      let interfaces: InterfacesData[] | null = [];
      let systems: SystemRow[] | null = [];

      if (currentSystemId) {
        systems = await getCurrentSystemAndDescendents(currentSystemId);
        interfaces = await getAllInterfacesForSystemAndDescendants(currentSystemId);
      } else {
        systems = await getTopLevelSystemsAndChildren();
        interfaces = await getTopLevelInterfacesAndDescendants();
      }

      if (interfaces) {
        interfaces.forEach((i) => {
          if (!systems.find(s => s.id === i.source.id)) systems.push(i.source);
          if (!systems.find(s => s.id === i.target.id)) systems.push(i.target);
        });
      }

      const { flowNodes, flowEdges } = transformToFlow(systems, interfaces || []);

      setNodes(flowNodes);
      setEdges(flowEdges);
    };

    load();
  }, [currentSystemId, layoutDirection, chartVersion]);

  const onConnect = useCallback(
      (params: Connection) => setEdges((eds) => addEdge(params, eds)),
      // TODO: create a system interface when this happens?
      [setEdges]
  );

  const onNodeDoubleClick = useCallback((_: ReactMouseEvent, node: Node) => {
    onSystemChange(+node.id)
  }, [onSystemChange]);

  const onLayout = (direction: 'TB' | 'LR') => {
    setLayoutDirection(direction);
  };

  return (
      <div style={{ width: '100%', height: '800px' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={onNodeDoubleClick}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

          <Panel position="top-right">
            <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xs px-3 py-1.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={() => onLayout('TB')}
            >
              Vertical
            </button>
            <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xs px-3 py-1.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={() => onLayout('LR')}
            >
              Horizontal
            </button>
            <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xs px-3 py-1.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={() => onSystemChange(null)}
            >
              {String.fromCharCode(8592)} Top Level
            </button>
          </Panel>
        </ReactFlow>
      </div>
  );
}