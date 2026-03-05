window.livetvView = {
    hls: null,

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
                <img src="img/logo.png" alt="XSMART TV" class="nav-logo">
                <div class="nav-links">
                    <a href="#/home" class="nav-item">الرئيسية</a>
                    <a href="#/movies" class="nav-item">أفلام</a>
                    <a href="#/series" class="nav-item">مسلسلات</a>
                    <a href="#/livetv" class="nav-item active">بث مباشر</a>
                    <a href="#/login" id="logout-btn" class="nav-item nav-logout" style="color: #ff4d4d;">تسجيل الخروج</a>
                </div>
                <div class="user-info" style="text-align: left;">
                    <div style="font-weight: bold;">${userInfo ? userInfo.username : 'المستخدم'}</div>
                    <div style="font-size: 0.8rem;">صلاحية: ${expDate}</div>
                </div>
            </div>

            <div class="livetv-layout">
                <div class="livetv-sidebar-v2" id="livetv-sidebar">
                    <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <input type="text" id="live-search-input" placeholder="بحث عن قناة..." 
                               style="width: 100%; padding: 10px; border-radius: 6px; border: none; background: rgba(255,255,255,0.05); color: white; outline: none; border: 1px solid rgba(255,255,255,0.1);">
                    </div>
                    <div class="cat-accordion-item">
                        <div class="cat-header active" data-cat="all">📺 عرض الكل</div>
                        <div class="cat-channels-list open" id="list-all"></div>
                    </div>
                    <div class="cat-accordion-item">
                        <div class="cat-header" data-cat="favorites">❤️ المفضلة</div>
                        <div class="cat-channels-list" id="list-favorites"></div>
                    </div>
                </div>
                <div class="livetv-main-player">
                    <div class="inline-player-wrapper">
                        <video id="inline-video" controls autoplay></video>
                    </div>
                    <div class="channel-info-overlay">
                        <h2 id="current-channel-name">جاري التحميل...</h2>
                        <button class="btn btn-secondary" id="inline-fav-btn" style="margin-top: 10px;">إضافة للمفضلة</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            Storage.remove('xtream_credentials');
            Storage.remove('user_info');
            Router.navigate('#/login');
        });

        await this.loadCategories();

        // Setup Search Logic
        const searchInput = document.getElementById('live-search-input');
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            const allList = document.getElementById('list-all');
            const allHeader = document.querySelector('[data-cat="all"]');

            // Switch to 'Show All' to show search results
            document.querySelectorAll('.cat-channels-list').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.cat-header').forEach(el => el.classList.remove('active'));
            allList.classList.add('open');
            allHeader.classList.add('active');

            if (query === '') {
                this.renderChannels('all', allList);
            } else {
                this.renderFilteredChannels(query, allList);
            }
        });

        App.hideLoader();
        SpatialNavigation.initFocus(container);
    },

    renderFilteredChannels: async function (query, container) {
        let channels = await API.getStreams('get_live_streams', '');
        const filtered = channels.filter(ch => ch.name.toLowerCase().includes(query));

        if (filtered.length > 0) {
            container.innerHTML = '';
            filtered.forEach(ch => {
                const chDiv = document.createElement('div');
                chDiv.className = 'channel-item-v2';
                chDiv.textContent = ch.name;
                chDiv.addEventListener('click', () => {
                    this.playChannel(ch);
                    document.querySelectorAll('.channel-item-v2').forEach(el => el.classList.remove('active'));
                    chDiv.classList.add('active');
                });
                container.appendChild(chDiv);
            });
        } else {
            container.innerHTML = '<div style="padding: 10px; color: #666;">لم يتم العثور على نتائج.</div>';
        }
    },

    loadCategories: async function () {
        const sidebar = document.getElementById('livetv-sidebar');
        const categories = await API.getCategories('get_live_categories');

        // Setup Favorites Toggle
        const favHeader = document.querySelector('[data-cat="favorites"]');
        const favList = document.getElementById('list-favorites');
        favHeader.addEventListener('click', async () => {
            const isOpen = favList.classList.contains('open');
            document.querySelectorAll('.cat-channels-list').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.cat-header').forEach(el => el.classList.remove('active'));
            if (!isOpen) {
                favList.classList.add('open');
                favHeader.classList.add('active');
                if (favList.innerHTML === '') this.renderChannels('favorites', favList);
            }
        });

        // Setup Show All Toggle
        const allHeader = document.querySelector('[data-cat="all"]');
        const allList = document.getElementById('list-all');
        allHeader.addEventListener('click', async () => {
            const isOpen = allList.classList.contains('open');
            document.querySelectorAll('.cat-channels-list').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.cat-header').forEach(el => el.classList.remove('active'));
            if (!isOpen) {
                allList.classList.add('open');
                allHeader.classList.add('active');
                if (allList.innerHTML === '') {
                    allList.innerHTML = '<div style="padding: 10px; color: #666;">جاري التحميل...</div>';
                    await this.renderChannels('all', allList);
                }
            }
        });

        // Load Show All by default first (since it's open now)
        this.renderChannels('all', allList);
        // Also initially load favorites in background or when clicked
        // this.renderChannels('favorites', favList);

        if (categories && categories.length > 0) {
            for (const cat of categories) {
                const item = document.createElement('div');
                item.className = 'cat-accordion-item';
                item.innerHTML = `
                    <div class="cat-header" data-cat="${cat.category_id}">${cat.category_name}</div>
                    <div class="cat-channels-list" id="list-${cat.category_id}"></div>
                `;
                sidebar.appendChild(item);

                const header = item.querySelector('.cat-header');
                const list = item.querySelector('.cat-channels-list');

                header.addEventListener('click', async () => {
                    const isOpen = list.classList.contains('open');
                    // Close others
                    document.querySelectorAll('.cat-channels-list').forEach(el => el.classList.remove('open'));
                    document.querySelectorAll('.cat-header').forEach(el => el.classList.remove('active'));

                    if (!isOpen) {
                        list.classList.add('open');
                        header.classList.add('active');
                        if (list.innerHTML === '') {
                            list.innerHTML = '<div style="padding: 10px; color: #666;">جاري التحميل...</div>';
                            await this.renderChannels(cat.category_id, list);
                        }
                    }
                });
            }
        }

        // Auto-play first available channel
        this.playFirstAvailable();
    },

    renderChannels: async function (categoryId, container) {
        let channels = [];
        if (categoryId === 'favorites') {
            channels = Storage.get('favorites_livetv') || [];
        } else if (categoryId === 'all') {
            channels = await API.getStreams('get_live_streams', '');
        } else {
            channels = await API.getStreams('get_live_streams', categoryId);
        }

        if (channels.length > 0) {
            container.innerHTML = '';
            channels.forEach(ch => {
                const chDiv = document.createElement('div');
                chDiv.className = 'channel-item-v2';
                chDiv.textContent = ch.name;
                chDiv.addEventListener('click', () => {
                    this.playChannel(ch);
                    document.querySelectorAll('.channel-item-v2').forEach(el => el.classList.remove('active'));
                    chDiv.classList.add('active');
                });
                container.appendChild(chDiv);
            });
        } else {
            container.innerHTML = `<div style="padding: 10px; color: #666;">${categoryId === 'favorites' ? 'لا يوجد مفضلات' : 'لا توجد قنوات'}</div>`;
        }
    },

    playChannel: function (channel) {
        const video = document.getElementById('inline-video');
        const nameEl = document.getElementById('current-channel-name');
        const favBtn = document.getElementById('inline-fav-btn');

        if (!video) return;

        nameEl.textContent = channel.name;
        const streamUrl = API.getStreamUrl('live', channel.stream_id);

        if (this.hls) {
            this.hls.destroy();
        }

        if (Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.play();
        }

        // Update fav button status
        const updateFavBtn = () => {
            const isFav = Storage.isFavorite('live', channel.stream_id);
            favBtn.textContent = isFav ? '❤️ إزالة من المفضلة' : '🤍 إضافة للمفضلة';
        };
        updateFavBtn();

        // Fav button logic
        favBtn.onclick = () => {
            if (Storage.isFavorite('live', channel.stream_id)) {
                Storage.removeFavorite('live', channel.stream_id);
            } else {
                Storage.addFavorite('live', {
                    stream_id: channel.stream_id,
                    name: channel.name,
                    stream_icon: channel.stream_icon || ""
                });
            }
            updateFavBtn();
            this.renderChannels('favorites', document.getElementById('list-favorites'));
        };
    },

    playFirstAvailable: async function () {
        // Try Show All first as it's the first dropdown and open by default
        const allList = document.getElementById('list-all');
        const allChannels = await API.getStreams('get_live_streams', '');

        if (allChannels && allChannels.length > 0) {
            this.playChannel(allChannels[0]);
            // Highlight it in the list after it renders
            setTimeout(() => {
                const firstItem = allList.querySelector('.channel-item-v2');
                if (firstItem) firstItem.classList.add('active');
            }, 600);
            return;
        }

        // Fallback to favorites
        let favChannels = Storage.get('favorites_livetv') || [];
        if (favChannels.length > 0) {
            this.playChannel(favChannels[0]);
            return;
        }
    }
};

