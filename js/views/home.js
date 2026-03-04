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
            // Let's load categories and a few items for demo instead of everything to avoid hanging
            // In a real app we would paginate or lazy load

            const [moviesCats, seriesCats] = await Promise.all([
                API.getCategories('get_vod_categories'),
                API.getCategories('get_series_categories')
            ]);

            let html = '';

            // Hero section - pick random popular movie later, hardcode for now
            html += `
                <div class="hero-banner" style="background-image: url('https://image.tmdb.org/t/p/original/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg');">
                    <div class="hero-content">
                        <h1 class="hero-title">أحدث الإضافات</h1>
                        <p class="hero-desc">استمتع بتشكيلة من أفضل وأحدث الأفلام والمسلسلات المضافة حديثاً في مكتبتك.</p>
                        <button class="btn" onclick="Router.navigate('#/movies')">تصفح الآن</button>
                    </div>
                </div>
            `;

            // Just load the first 2 movie categories to keep it fast
            if (moviesCats && moviesCats.length > 0) {
                for (let i = 0; i < Math.min(2, moviesCats.length); i++) {
                    const cat = moviesCats[i];
                    const streams = await API.getStreams('get_vod_streams', cat.category_id);
                    html += this.buildCarouselRow(cat.category_name, streams.slice(0, 15), 'movie');
                }
            }

            // Series categories
            if (seriesCats && seriesCats.length > 0) {
                for (let i = 0; i < Math.min(1, seriesCats.length); i++) {
                    const cat = seriesCats[i];
                    const streams = await API.getStreams('get_series', cat.category_id);
                    html += this.buildCarouselRow('مسلسلات: ' + cat.category_name, streams.slice(0, 15), 'series');
                }
            }

            contentDiv.innerHTML = html;

        } catch (e) {
            console.error(e);
            contentDiv.innerHTML = '<div style="padding: 100px; text-align:center;">حدث خطأ في تحميل المحتوى.</div>';
        }
    },

    buildCarouselRow: function (title, items, type) {
        if (!items || items.length === 0) return '';

        let rowHtml = `
            <div class="row">
                <div class="row-title">${title}</div>
                <div class="row-posters">
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
    }
};
