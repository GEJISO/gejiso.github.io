const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(__dirname, '../downloads');
const outputFile = path.join(__dirname, '../downloads-data.json');

function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function generateFileList() {
    const files = fs.readdirSync(downloadsDir)
        .filter(file => !file.startsWith('.')) // 隐藏文件
        .map(file => {
            const stats = fs.statSync(path.join(downloadsDir, file));
            return {
                name: file,
                type: path.extname(file).toUpperCase().replace('.', '') || '文件',
                size: formatSize(stats.size),
                lastModified: new Date(stats.mtime).toLocaleDateString(),
                version: `1.${stats.mtime.getTime().toString().slice(-4)}`
            };
        });

    fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
    console.log(`已生成 ${files.length} 个文件列表`);
}

generateFileList();