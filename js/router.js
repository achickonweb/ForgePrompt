// Hash-based SPA Router
const routes = {
    '/': 'home',
    '/prompts': 'prompts',
    '/requests': 'requests',
    '/tools': 'dev-tools',
    '/login': 'login',
    '/register': 'register',
    '/prompt-editor': 'prompt-editor',
    '/prompt-detail': 'prompt-detail',
    '/request-detail': 'request-detail',
    '/request-editor': 'request-editor',
    '/profile': 'profile',
    '/admin': 'admin',
    '/tools/json': 'tool-json',
    '/tools/base64': 'tool-base64',
    '/tools/password': 'tool-password',
    '/tools/uuid': 'tool-uuid',
    '/tools/text': 'tool-text',
    '/tools/url': 'tool-url',
    '/tools/hash': 'tool-hash',
    '/tools/jwt': 'tool-jwt',
    '/tools/lorem': 'tool-lorem',
    '/tools/color': 'tool-color',
    '/tools/unix': 'tool-unix',
    '/tools/base': 'tool-base',
    '/tools/html': 'tool-html',
    '/tools/case': 'tool-case',
    '/tools/uri': 'tool-uri',
    '/tools/keycode': 'tool-keycode',
    '/tools/shadow': 'tool-shadow',
    '/tools/gradient': 'tool-gradient',
    '/tools/regex': 'tool-regex',
    '/tools/bcrypt': 'tool-bcrypt'
};

export class Router {
    constructor() {
        this.appRoot = document.getElementById('app-root');
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Intercept global link clicks
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/') && !href.startsWith('//')) {
                    e.preventDefault();
                    this.navigate(href);
                }
            }
        });
        
        // Initial route
        this.handleRoute();
    }

    navigate(url) {
        window.location.hash = '#' + url;
    }

    async handleRoute() {
        let path = window.location.hash.slice(1) || '/';
        
        // Remove trailing slash if it exists
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        const basePath = path.split('?')[0];
        const pageName = this.matchRoute(basePath);
        
        try {
            // Dynamic import of the page module
            const module = await import(`./pages/${pageName}.js`);
            const html = await module.render();
            this.appRoot.innerHTML = html;
            
            if (module.init) {
                module.init();
            }
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Routing error:', error);
            this.appRoot.innerHTML = `<div class="empty-state">
                <div class="empty-icon">404</div>
                <h3>Page Not Found</h3>
                <p>The page you are looking for does not exist.</p>
                <a href="/" class="btn-primary">Return Home</a>
            </div>`;
        }
    }

    matchRoute(path) {
        // Simple exact match for MVP
        if (routes[path]) {
            return routes[path];
        }
        
        // Simple dynamic routing (e.g., /prompts/123)
        if (path.startsWith('/prompts/')) return 'prompt-detail';
        if (path.startsWith('/requests/')) return 'request-detail';
        if (path.startsWith('/profile/')) return 'profile';
        
        return 'home'; // default
    }
}
