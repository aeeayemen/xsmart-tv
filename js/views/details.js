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
                data = await API.getVodInfo(params.id); // For Live TV it might be a different endpoint but let's assume get_vod_info works for VOD for now.
            } else if (params.type === 'series') {
                data = await API.getSeriesInfo(params.id);
            }

            if (!data || (!data.info && !data.movie_data)) {
                container.innerHTML = '<div style="padding: 100px; text-align:center;">تعذر العثور على التفاصيل.</div>';
                App.hideLoader();
                return;
            }

            const info = data.info || data;
            const title = info.name || info.title || "بدون عنوان";
            const desc = info.description || info.plot || "لا يوجد وصف متاح لهذا العمل.";
            const cover = info.cover_big || info.movie_image || info.cover || "https://via.placeholder.com/1280x720";
            const rating = info.rating || "N/A";
            const isFav = Storage.isFavorite(params.type, params.id);
            const favText = isFav ? "إزالة من المفضلة" : "إضافة للمفضلة";

            container.innerHTML = `
                <div class="details-container" style="background-image: url('${cover}');">
                    <div class="details-overlay">
                        <div class="details-content fade-in">
                            <h1 class="details-title">${title}</h1>
                            <div class="details-meta">
                                <span>التقييم: ${rating}</span>
                                <span>${params.type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                            </div>
                            <p class="details-desc">${desc}</p>
                            
                            <div class="details-actions">
                                <button class="btn" id="play-btn">
                                    ▶ تشغيل
                                </button>
                                <button class="btn btn-secondary" id="fav-btn">
                                    <span id="fav-icon">${isFav ? '♥' : '♡'}</span> <span id="fav-text">${favText}</span>
                                </button>
                                <button class="btn btn-secondary" onclick="window.history.back()">
                                    رجوع
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Setup buttons
            document.getElementById('play-btn').addEventListener('click', () => {
                // If it's a series, we need to show episodes. For now, let's just assume movie/live or first episode.
                // In a full app, we would render seasons/episodes here.
                Router.navigate(`#/player?type=${params.type}&id=${params.id}`);
            });

            document.getElementById('fav-btn').addEventListener('click', () => {
                const item = {
                    stream_id: params.id,
                    series_id: params.id,
                    name: title,
                    stream_icon: cover
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
    }
};
