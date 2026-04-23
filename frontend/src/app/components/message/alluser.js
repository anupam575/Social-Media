"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import API from "../../../utils/axiosInstance";
import UIPagination from "../../components/section/ui/pagination";
import ActionDropdown from "../../components/section/ui/ActionDropdown";

const Users = () => {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // SEARCH STATE
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // =========================
  // DEBOUNCE LOGIC (300ms)
  // =========================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // =========================
  // FETCH USERS (ONLY API DATA)
  // =========================
  const fetchUsers = useCallback(
    async (pageNumber = 1) => {
      try {
        setLoading(true);

        const { data } = await API.get(
          `/users?page=${pageNumber}&limit=${limit}`,
          { withCredentials: true },
        );

        setUsers(data.users || []);
        setTotalUsers(data.totalUsers ?? data.users.length);
        setTotalPages(data.totalPages ?? 1);
      } catch (error) {
        console.error("Fetch Users Error:", error.message);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  // =========================
  // FRONTEND FILTER (ALL FIELDS SEARCH)
  // =========================
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return users;

    const q = debouncedSearch.toLowerCase();

    return users.filter(
      (user) =>
        user.first_name?.toLowerCase().includes(q) ||
        user.last_name?.toLowerCase().includes(q) ||
        user.Email?.toLowerCase().includes(q) ||
        user.phone_number?.toLowerCase().includes(q) ||
        user.department_name?.toLowerCase().includes(q) ||
        user.Role?.toLowerCase().includes(q),
    );
  }, [users, debouncedSearch]);

  // =========================
  // ACTIONS
  // =========================
  const handleUpdate = (id) => {
    router.push(`/admin/allusers/edit/${id}`);
  };

  const handleView = (id) => {
    router.push(`/admin/allusers/${id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;

    try {
      await API.delete(`/users/${id}`);
      fetchUsers(page);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Total Users: {totalUsers}
          </h1>

          {/* PREMIUM SEARCH INPUT */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users (name, email, phone, role...)"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 shadow-sm 
                            focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>

          <button
            onClick={() => router.push("/admin/register")}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition"
          >
            + Add User
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col border border-gray-100">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Users List</h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading users...
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  {/* HEADER */}
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-xs uppercase text-gray-600 border-b">
                      <th className="p-4 text-left">No.</th>
                      <th className="p-4 text-left">First Name</th>
                      <th className="p-4 text-left">Last Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Phone</th>
                      <th className="p-4 text-left">Department</th>
                      <th className="p-4 text-left">Role</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Created</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>

                  {/* BODY */}
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr
                          key={user._id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="p-4 font-semibold text-gray-500">
                            {(page - 1) * limit + index + 1}
                          </td>

                          <td className="p-4 font-medium text-gray-800">
                            {user.first_name}
                          </td>

                          <td className="p-4 text-gray-700">
                            {user.last_name}
                          </td>

                          <td className="p-4 text-gray-600">{user.Email}</td>

                          <td className="p-4 text-gray-600">
                            {user.phone_number}
                          </td>

                          <td className="p-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                              {user.department_name || "-"}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                              {user.Role}
                            </span>
                          </td>

                          <td className="p-4">
                            {user.isActive ? (
                              <span className="text-green-600 font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="text-red-500 font-medium">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-gray-500 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>

                          <td className="p-4 text-center">
                            <ActionDropdown
                              onUpdate={() => handleUpdate(user._id)}
                              onView={() => handleView(user._id)}
                              onDelete={() => handleDelete(user._id)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="10"
                          className="text-center py-6 text-gray-500"
                        >
                          No Users Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="p-4 border-t flex justify-center">
                <UIPagination
                  totalPages={totalPages}
                  page={page}
                  onChange={(value) => setPage(value)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
