window.livetvView = {
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
                    <a href="#/movies" class="nav-item">أفلام</a>
                    <a href="#/series" class="nav-item">مسلسلات</a>
                    <a href="#/livetv" class="nav-item active">بث مباشر</a>
                    <a href="#/login" id="logout-btn" class="nav-item" style="color: #ff4d4d;">خروج</a>
                </div>
                <div class="user-info" style="text-align: left;">
                    <div style="font-weight: bold;">${userInfo ? userInfo.username : 'المستخدم'}</div>
                    <div style="font-size: 0.8rem;">صلاحية: ${expDate}</div>
                </div>
            </div>

            <div class="page-layout">
                <div class="sidebar" id="livetv-sidebar">
                    <div class="sidebar-item active" data-cat="all">عرض الكل</div>
                </div>
                <div class="content-area" id="livetv-content">
                    <h2 class="row-title" style="margin-bottom: 20px;">قنوات البث المباشر</h2>
                    <div id="livetv-grid" class="content-grid">
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

        await this.loadCategories();
        await this.loadLiveTV('all');
        App.hideLoader();
        SpatialNavigation.initFocus(container);
    },

    loadCategories: async function () {
        const sidebar = document.getElementById('livetv-sidebar');
        const categories = await API.getCategories('get_live_categories');

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'sidebar-item';
                item.dataset.cat = cat.category_id;
                item.textContent = cat.category_name;
                item.addEventListener('click', () => {
                    sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    this.loadLiveTV(cat.category_id);
                });
                sidebar.appendChild(item);
            });
        }

        sidebar.querySelector('[data-cat="all"]').addEventListener('click', () => {
            sidebar.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            sidebar.querySelector('[data-cat="all"]').classList.add('active');
            this.loadLiveTV('all');
        });
    },

    loadLiveTV: async function (categoryId) {
        const grid = document.getElementById('livetv-grid');
        grid.innerHTML = '<p style="color: var(--text-secondary);">جاري التحميل...</p>';

        try {
            let allStreams = [];
            if (categoryId === 'all') {
                allStreams = await API.getStreams('get_live_streams', '');
            } else {
                allStreams = await API.getStreams('get_live_streams', categoryId);
            }

            if (allStreams.length > 0) {
                let html = '';
                allStreams.forEach(item => {
                    const id = item.stream_id;
                    const name = item.name || item.title || "بدون عنوان";
                    const icon = item.stream_icon || item.cover || 'https://via.placeholder.com/300x300/e74c3c/ffffff?text=Live+TV';

                    html += `
                        <div class="grid-item">
                            <img src="${icon}" alt="${name}" loading="lazy" class="poster" style="height: 160px; object-fit: contain; background: #222;"
                                 onclick="Router.navigate('#/player?type=live&id=${id}')">
                            <h4 style="margin-top: 8px; font-size: 0.9rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${name}</h4>
                        </div>
                    `;
                });
                grid.innerHTML = html;
            } else {
                grid.innerHTML = '<p>لا توجد قنوات متاحة حالياً.</p>';
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML = '<p>حدث خطأ في تحميل القنوات.</p>';
        }
    }
};
