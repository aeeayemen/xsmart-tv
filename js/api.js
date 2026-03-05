const API = {
    host: 'mock_host',
    username: 'mock_user',
    password: 'mock_password',
    userInfo: { auth: 1, username: 'Mock User', exp_date: '1735689600' }, // date far in the future

    init: function (host, username, password) {
        this.host = host;
        this.username = username;
        this.password = password;
    },

    buildUrl: function (action = '', additionalParams = '') {
        return '#';
    },

    authenticate: async function () {
        return new Promise(resolve => {
            setTimeout(() => {
                Storage.setStr('xtream_credentials', JSON.stringify({
                    host: this.host || 'mock',
                    username: this.username || 'mock',
                    password: this.password || 'mock'
                }));
                Storage.set('user_info', this.userInfo);
                resolve({ user_info: this.userInfo });
            }, 500); // simulate network delay
        });
    },

    getCategories: async function (type) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (type === 'get_vod_categories') {
                    resolve([
                        { category_id: "1", category_name: "أفلام أكشن" },
                        { category_id: "2", category_name: "أفلام دراما" },
                        { category_id: "6", category_name: "أفلام 2026" },
                        { category_id: "7", category_name: "أفلام 2025" }
                    ]);
                } else if (type === 'get_series_categories') {
                    resolve([
                        { category_id: "3", category_name: "مسلسلات عربية" },
                        { category_id: "8", category_name: "مسلسلات رمضان 2026" },
                        { category_id: "9", category_name: "مسلسلات أجنبية" }
                    ]);
                } else if (type === 'get_live_categories') {
                    resolve([
                        { category_id: "4", category_name: "قنوات رياضية" },
                        { category_id: "5", category_name: "قنوات إخبارية" },
                        { category_id: "10", category_name: "قنوات أطفال" }
                    ]);
                } else {
                    resolve([]);
                }
            }, 300);
        });
    },

    getStreams: async function (type, categoryId = '') {
        return new Promise(resolve => {
            setTimeout(() => {
                let streams = [];
                const seriesPosters = [
                    "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                    "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", // Breaking Bad
                    "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg", // Game of Thrones
                    "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg", // Stranger Things
                    "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", // Peaky Blinders
                ];
                const moviePosters = [
                    "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                    "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
                    "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
                    "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
                ];

                for (let i = 1; i <= 15; i++) {
                    if (type === 'get_vod_streams') {
                        let icon = moviePosters[(i - 1) % moviePosters.length];
                        streams.push({ stream_id: 100 + i, name: "فيلم تجريبي " + i, stream_icon: icon, cover: icon });
                    } else if (type === 'get_series') {
                        let cover = seriesPosters[(i - 1) % seriesPosters.length];
                        streams.push({ series_id: 200 + i, name: "مسلسل تجريبي " + i, cover: cover, stream_icon: cover });
                    } else if (type === 'get_live_streams') {
                        let liveIcon = "https://via.placeholder.com/300x300/e74c3c/ffffff?text=Live+TV";
                        streams.push({ stream_id: 300 + i, name: "قناة بث " + i, stream_icon: liveIcon, cover: liveIcon });
                    }
                }
                resolve(streams);
            }, 300);
        });
    },

    getVodInfo: async function (vodId) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    info: { name: "اسم الفيلم الوهمي", rating: "8.5", year: "2023", description: "هذا وصف وهمي لفيلم لغرض تجربة التصميم، يتم عرض التفاصيل هنا بشكل منسق.", movie_image: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", backdrop_path: ["https://image.tmdb.org/t/p/original/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"] },
                    movie_data: { stream_id: vodId, container_extension: 'mp4' }
                });
            }, 300);
        });
    },

    getSeriesInfo: async function (seriesId) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    info: {
                        name: "مسلسل تجريبي " + (seriesId - 200),
                        rating: "9.2",
                        release_date: "2024",
                        description: "هذا مسلسل تجريبي يحتوي على مواسم وحلقات متعددة لتجربة واجهة المستخدم والتنقل بين الحلقات والمواسم بسلاسة.",
                        cover: "https://image.tmdb.org/t/p/w500/1LRLLWGvs5sZdTtuJCp4DPm52f.jpg",
                        backdrop_path: ["https://image.tmdb.org/t/p/original/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"]
                    },
                    episodes: {
                        "1": [
                            { id: "s1e1", title: "بداية الرحلة", info: { duration: "50m" } },
                            { id: "s1e2", title: "المواجهة الأولى", info: { duration: "48m" } },
                            { id: "s1e3", title: "الخيانة", info: { duration: "45m" } },
                            { id: "s1e4", title: "طريق العودة", info: { duration: "52m" } },
                            { id: "s1e5", title: "النهاية القريبة", info: { duration: "55m" } }
                        ],
                        "2": [
                            { id: "s2e1", title: "فصل جديد", info: { duration: "49m" } },
                            { id: "s2e2", title: "ظلال الماضي", info: { duration: "47m" } },
                            { id: "s2e3", title: "العهد القديم", info: { duration: "50m" } }
                        ]
                    }
                });
            }, 300);
        });
    },

    getStreamUrl: function (type, id, extension = 'm3u8') {
        // Return a public test stream URL for testing player design
        if (type === 'live' || extension === 'm3u8') {
            return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
        }
        return "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }
};
