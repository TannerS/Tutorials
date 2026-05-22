import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let chartId = 0;

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#252a3f', primaryTextColor: '#e4e6f0',
    primaryBorderColor: '#5b9cf6', lineColor: '#5b9cf6',
    secondaryColor: '#1a1d2e', tertiaryColor: '#161822',
    background: '#0f1117', mainBkg: '#252a3f', nodeBorder: '#5b9cf6',
    clusterBkg: '#1a1d2e', clusterBorder: '#2a2e42', titleColor: '#e4e6f0',
    edgeLabelBackground: '#1a1d2e', nodeTextColor: '#e4e6f0',
  },
  flowchart: { htmlLabels: true, curve: 'basis', padding: 15 },
  fontFamily: "'Inter', sans-serif",
});

export default function FlowChart({ chart, title }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const idRef = useRef(`mermaid-${chartId++}`);
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e) { console.error('Mermaid render error:', e); }
    };
    render();
    return () => { cancelled = true; };
  }, [chart]);
  return (
    <div style={{
      margin: '1.5rem 0', background: '#161822', borderRadius: '8px',
      border: '1px solid #2a2e42', overflow: 'hidden',
    }}>
      {title && (
        <div style={{
          padding: '0.75rem 1rem', borderBottom: '1px solid #2a2e42',
          fontSize: '0.85rem', fontWeight: 500, color: '#9399b2',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1rem' }}>📊</span> {title}
        </div>
      )}
      <div ref={containerRef}
        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
