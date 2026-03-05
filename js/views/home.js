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

            // Load recently watched from local storage
            const recentSeries = Storage.getHistory('series');
            const recentMovies = Storage.getHistory('movie');

            let html = '';

            // Hero section
            html += `
                <div class="hero-banner" style="background-image: url('https://image.tmdb.org/t/p/original/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg');">
                    <div class="hero-content">
                        <h1 class="hero-title">مرحباً ${userInfo ? userInfo.username : 'بك'}</h1>
                        <p class="hero-desc">استمتع بأحدث الإضافات وتابع مشاهدة ما تفضله من حيث توقفت.</p>
                        <button class="btn" onclick="Router.navigate('#/movies')">تصفح الأفلام</button>
                    </div>
                </div>
            `;

            // 1. Latest Additions
            if (latestStreams.length > 0) {
                html += this.buildCarouselRow('أحدث الإضافات', latestStreams, 'movie', 'row-latest');
            }

            // 2. Recently Watched Series
            if (recentSeries.length > 0) {
                html += this.buildCarouselRow('مسلسلات شاهدتها مؤخراً', recentSeries, 'series', 'row-recent-series');
            }

            // 3. Recently Watched Movies
            if (recentMovies.length > 0) {
                html += this.buildCarouselRow('أفلام شاهدتها مؤخراً', recentMovies, 'movie', 'row-recent-movies');
            }

            if (latestStreams.length === 0 && recentMovies.length === 0 && recentSeries.length === 0) {
                html += `
                    <div style="padding: 40px; text-align: center; color: #888;">
                        <h2 style="margin-bottom: 20px;">لا يوجد محتوى لعرضه حالياً</h2>
                        <p>يرجى التحقق من اتصالك بالإنترنت أو تصفح الأقسام الأخرى.</p>
                    </div>
                `;
            }

            contentDiv.innerHTML = html;

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
            const icon = item.cover || item.stream_icon || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(name);

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
    }
};
