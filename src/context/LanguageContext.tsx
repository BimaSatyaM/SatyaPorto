// ===== src/context/LanguageContext.tsx =====
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'ID';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
    activeSection: string;
    setActiveSection: (section: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    EN: {
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.projects': 'Projects',
        'nav.dashboard': 'Dashboard',
        'nav.contact': 'Contact',
        'sidebar.guest': 'Guest Account',
        'sidebar.guestSub': 'Sign in to interact',
        'sidebar.admin': 'Whitelisted Admin',
        'sidebar.logout': 'Logout',
        'sidebar.copyright1': 'COPYRIGHT © 2026',
        'sidebar.copyright2': 'Bima Satya. All rights reserved.',
        'sidebar.loginGoogle': 'Login with Google',
        'sidebar.loginGitHub': 'Login with GitHub',
        'home.bio1': 'An Informatics Student and developer dedicated to building impactful digital solutions. I specialize in developing scalable web platforms and mobile applications using a modern tech stack, primarily React, Flutter, Python, and Go.',
        'home.bio2': 'Right now I’m focusing on improving my skills in several programming languages and frameworks since I’m still a student. I combine technical expertise with effective communication and collaboration to ensure every project achieves logical clarity and a meaningful real-world impact. I\'m also open to new opportunities and collaborations, so feel free to reach out!',
        'home.skillsTitle': 'Skills',
        'home.skillsSubtitle': 'My professional skills.',
        'home.warning': "I'm still learning all these languages/frameworks, and there's likely more to come in the future!",
        'home.projectShowcaseTitle': 'Project Showcase',
        'home.projectShowcaseSubtitle': "Latest projects That I've Made.",
        'skills.all': 'All',
        'skills.language': 'Language',
        'skills.frontend': 'Front End',
        'skills.backend': 'Back End',
        'skills.database': 'Database',
        'skills.mobile': 'Mobile',
        'skills.tools': 'Tools',
        'about.title': 'About Me',
        'about.subtitle': 'A brief introduction about who I am.',
        'about.bio1': "I'm Bima Satya Mahendra (Satya), currently studying at Informatics Departement, Sumatra Institute Of Technology. I have an interest in software engineering development, web3, blockchain technology, and AI, Especially web3 and AI. I’ve been spending most of my time building projects and improving my skills in those areas.",
        'about.bio2': "Right now i'm still improving on my skills in several programming languages and frameworks since i'm still a student. especially blockchain and AI. I enjoy turning ideas into working products, while making sure the code is not just functional, but also clean, structured, and easy to maintain. For me, good software isn’t just about making things work, but it’s about building them the right way.",
        'about.bio3': "Lately, I’ve been exploring blockchain and AI more deeply, experimenting with different tools and technologies, and understanding how systems actually work behind that.",
        'about.bio4': 'Recently, I’ve been working on project that called "ACTS (Adaptive Confluence Trading System)" a Self Learning Trading Bot. I’m still learning all of that and improving myself. I’m open to collaborations, opportunities, or just connecting with people in the same space.',
        'about.bestRegards': 'Best Regards,',
        'about.cvTitle': 'Curriculum Vitae (CV)',
        'about.cvSubtitle': 'Download my professional resume (PDF)',
        'about.eduTitle': 'Education',
        'about.eduSubtitle': 'My educational journey.',
        'about.edu1Title': 'Institut Teknologi Sumatera',
        'about.edu1Details': "Bachelor's degree • Informatics Engineering, (S.Kom) • GPA: -",
        'about.edu1Meta': '2025 - Present • Lampung, Indonesia',
        'about.edu2Title': 'SMAN 3 Bandar Lampung',
        'about.edu2Details': 'Senior High School • Merdeka Curriculum',
        'about.edu2Meta': '2022 - 2025 • Bandar Lampung, Lampung, Indonesia',
        'projects.title': 'Featured Projects',
        'projects.subtitle': 'A showcase of recent projects by me.',
        'projects.visit': 'Visit Project',
        'projects.selectReaction': 'Select Reaction',
        'projects.writeComment': 'Write a comment...',
        'projects.noComments': 'No comments yet. Be the first to share your thoughts!',
        'projects.loginReact': 'Please login first to react',
        'projects.loginComment': 'Please login first to comment',
        'contact.title': 'Contact',
        'contact.subtitle': "Let's get in touch.",
        'contact.socialTitle': 'Find me on social media',
        'contact.gmailTitle': 'Stay in Touch',
        'contact.gmailSub': 'Reach out via email for inquiries or collaborations.',
        'contact.gmailBtn': 'Go to Gmail',
        'contact.igTitle': 'Follow My Journey',
        'contact.igSub': 'Follow my creative journey.',
        'contact.igBtn': 'Go to Instagram',
        'contact.liTitle': "Let's Connect",
        'contact.liSub': 'Connect with me professionally.',
        'contact.liBtn': 'Go to Linkedin',
        'contact.ghTitle': 'Explore the Code',
        'contact.ghSub': 'Explore my open-source work.',
        'contact.ghBtn': 'Go to Github',
        'contact.sendTitle': 'Send me a message',
        'contact.nameLabel': 'Name',
        'contact.namePlaceholder': 'Your Name',
        'contact.emailLabel': 'Email',
        'contact.emailPlaceholder': 'your@email.com',
        'contact.msgLabel': 'Message',
        'contact.msgPlaceholder': 'Type your message here...',
        'contact.sendBtn': 'Send Message',
        'contact.sendingBtn': 'Sending...',
        'contact.sentBtn': 'Message Sent!',
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': 'Manage projects showcase and classifier entries.',
        'dashboard.unauthorized': 'Unauthorized Access',
        'dashboard.underConstruction': 'This page is still under development. Comeback Later when it realases!',
        'dashboard.createPost': 'Create New Post',
        'dashboard.editPost': 'Edit Post',
        'dashboard.postTitle': 'Title',
        'dashboard.postDesc': 'Description',
        'dashboard.postLink': 'Project Link',
        'dashboard.postImage': 'Image Upload',
        'dashboard.selectTech': 'Select Tech Stack',
        'dashboard.featured': 'Featured Post',
        'dashboard.submit': 'Submit',
        'dashboard.cancel': 'Cancel',
        'dashboard.classifierTitle': 'Tech Skill Classifier',
        'dashboard.classifierName': 'Tech Name',
        'dashboard.classifierColor': 'Badge Theme Color',
        'dashboard.classifierPreview': 'Live Badge Preview',
        'dashboard.classifierAdd': 'Add Tech Skill',
        'dashboard.currentSkills': 'Current Skills List'
    },
    ID: {
        'nav.home': 'Beranda',
        'nav.about': 'Tentang Saya',
        'nav.projects': 'Proyek',
        'nav.dashboard': 'Dasbor',
        'nav.contact': 'Kontak',
        'sidebar.guest': 'Akun Tamu',
        'sidebar.guestSub': 'Masuk untuk berinteraksi',
        'sidebar.admin': 'Admin Terdaftar',
        'sidebar.logout': 'Keluar',
        'sidebar.copyright1': 'HAK CIPTA © 2026',
        'sidebar.copyright2': 'Bima Satya. Hak cipta dilindungi.',
        'sidebar.loginGoogle': 'Masuk dengan Google',
        'sidebar.loginGitHub': 'Masuk dengan GitHub',
        'home.bio1': 'Aku adalah Mahasiswa Informatika dan seorang developer yang berdedikasi untuk membangun solusi digital yang berdampak. Saya berspesialisasi dalam mengembangkan platform web yang skalabel dan aplikasi seluler menggunakan tumpukan teknologi modern, terutama React, Flutter, Python, dan Go.',
        'home.bio2': 'Saat ini saya sedang fokus meningkatkan kemampuan saya dalam beberapa bahasa pemrograman dan kerangka kerja karena saya masih berstatus mahasiswa. Saya menggabungkan keahlian teknis dengan komunikasi dan kolaborasi yang efektif untuk memastikan setiap proyek mencapai kejelasan logis dan dampak nyata yang bermakna. Saya juga terbuka untuk peluang dan kolaborasi baru, jadi jangan ragu untuk menghubungi!',
        'home.skillsTitle': 'Keahlian',
        'home.skillsSubtitle': 'Keahlian profesional saya.',
        'home.warning': 'Saya masih mempelajari semua bahasa/kerangka kerja ini, dan kemungkinan akan ada lebih banyak lagi di masa mendatang!',
        'home.projectShowcaseTitle': 'Pameran Proyek',
        'home.projectShowcaseSubtitle': 'Proyek terbaru yang telah saya buat.',
        'skills.all': 'Semua',
        'skills.language': 'Bahasa Pemrograman',
        'skills.frontend': 'Front End',
        'skills.backend': 'Back End',
        'skills.database': 'Database',
        'skills.mobile': 'Seluler',
        'skills.tools': 'Alat',
        'about.title': 'Tentang Saya',
        'about.subtitle': 'Pengantar singkat tentang siapa saya.',
        'about.bio1': 'Aku Bima Satya Mahendra (Satya), saat ini sedang menempuh pendidikan di Jurusan Informatika, Institut Teknologi Sumatera. Aku memiliki minat dalam pengembangan rekayasa perangkat lunak, web3, teknologi blockchain, dan AI, terutama web3 dan AI. Aku telah menghabiskan sebagian besar waktuku untuk membangun proyek dan meningkatkan keterampilanku di bidang-bidang tersebut.',
        'about.bio2': 'Saat ini saya masih meningkatkan kemampuan saya di beberapa bahasa pemrograman dan kerangka kerja karena saya masih mahasiswa. terutama blockchain dan AI. Saya senang mengubah ide menjadi produk yang berfungsi, sambil memastikan kode tersebut tidak hanya fungsional, tetapi juga bersih, terstruktur, dan mudah dipelihara. Bagi saya, perangkat lunak yang baik bukan hanya tentang membuat sesuatu berfungsi, tetapi tentang membangunnya dengan cara yang benar.',
        'about.bio3': 'Akhir-akhir ini, saya telah menjelajahi blockchain dan AI secara lebih mendalam, bereksperimen dengan berbagai alat dan teknologi, dan memahami bagaimana sistem sebenarnya bekerja di baliknya.',
        'about.bio4': 'Baru-baru ini, saya sedang mengerjakan proyek bernama "ACTS (Adaptive Confluence Trading System)" sebuah Bot Perdagangan Pembelajaran Mandiri. Saya masih mempelajari semua itu dan meningkatkan diri saya. Saya terbuka untuk kolaborasi, peluang, atau sekadar terhubung dengan orang-orang di bidang yang sama.',
        'about.bestRegards': 'Salam Hangat,',
        'about.cvTitle': 'Daftar Riwayat Hidup',
        'about.cvSubtitle': 'Unduh resume profesional saya (PDF)',
        'about.eduTitle': 'Pendidikan',
        'about.eduSubtitle': 'Perjalanan pendidikan saya.',
        'about.edu1Title': 'Institut Teknologi Sumatera',
        'about.edu1Details': 'Gelar Sarjana • Teknik Informatika, (S.Kom) • IPK: -',
        'about.edu1Meta': '2025 - Sekarang • Lampung, Indonesia',
        'about.edu2Title': 'SMAN 3 Bandar Lampung',
        'about.edu2Details': 'Sekolah Menengah Atas • Kurikulum Merdeka',
        'about.edu2Meta': '2022 - 2025 • Bandar Lampung, Lampung, Indonesia',
        'projects.title': 'Proyek Unggulan',
        'projects.subtitle': 'Pameran kreasi terbaru yang dibagikan oleh komunitas kami.',
        'projects.visit': 'Kunjungi Proyek',
        'projects.selectReaction': 'Pilih Reaksi',
        'projects.writeComment': 'Tulis komentar...',
        'projects.noComments': 'Belum ada komentar. Jadilah yang pertama membagikan pendapat Anda!',
        'projects.loginReact': 'Silakan login terlebih dahulu untuk memberikan reaksi',
        'projects.loginComment': 'Silakan login terlebih dahulu untuk memberikan komentar',
        'contact.title': 'Hubungi',
        'contact.subtitle': 'Mari saling terhubung.',
        'contact.socialTitle': 'Temukan saya di media sosial',
        'contact.gmailTitle': 'Hubungi Saya',
        'contact.gmailSub': 'Hubungi saya melalui email untuk pertanyaan atau kolaborasi.',
        'contact.gmailBtn': 'Buka Gmail',
        'contact.igTitle': 'Ikuti Perjalanan Saya',
        'contact.igSub': 'Ikuti perjalanan kreatif saya.',
        'contact.igBtn': 'Buka Instagram',
        'contact.liTitle': 'Mari Terhubung',
        'contact.liSub': 'Terhubung dengan saya secara profesional.',
        'contact.liBtn': 'Buka Linkedin',
        'contact.ghTitle': 'Jelajahi Kode',
        'contact.ghSub': 'Jelajahi karya sumber terbuka saya.',
        'contact.ghBtn': 'Buka Github',
        'contact.sendTitle': 'Kirimkan saya pesan',
        'contact.nameLabel': 'Nama',
        'contact.namePlaceholder': 'Nama Anda',
        'contact.emailLabel': 'Email',
        'contact.emailPlaceholder': 'email@anda.com',
        'contact.msgLabel': 'Pesan',
        'contact.msgPlaceholder': 'Ketik pesan Anda di sini...',
        'contact.sendBtn': 'Kirim Pesan',
        'contact.sendingBtn': 'Mengirim...',
        'contact.sentBtn': 'Pesan Terkirim!',
        'dashboard.title': 'Dasbor Admin',
        'dashboard.subtitle': 'Kelola pameran proyek dan entri pengklasifikasi.',
        'dashboard.unauthorized': 'Akses Tidak Sah',
        'dashboard.underConstruction': 'Halaman ini sedang dalam pembangunan atau dibatasi untuk administrator.',
        'dashboard.createPost': 'Buat Postingan Baru',
        'dashboard.editPost': 'Edit Postingan',
        'dashboard.postTitle': 'Judul',
        'dashboard.postDesc': 'Deskripsi',
        'dashboard.postLink': 'Tautan Proyek',
        'dashboard.postImage': 'Unggah Gambar',
        'dashboard.selectTech': 'Pilih Tech Stack',
        'dashboard.featured': 'Postingan Unggulan',
        'dashboard.submit': 'Kirim',
        'dashboard.cancel': 'Batal',
        'dashboard.classifierTitle': 'Pengklasifikasi Keahlian Teknologi',
        'dashboard.classifierName': 'Nama Teknologi',
        'dashboard.classifierColor': 'Warna Tema Lencana',
        'dashboard.classifierPreview': 'Pratinjau Lencana Langsung',
        'dashboard.classifierAdd': 'Tambah Keahlian Teknologi',
        'dashboard.currentSkills': 'Daftar Keahlian Saat Ini'
    }
};

