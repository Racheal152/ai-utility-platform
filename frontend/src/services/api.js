import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Households ──────────────────────────────────────────────
export const ensureHousehold = () => API.post('/households/ensure');
export const fetchHouseholds = () => API.get('/households');
export const createHousehold = (name) => API.post('/households', { name });
export const updateHousehold = (id, name) => API.patch(`/households/${id}`, { name });
export const fetchMembers = (householdId) => API.get(`/households/${householdId}/members`);
export const generateInvite = (householdId) => API.post(`/households/${householdId}/invite`);
export const joinHousehold = (token) => API.post('/households/join', { token });
export const removeMember = (householdId, userId) => API.delete(`/households/${householdId}/members/${userId}`);
export const transferOwnership = (householdId, newOwnerId) => API.patch(`/households/${householdId}/transfer-ownership`, { newOwnerId });

// ─── Bills ───────────────────────────────────────────────────
export const fetchBills = (householdId) => API.get(`/bills/household/${householdId}`);
export const fetchAiInsights = (householdId) => API.get(`/bills/household/${householdId}/insights`);
export const fetchPredictions = (householdId) => API.get(`/bills/household/${householdId}/predictions`);
export const addBill = (payload) => API.post('/bills', payload);
export const updateBillStatus = (id, status) => API.patch(`/bills/${id}/status`, { status });
export const deleteBill = (id) => API.delete(`/bills/${id}`);

// ─── Notifications ───────────────────────────────────────────
export const fetchNotifications = (history = false) => API.get(`/notifications${history ? '?history=true' : ''}`);
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const clearNotifications = () => API.delete('/notifications');

// ─── Payment Proofs ───────────────────────────────────────────
export const uploadProof = (billId, file) => {
    const form = new FormData();
    form.append('bill_id', billId);
    form.append('receipt', file);
    return API.post('/bills/upload-proof', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const approveProof = (proofId) => API.patch(`/bills/proofs/${proofId}/approve`);
export const rejectProof = (proofId, reason) => API.patch(`/bills/proofs/${proofId}/reject`, { reason });

// ─── Users ───────────────────────────────────────────────────
export const updateProfile = (data) => API.put('/users/profile', data);

export default API;