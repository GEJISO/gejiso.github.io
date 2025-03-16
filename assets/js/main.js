// 路径配置
const REPO_NAME = window.location.pathname.split('/')[1] || '';
const BASE_URL = REPO_NAME ? `/${REPO_NAME}` : '';

// 核心功能
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('blog.html')) return;
    fetchBlogPosts();
});

async function fetchBlogPosts() {
    try {
        const response = await fetch(`${BASE_URL}/blog-data.json`);
        if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
        renderBlogList(await response.json());
    } catch (error) {
        console.error('加载失败:', error);
        document.getElementById('blog-list').innerHTML = 
            `<p class="error">文章加载失败，请刷新重试</p>`;
    }
}

function renderBlogList(data) {
    const container = document.getElementById('blog-list');
    container.innerHTML = data.posts.map(post => `
        <article class="blog-card" data-id="${post.id}">
            <h2>${post.title}</h2>
            <time>${new Date(post.date).toLocaleDateString()}</time>
            <p>${post.excerpt}</p>
            <a href="${BASE_URL}/blog.html?id=${post.id}" class="read-more">阅读全文 →</a>
        </article>
    `).join('');
}

// 文章页逻辑
async function loadBlogPost() {
    try {
        const postId = new URLSearchParams(window.location.search).get('id');
        if (!postId) throw new Error('缺少文章ID');

        const response = await fetch(`${BASE_URL}/blog-data.json`);
        const data = await response.json();
        const post = data.posts.find(p => p.id == postId);
        
        if (!post) throw new Error('文章不存在');
        await renderBlogPost(post);
    } catch (error) {
        console.error('加载失败:', error);
        document.getElementById('post-content').innerHTML = 
            `<p class="error">${error.message}</p>`;
    }
}

async function renderBlogPost(post) {
    // 加载元数据
    document.title = `${post.title} | 技术博客`;
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-date').textContent = 
        new Date(post.date).toLocaleDateString();

    // 加载Markdown内容
    try {
        const mdResponse = await fetch(`${BASE_URL}/${post.contentFile}`);
        const content = await mdResponse.text();
        document.getElementById('post-content').innerHTML = marked.parse(content);
    } catch (error) {
        console.error('Markdown加载失败:', error);
        document.getElementById('post-content').innerHTML = 
            `<p class="error">内容加载失败</p>`;
    }

    // 配置下载按钮
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.href = `${BASE_URL}/${post.downloadFile}`;
    downloadBtn.download = post.downloadFile.split('/').pop();
}