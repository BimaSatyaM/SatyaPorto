// ===== src/data/portfolioData.ts =====

export interface Song {
    title: string;
    artist: string;
    cover: string;
    file: string;
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
