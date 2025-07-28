import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import ForceGraph2D from "react-force-graph-2d";
import { graphData as originalGraphData } from "./data/graphData";
import AddressList from "./table";
import "./app.css";

function App() {
  const graphRef = useRef();

  // ---- State -------------------------------------------------
  // Which groups are globally allowed to be shown
  const [visibleGroups, setVisibleGroups] = useState([1, 2]);

  // Per-node visibility (eye icon in the table)
  const [nodeVis, setNodeVis] = useState(() =>
    Object.fromEntries(originalGraphData.nodes.map((n) => [n.id, !!n.visible]))
  );

  const [selectedNode, setSelectedNode] = useState(null);

  // ---- Helpers -----------------------------------------------
  const getNodeId = (node) => (typeof node === "object" ? node.id : node);

  // Final “isVisible” decision = group is visible AND node eye toggle is true
  const visibleNodeIds = useMemo(() => {
    const ids = new Set();
    for (const n of originalGraphData.nodes) {
      if (visibleGroups.includes(n.group) && nodeVis[n.id] !== false) {
        ids.add(n.id);
      }
    }
    return ids;
  }, [visibleGroups, nodeVis]);

  // For the table: same original list, but with a computed .visible flag
  const nodesForTable = useMemo(
    () =>
      originalGraphData.nodes.map((n) => ({
        ...n,
        visible: visibleNodeIds.has(n.id),
      })),
    [visibleNodeIds]
  );

  // ---- ForceGraph config -------------------------------------
  useEffect(() => {
    if (!graphRef.current) return;
    // Link distance
    graphRef.current
      .d3Force("link")
      .distance((link) => link.customLength || 50);
  }, []);

  // ---- UI actions --------------------------------------------
  const toggleGroup = useCallback((group) => {
    setVisibleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }, []);

  const handleClickNode = useCallback((node) => {
    setSelectedNode(node.id);
  }, []);

  const onToggleVisible = useCallback((id) => {
    setNodeVis((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ---- Renderers ---------------------------------------------
  const renderNode = useCallback((node, ctx) => {
    const radius = 12;
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    // Outer ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Inner gradient
    const innerRadius = radius - 1;
    const gradient = ctx.createRadialGradient(
      node.x,
      node.y,
      innerRadius / 4,
      node.x,
      node.y,
      innerRadius
    );
    gradient.addColorStop(0, node.group === 1 ? "#ffcc00" : "#95D5E9");
    gradient.addColorStop(1, "#000000");

    ctx.beginPath();
    ctx.arc(node.x, node.y, innerRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = gradient;
    ctx.fill();
  }, []);

  // ---- JSX ---------------------------------------------------
  return (
    <div className="app-container">
      <div className="controls">
        {[1, 2].map((group) => (
          <button key={group} onClick={() => toggleGroup(group)}>
            {visibleGroups.includes(group)
              ? `Hide Group ${group}`
              : `Show Group ${group}`}
          </button>
        ))}
      </div>

      <AddressList
        nodes={nodesForTable}
        selectedId={selectedNode}
        onToggleVisible={onToggleVisible}
      />

      <ForceGraph2D
        ref={graphRef}
        graphData={originalGraphData}
        backgroundColor="#091024"
        nodeAutoColorBy="group"
        nodeLabel="name"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={(d) => d.value * 0.001}
        linkWidth={(d) => d.value * 0.1}
        linkColor={() => "#ffffff"}
        linkDirectionalArrowLength={8}
        linkDirectionalArrowRelPos={0.8}
        onNodeClick={handleClickNode}
        d3Force="charge"
        d3VelocityDecay={0.5}
        nodeCanvasObject={renderNode}
        minZoom={0.5}
        maxZoom={5}
        // The magic: don't mutate data, just hide visually
        nodeVisibility={(node) => visibleNodeIds.has(node.id)}
        linkVisibility={(link) =>
          visibleNodeIds.has(getNodeId(link.source)) &&
          visibleNodeIds.has(getNodeId(link.target))
        }
      />
    </div>
  );
}

export default App;
