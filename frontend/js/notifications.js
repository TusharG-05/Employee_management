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
            
            // Check if this is a leave notification
            const isLeaveNotification = n.message.includes('leave request');
            const notificationClass = isLeaveNotification && !n.is_read ? 'bg-warning bg-opacity-10' : '';
            
            li.innerHTML = `
                <div class="d-flex flex-column ${notificationClass} p-2 rounded" onclick="markAsRead(${n.id}, event)">
                    <small class="text-muted" style="font-size: 0.7rem;">${date}</small>
                    <div class="text-wrap" style="max-width: 250px;">
                        ${isLeaveNotification ? '<i class="bi bi-exclamation-circle text-warning me-1"></i>' : ''}
                        ${n.message}
                    </div>
                </div>
                <button class="btn-close position-absolute top-50 end-0 translate-middle-y me-2" 
                        style="font-size: 0.6rem;" 
                        onclick="deleteNotification(${n.id}, event)"></button>
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

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const bgClass = type === 'success' ? 'bg-success' : (type === 'error' ? 'bg-danger' : 'bg-primary');
    const icon = type === 'success' ? 'check-circle-fill' : (type === 'error' ? 'exclamation-triangle-fill' : 'bell-fill');

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${bgClass} border-0 show`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-${icon} me-2"></i> ${message}
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

let wsConnection = null;
let pingInterval = null;

function initWebSocket() {
    const emp_id = localStorage.getItem("emp_id");
    const token = getToken();
    if (!emp_id || !token) {
        console.log("WebSocket: Missing emp_id or token");
        return;
    }

    // Close existing connection if any
    if (wsConnection) {
        wsConnection.close();
    }
    if (pingInterval) {
        clearInterval(pingInterval);
    }

    try {
        wsConnection = new WebSocket(`${WS_BASE}/ws/notify/${emp_id}`);

        wsConnection.onopen = () => {
            console.log("WebSocket connected for employee:", emp_id);
            // Send ping every 30 seconds to keep connection alive
            pingInterval = setInterval(() => {
                if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                    wsConnection.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000);
        };

        wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Ignore pong messages
                if (data.type === "pong") {
                    return;
                }
                
                if (data.type === "notification") {
                    console.log("Notification received:", data);
                    
                    // Refresh notifications list
                    loadNotifications();
                    
                    // Handle specific notification actions
                    if (data.action === "new_leave_application") {
                        // Admin received new leave application
                        if (window.loadPendingLeaveCount) {
                            window.loadPendingLeaveCount();
                        }
                        // If leave modal is open, refresh it
                        const leaveModal = document.getElementById('leaveModal');
                        if (leaveModal && leaveModal.classList.contains('show')) {
                            if (window.loadLeaveRequests) {
                                window.loadLeaveRequests();
                            }
                        }
                    } else if (data.action === "leave_decision") {
                        // Employee received leave decision - refresh leave list immediately
                        console.log("Leave decision received, refreshing leave list...", data);
                        
                        // Determine toast type based on decision (use decision field if available, otherwise parse message)
                        const decisionType = data.decision === 'ACCEPTED' ? 'success' : 
                                           data.decision === 'REJECTED' ? 'error' :
                                           data.message.toLowerCase().includes('accepted') ? 'success' : 
                                           data.message.toLowerCase().includes('rejected') ? 'error' : 'info';
                        
                        // Show a more prominent notification for leave decisions
                        showToast(data.message, decisionType);
                        
                        // Always refresh leave list, even if user is on different tab
                        if (window.loadLeaveRequests) {
                            // Small delay to ensure DOM is ready
                            setTimeout(() => {
                                window.loadLeaveRequests();
                            }, 100);
                        }
                        
                        // Also refresh attendance section as leave status affects attendance
                        if (window.loadAttendanceSection) {
                            setTimeout(() => {
                                window.loadAttendanceSection();
                            }, 200);
                        }
                    } else {
                        // Regular notification - show toast
                        showToast(data.message, 'info');
                    }
                }
            } catch (e) {
                console.error("WS Message Error:", e);
            }
        };

        wsConnection.onclose = (event) => {
            console.log("WebSocket connection closed. Code:", event.code, "Reason:", event.reason);
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }
            // Retry connection after 5 seconds
            setTimeout(() => {
                console.log("Attempting to reconnect WebSocket...");
                initWebSocket();
            }, 5000);
        };

        wsConnection.onerror = (err) => {
            console.error("WebSocket Error:", err);
        };
    } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
        // Retry after 5 seconds
        setTimeout(initWebSocket, 5000);
    }
}

// Initialize WebSocket if token exists
if (typeof getToken === 'function' && getToken()) {
    // Wait a bit for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initWebSocket, 500);
        });
    } else {
        setTimeout(initWebSocket, 500);
    }
}