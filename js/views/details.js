window.detailsView = {
    render: async function (container, params) {
        if (!params || !params.type || !params.id) {
            Router.navigate('#/home');
            return;
        }

        App.showLoader();

        try {
            let data = null;
            if (params.type === 'movie' || params.type === 'livetv') {
                data = await API.getVodInfo(params.id);
            } else if (params.type === 'series') {
                data = await API.getSeriesInfo(params.id);
            }

            if (!data || (!data.info && !data.movie_data && !data.episodes)) {
                container.innerHTML = '<div style="padding: 100px; text-align:center;">تعذر العثور على التفاصيل.</div>';
                App.hideLoader();
                return;
            }

            const info = data.info || data;
            const title = info.name || info.title || "بدون عنوان";
            const desc = info.description || info.plot || "لا يوجد وصف متاح لهذا العمل.";
            const cover = info.backdrop_path && info.backdrop_path[0] ? info.backdrop_path[0] : (info.cover_big || info.movie_image || info.cover || "https://via.placeholder.com/1280x720");
            const rating = info.rating || info.rating_5o || "N/A";
            const isFav = Storage.isFavorite(params.type, params.id);
            const favText = isFav ? "إزالة من المفضلة" : "إضافة للمفضلة";

            // Add to history (Recently Watched)
            Storage.addToHistory(params.type, {
                stream_id: params.id,
                series_id: params.id,
                name: title,
                cover: info.cover_big || info.movie_image || info.cover,
                stream_icon: info.stream_icon || info.cover || info.movie_image
            });

            container.innerHTML = `
                <div class="details-container" style="background-image: url('${cover}');">
                    <div class="details-overlay">
                        <div class="details-content fade-in">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                <div>
                                    <h1 class="details-title">${title}</h1>
                                    <div class="details-meta">
                                        <span>⭐ ${rating}</span>
                                        <span>📅 ${info.year || info.release_date || ''}</span>
                                        <span>🎬 ${params.type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                                    </div>
                                    <p class="details-desc">${desc}</p>
                                </div>
                                <img src="${info.cover || info.stream_icon || info.movie_image}" style="width: 200px; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.8);" class="hide-mobile">
                            </div>
                            
                            <div class="details-actions">
                                ${params.type !== 'series' ? `
                                    <button class="btn" id="play-btn">▶ تشغيل الآن</button>
                                ` : ''}
                                <button class="btn btn-secondary" id="fav-btn">
                                    <span id="fav-icon">${isFav ? '♥' : '♡'}</span> <span id="fav-text">${favText}</span>
                                </button>
                                <button class="btn btn-secondary" onclick="window.history.back()">رجوع</button>
                            </div>

                            ${params.type === 'series' && data.episodes ? `
                                <div class="episodes-section">
                                    <h3 style="margin-bottom: 15px;">قائمة الحلقات</h3>
                                    <div class="seasons-tabs" id="seasons-tabs">
                                        <!-- Seasons injected here -->
                                    </div>
                                    <div class="episodes-list" id="episodes-list">
                                        <!-- Episodes injected here -->
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            if (params.type === 'series' && data.episodes) {
                this.setupEpisodes(data.episodes, params.id);
            } else if (document.getElementById('play-btn')) {
                document.getElementById('play-btn').addEventListener('click', () => {
                    Router.navigate(`#/player?type=${params.type}&id=${params.id}`);
                });
            }

            document.getElementById('fav-btn').addEventListener('click', () => {
                const item = {
                    stream_id: params.id,
                    series_id: params.id,
                    name: title,
                    stream_icon: info.cover || info.stream_icon || info.movie_image,
                    cover: info.cover || info.stream_icon || info.movie_image || info.backdrop_path?.[0]
                };

                if (Storage.isFavorite(params.type, params.id)) {
                    Storage.removeFavorite(params.type, params.id);
                    document.getElementById('fav-icon').innerText = '♡';
                    document.getElementById('fav-text').innerText = 'إضافة للمفضلة';
                } else {
                    Storage.addFavorite(params.type, item);
                    document.getElementById('fav-icon').innerText = '♥';
                    document.getElementById('fav-text').innerText = 'إزالة من المفضلة';
                }
            });

        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="padding: 100px; text-align:center;">خطأ في تحميل التفاصيل.</div>';
        }

        App.hideLoader();
        SpatialNavigation.initFocus(container);
    },

    setupEpisodes: function (seasonsData, seriesId) {
        const tabsContainer = document.getElementById('seasons-tabs');
        const episodesContainer = document.getElementById('episodes-list');
        const seasons = Object.keys(seasonsData);

        seasons.forEach((seasonNum, index) => {
            const tab = document.createElement('div');
            tab.className = `season-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = `الموسم ${seasonNum}`;
            tab.addEventListener('click', () => {
                document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderEpisodes(seasonsData[seasonNum], seriesId, episodesContainer);
            });
            tabsContainer.appendChild(tab);
        });

        // Render first season by default
        if (seasons.length > 0) {
            this.renderEpisodes(seasonsData[seasons[0]], seriesId, episodesContainer);
        }
    },

    renderEpisodes: function (episodes, seriesId, container) {
        container.innerHTML = '';
        episodes.forEach((ep, index) => {
            const epDiv = document.createElement('div');
            epDiv.className = 'episode-item';
            epDiv.innerHTML = `
                <div class="ep-number">${index + 1}</div>
                <div class="ep-info">
                    <div class="ep-title">${ep.title || `حلقة ${index + 1}`}</div>
                    <div class="ep-duration">${ep.info && ep.info.duration ? ep.info.duration : ''}</div>
                </div>
                <div class="ep-play">▶</div>
            `;
            epDiv.addEventListener('click', () => {
                Router.navigate(`#/player?type=series&id=${seriesId}&episode_id=${ep.id}`);
            });
            container.appendChild(epDiv);
        });

        // Refresh spatial navigation to pick up new items
        SpatialNavigation.initFocus(document.getElementById('app'));
    }
};
