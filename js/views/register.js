window.registerView = {
    render: function (container) {
        container.innerHTML = `
            <div class="login-container fade-in">
                <div class="login-box">
                    <img src="img/logo.jpg" alt="XSMART TV" class="login-logo" style="width: 150px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    <h2 style="margin-bottom: 20px;">إنشاء حساب جديد</h2>
                    <form id="register-form" class="login-form">
                        <div class="input-group">
                            <input type="text" id="reg-username" placeholder="اسم المستخدم" required tabindex="1">
                        </div>
                        <div class="input-group">
                            <input type="email" id="reg-email" placeholder="البريد الإلكتروني" required tabindex="2">
                        </div>
                        <div class="input-group">
                            <input type="password" id="reg-password" placeholder="كلمة المرور" required tabindex="3">
                        </div>
                        <button type="submit" class="btn login-btn" tabindex="4">إنشاء حساب</button>
                    </form>
                    <div style="margin-top: 20px; text-align: center; font-size: 0.9rem;">
                        <a href="#/login" style="color: #e50914; text-decoration: none; font-weight: bold;">العودة لتسجيل الدخول</a>
                    </div>
                    <p id="register-error" style="color: red; margin-top: 15px; display: none;"></p>
                </div>
            </div>
            
            <div class="legal-footer">
                نحن مجرد مشغل وسائط (Media Player) ولا نوفر أو نستضيف أي محتوى. التطبيق متاح لتشغيل روابط المشتركين الخاصة بهم فقط.
            </div>
        `;

        const form = document.getElementById('register-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    handleRegister: function () {
        const user = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value.trim();
        const errorEl = document.getElementById('register-error');

        if (!user || !email || !pass) {
            errorEl.innerText = 'يرجى ملء جميع الحقول';
            errorEl.style.display = 'block';
            return;
        }

        App.showLoader();
        errorEl.style.display = 'none';

        // Mock registration process
        setTimeout(() => {
            const host = 'http://mock_hardcoded_host';
            API.init(host, user, pass);
            API.authenticate()
                .then(res => {
                    App.hideLoader();
                    Router.navigate('#/home');
                })
                .catch(err => {
                    App.hideLoader();
                    errorEl.innerText = 'حدث خطأ أثناء إنشاء الحساب حاول مرة أخرى.';
                    errorEl.style.display = 'block';
                });
        }, 800);
    }
};
