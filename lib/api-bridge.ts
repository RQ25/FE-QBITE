import axios, { AxiosError } from "axios";
import { BASE_API_URL } from "@/global";

const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
});

const buildHeaders = (token?: string, contentType?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
};

export const get = async (url: string, token?: string) => {
  try {
    const result = await axiosInstance.get(url, {
      headers: buildHeaders(token),
    });
    return {
      status: true,
      data: result.data,
    };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return {
      status: false,
      message: err.response?.data?.message || "Gagal mengambil data dari server.",
    };
  }
};

export const post = async (url: string, data: string | FormData | object, token?: string) => {
  try {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const contentType = isFormData ? undefined : "application/json";

    const result = await axiosInstance.post(url, data, {
      headers: buildHeaders(token, contentType),
    });
    return {
      status: true,
      data: result.data,
    };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return {
      status: false,
      message: err.response?.data?.message || "Gagal mengirim data ke server.",
    };
  }
};

export const put = async (url: string, data: string | FormData | object, token: string) => {
  try {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const contentType = isFormData ? undefined : "application/json";

    const result = await axiosInstance.put(url, data, {
      headers: buildHeaders(token, contentType),
    });
    return {
      status: true,
      data: result.data,
    };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return {
      status: false,
      message: err.response?.data?.message || "Gagal memperbarui data.",
    };
  }
};

export const patch = async (url: string, data: object, token: string) => {
  try {
    const result = await axiosInstance.patch(url, data, {
      headers: buildHeaders(token, "application/json"),
    });
    return {
      status: true,
      data: result.data,
    };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return {
      status: false,
      message: err.response?.data?.message || "Gagal memproses status pesanan.",
    };
  }
};

export const drop = async (url: string, token: string) => {
  try {
    const result = await axiosInstance.delete(url, {
      headers: buildHeaders(token),
    });
    return {
      status: true,
      data: result.data,
    };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return {
      status: false,
      message: err.response?.data?.message || "Gagal menghapus data.",
    };
  }
};

export const downloadExcel = async (url: string, token: string, fallbackFilename: string) => {
  try {
    const response = await axiosInstance.get(url, {
      headers: buildHeaders(token),
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", fallbackFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return { status: true };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return {
      status: false,
      message: err.response?.data?.message || "Gagal mengunduh file Excel.",
    };
  }
};