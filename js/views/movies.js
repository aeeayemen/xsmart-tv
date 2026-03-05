window.moviesView = {
    render: async function (container) {
        App.showLoader();

        const userInfo = Storage.get('user_info');
        let expDate = 'غير محدود';
        if (userInfo && userInfo.exp_date && userInfo.exp_date !== "null") {
            const date = new Date(userInfo.exp_date * 1000);
            expDate = date.toLocaleDateString('ar-EG');
        }

        container.innerHTML = `
            <div class="navbar">
                <img src="img/logo.jpg" alt="XSMART TV" style="width: 80px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                <div class="nav-links">
                    <a href="#/home" class="nav-item">الرئيسية</a>
                    <a href="#/movies" class="nav-item active">أفلام</a>
                    <a href="#/series" class="nav-item">مسلسلات</a>
                    <a href="#/livetv" class="nav-item">بث مباشر</a>
                    <a href="#/login" id="logout-btn" class="nav-item" style="color: #ff4d4d;">خروج</a>
                </div>
                <div class="user-info" style="text-align: left;">
                    <div style="font-weight: bold;">${userInfo ? userInfo.username : 'المستخدم'}</div>
                    <div style="font-size: 0.8rem;">صلاحية: ${expDate}</div>
                </div>
            </div>

            <div class="page-layout">
                <div class="sidebar" id="movies-sidebar">
                    <div class="sidebar-item active" data-cat="all">عرض الكل</div>
                    <div class="sidebar-item" data-cat="favorites" style="border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; padding-bottom: 15px;">❤️ المفضلة</div>
                </div>
                <div class="content-area" id="movies-content">
                    <h2 class="row-title" style="margin-bottom: 20px;">جميع الأفلام</h2>
                    <div id="movies-grid" class="content-grid">
                    </div>
                </div>
            </div>
            
            <div class="legal-footer">
                نحن مجرد مشغل وسائط (Media Player) ولا نوفر أو نستضيف أي محتوى.
            </div>
        `;

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            Storage.remove('xtream_credentials');
            Storage.remove('user_info');
            Router.navigate('#/login');
        });

        // Load categories into sidebar
        await this.loadCategories();

        // Handle search query if present
        if (params && params.search) {
            const sidebar = document.getElementById('movies-sidebar');
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            await this.loadMovies('all', params.search);
        } else {
            // Load all movies by default
            await this.loadMovies('all');
        }

        App.hideLoader();
        SpatialNavigation.initFocus(container);
    },

    loadCategories: async function () {
        const sidebar = document.getElementById('movies-sidebar');
        const categories = await API.getCategories('get_vod_categories');

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'sidebar-item';
                item.dataset.cat = cat.category_id;
                item.textContent = cat.category_name;
                item.addEventListener('click', () => {
                    // Update active state
                    sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    // Load filtered content
                    this.loadMovies(cat.category_id);
                });
                sidebar.appendChild(item);
            });
        }

        // Wire up the "Show All" button
        sidebar.querySelector('[data-cat="all"]').addEventListener('click', () => {
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            sidebar.querySelector('[data-cat="all"]').classList.add('active');
            this.loadMovies('all');
        });

        // Wire up the "Favorites" button
        sidebar.querySelector('[data-cat="favorites"]').addEventListener('click', () => {
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            sidebar.querySelector('[data-cat="favorites"]').classList.add('active');
            this.loadMovies('favorites');
        });
    },

    loadMovies: async function (categoryId, query = '') {
        const grid = document.getElementById('movies-grid');
        const titleEl = document.querySelector('.content-area .row-title');
        grid.innerHTML = '<p style="color: var(--text-secondary);">جاري التحميل...</p>';

        try {
            let allStreams = [];
            if (categoryId === 'all') {
                allStreams = await API.getStreams('get_vod_streams', '');
            } else if (categoryId === 'favorites') {
                allStreams = Storage.get('favorites_movie') || [];
            } else {
                allStreams = await API.getStreams('get_vod_streams', categoryId);
            }

            // Apply Search Filtering if query exists
            if (query) {
                const q = query.toLowerCase();
                allStreams = allStreams.filter(item =>
                    (item.name && item.name.toLowerCase().includes(q)) ||
                    (item.title && item.title.toLowerCase().includes(q))
                );
                titleEl.textContent = `نتائج البحث عن: ${query}`;
            } else {
                titleEl.textContent = categoryId === 'all' ? 'جميع الأفلام' : (categoryId === 'favorites' ? 'المفضلة' : 'تصفية حسب التصنيف');
            }

            if (allStreams.length > 0) {
                let html = '';
                allStreams.forEach(item => {
                    const id = item.stream_id;
                    const name = item.name || item.title || "بدون عنوان";
                    const icon = item.cover || item.stream_icon || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(name);

                    html += `
                        <div class="grid-item">
                            <img src="${icon}" alt="${name}" loading="lazy" class="poster" 
                                 onclick="Router.navigate('#/details?type=movie&id=${id}')">
                            <h4 style="margin-top: 8px; font-size: 0.9rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${name}</h4>
                        </div>
                    `;
                });
                grid.innerHTML = html;
            } else {
                grid.innerHTML = '<p>لا توجد أفلام متاحة حالياً.</p>';
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML = '<p>حدث خطأ في تحميل الأفلام.</p>';
        }
    }
};
