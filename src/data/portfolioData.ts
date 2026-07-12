// ===== src/data/portfolioData.ts =====

export interface Song {
    title: string;
    artist: string;
    cover: string;
    file: string;
}

export interface PageDetail {
    gradient: string;
    icon: string;
    tag: string;
    title: string;
    tagline: string;
    html: string;
}

export const playlist: Song[] = [
    { title: 'As It Was', artist: 'Harry Styles', cover: 'assets/cover1.jpg', file: 'assets/Asitwas.mp3' },
    { title: 'To The Bone', artist: 'Pamungkas', cover: 'assets/cover2.jpg', file: 'assets/Tothebone.mp3' },
    { title: 'About You', artist: 'The 1975', cover: 'assets/cover3.jpg', file: 'assets/Aboutyou.mp3' },
    { title: 'Robbers', artist: 'The 1975', cover: 'assets/cover4.jpg', file: 'assets/Robbers.mp3' },
    { title: 'The Man Who Can’t Be Moved', artist: 'The Script', cover: 'assets/cover5.jpg', file: 'assets/tmwcbm.mp3' },
    { title: 'We Cant Be Friends (wait for your love)', artist: 'Ariana Grande', cover: 'assets/cover9.jpg', file: 'assets/wcbf.mp3' },
    { title: 'As Long As You Love Me', artist: 'Backstreet Boys', cover: 'assets/cover10.jpg', file: 'assets/alaylm.mp3' },
    { title: 'Untuk Perempuan Yang Sedang Di Pelukan', artist: 'Payung Teduh', cover: 'assets/cover6.jpg', file: 'assets/upysdp.mp3' },
    { title: 'Terbuang Dalam Waktu', artist: 'Barasuara', cover: 'assets/cover7.jpg', file: 'assets/tdw.mp3' },
    { title: 'Aku Milikmu', artist: 'Dewa 19', cover: 'assets/cover8.jpg', file: 'assets/Akumilikmu.mp3' }
];

