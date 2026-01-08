// js/notifications.js

async function loadNotifications() {
    const notifyBadge = document.getElementById('notification-badge');
    const notifyList = document.getElementById('notification-list');

    if (!notifyBadge || !notifyList) return;

    try {
        const res = await apiRequest('/notifications');
        if (!res.ok) throw new Error("Failed to fetch notifications");

        const notifications = await res.json();
        const unreadCount = notifications.filter(n => !n.is_read).length;

        if (unreadCount > 0) {
            notifyBadge.textContent = unreadCount;
            notifyBadge.classList.remove('d-none');
        } else {
            notifyBadge.classList.add('d-none');
        }

        if (notifications.length === 0) {
            notifyList.innerHTML = '<li class="dropdown-item text-muted text-center py-3">No notifications</li>';
            return;
        }

        notifyList.innerHTML = `
            <li class="dropdown-header d-flex justify-content-between align-items-center">
                <span>Notifications</span>
                <button class="btn btn-sm btn-link text-primary p-0 text-decoration-none" onclick="markAllAsRead(event)">Mark all as read</button>
            </li>
            <li><hr class="dropdown-divider"></li>
        `;

        notifications.slice(0, 10).forEach(n => {
            const date = new Date(n.created_at).toLocaleString();
            const li = document.createElement('li');
            li.className = `dropdown-item position-relative ${n.is_read ? 'opacity-75' : 'fw-bold'}`;
            li.innerHTML = `
                <div class="d-flex flex-column" onclick="markAsRead(${n.id}, event)">
                    <small class="text-muted" style="font-size: 0.7rem;">${date}</small>
                    <div class="text-wrap" style="max-width: 250px;">${n.message}</div>
                </div>
                <button class="btn-close position-absolute top-50 end-0 translate-middle-y me-2" style="font-size: 0.6rem;" onclick="deleteNotification(${n.id}, event)"></button>
            `;
            notifyList.appendChild(li);
        });

    } catch (err) {
        console.error("Notification Error:", err);
    }
}

async function markAsRead(id, event) {
    if (event) event.stopPropagation();
    try {
        const res = await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
        if (res.ok) loadNotifications();
    } catch (err) {
        console.error("Mark read error:", err);
    }
}

async function markAllAsRead(event) {
    if (event) event.stopPropagation();
    try {
        const res = await apiRequest('/notifications', { method: 'PATCH' });
        if (res.ok) loadNotifications();
    } catch (err) {
        console.error("Mark all read error:", err);
    }
}

async function deleteNotification(id, event) {
    if (event) event.stopPropagation();
    if (!confirm("Delete this notification?")) return;
    try {
        const res = await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
        if (res.ok) loadNotifications();
    } catch (err) {
        console.error("Delete notification error:", err);
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-primary border-0 show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-bell-fill me-2"></i> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

function initWebSocket() {
    const emp_id = localStorage.getItem("emp_id");
    const token = getToken();
    if (!emp_id || !token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/${emp_id}`);

    ws.onopen = () => {
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('ping');
            }
        }, 10000);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "notification") {
                showToast(data.message);
                loadNotifications(); // Refresh the list
                // Refresh leave requests if notification is about leave
                if (data.message.includes("leave request")) {
                    if (window.loadLeaveRequests) {
                        window.loadLeaveRequests();
                    }
                }
            }
        } catch (e) {
            console.error("WS Message Error:", e);
        }
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed, retrying in 5s...");
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
    };
}

// Initialize WebSocket if token exists
if (getToken()) {
    initWebSocket();
}

