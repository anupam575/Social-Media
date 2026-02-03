"use client";

import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://localhost:4000/api/v1";

// Main API instance
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Refresh-only instance (NO interceptors)
const refreshAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ❌ Never intercept refresh-token itself
    if (originalRequest?.url?.includes("/refresh-token")) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => API(originalRequest));
      }

      isRefreshing = true;

      try {
        console.log("♻️ Calling /refresh-token...");
        await refreshAPI.get("/refresh-token");
        console.log("✅ Refresh token success");

        processQueue(null);
        return API(originalRequest);
      } catch (err) {
        processQueue(err);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
