import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import ForceGraph3D from "react-force-graph-3d";
import { graphData as originalGraphData } from "./data/graphData";
import AddressList from "./table";
import "./app.css";
import * as THREE from "three";

function App() {
  const graphRef = useRef();

  // -------------------- State --------------------
  const [visibleGroups, setVisibleGroups] = useState([1, 2]);
  const [nodeVisibility, setNodeVisibility] = useState(() =>
    Object.fromEntries(originalGraphData.nodes.map((n) => [n.id, !!n.visible]))
  );
  const [selectedNode, setSelectedNode] = useState(null);

  // -------------------- Helpers --------------------
  const getNodeId = (node) => (typeof node === "object" ? node.id : node);

  // -------------------- Derived Data --------------------
  const visibleNodeIds = useMemo(() => {
    const ids = new Set();
    for (const node of originalGraphData.nodes) {
      if (
        visibleGroups.includes(node.group) &&
        nodeVisibility[node.id] !== false
      ) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [visibleGroups, nodeVisibility]);

  const createMetallicNode = useCallback((node) => {
    const color = node.group === 1 ? 0xf5d300 : 0x0bd2ec;

    const geometry = new THREE.SphereGeometry(6, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.7,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }, []);

  const createNeonGlowNode = useCallback((node) => {
    const color = node.group === 1 ? 0xffff00 : 0x00ffff;

    const coreGeometry = new THREE.SphereGeometry(4, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ color });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);

    const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);

    const group = new THREE.Group();
    group.add(glow);
    group.add(core);
    return group;
  }, []);

  const createHighlightedNode = useCallback((node) => {
    const baseColor = node.group === 1 ? 0xffd700 : 0x00bfff;

    // Core Sphere
    const coreGeometry = new THREE.SphereGeometry(5, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.4,
      roughness: 0.3,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);

    // Outer glowing highlight (bigger, transparent sphere)
    const highlightGeometry = new THREE.SphereGeometry(6.5, 32, 32);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide, // Render inside of sphere for outer glow
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);

    // Combine both in a group
    const group = new THREE.Group();
    group.add(highlight);
    group.add(core);

    return group;
  }, []);

  const createCrystalNode = useCallback((node) => {
    const color = node.group === 1 ? 0xffff99 : 0x99ccff;

    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color,
      transmission: 1, // Makes it translucent
      opacity: 0.8,
      transparent: true,
      roughness: 0,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
    });

    return new THREE.Mesh(geometry, material);
  }, []);

  const createBallNode = useCallback((node) => {
    const group = new THREE.Group();

    const color = node.group === 1 ? 0xffcc00 : 0x95d5e9;

    const sphereGeometry = new THREE.SphereGeometry(6, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      shininess: 80,
      transparent: true,
      opacity: 1,
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Optional: add glow effect using a larger transparent sphere
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(9, 32, 32),
      glowMaterial
    );

    group.add(sphere);
    group.add(glow);

    return group;
  }, []);

  const tableNodes = useMemo(
    () =>
      originalGraphData.nodes.map((node) => ({
        ...node,
        visible: visibleNodeIds.has(node.id),
      })),
    [visibleNodeIds]
  );

  // -------------------- Effects --------------------
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current
        .d3Force("link")
        .distance((link) => link.customLength || 50);
    }
  }, []);

  // -------------------- Handlers --------------------
  const toggleGroup = useCallback((groupId) => {
    setVisibleGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node.id);
  }, []);

  const toggleNodeVisibility = useCallback((id) => {
    setNodeVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // -------------------- Node Renderer --------------------
  const renderNode = useCallback((node, ctx) => {
    const radius = 12;
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    const innerRadius = radius - 1;

    // Glowing radial gradient
    const gradient = ctx.createRadialGradient(
      node.x,
      node.y,
      innerRadius / 4,
      node.x,
      node.y,
      innerRadius
    );
    gradient.addColorStop(0, "#FFD700"); // Bright yellow
    gradient.addColorStop(1, "#000000"); // Fade to black

    // Inner glow
    ctx.beginPath();
    ctx.arc(node.x, node.y, innerRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Outer white ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  // -------------------- JSX --------------------
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
        nodes={tableNodes}
        selectedId={selectedNode}
        onToggleVisible={toggleNodeVisibility}
      />

      <ForceGraph3D
        ref={graphRef}
        graphData={originalGraphData}
        backgroundColor="#091024"
        nodeAutoColorBy="group"
        nodeLabel="name"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={(d) => d.value * 0.001}
        linkWidth={(d) => d.value * 0.1}
        linkColor={() => "rgba(255, 255, 255, 1)"}
        nodeThreeObject={createHighlightedNode}
        onNodeClick={handleNodeClick}
        d3Force="charge"
        d3VelocityDecay={0.7}
        nodeCanvasObject={renderNode}
        minZoom={0.5}
        maxZoom={5}
        nodeVisibility={(node) => visibleNodeIds.has(node.id)}
        linkVisibility={(link) =>
          visibleNodeIds.has(getNodeId(link.source)) &&
          visibleNodeIds.has(getNodeId(link.target))
        }
        // linkMaterial={() => {
        //   return new THREE.MeshLambertMaterial({
        //     color: 0xffffff,
        //     emissive: 0xffffff,
        //     transparent: true,
        //     opacity: 0.4,
        //   });
        // }}
        // linkDirectionalArrowLength={4} // smaller, subtler
        linkDirectionalArrowRelPos={1} // tip of the link
        linkDirectionalArrowColor={() => "rgba(255,255,255,0.6)"} // soft white
        linkMaterial={() =>
          new THREE.MeshLambertMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            transparent: true,
            opacity: 0.3,
          })
        }
        linkDirectionalArrowLength={(link) => Math.min(6, link.value || 1) * 0.8}
      />
    </div>
  );
}

export default App;
