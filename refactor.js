const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./js', (filePath) => {
    if (!filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Replace href="#/ with href="/
    if (content.includes('href="#/')) {
        content = content.replace(/href="#\//g, 'href="/');
        changed = true;
    }

    // 2. Replace window.location.hash assignment with window.app.router.navigate
    // Match window.location.hash = '#/...'
    if (content.match(/window\.location\.hash\s*=\s*'#\//)) {
        content = content.replace(/window\.location\.hash\s*=\s*'#\/([^']*)'/g, "window.app.router.navigate('/$1')");
        changed = true;
    }
    // Match window.location.hash = `#/`
    if (content.match(/window\.location\.hash\s*=\s*`#\//)) {
        content = content.replace(/window\.location\.hash\s*=\s*`#\/([^`]*)`/g, "window.app.router.navigate(`/$1`)");
        changed = true;
    }

    // 3. Replace onclick="window.location.hash='#/...'"
    if (content.match(/onclick="window\.location\.hash='#\//)) {
        content = content.replace(/onclick="window\.location\.hash='#\/([^']*)'"/g, `onclick="window.app.router.navigate('/$1')"`);
        changed = true;
    }

    // 4. Replace reading hash for query params with window.location.search
    // e.g. const hash = window.location.hash;
    // const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    if (content.includes('const hash = window.location.hash;')) {
        content = content.replace(
            /const hash = window\.location\.hash;\s*const urlParams = new URLSearchParams\(hash\.includes\('\?'\) \? hash\.split\('\?'\)\[1\] : ''\);/g,
            "const urlParams = new URLSearchParams(window.location.search);"
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
});
