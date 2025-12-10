import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Search, ZoomIn, ZoomOut, RotateCcw, Eye, ExternalLink, Calendar, User, FolderOpen, Tag, Layers, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const NODE_COLORS = {
  task: '#8b5cf6',
  project: '#f97316',
  person: '#06b6d4',
  group: '#ec4899',
  module: '#10b981',
};

const NODE_CONFIG = {
  task: { label: 'Tasks', size: 8 },
  project: { label: 'Projects', size: 16 },
  person: { label: 'People', size: 14 },
  group: { label: 'Groups', size: 14 },
  module: { label: 'Modules', size: 14 },
};

function truncateWords(text, maxWords = 4) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

function extractGraphData(tasks) {
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  const addNode = (id, label, type, data = null) => {
    if (!nodeMap.has(id) && label) {
      const node = {
        id, label,
        shortLabel: truncateWords(label, 4),
        type,
        color: NODE_COLORS[type],
        size: NODE_CONFIG[type].size,
        data
      };
      nodes.push(node);
      nodeMap.set(id, node);
    }
    return nodeMap.get(id);
  };

  tasks.forEach((task) => {
    addNode(`task-${task.id}`, task.title, 'task', task);
  });

  tasks.forEach((task) => {
    if (task.project) {
      task.project.split(',').map(p => p.trim()).filter(Boolean).forEach(proj => {
        addNode(`project-${proj}`, proj, 'project');
        links.push({ source: `task-${task.id}`, target: `project-${proj}` });
      });
    }
    if (task.owner) {
      task.owner.split(',').map(o => o.trim()).filter(Boolean).forEach(owner => {
        addNode(`person-${owner}`, owner, 'person');
        links.push({ source: `task-${task.id}`, target: `person-${owner}` });
      });
    }
    if (task.module?.length > 0) {
      task.module.forEach(mod => {
        if (mod) {
          addNode(`module-${mod}`, mod, 'module');
          links.push({ source: `task-${task.id}`, target: `module-${mod}` });
        }
      });
    }
    if (task.customGroup) {
      addNode(`group-${task.customGroup}`, task.customGroup, 'group');
      links.push({ source: `task-${task.id}`, target: `group-${task.customGroup}` });
    }
  });

  return { nodes, links };
}

