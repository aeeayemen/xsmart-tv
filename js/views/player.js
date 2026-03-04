window.playerView = {
    videoPlayer: null,
    resumeInterval: null,
    streamId: null,

    render: function (container, params) {
        if (!params || !params.type || !params.id) {
            Router.navigate('#/home');
            return;
        }

        this.streamId = params.id;
        const streamUrl = API.getStreamUrl(params.type, params.id);

        container.innerHTML = `
            <div class="player-container fade-in">
                <div class="player-back" onclick="window.history.back()">← رجوع</div>
                <video id="video-element" controls autoplay></video>
            </div>
        `;

        const video = document.getElementById('video-element');
        this.videoPlayer = video;

        // Check resume progress
        const resumeTime = Storage.getResumeProgress(this.streamId);

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                if (resumeTime > 0) {
                    video.currentTime = resumeTime;
                }
                video.play().catch(e => console.log("Auto-play prevented", e));
            });

            // Basic error handling
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("fatal network error encountered, try to recover");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("fatal media error encountered, try to recover");
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari, older iOS)
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', function () {
                if (resumeTime > 0) {
                    video.currentTime = resumeTime;
                }
                video.play();
            });
        }

        // Setup resume tracking interval
        this.resumeInterval = setInterval(() => {
            if (!video.paused && !video.ended) {
                Storage.saveResumeProgress(this.streamId, Math.floor(video.currentTime));
            }
        }, 5000); // Save every 5 seconds

        // Cleanup on hash change
        const cleanup = () => {
            clearInterval(this.resumeInterval);
            window.removeEventListener('hashchange', cleanup);
        };
        window.addEventListener('hashchange', cleanup);

        // Timeout to hide back button logic could be added here
    }
};