export const pages: Record<string, PageDetail> = {
    'who-i-am': {
        gradient: 'linear-gradient(135deg,#005437,#debad6)',
        icon: 'fas fa-code', tag: 'ABOUT',
        title: 'Who I Am',
        tagline: 'Passionate Web Developer & Creative Problem Solver',
        html: `
        <div class="detail-section-item">
            <h2><i class="fas fa-user-circle"></i> Introduction</h2>
            <p>Hai! Saya <strong>Bima Satya M.</strong>, Web Developer Indonesia. 5+ tahun pengalaman membangun web menakjubkan.</p>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-heart"></i> Why I Love Web Dev</h2>
            <p>Web development bukan hanya pekerjaan, tapi seni digital. Kombinasi logika dan kreativitas yang membuat saya jatuh cinta.</p>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-star"></i> My Values</h2>
            <div class="detail-values-grid">
                <div class="detail-value-card"><i class="fas fa-lightbulb"></i><h3>Creativity</h3><p>Solusi kreatif setiap tantangan</p></div>
                <div class="detail-value-card"><i class="fas fa-cogs"></i><h3>Quality</h3><p>Clean & maintainable code</p></div>
                <div class="detail-value-card"><i class="fas fa-users"></i><h3>Collaboration</h3><p>Team player sejati</p></div>
                <div class="detail-value-card"><i class="fas fa-rocket"></i><h3>Innovation</h3><p>Update teknologi terbaru</p></div>
            </div>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-coffee"></i> Fun Facts</h2>
            <ul class="detail-fun-list">
                <li>☕ Ngoding + kopi = terbaik</li>
                <li>🎵 Lo-fi music saat coding</li>
                <li>🎮 Fans game retro & pixel art</li>
                <li>🌱 Learning Next.js & TypeScript</li>
                <li>🌏 Suka traveling & fotografi</li>
            </ul>
        </div>`
    },
    'what-i-do': {
        gradient: 'linear-gradient(135deg,#6ba9a7,#f6e8d0)',
        icon: 'fas fa-rocket', tag: 'SERVICES',
        title: 'What I Do',
        tagline: 'Building Modern Web Experiences',
        html: `
        <div class="detail-section-item">
            <h2><i class="fas fa-list"></i> Services</h2>
            <div class="detail-services-grid">
                <div class="detail-service-card"><div class="detail-service-icon"><i class="fas fa-desktop"></i></div><h3>Landing Page</h3><p>Website menarik untuk promosi.</p></div>
                <div class="detail-service-card"><div class="detail-service-icon"><i class="fas fa-shopping-cart"></i></div><h3>E-Commerce</h3><p>Toko online + payment.</p></div>
                <div class="detail-service-card"><div class="detail-service-icon"><i class="fas fa-blog"></i></div><h3>Blog CMS</h3><p>Platform blog mudah dikelola.</p></div>
                <div class="detail-service-card"><div class="detail-service-icon"><i class="fas fa-chart-line"></i></div><h3>Web App</h3><p>Aplikasi real-time kompleks.</p></div>
                <div class="detail-service-card"><div class="detail-service-icon"><i class="fas fa-mobile-alt"></i></div><h3>Responsive</h3><p>Sempurna di semua device.</p></div>
                <div class="detail-service-card"><div class="detail-service-icon"><i class="fas fa-search"></i></div><h3>SEO</h3><p>Mudah ditemukan di Google.</p></div>
            </div>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-code"></i> Tech Stack</h2>
            <div class="detail-tech-stack">
                <span class="detail-tech-badge"><i class="fab fa-flutter"></i> Flutter</span>
                <span class="detail-tech-badge"><i class="fa-brands fa-python"></i> Python</span>
                <span class="detail-tech-badge"><i class="fab fa-react"></i> React</span>
                <span class="detail-tech-badge"><i class="fab fa-c"></i> C/C++</span>
                <span class="detail-tech-badge"><i class="fab fa-figma"></i> Figma</span>
            </div>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-project-diagram"></i> My Process</h2>
            <div class="detail-process-list">
                <div class="detail-process-step"><span class="detail-step-num">01</span><div><h3>Discovery</h3><p>Memahami kebutuhan Anda</p></div></div>
                <div class="detail-process-step"><span class="detail-step-num">02</span><div><h3>Design</h3><p>Merancang UI/UX menarik</p></div></div>
                <div class="detail-process-step"><span class="detail-step-num">03</span><div><h3>Development</h3><p>Clean code & best practices</p></div></div>
                <div class="detail-process-step"><span class="detail-step-num">04</span><div><h3>Testing</h3><p>QA & bug fixing</p></div></div>
                <div class="detail-process-step"><span class="detail-step-num">05</span><div><h3>Launch</h3><p>Deploy & support</p></div></div>
            </div>
        </div>`
    },
    'my-vision': {
        gradient: 'linear-gradient(135deg,#2f5061,#e57f84)',
        icon: 'fas fa-lightbulb', tag: 'VISION',
        title: 'My Vision',
        tagline: 'Creating Meaningful Digital Experiences',
        html: `
        <div class="detail-section-item">
            <h2><i class="fas fa-bullseye"></i> Big Picture</h2>
            <p>Menciptakan website yang <strong>indah</strong>, <strong>fungsional</strong>, dan memberikan nilai nyata.</p>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-flag"></i> Core Principles</h2>
            <div class="detail-principles-grid">
                <div class="detail-principle-card"><div class="detail-principle-num">1</div><h3>User-Centered</h3><p>Pengguna adalah prioritas.</p></div>
                <div class="detail-principle-card"><div class="detail-principle-num">2</div><h3>Performance</h3><p>Website cepat = user happy.</p></div>
                <div class="detail-principle-card"><div class="detail-principle-num">3</div><h3>Accessibility</h3><p>Bisa diakses semua orang.</p></div>
                <div class="detail-principle-card"><div class="detail-principle-num">4</div><h3>Learning</h3><p>Selalu belajar hal baru.</p></div>
            </div>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-road"></i> Goals</h2>
            <div class="detail-goals-list">
                <div class="detail-goal-item"><i class="fas fa-check-circle"></i><div><h3>Full-Stack Master</h3><p>Expert frontend & backend</p></div></div>
                <div class="detail-goal-item"><i class="fas fa-check-circle"></i><div><h3>Impactful Products</h3><p>Berdampak positif</p></div></div>
                <div class="detail-goal-item"><i class="fas fa-check-circle"></i><div><h3>Share Knowledge</h3><p>Edukasi developer Indonesia</p></div></div>
                <div class="detail-goal-item"><i class="fas fa-check-circle"></i><div><h3>Open Source</h3><p>Kontribusi global</p></div></div>
            </div>
        </div>
        <div class="detail-section-item">
            <h2><i class="fas fa-quote-left"></i> Philosophy</h2>
            <blockquote class="detail-quote">
                Code is poetry. Every line should be purposeful.
                <footer>— Bima Satya M.</footer>
            </blockquote>
        </div>`
    }
};
