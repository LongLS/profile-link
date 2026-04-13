import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ==========================================
// CẤU HÌNH SUPABASE TẠI ĐÂY
const supabaseUrl = 'https://yygbjslykejlceqhxxlo.supabase.co'; 
const supabaseKey = 'sb_publishable_6gGnoexZUHVxEwM7pW3zug_rYNPl3EH'; 
// ==========================================

const supabase = createClient(supabaseUrl, supabaseKey);

let currentFilter = 'all';
let chartInstance = null;

// Gắn sự kiện cho các nút filter
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-time');
        loadData();
    });
});

// Tính toán mốc thời gian bắt đầu tuỳ theo filter
function getLimitDate() {
    const now = new Date();
    if (currentFilter === 'day') {
        now.setHours(0, 0, 0, 0);
        return now.toISOString();
    }
    if (currentFilter === 'week') {
        const first = now.getDate() - now.getDay() + 1; // Thứ 2 làm đầu tuần
        now.setDate(first);
        now.setHours(0, 0, 0, 0);
        return now.toISOString();
    }
    if (currentFilter === 'month') {
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now.toISOString();
    }
    return null;
}

async function loadData() {
    if (supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL_HERE') {
        document.getElementById('clickTableBody').innerHTML = `<tr><td colspan="2" style="text-align: center; color: red; font-weight: bold;">BẠN QUÊN CHƯA NHẬP PROJECT URL?</td></tr>`;
        return;
    }

    try {
        const limitDate = getLimitDate();

        // 1. Phân tích Views (Lấy TOÀN BỘ Row để vẽ Chart)
        let viewsQuery = supabase.from('page_views').select('created_at');
        if (limitDate) viewsQuery = viewsQuery.gte('created_at', limitDate);
        
        const { data: viewsData, error: viewError } = await viewsQuery;
        if (viewError) throw viewError;
        
        document.getElementById('totalViews').innerText = viewsData.length || 0;
        updateChart(viewsData); // Cập nhật biểu đồ

        // 2. Phân tích Clicks theo thời gian
        let clicksQuery = supabase.from('link_clicks').select('link_name');
        if (limitDate) clicksQuery = clicksQuery.gte('created_at', limitDate);
        
        const { data: clicks, error: clickError } = await clicksQuery;
        if (clickError) throw clickError;
        
        document.getElementById('totalClicks').innerText = clicks.length || 0;

        // Bảng xếp hạng link
        const clickCounts = {};
        clicks.forEach(row => {
            clickCounts[row.link_name] = (clickCounts[row.link_name] || 0) + 1;
        });

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
        console.error("Lỗi:", err);
    }
}

function updateChart(data) {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    // Nếu chưa có Data nào, tạo dữ liệu ảo bằng 0
    if (data.length === 0) {
        data = [{ created_at: new Date().toISOString() }]; // Fake array just to plot zeros
    }

    // Nhóm data theo giờ (nếu là Hôm nay) hoặc theo Ngày (Tuần/Tháng/All)
    const grouped = {};
    data.forEach(row => {
        const d = new Date(row.created_at);
        let key = '';
        if (currentFilter === 'day') {
            key = d.getHours().toString().padStart(2, '0') + ':00'; // Nhóm theo Hour
        } else {
            // Nhóm theo YYYY-MM-DD để dễ sort tăng dần
            key = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
        }
        grouped[key] = (grouped[key] || 0) + (data.length === 1 && data[0].created_at === data[row]? 0 : 1);
        if (data.length === 1 && !row.id) grouped[key] = 0; // handle empty state nicely
    });

    // Lọc lại mảng key & map thành Labels mượt mà
    const sortedKeys = Object.keys(grouped).sort();
    let labels = sortedKeys;
    if (currentFilter !== 'day') {
        labels = sortedKeys.map(k => {
           const parts = k.split('-');
           return parts[2] + '/' + parts[1]; // Đổi định dạng hiển thị thành DD/MM
        });
    }

    const chartData = sortedKeys.map(k => grouped[k]);

    // Xoá biểu đồ cũ trước khi vẽ cái mới (Fix lỗi giật nháy canvas)
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Biểu đồ Line mượt mà vát cong (Tension 0.4)
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Lượt xem (Views)',
                data: chartData,
                borderColor: '#111827',
                backgroundColor: 'rgba(17, 24, 39, 0.05)',
                borderWidth: 2,
                tension: 0.4, // Tạo độ cong
                fill: true,
                pointBackgroundColor: '#111827'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { precision: 0 } // Số người không thể bị lẻ
                }
            }
        }
    });
}

// Chạy lần đầu
loadData();
