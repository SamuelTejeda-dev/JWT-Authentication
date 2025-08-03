import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
// import { navigate } from "../lib/navigation";

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

const API = axios.create(options);

API.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error;
    const { status, data } = error.response || {};

    if (status === 401 && data?.errorCode === "InvalidAccessToken") {
      try {
        await API.get("/auth/refresh");
        return API(config);
      } catch (error) {
        QueryClient.clear();
        navigate("/login", {
          state: {
            redirectUrl: window.location.pathname,
          },
        });
      }
    }

    return Promise.reject({ status, ...data });
  }
);

export default API;
