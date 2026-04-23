"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UIPagination from "../../components/section/ui/pagination";
import ActionDropdown from "../../components/section/ui/ActionDropdown";
import useEmployees from "./useEmployees";

export default function EmployeesPage() {

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(2);

    const router = useRouter();

    const {
        filteredEmployees,
        loading,
        totalPages,
        formatDate,
        handleDelete,
    } = useEmployees(page, limit, search);

    useEffect(() => {
        setPage(1);
    }, [search]);

    // SCROLL TOP ON PAGE CHANGE
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">

                <h1 className="text-2xl font-bold text-gray-800">
                    Employees
                </h1>

                <div className="flex items-center gap-3">

                    {/* SEARCH */}
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border px-3 py-2 rounded-lg text-sm w-48"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* ADD */}
                    <button
                        onClick={() => router.push("/hr/employee/create")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        + Add
                    </button>

                    {/* LIMIT */}
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border px-2 py-2 rounded-lg text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>

                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white shadow rounded-xl overflow-hidden">

                <table className="w-full text-sm">

                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="p-3 text-left">Code</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Designation</th>
                            <th className="p-3 text-left">Role</th>
                            <th className="p-3 text-left">Basic Pay</th>
                            <th className="p-3 text-left">DOB</th>
                            <th className="p-3 text-left">DOJ</th>
                            <th className="p-3 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredEmployees.map((emp) => (
                            <tr key={emp._id} className="border-t hover:bg-gray-50">

                                <td className="p-3 font-medium text-blue-600">
                                    {emp.code}
                                </td>

                                <td className="p-3">
                                    {emp.employee_name}
                                </td>

                                <td className="p-3">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                        {emp.designation?.name}
                                    </span>
                                </td>

                                <td className="p-3">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                        {emp.role?.role_name}
                                    </span>
                                </td>

                                <td className="p-3 font-semibold text-green-600">
                                    ₹ {emp.basic_pay}
                                </td>

                                <td className="p-3">
                                    {formatDate(emp.date_of_birth)}
                                </td>

                                <td className="p-3">
                                    {formatDate(emp.date_of_joining)}
                                </td>

                                <td className="p-3 text-center">
                                    <ActionDropdown
                                        onUpdate={() =>
                                            router.push(`/hr/employee/edit/${emp._id}`)
                                        }
                                        onView={() =>
                                            router.push(`/hr/employee/view/${emp._id}`)
                                        }
                                        onDelete={() => handleDelete(emp._id)}
                                    />
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>

            </div>

            {/* PAGINATION */}
            <div className="flex justify-center mt-6">
                <UIPagination
                    totalPages={totalPages}
                    page={page}
                    onChange={(newPage) => setPage(newPage)}
                />
            </div>

        </div>
    );
}