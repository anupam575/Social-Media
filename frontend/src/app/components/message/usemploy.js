"use client";

import { useEffect, useState } from "react";
import API from "../../../utils/axiosInstance";

export default function useEmployees(page, limit, search) {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    // DATE FORMAT (logic kept here for reuse)
    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // FETCH DATA (BACKEND PAGINATION)
    const fetchEmployees = async () => {
        try {
            setLoading(true);

            const res = await API.get(
                `/employees/all?page=${page}&limit=${limit}`
            );

            if (res.data.success) {
                setEmployees(res.data.data);
                setFilteredEmployees(res.data.data);
                setTotalPages(res.data.totalPages);
            }

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [page, limit]);

    // SEARCH LOGIC (unchanged)
    useEffect(() => {
        const text = search.toLowerCase();

        if (!text) {
            setFilteredEmployees(employees);
            return;
        }

        const filtered = employees.filter((emp) =>
            [
                emp.code,
                emp.employee_name,
                emp.pay_scale,
                emp.basic_pay,
                emp.designation?.name,
                emp.role?.role_name,
            ]
                .join(" ")
                .toLowerCase()
                .includes(text)
        );

        setFilteredEmployees(filtered);

    }, [search, employees]);

    // DELETE
    const handleDelete = async (id) => {
        if (!confirm("Delete?")) return;
        await API.delete(`/employees/${id}`);
        fetchEmployees();
    };

    return {
        employees,
        filteredEmployees,
        loading,
        totalPages,
        formatDate,
        handleDelete,
        fetchEmployees,
    };
}