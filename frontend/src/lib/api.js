import API from "../config/apiClient";

export const login = async (data) => {
  const response = await API.post("/auth/login", data);
  return response.data;
};