const VALID_SECTIONS = ['home', 'about', 'projects', 'dashboard', 'contact'];

const parseUrlPath = (): { section: string; lang: Language } => {
    const parts = window.location.pathname.toLowerCase().split('/').filter(Boolean);
    let section = 'home';
    let lang: Language = 'EN';

    if (parts.length > 0) {
        if (VALID_SECTIONS.includes(parts[0])) {
            section = parts[0];
        }
    }
    if (parts.length > 1) {
        if (parts[1] === 'id') {
            lang = 'ID';
        } else if (parts[1] === 'en') {
            lang = 'EN';
        }
    } else {
        const saved = localStorage.getItem('languagePreference');
        if (saved === 'EN' || saved === 'ID') {
            lang = saved as Language;
        }
    }
    return { section, lang };
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>(() => parseUrlPath().lang);
    const [activeSection, setActiveSectionState] = useState<string>(() => parseUrlPath().section);

    useEffect(() => {
        const expectedPath = `/${activeSection}/${lang.toLowerCase()}`;
        const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
        if (currentPath !== expectedPath) {
            window.history.replaceState(null, '', expectedPath + window.location.search + window.location.hash);
        }
    }, [lang, activeSection]);

    useEffect(() => {
        const handlePopState = () => {
            const parsed = parseUrlPath();
            setLangState(parsed.lang);
            setActiveSectionState(parsed.section);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('languagePreference', newLang);

        const expectedPath = `/${activeSection}/${newLang.toLowerCase()}`;
        const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
        if (currentPath !== expectedPath) {
            window.history.pushState(null, '', expectedPath + window.location.search + window.location.hash);
        }
    };

    const setActiveSection = (newSection: string) => {
        if (VALID_SECTIONS.includes(newSection)) {
            setActiveSectionState(newSection);
            const expectedPath = `/${newSection}/${lang.toLowerCase()}`;
            const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
            if (currentPath !== expectedPath) {
                window.history.pushState(null, '', expectedPath + window.location.search + window.location.hash);
            }
        }
    };

    const t = (key: string): string => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, activeSection, setActiveSection }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
