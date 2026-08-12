import type { ReactNode } from 'react';
import PosterCode from './PosterCode';

interface PosterCardProps {
  glyph: string;
  title: ReactNode;
  badge?: string;
  language?: string;
  code: string;
  caption: ReactNode;
}

export default function PosterCard({ glyph, title, badge, language = 'tsx', code, caption }: PosterCardProps) {
  return (
    <div className="poster-card">
      <div className="poster-card-head">
        <span className="poster-glyph">{glyph}</span>
        <h3>
          {title}
          {badge && <span className="poster-badge">{badge}</span>}
        </h3>
      </div>
      <PosterCode language={language}>{code}</PosterCode>
      <p className="poster-cap">{caption}</p>
    </div>
  );
}
