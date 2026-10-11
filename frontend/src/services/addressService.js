import api from "./api";

export const addressService = {
  fetchAddresses: async () => {
    const { data } = await api.get("/users/addresses/");
    return data.results;
  },

  createAddress: async (payload) => {
    const { data } = await api.post("/users/addresses/", payload);
    return data;
  },

  updateAddress: async (id, payload) => {
    const { data } = await api.patch(`/users/addresses/${id}/`, payload);
    return data;
  },

  deleteAddress: async (id) => {
    await api.delete(`/users/addresses/${id}/`);
    return id;
  },
};

export default addressService;
