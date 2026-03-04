const SpatialNavigation = {
    focusableElements: [],
    currentIndex: -1,

    init: function () {
        window.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    clearFocus: function () {
        this.focusableElements.forEach(el => el.classList.remove('focused'));
        this.focusableElements = [];
        this.currentIndex = -1;
    },

    initFocus: function (container) {
        // Find all focusable elements in the current view
        // Using common classes or attributes, e.g. .nav-item, .poster, .btn, input
        const elements = container.querySelectorAll('.nav-item, .poster, .btn, .input-group input, .player-back');
        if (elements.length === 0) return;

        this.focusableElements = Array.from(elements);

        // Find if any is already focused (from prior state)
        let firstFocus = this.focusableElements.findIndex(el => el.classList.contains('focused'));

        if (firstFocus === -1) {
            // Wait for user interaction before applying focus ring
            this.currentIndex = -1;
        } else {
            this.currentIndex = firstFocus;
        }
    },

    setFocus: function (index) {
        if (this.currentIndex >= 0 && this.focusableElements[this.currentIndex]) {
            this.focusableElements[this.currentIndex].classList.remove('focused');
            if (this.focusableElements[this.currentIndex].tagName === 'INPUT') {
                this.focusableElements[this.currentIndex].blur();
            }
        }

        this.currentIndex = index;
        const target = this.focusableElements[this.currentIndex];
        if (target) {
            target.classList.add('focused');
            if (target.tagName === 'INPUT') {
                target.focus();
            }

            // Scroll into view if it's offscreen
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    },

    handleKeydown: function (e) {
        // Avoid handling keys if a typing input is actively focused, except ArrowNav
        const activeElement = document.activeElement;
        const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

        // Right, Left, Down, Up, Enter
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                this.move('right');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.move('left');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.move('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.move('up');
                break;
            case 'Enter':
                if (this.currentIndex >= 0 && this.focusableElements[this.currentIndex]) {
                    this.focusableElements[this.currentIndex].click();
                }
                break;
            case 'Backspace':
            case 'Escape':
                // App-wide back logic, if not in input
                if (!isInput) {
                    window.history.back();
                }
                break;
        }
    },

    move: function (direction) {
        if (this.focusableElements.length === 0) return;

        const currentEl = this.focusableElements[this.currentIndex];
        if (!currentEl) {
            this.setFocus(0);
            return;
        }

        const rect = currentEl.getBoundingClientRect();
        let closest = null;
        let minDistance = Infinity;
        let targetIndex = -1;

        for (let i = 0; i < this.focusableElements.length; i++) {
            if (i === this.currentIndex) continue;

            const tEl = this.focusableElements[i];
            const tRect = tEl.getBoundingClientRect();

            // Check direction validity
            let isDirMatch = false;
            let distance = Infinity;

            if (direction === 'right' && tRect.left >= rect.right) {
                isDirMatch = true;
                distance = Math.sqrt(Math.pow(tRect.left - rect.right, 2) + Math.pow(tRect.top - rect.top, 2));
            } else if (direction === 'left' && tRect.right <= rect.left) {
                isDirMatch = true;
                distance = Math.sqrt(Math.pow(rect.left - tRect.right, 2) + Math.pow(rect.top - tRect.top, 2));
            } else if (direction === 'down' && tRect.top >= rect.bottom) {
                isDirMatch = true;
                distance = Math.sqrt(Math.pow(tRect.top - rect.bottom, 2) + Math.pow(tRect.left - rect.left, 2));
            } else if (direction === 'up' && tRect.bottom <= rect.top) {
                isDirMatch = true;
                distance = Math.sqrt(Math.pow(rect.top - tRect.bottom, 2) + Math.pow(rect.left - tRect.left, 2));
            }

            // Weight alignment slightly more favorable
            if (isDirMatch) {
                if (direction === 'left' || direction === 'right') {
                    // Favour elements that are on the same vertical align
                    if (tRect.top < rect.bottom && tRect.bottom > rect.top) {
                        distance *= 0.1;
                    }
                } else {
                    // Favour elements that are on the same horizontal align
                    if (tRect.left < rect.right && tRect.right > rect.left) {
                        distance *= 0.1;
                    }
                }

                if (distance < minDistance) {
                    minDistance = distance;
                    targetIndex = i;
                }
            }
        }

        if (targetIndex !== -1) {
            this.setFocus(targetIndex);
        }
    }
};
