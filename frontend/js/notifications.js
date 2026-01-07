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

// Polling for notifications every 30 seconds
if (getToken()) {
    setInterval(loadNotifications, 30000);
}
