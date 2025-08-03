import API from "../config/apiClient";

export const login = async (data) => {
  await API.post("/auth/login", data);
};

export const logout = async () => {
  await API.get("/auth/logout");
};

export const register = async (data) => {
  await API.post("/auth/register", data);
};

export const verifyEmail = async (verificationCode) => {
  const res = await API.get(`/auth/email/verify/${verificationCode}`);
  return res;
};

export const sendPasswordResetEmail = async (email) => {
  await API.post("/auth/password/forgot", { email });
};

export const resetPassword = async ({ verificationCode, password }) => {
  await API.post("/auth/password/reset", { verificationCode, password });
};

export const getUser = async () => {
  return await API.get("/user");
};

export const getSessions = async () => {
  return await API.get("/sessions");
};

export const deleteSession = async (id) => {
  return await API.delete(`/sessions/${id}`);
};
