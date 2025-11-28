"use client";
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { FaEye, FaEdit, FaTrash, FaPlus, FaUniversity } from "react-icons/fa";

const CreateInstitution = () => {
    const [institutions, setInstitutions] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [operationLoading, setOperationLoading] = useState(false);
    const [institutionName, setInstitutionName] = useState('');
    const [renameInstitutionName, setRenameInstitutionName] = useState('');
    const [selectedInstitutionId, setSelectedInstitutionId] = useState(null);
    const [institutionToDelete, setInstitutionToDelete] = useState(null);

    useEffect(() => {
        const storedInstitutes = JSON.parse(localStorage.getItem("institutes")) || [];
        setInstitutions(storedInstitutes);
    }, []);

    const handleCreateInstitution = () => {
        setOperationLoading(true);
        if (!institutionName.trim()) {
            toast.error("Please enter the institution name", { position: 'top-center' });
            setOperationLoading(false);
            return;
        }

        const newInstitution = {
            instituteId: institutions?.length + 1 || 1,
            instituteName: institutionName.trim(),
            branches: []
        };

        const updatedInstitutes = [...institutions, newInstitution];
        setInstitutions(updatedInstitutes);
        localStorage.setItem("institutes", JSON.stringify(updatedInstitutes));

        setInstitutionName('');
        setIsCreateModalOpen(false);
        setOperationLoading(false);

        toast.success("Institution created successfully", { position: 'top-center' });
    };

    const openRenameModal = (inst) => {
        setSelectedInstitutionId(inst.instituteId);
        setRenameInstitutionName(inst.instituteName);
        setIsRenameModalOpen(true);
    };

    const handleInstitutionRename = () => {
        if (!selectedInstitutionId) return;

        setOperationLoading(true);

        if (!renameInstitutionName.trim()) {
            toast.error("Institution name cannot be empty", { position: 'top-center' });
            setOperationLoading(false);
            return;
        }

        const updatedInstitutes = institutions.map((inst) =>
            inst.instituteId === selectedInstitutionId
                ? { ...inst, instituteName: renameInstitutionName.trim() }
                : inst
        );

        setInstitutions(updatedInstitutes);
        localStorage.setItem("institutes", JSON.stringify(updatedInstitutes));

        setIsRenameModalOpen(false);
        setSelectedInstitutionId(null);
        setRenameInstitutionName('');
        setOperationLoading(false);

        toast.success("Institution renamed successfully", { position: 'top-center' });
    };

    const openDeleteModal = (inst) => {
        setInstitutionToDelete(inst);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteInstitution = () => {
        if (!institutionToDelete) return;

        setOperationLoading(true);

        const updatedInstitutes = institutions.filter(
            (inst) => inst.instituteId !== institutionToDelete.instituteId
        );

        setInstitutions(updatedInstitutes);
        localStorage.setItem("institutes", JSON.stringify(updatedInstitutes));

        setOperationLoading(false);
        setIsDeleteModalOpen(false);
        setInstitutionToDelete(null);

        toast.success("Institution deleted successfully", { position: "top-center" });
    };


    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Toaster />
                <Navbar />

                {/* Main Section */}
                <div className="flex-1 px-6 py-8 mt-16 bg-gradient-to-br from-gray-50 via-white to-gray-100">
                    <div className="max-w-6xl mx-auto mt-5">

                        {/* Header */}
                        <div className="flex flex-col items-center justify-center mb-12 animate-fadeIn">
                            <div className="flex items-center gap-3 mb-4">
                                <FaUniversity className="text-5xl text-purple-600 drop-shadow-md" />
                                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                                    Institutions
                                </h1>
                            </div>
                            <p className="text-lg text-center text-gray-600 mb-8 max-w-2xl">
                                View, create, and manage your institutions. Add branches and faculty later to get started with timetable generation.
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-300"
                            >
                                <FaPlus className="text-lg" /> Create Institution
                            </button>
                        </div>

                        {/* Institution Cards */}
                        {institutions?.length > 0 ? (
                            <div className="flex flex-wrap gap-6 justify-center items-stretch">
                                {institutions.map(inst => (
                                    <div
                                        key={inst.instituteId}
                                        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 min-w-[360px] flex flex-col"
                                    >
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <FaUniversity className="text-xl text-purple-500" />
                                                    <h2 className="text-lg font-semibold text-gray-900 mr-4">
                                                        {inst.instituteName}
                                                    </h2>
                                                </div>
                                                <span className="bg-gradient-to-r from-purple-100 to-blue-100 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                    {inst.branches.length} {inst.branches.length === 1 ? 'Branch' : 'Branches'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-6 py-3 flex justify-between border-t border-gray-200">
                                            <Link
                                                href={`/institution/${inst.instituteId}`}
                                                className="flex items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all"
                                            >
                                                <FaEye /> View
                                            </Link>
                                            <button
                                                onClick={() => openRenameModal(inst)}
                                                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                <FaEdit /> Rename
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(inst)}
                                                className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                <FaTrash /> Delete
                                            </button>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center mt-10">
                                <div className="text-5xl mb-4">🚀</div>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                    No institutions yet
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Get started by creating your first institution and add branches & faculty later.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Institution Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Create Institution</h3>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name *</label>
                                    <input
                                        type="text"
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., RNS Institute of Technology"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    You can add branches and faculty after creating the institution.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateInstitution}
                                    disabled={operationLoading}
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {operationLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rename Institution Modal */}
                {isRenameModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Rename Institution</h3>
                                <button
                                    onClick={() => {
                                        setIsRenameModalOpen(false);
                                        setSelectedInstitutionId(null);
                                        setRenameInstitutionName('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Institution Name *</label>
                                    <input
                                        type="text"
                                        value={renameInstitutionName}
                                        onChange={(e) => setRenameInstitutionName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter new name"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    This will update the institution name everywhere in your timetable setup.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setIsRenameModalOpen(false);
                                        setSelectedInstitutionId(null);
                                        setRenameInstitutionName('');
                                    }}
                                    className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInstitutionRename}
                                    disabled={operationLoading}
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {operationLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Institution Modal */}
                {isDeleteModalOpen && institutionToDelete && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Delete Institution</h3>
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setInstitutionToDelete(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-700">
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold">
                                        {institutionToDelete.instituteName}
                                    </span>
                                    ?
                                </p>
                                <p className="text-xs text-red-500">
                                    This action cannot be undone. All branches and related data under this
                                    institution will no longer be accessible.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setInstitutionToDelete(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteInstitution}
                                    disabled={operationLoading}
                                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {operationLoading ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </div>

            {/* Animations */}
            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>
        </>
    );
};

export default CreateInstitution;
