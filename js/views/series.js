window.seriesView = {
    render: async function (container, params) {
        App.showLoader();

        const userInfo = Storage.get('user_info');
        let expDate = 'غير محدود';
        if (userInfo && userInfo.exp_date && userInfo.exp_date !== "null") {
            const date = new Date(userInfo.exp_date * 1000);
            expDate = date.toLocaleDateString('ar-EG');
        }

        container.innerHTML = `
            <div class="navbar">
                <img src="img/logo.png" alt="XSMART TV" class="nav-logo">
                <div class="nav-links">
                    <a href="#/home" class="nav-item">الرئيسية</a>
                    <a href="#/movies" class="nav-item">أفلام</a>
                    <a href="#/series" class="nav-item active">مسلسلات</a>
                    <a href="#/livetv" class="nav-item">بث مباشر</a>
                    <a href="#/login" id="logout-btn" class="nav-item nav-logout" style="color: #ff4d4d;">تسجيل الخروج</a>
                </div>
                <div class="user-info" style="text-align: left;">
                    <div style="font-weight: bold;">${userInfo ? userInfo.username : 'المستخدم'}</div>
                    <div style="font-size: 0.8rem;">صلاحية: ${expDate}</div>
                </div>
            </div>

            <div class="page-layout">
                <div class="sidebar" id="series-sidebar">
                    <div class="sidebar-item active" data-cat="all">عرض الكل</div>
                    <div class="sidebar-item" data-cat="favorites" style="border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; padding-bottom: 15px;">❤️ المفضلة</div>
                </div>
                <div class="content-area" id="series-content">
                    <h2 class="row-title" style="margin-bottom: 20px;">جميع المسلسلات</h2>
                    <div id="series-grid" class="content-grid">
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
            const sidebar = document.getElementById('series-sidebar');
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            await this.loadSeries('all', params.search);
        } else {
            // Load all series by default
            await this.loadSeries('all');
        }

        App.hideLoader();
        SpatialNavigation.initFocus(container);
    },

    loadCategories: async function () {
        const sidebar = document.getElementById('series-sidebar');
        const categories = await API.getCategories('get_series_categories');

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'sidebar-item';
                item.dataset.cat = cat.category_id;
                item.textContent = cat.category_name;
                item.addEventListener('click', () => {
                    sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    this.loadSeries(cat.category_id);
                });
                sidebar.appendChild(item);
            });
        }

        sidebar.querySelector('[data-cat="all"]').addEventListener('click', () => {
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            sidebar.querySelector('[data-cat="all"]').classList.add('active');
            this.loadSeries('all');
        });

        // Wire up the "Favorites" button
        sidebar.querySelector('[data-cat="favorites"]').addEventListener('click', () => {
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            sidebar.querySelector('[data-cat="favorites"]').classList.add('active');
            this.loadSeries('favorites');
        });
    },

    loadSeries: async function (categoryId, query = '') {
        const grid = document.getElementById('series-grid');
        const titleEl = document.querySelector('.content-area .row-title');
        grid.innerHTML = '<p style="color: var(--text-secondary);">جاري التحميل...</p>';

        try {
            let allStreams = [];
            if (categoryId === 'all') {
                allStreams = await API.getStreams('get_series', '');
            } else if (categoryId === 'favorites') {
                allStreams = Storage.get('favorites_series') || [];
            } else {
                allStreams = await API.getStreams('get_series', categoryId);
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
                titleEl.textContent = categoryId === 'all' ? 'جميع المسلسلات' : (categoryId === 'favorites' ? 'المفضلة' : 'تصفية حسب التصنيف');
            }

            if (allStreams.length > 0) {
                let html = '';
                allStreams.forEach(item => {
                    const id = item.series_id;
                    const name = item.name || item.title || "بدون عنوان";
                    const icon = item.cover || item.stream_icon || 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(name);

                    html += `
                        <div class="grid-item">
                            <img src="${icon}" alt="${name}" loading="lazy" class="poster" 
                                 onerror="this.onerror=null; this.outerHTML='<div class=&quot;poster fallback-poster&quot; onclick=&quot;Router.navigate(\\'#/details?type=series&id=${id}\\')&quot;><span>' + this.alt + '</span></div>';"
                                 onclick="Router.navigate('#/details?type=series&id=${id}')">
                            <h4 style="margin-top: 8px; font-size: 0.9rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${name}</h4>
                        </div>
                    `;
                });
                grid.innerHTML = html;
            } else {
                grid.innerHTML = '<p>لا توجد مسلسلات متاحة حالياً.</p>';
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML = '<p>حدث خطأ في تحميل المسلسلات.</p>';
        }
    }
};
