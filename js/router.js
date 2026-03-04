const Router = {
    routes: {
        '#/login': 'login',
        '#/register': 'register',
        '#/home': 'home',
        '#/movies': 'movies',
        '#/series': 'series',
        '#/livetv': 'livetv',
        '#/details': 'details',
        '#/player': 'player'
    },

    init: function () {
        window.addEventListener('hashchange', () => this.handleRoute());
    },

    navigate: function (hash) {
        window.location.hash = hash;
    },

    getParams: function () {
        const hashParams = window.location.hash.split('?')[1];
        if (!hashParams) return {};

        return hashParams.split('&').reduce((acc, current) => {
            const [key, value] = current.split('=');
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});
    },

    handleRoute: function () {
        let hash = window.location.hash || '#/home';
        // Remove query params from hash for routing
        let baseHash = hash.split('?')[0];

        const viewName = this.routes[baseHash];
        const appDiv = document.getElementById('app');

        // Reset focus state
        SpatialNavigation.clearFocus();

        if (viewName && window[viewName + 'View']) {
            appDiv.innerHTML = '';
            // Pass query params to render method
            const params = this.getParams();
            window[viewName + 'View'].render(appDiv, params);

            // Re-bind spatial nav focus after render
            setTimeout(() => {
                SpatialNavigation.initFocus(appDiv);
            }, 100);
        } else {
            // Default to login or home
            const credentials = Storage.getStr('xtream_credentials');
            this.navigate(credentials ? '#/home' : '#/login');
        }
    }
};
