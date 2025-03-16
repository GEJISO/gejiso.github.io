// 加载文章列表
document.addEventListener('DOMContentLoaded', () => {
    fetchBlogPosts();
});

async function fetchBlogPosts() {
    try {
        const response = await fetch('blog-data.json');
        const data = await response.json();
        renderBlogList(data.posts);
    } catch (error) {
        console.error('加载文章失败:', error);
    }
}

function renderBlogList(posts) {
    const container = document.getElementById('blog-list');
    container.innerHTML = posts.map(post => `
        <article class="blog-card">
            <h2>${post.title}</h2>
            <time>${post.date}</time>
            <p>${post.excerpt}</p>
            <a href="blog.html?id=${post.id}" class="read-more">阅读全文</a>
        </article>
    `).join('');
}

// 文章详情页逻辑（在blog.html中使用）
function loadBlogPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    fetch('blog-data.json')
        .then(response => response.json())
        .then(data => {
            const post = data.posts.find(p => p.id == postId);
            renderBlogPost(post);
        });
}

async function renderBlogPost(post) {
    document.title = post.title + " | 我的博客";
    
    // 加载Markdown内容
    const response = await fetch(post.contentFile);
    const content = await response.text();
    
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-date').textContent = post.date;
    document.getElementById('post-content').innerHTML = marked.parse(content);
    
    // 设置下载链接
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.href = post.downloadFile;
    downloadBtn.download = post.downloadFile.split('/').pop();
}