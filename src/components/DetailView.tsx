// ===== src/components/DetailView.tsx =====
import React from 'react';
import { pages } from '../data/portfolioData';

interface DetailViewProps {
    pageKey: string;
    onBack: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ pageKey, onBack }) => {
    const page = pages[pageKey];

    if (!page) return null;

    return (
        <div id="detailView" className="detail-view">
            <button className="detail-back-btn" id="detailBackBtn" onClick={onBack}>
                <i className="fas fa-arrow-left"></i> Back
            </button>
            <div id="detailContent">
                <div className="detail-hero-section" style={{ background: page.gradient }}>
                    <div className="detail-hero-icon">
                        <i className={page.icon}></i>
                    </div>
                    <h4>{page.tag}</h4>
                    <h1>{page.title}</h1>
                    <p className="tagline">{page.tagline}</p>
                </div>
                <div 
                    dangerouslySetInnerHTML={{ __html: page.html }} 
                />
                
                {/* CTA buttons depending on section page key */}
                <div className="detail-cta" style={{
                    background: pageKey === 'who-i-am' 
                        ? 'linear-gradient(135deg,#1DB954,#0a4d21)' 
                        : pageKey === 'what-i-do'
                        ? 'linear-gradient(135deg,#ff6b6b,#ee5253)'
                        : 'linear-gradient(135deg,#f39c12,#e67e22)'
                }}>
                    <h2>
                        {pageKey === 'who-i-am' && 'Mari Berkolaborasi!'}
                        {pageKey === 'what-i-do' && 'Ready to Start?'}
                        {pageKey === 'my-vision' && 'Join My Journey'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {pageKey === 'who-i-am' && 'Tertarik bekerja sama?'}
                        {pageKey === 'what-i-do' && "Let's build something great!"}
                        {pageKey === 'my-vision' && 'Mari wujudkan visi bersama!'}
                    </p>
                    <button 
                        className="detail-cta-btn" 
                        onClick={() => {
                            if (window.goTo) {
                                window.goTo('contact');
                            }
                        }}
                        style={{
                            color: pageKey === 'who-i-am' 
                                ? '#1DB954' 
                                : pageKey === 'what-i-do'
                                ? '#ee5253'
                                : '#e67e22'
                        }}
                    >
                        <i className={pageKey === 'my-vision' ? 'fas fa-handshake' : 'fas fa-paper-plane'}></i>{' '}
                        {pageKey === 'who-i-am' && 'Get in Touch'}
                        {pageKey === 'what-i-do' && 'Hire Me'}
                        {pageKey === 'my-vision' && 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};
