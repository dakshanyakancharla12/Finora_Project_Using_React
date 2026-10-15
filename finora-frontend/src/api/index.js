import { ApiError, request } from "./client";

export const api = {
  auth: {
    signup: (body) =>
      request("/auth/signup", {
        method: "POST",
        body,
        handleUnauthorized: false
      }),

    login: async (body) => {
      try {
        return await request("/auth/login", {
          method: "POST",
          body,
          handleUnauthorized: false
        });
      } catch (error) {
        if (error.status === 401 && !error.data?.message) {
          throw new ApiError("Invalid email or password.", 401, error.data);
        }
        throw error;
      }
    },

    logout: () =>
      request("/auth/logout", { method: "POST", handleUnauthorized: false }),

    forgotPassword: (body) =>
      request("/auth/forgot-password", {
        method: "POST",
        body,
        handleUnauthorized: false
      })
  },

  profile: {
    get: () => request("/profile"),
    update: (body) => request("/profile", { method: "PUT", body }),
    changePassword: (body) =>
      request("/profile/change-password", { method: "POST", body })
  },

  transactions: {
    list: () => request("/transactions"),
    create: (body) => request("/transactions", { method: "POST", body }),
    update: (id, body) =>
      request(`/transactions/${encodeURIComponent(id)}`, {
        method: "PUT",
        body
      }),
    remove: (id) =>
      request(`/transactions/${encodeURIComponent(id)}`, {
        method: "DELETE"
      })
  },

  budgets: {
    list: () => request("/budgets"),
    create: (body) => request("/budgets", { method: "POST", body }),
    update: (id, body) =>
      request(`/budgets/${encodeURIComponent(id)}`, {
        method: "PUT",
        body
      }),
    remove: (id) =>
      request(`/budgets/${encodeURIComponent(id)}`, { method: "DELETE" })
  }
};
