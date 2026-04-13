import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ==========================================
// CẤU HÌNH SUPABASE TẠI ĐÂY
// Bước 1: Hãy điền cái URL bạn được Supabase cấp vào đây:
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL_HERE'; // Ví dụ: 'https://xyzabcdef.supabase.co'

// Bước 2: Key Public mà bạn vửa gửi
const supabaseKey = 'sb_publishable_6gGnoexZUHVxEwM7pW3zug_rYNPl3EH'; 
// ==========================================

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadData() {
    // Cảnh báo nếu chưa nhập URL
    if (supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL_HERE') {
        document.getElementById('clickTableBody').innerHTML = `<tr><td colspan="2" style="text-align: center; color: red; font-weight: bold;">BẠN QUÊN CHƯA NHẬP PROJECT URL VÀO ĐẦU FILE \`dashboard.js\` VÀ \`tracker.js\` THÌ PHẢI?</td></tr>`;
        return;
    }

    try {
        // 1. Phân tích tổng Views
        const { count: viewCount, error: viewError } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true });
            
        if (viewError) throw viewError;
        document.getElementById('totalViews').innerText = viewCount || 0;

        // 2. Phân tích lượt Clicks
        const { data: clicks, error: clickError } = await supabase
            .from('link_clicks')
            .select('link_name');

        if (clickError) throw clickError;
        
        document.getElementById('totalClicks').innerText = clicks.length || 0;

        // Gom nhóm thống kê cho dễ tính (Count Group By Link)
        const clickCounts = {};
        clicks.forEach(row => {
            clickCounts[row.link_name] = (clickCounts[row.link_name] || 0) + 1;
        });

        // Sắp xếp các link có cực nhiều người quan tâm lên đầu
        const sortedLinks = Object.keys(clickCounts).sort((a, b) => clickCounts[b] - clickCounts[a]);
        
        const tbody = document.getElementById('clickTableBody');
        tbody.innerHTML = '';
        
        if (sortedLinks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: gray;">Chưa có ai click vào nút nào cả 🥲</td></tr>';
            return;
        }

        sortedLinks.forEach(linkName => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600; color: #111827;">${linkName}</td>
                <td style="text-align: right; font-weight: bold; color: #3B82F6;">${clickCounts[linkName]} lượt</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Lỗi kết nối Supabase:", err);
        document.getElementById('totalViews').innerText = 'Lỗi';
        document.getElementById('totalClicks').innerText = 'Lỗi';
        document.getElementById('clickTableBody').innerHTML = `<tr><td colspan="2" style="text-align: center; color: red;">${err.message}</td></tr>`;
    }
}

// Bắt đầu chạy ngay khi bật Dashboard
loadData();

// Tự động load dữ liệu mới liên tục mỗi 15 giây (Realtime Polling)
setInterval(loadData, 15000);
