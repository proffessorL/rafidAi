import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer style={{ padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(255,255,255,0.5)' }}>
    <div className="container">
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        Made with <Heart size={13} style={{ color: 'var(--rose)' }} /> by RESNOR — Your Academic Well-being Platform
      </p>
    </div>
  </footer>
);
