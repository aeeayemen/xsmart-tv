window.homeView = {
    render: async function (container) {
        App.showLoader();

        const userInfo = Storage.get('user_info');
        // Expiration date calculation
        let expDate = 'غير محدود';
        if (userInfo && userInfo.exp_date && userInfo.exp_date !== "null") {
            const date = new Date(userInfo.exp_date * 1000);
            expDate = date.toLocaleDateString('ar-EG');
        }

        container.innerHTML = `
            <div class="navbar">
                <img src="img/logo.jpg" alt="XSMART TV" style="width: 80px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                <div class="nav-links">
                    <a href="#/home" class="nav-item active">الرئيسية</a>
                    <a href="#/movies" class="nav-item">أفلام</a>
                    <a href="#/series" class="nav-item">مسلسلات</a>
                    <a href="#/livetv" class="nav-item">بث مباشر</a>
                    <a href="#/login" id="logout-btn" class="nav-item" style="color: #ff4d4d;">خروج</a>
                </div>
                <div class="user-info" style="text-align: left;">
                    <div style="font-weight: bold;">${userInfo ? userInfo.username : 'المستخدم'}</div>
                    <div style="font-size: 0.8rem;">صلاحية: ${expDate}</div>
                </div>
            </div>

            <div class="home-container fade-in" id="home-content">
                <!-- Content injected here -->
            </div>
            
            <div class="legal-footer">
                نحن مجرد مشغل وسائط (Media Player) ولا نوفر أو نستضيف أي محتوى. التطبيق متاح لتشغيل روابط المشتركين الخاصة بهم فقط.
            </div>
        `;

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            Storage.remove('xtream_credentials');
            Storage.remove('user_info');
            Router.navigate('#/login');
        });

        // Load based on tab? or load all for home
        await this.loadContent();
        App.hideLoader();

        // Re-init spatial navigation after loading content
        SpatialNavigation.initFocus(container);

        // Start auto-scrolling the carousels
        this.startAutoScroll();
    },

    loadContent: async function () {
        const contentDiv = document.getElementById('home-content');

        try {
            // Fetch 'Latest Additions' from the first VOD category as a proxy
            const moviesCats = await API.getCategories('get_vod_categories');
            let latestStreams = [];
            if (moviesCats && moviesCats.length > 0) {
                // Get streams from the first category
                latestStreams = await API.getStreams('get_vod_streams', moviesCats[0].category_id);
                latestStreams = latestStreams.slice(0, 20); // Top 20
            }
            // Fetch Latest Series
            const seriesCats = await API.getCategories('get_series_categories');
            let latestSeries = [];
            if (seriesCats && seriesCats.length > 0) {
                latestSeries = await API.getStreams('get_series', seriesCats[0].category_id);
                latestSeries = latestSeries.slice(0, 20);
            }

            // Fetch Live TV channels
            const liveCats = await API.getCategories('get_live_categories');
            let liveStreams = [];
            if (liveCats && liveCats.length > 0) {
                liveStreams = await API.getStreams('get_live_streams', liveCats[0].category_id);
                liveStreams = liveStreams.slice(0, 20); // Top 20
            }

            // Load recently watched from local storage
            const recentSeries = Storage.getHistory('series');
            const recentMovies = Storage.getHistory('movie');
            const recentLive = Storage.getHistory('livetv');

            // Load favorites
            const favMovies = Storage.get('favorites_movie') || [];
            const favSeries = Storage.get('favorites_series') || [];
            const favLive = Storage.get('favorites_livetv') || [];

            const userInfo = Storage.get('user_info');

            let html = '';

            // Hero section with Search
            html += `
                <div class="hero-banner" style="background-image: url('https://image.tmdb.org/t/p/original/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg');">
                    <div class="hero-content">
                        <h1 class="hero-title">مرحباً ${userInfo ? userInfo.username : 'بك'}</h1>
                        <p class="hero-desc">استمتع بأحدث الإضافات وتابع مشاهدة ما تفضله من حيث توقفت.</p>
                        
                        <div class="search-container-home" style="margin-top: 20px; display: flex; gap: 10px; max-width: 400px;">
                            <input type="text" id="home-search-input" placeholder="ابحث عن فيلم، مسلسل، أو قناة..." 
                                   style="flex-grow: 1; padding: 12px; border-radius: 8px; border: none; background: rgba(255,255,255,0.1); color: white; outline: none; border: 1px solid rgba(255,255,255,0.2);">
                            <button class="btn" id="home-search-btn" style="padding: 10px 20px;">🔍</button>
                        </div>
                    </div>
                </div>
            `;

            // 1. Latest Additions (Movies)
            if (latestStreams.length > 0) {
                html += this.buildCarouselRow('أحدث الأفلام', latestStreams, 'movie', 'row-latest');
            }

            // 2. Latest Series
            if (latestSeries.length > 0) {
                html += this.buildCarouselRow('أحدث المسلسلات', latestSeries, 'series', 'row-latest-series');
            }

            // 3. Recently Watched Series
            if (recentSeries.length > 0) {
                html += this.buildCarouselRow('مسلسلات شاهدتها مؤخراً', recentSeries, 'series', 'row-recent-series');
            }

            // 4. Recently Watched Movies
            if (recentMovies.length > 0) {
                html += this.buildCarouselRow('أفلام شاهدتها مؤخراً', recentMovies, 'movie', 'row-recent-movies');
            }

            // 5. Recently Watched Channels
            if (recentLive.length > 0) {
                html += this.buildCarouselRow('قنوات شاهدتها مؤخراً', recentLive, 'livetv', 'row-recent-live');
            }

            // 6. Live TV Channels
            if (liveStreams.length > 0) {
                html += this.buildCarouselRow('القنوات التلفزيونية', liveStreams, 'livetv', 'row-live-channels');
            }

            // 7. Favorites
            if (favMovies.length > 0) {
                html += this.buildCarouselRow('الأفلام المفضلة', favMovies, 'movie', 'row-fav-movies');
            }
            if (favSeries.length > 0) {
                html += this.buildCarouselRow('المسلسلات المفضلة', favSeries, 'series', 'row-fav-series');
            }
            if (favLive.length > 0) {
                html += this.buildCarouselRow('القنوات المفضلة', favLive, 'livetv', 'row-fav-live');
            }

            if (latestStreams.length === 0 && latestSeries.length === 0 && recentMovies.length === 0 && recentSeries.length === 0 && recentLive.length === 0 && favMovies.length === 0 && favSeries.length === 0 && favLive.length === 0) {
                html += `
                    <div style="padding: 40px; text-align: center; color: #888;">
                        <h2 style="margin-bottom: 20px;">لا يوجد محتوى لعرضه حالياً</h2>
                        <p>يرجى التحقق من اتصالك بالإنترنت أو تصفح الأقسام الأخرى.</p>
                    </div>
                `;
            }

            contentDiv.innerHTML = html;

            // Setup Search Logic
            const searchInput = document.getElementById('home-search-input');
            const searchBtn = document.getElementById('home-search-btn');

            const performSearch = () => {
                const query = searchInput.value.trim();
                if (query) {
                    // Navigate to a search view or handle in-place (let's use params)
                    Router.navigate(`#/movies?search=${encodeURIComponent(query)}`);
                }
            };

            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });

        } catch (e) {
            console.error(e);
            contentDiv.innerHTML = '<div style="padding: 100px; text-align:center;">حدث خطأ في تحميل المحتوى.</div>';
        }
    },

    buildCarouselRow: function (title, items, type, rowId) {
        if (!items || items.length === 0) return '';

        let rowHtml = `
            <div class="row">
                <div class="row-title">${title}</div>
                <button class="slider-btn slider-btn-right" onclick="homeView.scrollRow('${rowId}', -300)">&#10094;</button>
                <button class="slider-btn slider-btn-left" onclick="homeView.scrollRow('${rowId}', 300)">&#10095;</button>
                <div class="row-posters" id="${rowId}">
        `;

        items.forEach(item => {
            const id = type === 'series' ? item.series_id : item.stream_id;
            const name = item.name || item.title || "بدون عنوان";
            // Check cover, stream_icon, movie_image, or fallback to placeholder
            const icon = item.cover || item.stream_icon || item.movie_image || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(name);

            rowHtml += `
                <img src="${icon}" alt="${name}" loading="lazy" class="poster" 
                     onclick="Router.navigate('#/details?type=${type}&id=${id}')">
            `;
        });

        rowHtml += `
                </div>
            </div>
        `;
        return rowHtml;
    },

    scrollRow: function (rowId, amount) {
        const row = document.getElementById(rowId);
        if (row) {
            // amount > 0 scrolls left (forward in RTL), amount < 0 scrolls right (backward in RTL)
            row.scrollBy({ left: amount, behavior: 'smooth' });
        }
    },

    startAutoScroll: function () {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
        }

        const lastScrolls = new Map();

        this.scrollInterval = setInterval(() => {
            const rows = document.querySelectorAll('.row-posters');
            rows.forEach(row => {
                // Pause if user is hovering over the row or its buttons
                if (row.matches(':hover') || row.parentNode.matches(':hover')) return;

                const maxScroll = row.scrollWidth - row.clientWidth;
                if (maxScroll <= 10) return; // No scroll needed if it entirely fits

                let currentScroll = Math.abs(row.scrollLeft);
                let lastScroll = lastScrolls.get(row) ?? -1;

                // Check if we reached the end, OR if we are stuck (tried to scroll but position didn't change)
                if (currentScroll >= maxScroll - 50 || (currentScroll > 0 && currentScroll === lastScroll)) {
                    // Reset to the beginning
                    row.scrollTo({ left: 0, behavior: 'smooth' });
                    lastScrolls.set(row, 0); // Reset tracking
                } else {
                    // Move forward. In RTL, "forward" usually means scrolling to a negative left value.
                    // To be completely safe across all browsers, we check the computed direction.
                    const isRtl = window.getComputedStyle(row).direction === 'rtl';
                    row.scrollBy({ left: isRtl ? -250 : 250, behavior: 'smooth' });

                    lastScrolls.set(row, currentScroll);
                }
            });
        }, 3000); // 3 seconds
    }
};
