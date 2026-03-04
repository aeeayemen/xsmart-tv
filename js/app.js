const App = {
    init: function () {
        // Show initial loader
        this.showLoader();

        // Check authentication
        const credentials = Storage.getStr('xtream_credentials');
        if (credentials) {
            // Already logged in, initialize API with saved credentials
            const creds = JSON.parse(credentials);
            API.init('http://mock', creds.username, creds.password);

            // Re-authenticate silently to verify subscription is still active
            API.authenticate()
                .then(res => {
                    App.start(window.location.hash || '#/home');
                })
                .catch(err => {
                    console.error("Auth failed on init:", err);
                    Storage.remove('xtream_credentials');
                    App.start('#/login');
                });
        } else {
            App.start('#/login');
        }
    },

    start: function (initialRoute) {
        this.hideLoader();
        Router.init();
        if (window.location.hash !== initialRoute) {
            Router.navigate(initialRoute);
        } else {
            Router.handleRoute(); // Force render of current hash
        }

        SpatialNavigation.init();
    },

    showLoader: function () {
        const appDiv = document.getElementById('app');
        if (!document.getElementById('main-loader')) {
            appDiv.innerHTML += `
                <div id="main-loader" class="loader-wrapper">
                    <div class="loader"></div>
                </div>
            `;
        }
    },

    hideLoader: function () {
        const loader = document.getElementById('main-loader');
        if (loader) {
            loader.remove();
        }
    },

    showNotification: function (msg) {
        // Will implement a small toast notification system here if needed
        alert(msg);
    }
};

window.onload = () => {
    App.init();
};
