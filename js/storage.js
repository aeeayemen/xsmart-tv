const Storage = {
    set: function (key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    },

    get: function (key) {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    },

    setStr: function (key, val) {
        localStorage.setItem(key, val);
    },

    getStr: function (key) {
        return localStorage.getItem(key);
    },

    remove: function (key) {
        localStorage.removeItem(key);
    },

    // Favorites Logic
    addFavorite: function (type, item) {
        // type: 'movies', 'series', 'livetv'
        let favs = this.get(`favorites_${type}`) || [];
        if (!favs.find(f => f.stream_id === item.stream_id || f.series_id === item.series_id)) {
            favs.push(item);
            this.set(`favorites_${type}`, favs);
        }
    },

    removeFavorite: function (type, id) {
        let favs = this.get(`favorites_${type}`) || [];
        favs = favs.filter(f => f.stream_id != id && f.series_id != id);
        this.set(`favorites_${type}`, favs);
    },

    isFavorite: function (type, id) {
        let favs = this.get(`favorites_${type}`) || [];
        return !!favs.find(f => f.stream_id == id || f.series_id == id);
    },

    // Resume playback logic
    saveResumeProgress: function (id, timeInSeconds) {
        this.set(`resume_${id}`, timeInSeconds);
    },

    getResumeProgress: function (id) {
        return this.get(`resume_${id}`) || 0;
    }
};