export function KnowledgeGraph({ tasks = [] }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simulationRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [filters, setFilters] = useState({
    task: true, project: true, person: true, group: true, module: true,
  });
  const [linkDistance, setLinkDistance] = useState(60);
  const [repulsion, setRepulsion] = useState(-100);
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const graphData = useMemo(() => {
    if (tasks.length === 0) return { nodes: [], links: [] };
    return extractGraphData(tasks);
  }, [tasks]);

  // Get related tasks for selected node
  const relatedItems = useMemo(() => {
    if (!selectedNode) return [];

    if (selectedNode.type === 'task') {
      // If task selected, return just that task
      return selectedNode.data ? [selectedNode.data] : [];
    }

    // For metadata nodes, find all connected tasks
    const connectedTaskIds = new Set();
    graphData.links.forEach(link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      if (targetId === selectedNode.id && sourceId.startsWith('task-')) {
        connectedTaskIds.add(sourceId.replace('task-', ''));
      }
      if (sourceId === selectedNode.id && targetId.startsWith('task-')) {
        connectedTaskIds.add(targetId.replace('task-', ''));
      }
    });

    return tasks.filter(t => connectedTaskIds.has(t.id));
  }, [selectedNode, tasks, graphData.links]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || 800, height: rect.height || 400 });
      }
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const filteredNodes = graphData.nodes.filter(node => {
      if (!filters[node.type]) return false;
      if (!showMetadata && node.type !== 'task') return false;
      if (searchTerm && !node.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = graphData.links.filter(link =>
      filteredNodeIds.has(link.source.id || link.source) &&
      filteredNodeIds.has(link.target.id || link.target)
    );

    const nodes = filteredNodes.map(d => ({ ...d }));
    const links = filteredLinks.map(d => ({ ...d }));
    const { width, height } = dimensions;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    if (simulationRef.current) simulationRef.current.stop();

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(repulsion).distanceMax(300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 3))
      .alphaDecay(0.05)
      .velocityDecay(0.4);

    simulationRef.current = simulation;

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const link = g.append('g')
      .attr('stroke', '#374151')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => {
          if (!e.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#111827')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#glow)');

    if (showLabels) {
      node.append('text')
        .text(d => d.shortLabel)
        .attr('x', d => d.size + 4)
        .attr('y', 3)
        .attr('font-size', '10px')
        .attr('fill', '#d1d5db')
        .attr('font-family', 'Inter, sans-serif')
        .style('pointer-events', 'none');
    }

    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);

      const connected = new Set([d.id]);
      links.forEach(l => {
        if (l.source.id === d.id) connected.add(l.target.id);
        if (l.target.id === d.id) connected.add(l.source.id);
      });

      node.select('circle').attr('opacity', n => connected.has(n.id) ? 1 : 0.15);
      node.select('text').attr('opacity', n => connected.has(n.id) ? 1 : 0.15);
      link.attr('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.05);
    });

    node.on('mouseover', function(_, d) {
      d3.select(this).select('circle').transition().duration(150).attr('r', d.size * 1.3);
    }).on('mouseout', function(_, d) {
      d3.select(this).select('circle').transition().duration(150).attr('r', d.size);
    });

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    svg.on('dblclick.zoom', () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
      node.select('circle').attr('opacity', 1);
      node.select('text').attr('opacity', 1);
      link.attr('stroke-opacity', 0.4);
      setSelectedNode(null);
    });

    svgRef.current.__zoom = zoom;
    return () => simulation.stop();
  }, [graphData, filters, searchTerm, showLabels, showMetadata, linkDistance, repulsion, dimensions]);

  const handleZoomIn = () => d3.select(svgRef.current).transition().duration(200).call(svgRef.current.__zoom.scaleBy, 1.4);
  const handleZoomOut = () => d3.select(svgRef.current).transition().duration(200).call(svgRef.current.__zoom.scaleBy, 0.7);
  const handleReset = () => {
    d3.select(svgRef.current).transition().duration(300).call(svgRef.current.__zoom.transform, d3.zoomIdentity);
    setSelectedNode(null);
  };

  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    pending: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    overdue: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/20' },
  };

  return (
    <div className="flex flex-col h-full bg-surface-900 rounded-2xl overflow-hidden">
      {/* Top: Graph + Controls */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Graph */}
        <div ref={containerRef} className="flex-1 relative min-h-[300px]">
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-56 bg-surface-800/50 border-l border-surface-700 p-3 space-y-3 overflow-y-auto text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-surface-400 uppercase font-semibold mb-1.5">
              <Search size={12} /> Search
            </div>
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to filter..."
              className="w-full px-2.5 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-white placeholder-surface-500 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-surface-400 uppercase font-semibold mb-1.5">
              <Eye size={12} /> Display
            </div>
            <div className="space-y-1">
              {[
                { label: 'Labels', value: showLabels, toggle: () => setShowLabels(!showLabels) },
                { label: 'Metadata', value: showMetadata, toggle: () => setShowMetadata(!showMetadata) },
              ].map(opt => (
                <label key={opt.label} className="flex items-center justify-between cursor-pointer">
                  <span className="text-surface-300">{opt.label}</span>
                  <button onClick={opt.toggle} className={`w-8 h-4 rounded-full ${opt.value ? 'bg-primary-500' : 'bg-surface-600'}`}>
                    <span className={`block w-3 h-3 bg-white rounded-full transition-transform ${opt.value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-surface-400 uppercase font-semibold mb-1.5">Filters</div>
            <div className="space-y-1">
              {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters[type]} onChange={() => setFilters(p => ({ ...p, [type]: !p[type] }))}
                         className="w-3 h-3 rounded border-surface-600 bg-surface-700 text-primary-500" />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                  <span className="text-surface-300">{cfg.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-surface-400 uppercase font-semibold mb-1.5">Physics</div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-surface-500 mb-1"><span>Distance</span><span>{linkDistance}</span></div>
                <input type="range" min="30" max="150" value={linkDistance} onChange={(e) => setLinkDistance(+e.target.value)}
                       className="w-full h-1 bg-surface-700 rounded appearance-none cursor-pointer accent-primary-500" />
              </div>
              <div>
                <div className="flex justify-between text-surface-500 mb-1"><span>Repulsion</span><span>{repulsion}</span></div>
                <input type="range" min="-300" max="-30" value={repulsion} onChange={(e) => setRepulsion(+e.target.value)}
                       className="w-full h-1 bg-surface-700 rounded appearance-none cursor-pointer accent-pink-500" />
              </div>
            </div>
          </div>

          <div>
            <div className="text-surface-400 uppercase font-semibold mb-1.5">Zoom</div>
            <div className="flex gap-1.5">
              <button onClick={handleZoomIn} className="p-1.5 bg-surface-700 hover:bg-surface-600 rounded text-surface-300"><ZoomIn size={14} /></button>
              <button onClick={handleZoomOut} className="p-1.5 bg-surface-700 hover:bg-surface-600 rounded text-surface-300"><ZoomOut size={14} /></button>
              <button onClick={handleReset} className="flex-1 py-1.5 bg-surface-700 hover:bg-surface-600 rounded text-surface-300 flex items-center justify-center gap-1">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-700">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                  <span className="text-surface-500">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Detail Panel */}
      <div className="border-t border-surface-700 bg-surface-800/30">
        {selectedNode ? (
          <div className="p-4">
            {/* Selected Node Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <div>
                <span className="text-xs text-surface-400 uppercase">{NODE_CONFIG[selectedNode.type]?.label}</span>
                <h3 className="text-base font-semibold text-white">{selectedNode.label}</h3>
              </div>
              <span className="ml-auto text-sm text-surface-400">
                {relatedItems.length} task{relatedItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Related Tasks List */}
            {relatedItems.length > 0 && (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-64 overflow-y-auto">
                {relatedItems.map((task) => {
                  const status = statusConfig[task.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div key={task.id} className="bg-surface-800 rounded-lg p-3 border border-surface-700 hover:border-surface-600 transition-colors">
                      <div className="flex items-start gap-2 mb-2">
                        <StatusIcon size={16} className={`${status.color} mt-0.5 flex-shrink-0`} />
                        <h4 className="text-sm font-medium text-white leading-tight line-clamp-2">{task.title}</h4>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {task.project && (
                          <div className="flex items-center gap-1.5 text-surface-400">
                            <FolderOpen size={12} className="text-orange-400" />
                            <span className="truncate">{task.project}</span>
                          </div>
                        )}
                        {task.owner && (
                          <div className="flex items-center gap-1.5 text-surface-400">
                            <User size={12} className="text-cyan-400" />
                            <span className="truncate">{task.owner}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-surface-400">
                            <Calendar size={12} className="text-pink-400" />
                            <span>{task.dueDate}</span>
                          </div>
                        )}
                        {task.customGroup && (
                          <div className="flex items-center gap-1.5 text-surface-400">
                            <Layers size={12} className="text-pink-400" />
                            <span className="truncate">{task.customGroup}</span>
                          </div>
                        )}
                        {task.module?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Tag size={12} className="text-emerald-400 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {task.module.slice(0, 2).map((m, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">{m}</span>
                              ))}
                              {task.module.length > 2 && (
                                <span className="text-surface-500">+{task.module.length - 2}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {task.link && (
                        <a href={task.link} target="_blank" rel="noopener noreferrer"
                           className="mt-2 flex items-center justify-center gap-1 w-full py-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 text-xs font-medium rounded transition-colors">
                          <ExternalLink size={12} /> Open
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-surface-500 text-sm">
            Click on a node to see related tasks
          </div>
        )}
      </div>
    </div>
  );
}
