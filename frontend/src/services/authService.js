import api, { tokenStorage } from "./api";

export const authService = {
  register: async (payload) => {
    const { data } = await api.post("/auth/register/", payload);
    return data.data; // { access, refresh, user }
  },

  requestPasswordReset: async (email) => {
    await api.post("/auth/password-reset/request/", { email });
  },

  confirmPasswordReset: async ({ uid, token, newPassword, newPassword2 }) => {
    await api.post("/auth/password-reset/confirm/", {
      uid,
      token,
      new_password: newPassword,
      new_password2: newPassword2,
    });
  },

  login: async ({ email, password }) => {
    const { data } = await api.post("/auth/login/", { email, password });
    return data; // { access, refresh, user }
  },

  logout: async () => {
    const refresh = tokenStorage.getRefreshToken();
    if (refresh) {
      await api.post("/auth/logout/", { refresh });
    }
  },

  fetchCurrentUser: async () => {
    const { data } = await api.get("/auth/me/");
    return data;
  },
};

export default authService;
