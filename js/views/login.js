window.loginView = {
    render: function (container) {
        container.innerHTML = `
            <div class="login-container fade-in">
                <div class="login-box">
                    <img src="img/logo.jpg" alt="XSMART TV" class="login-logo" style="width: 150px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    <h2 style="margin-bottom: 20px;">تسجيل الدخول</h2>
                    <form id="login-form" class="login-form">
                        <div class="input-group">
                            <input type="text" id="username" placeholder="اسم المستخدم (Username)" required tabindex="1">
                        </div>
                        <div class="input-group">
                            <input type="password" id="password" placeholder="كلمة المرور (Password)" required tabindex="2">
                        </div>
                        <button type="submit" class="btn login-btn" tabindex="3">تسجيل الدخول</button>
                    </form>
                    <div style="margin-top: 20px; text-align: center; font-size: 0.9rem;">
                        <a href="#/register" style="color: #e50914; text-decoration: none; font-weight: bold;">أو إنشاء حساب جديد</a>
                    </div>
                    <p id="login-error" style="color: red; margin-top: 15px; display: none;"></p>
                </div>
            </div>
            
            <div class="legal-footer">
                نحن مجرد مشغل وسائط (Media Player) ولا نوفر أو نستضيف أي محتوى. التطبيق متاح لتشغيل روابط المشتركين الخاصة بهم فقط.
            </div>
        `;

        const form = document.getElementById('login-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    handleLogin: function () {
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value.trim();
        const errorEl = document.getElementById('login-error');

        if (!user || !pass) {
            errorEl.innerText = 'يرجى ملء جميع الحقول';
            errorEl.style.display = 'block';
            return;
        }

        App.showLoader();
        errorEl.style.display = 'none';

        // Hardcode the host for now since the user doesn't need to enter it
        const host = 'http://mock_hardcoded_host';

        API.init(host, user, pass);
        API.authenticate()
            .then(res => {
                App.hideLoader();
                Router.navigate('#/home');
            })
            .catch(err => {
                App.hideLoader();
                errorEl.innerText = 'فشل تسجيل الدخول. تأكد من صحة البيانات أو صلاحية الاشتراك.';
                errorEl.style.display = 'block';
            });
    }
};
