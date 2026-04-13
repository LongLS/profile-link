import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Cấu hình Supabase (Bạn BẮT BUỘC phải thay [YOUR_PROJECT_URL] bằng URL project của bạn, vd: https://xyz.supabase.co)
const supabaseUrl = 'https://yygbjslykejlceqhxxlo.supabase.co'; 
const supabaseKey = 'sb_publishable_6gGnoexZUHVxEwM7pW3zug_rYNPl3EH'; // Key của bạn
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Phân tích lượt truy cập tự động
async function trackPage() {
    try {
        await supabase.from('page_views').insert([{}]);
        console.log('Đã ghi nhận 1 lượt truy cập.');
    } catch (e) {
        console.error('Lỗi khi đếm view:', e);
    }
}
trackPage();

// 2. Bắt sự kiện người dùng Click vào link
document.addEventListener('DOMContentLoaded', () => {
    // Tìm tất cả các thẻ a
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            // Lấy tên link dựa theo aria-label (cho social icon) hoặc chữ bên trong card
            let linkName = link.getAttribute('aria-label');
            if (!linkName) {
                const textNode = link.querySelector('.text');
                if (textNode) linkName = textNode.textContent.trim();
            }
            if (!linkName) linkName = link.href || 'Unknown Link';
            
            // Gửi dữ liệu lầm lũi ở background, không chờ chặn người dùng mở tab
            supabase.from('link_clicks').insert([{ link_name: linkName }]).then(() => {
                console.log(`Đã ghi nhận click cho: ${linkName}`);
            }).catch(console.error);
        });
    });
});
