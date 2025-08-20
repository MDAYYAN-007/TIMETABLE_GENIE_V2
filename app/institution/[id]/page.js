'use client';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaChevronDown,
    FaChevronUp,
    FaPlus,
    FaUniversity,
    FaGraduationCap,
    FaCalendarAlt,
    FaUsers,
    FaEdit,
    FaTrash,
    FaBook,
    FaTable,
    FaSearch,
    FaTimes,
    FaUserEdit
} from 'react-icons/fa';
import { IoMdSchool } from 'react-icons/io';
import { MdOutlineClass, MdOutlineDashboard } from 'react-icons/md';
import Link from 'next/link';

const Institution = () => {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    // Common states for loading and tabs
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('branches');

    // States for current institute and branches
    const [currentInstitute, setCurrentInstitute] = useState({});
    const [currentBranches, setCurrentBranches] = useState([]);

    // Modal state for creating branches
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Branch form states
    const [branchName, setBranchName] = useState('');
    const [numSemesters, setNumSemesters] = useState('');
    const [semesterType, setSemesterType] = useState('odd');
    const [semestersData, setSemestersData] = useState([]);

    // States for branch and semester management
    const [openBranchIds, setOpenBranchIds] = useState([]);
    const [editingBranch, setEditingBranch] = useState(null);
    const [newBranchName, setNewBranchName] = useState('');
    const [editingSemester, setEditingSemester] = useState(null);
    const [newSemesterName, setNewSemesterName] = useState('');

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');

    // State for faculty management
    const [faculty, setFaculty] = useState([]);

    // Modal state for adding teachers
    const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

    // Teacher form states
    const [newTeacherName, setNewTeacherName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const [teacherBranch, setTeacherBranch] = useState('N/A');

    // Edit modal state for teachers
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);

    // Unavailability modal state
    const [isUnavailabilityModalOpen, setIsUnavailabilityModalOpen] = useState(false);

    // Current teacher state for unavailability
    const [currentTeacher, setCurrentTeacher] = useState(null);

    // Periods per day (can be adjusted as needed)
    const periodsPerDay = 8; // Assuming 8 periods per day

    // Message modal state for unavailability messages
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    // Current slot and message state for unavailability messages
    const [currentSlot, setCurrentSlot] = useState('');
    const [currentMessage, setCurrentMessage] = useState('');

    // Search query for faculty
    const [facultySearchQuery, setFacultySearchQuery] = useState('');

    // Fetch current institute and branches on mount
    useEffect(() => {
        // Fetch current institute
        const storedInstitutes = JSON.parse(localStorage.getItem('institutes')) || [];
        const found = storedInstitutes.find((inst) => inst.instituteId === id);
        setCurrentInstitute(found);

        // Fetch branches for the current institute
        const allBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const branchesForInstitute = allBranches.filter((branch) => branch.instituteId === id);
        setCurrentBranches(branchesForInstitute);

        // Fetch faculty for the current institute
        const storedFaculty = JSON.parse(localStorage.getItem('faculty')) || [];
        setFaculty(storedFaculty.filter(f => f.instituteId === id));

        setLoading(false);
    }, [id]);

    // Filter faculty and branches based on search queries
    const filteredFaculty = faculty.filter(member =>
        member.name.toLowerCase().includes(facultySearchQuery.toLowerCase())
    );

    const filteredBranches = currentBranches.filter(branch =>
        branch.branchName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle changes in the number of semesters
    const handleNumSemestersChange = (value) => {
        setNumSemesters(value);
        if (!value) {
            setSemestersData([]);
            return;
        }

        const count = Number(value);
        const newSemesters = semesterType === 'odd'
            ? Array.from({ length: count }, (_, i) => ({ semesterName: `Semester ${i * 2 + 1}`, sections: 1 }))
            : Array.from({ length: count }, (_, i) => ({ semesterName: `Semester ${(i + 1) * 2}`, sections: 1 }));
        setSemestersData(newSemesters);
    };

    // Handle semester type change
    const handleSemesterTypeChange = (type) => {
        setSemesterType(type);
        if (numSemesters) {
            const count = Number(numSemesters);
            const newSemesters = type === 'odd'
                ? Array.from({ length: count }, (_, i) => ({ semesterName: `Semester ${i * 2 + 1}`, sections: 1 }))
                : Array.from({ length: count }, (_, i) => ({ semesterName: `Semester ${(i + 1) * 2}`, sections: 1 }));
            setSemestersData(newSemesters);
        }
    };

    // Handle semester name and section changes
    const handleSemesterNameChange = (index, value) => {
        const updated = [...semestersData];
        updated[index].semesterName = value;
        setSemestersData(updated);
    };

    const handleSectionChange = (index, value) => {
        const updated = [...semestersData];
        updated[index].sections = value;
        setSemestersData(updated);
    };

    // Handle branch creation
    const handleSaveBranch = () => {
        if (!branchName.trim()) {
            toast.error('Branch name is required', { position: 'top-center' });
            return;
        }

        if (!numSemesters) {
            toast.error('Number of semesters is required', { position: 'top-center' });
            return;
        }

        const newBranch = {
            branchId: Date.now(),
            branchName,
            instituteId: id,
            instituteName: currentInstitute.instituteName,
            semesters: semestersData.map(sem => ({
                ...sem,
                sectionNames: Array.from({ length: sem.sections || 1 }, (_, i) =>
                    `Section ${String.fromCharCode(65 + i)}`
                ),
                semesterId: Date.now() + Math.random().toString(36).substring(2, 8)
            }))
        };

        const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
        storedBranches.push(newBranch);
        localStorage.setItem('branches', JSON.stringify(storedBranches));

        const storedInstitutes = JSON.parse(localStorage.getItem('institutes')) || [];
        const updatedInstitutes = storedInstitutes.map((inst) => {
            if (inst.instituteId === id) {
                if (!inst.branches) inst.branches = [];
                inst.branches.push(branchName);
            }
            return inst;
        });
        localStorage.setItem('institutes', JSON.stringify(updatedInstitutes));

        setBranchName('');
        setNumSemesters('');
        setSemestersData([]);
        setIsModalOpen(false);

        toast.success('Branch added successfully', { position: 'top-center' });
        setCurrentInstitute(updatedInstitutes.find((inst) => inst.instituteId === id));
        const allBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const branchesForInstitute = allBranches.filter((branch) => branch.instituteId === id);
        setCurrentBranches(branchesForInstitute);
    };

    // Start editing semester
    const startEditingSemester = (semesterName) => {
        setEditingSemester(semesterName);
        setNewSemesterName(semesterName);
    };

    // Cancel editing semester
    const cancelEditingSemester = () => {
        setEditingSemester(null);
        setNewSemesterName('');
    };

    // Save edited semester
    const saveEditedSemester = (branchId, oldSemesterName) => {
        if (!newSemesterName.trim()) {
            toast.error('Semester name cannot be empty', { position: 'top-center' });
            return;
        }

        const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const updatedBranches = storedBranches.map(branch => {
            if (branch.branchId === branchId) {
                const updatedSemesters = branch.semesters.map(sem =>
                    sem.semesterName === oldSemesterName
                        ? { ...sem, semesterName: newSemesterName }
                        : sem
                );
                return { ...branch, semesters: updatedSemesters };
            }
            return branch;
        });
        localStorage.setItem('branches', JSON.stringify(updatedBranches));

        setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
        setEditingSemester(null);
        toast.success('Semester renamed successfully', { position: 'top-center' });
    };

    // Start editing branch
    const startEditingBranch = (branch) => {
        setEditingBranch(branch.branchId);
        setNewBranchName(branch.branchName);
    };

    // Cancel editing branch
    const cancelEditingBranch = () => {
        setEditingBranch(null);
        setNewBranchName('');
    };

    // Save edited branch
    const saveEditedBranch = (branchId) => {
        if (!newBranchName.trim()) {
            toast.error('Branch name cannot be empty', { position: 'top-center' });
            return;
        }

        const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const updatedBranches = storedBranches.map(branch => {
            if (branch.branchId === branchId) {
                return { ...branch, branchName: newBranchName };
            }
            return branch;
        });
        localStorage.setItem('branches', JSON.stringify(updatedBranches));

        const storedInstitutes = JSON.parse(localStorage.getItem('institutes')) || [];
        const updatedInstitutes = storedInstitutes.map(inst => {
            if (inst.instituteId === id) {
                const updatedBranchesList = inst.branches?.map(name =>
                    name === currentBranches.find(b => b.branchId === branchId)?.branchName ? newBranchName : name
                ) || [];
                return { ...inst, branches: updatedBranchesList };
            }
            return inst;
        });
        localStorage.setItem('institutes', JSON.stringify(updatedInstitutes));

        setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
        setCurrentInstitute(updatedInstitutes.find(inst => inst.instituteId === id));
        setEditingBranch(null);
        toast.success('Branch renamed successfully', { position: 'top-center' });
    };

    // Delete branch
    const deleteBranch = (branchId) => {
        if (confirm('Are you sure you want to delete this branch? This will also delete all associated semesters and timetables.')) {
            const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
            const updatedBranches = storedBranches.filter(branch => branch.branchId !== branchId);
            localStorage.setItem('branches', JSON.stringify(updatedBranches));

            const storedInstitutes = JSON.parse(localStorage.getItem('institutes')) || [];
            const updatedInstitutes = storedInstitutes.map(inst => {
                if (inst.instituteId === id) {
                    const branchToDelete = storedBranches.find(b => b.branchId === branchId);
                    const updatedBranchesList = inst.branches?.filter(name => name !== branchToDelete?.branchName) || [];
                    return { ...inst, branches: updatedBranchesList };
                }
                return inst;
            });
            localStorage.setItem('institutes', JSON.stringify(updatedInstitutes));

            setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
            setCurrentInstitute(updatedInstitutes.find(inst => inst.instituteId === id));
            toast.success('Branch deleted successfully', { position: 'top-center' });
        }
    };

    // Add semester to a branch
    const addSemester = (branchId) => {
        const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const updatedBranches = storedBranches.map(branch => {
            if (branch.branchId === branchId && branch.semesters.length < 5) {
                const lastSemester = branch.semesters[branch.semesters.length - 1];
                const lastNumber = parseInt(lastSemester.semesterName.split(' ')[1]);
                const newSemester = {
                    semesterName: `Semester ${lastNumber + 2}`,
                    sections: 1
                };
                return { ...branch, semesters: [...branch.semesters, newSemester] };
            }
            return branch;
        });
        localStorage.setItem('branches', JSON.stringify(updatedBranches));
        setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
        toast.success('Semester added successfully', { position: 'top-center' });
    };

    // Delete semester from a branch
    const deleteSemester = (branchId, semesterName) => {
        if (confirm(`Are you sure you want to delete ${semesterName}? This will also delete all associated sections and timetables.`)) {
            const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
            const updatedBranches = storedBranches.map(branch => {
                if (branch.branchId === branchId) {
                    const updatedSemesters = branch.semesters.filter(sem => sem.semesterName !== semesterName);
                    return { ...branch, semesters: updatedSemesters };
                }
                return branch;
            });
            localStorage.setItem('branches', JSON.stringify(updatedBranches));

            setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
            toast.success('Semester deleted successfully', { position: 'top-center' });
        }
    };

    // Add section to a semester
    const addSection = (branchId, semesterName) => {
        const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const updatedBranches = storedBranches.map(branch => {
            if (branch.branchId === branchId) {
                const updatedSemesters = branch.semesters.map(sem => {
                    if (sem.semesterName === semesterName && sem.sectionNames.length < 5) {
                        // Find all existing section letters
                        const existingLetters = sem.sectionNames.map(name =>
                            name.split(' ')[1].charCodeAt(0)
                        );

                        // Find the first available letter starting from A
                        let newLetterCode = 65; // 'A'
                        while (existingLetters.includes(newLetterCode)) {
                            newLetterCode++;
                        }

                        const newSectionName = `Section ${String.fromCharCode(newLetterCode)}`;
                        return {
                            ...sem,
                            sections: sem.sections + 1,
                            sectionNames: [...sem.sectionNames, newSectionName]
                        };
                    }
                    return sem;
                });
                return { ...branch, semesters: updatedSemesters };
            }
            return branch;
        });
        localStorage.setItem('branches', JSON.stringify(updatedBranches));
        setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
        toast.success('Section added successfully', { position: 'top-center' });
    };

    // Delete section from a semester
    const deleteSection = (branchId, semesterName, sectionName) => {
        const storedBranches = JSON.parse(localStorage.getItem('branches')) || [];
        const updatedBranches = storedBranches.map(branch => {
            if (branch.branchId === branchId) {
                const updatedSemesters = branch.semesters.map(sem => {
                    if (sem.semesterName === semesterName && sem.sectionNames.length > 1) {
                        return {
                            ...sem,
                            sections: sem.sections - 1,
                            sectionNames: sem.sectionNames.filter(name => name !== sectionName)
                        };
                    }
                    return sem;
                });
                return { ...branch, semesters: updatedSemesters };
            }
            return branch;
        });
        localStorage.setItem('branches', JSON.stringify(updatedBranches));
        setCurrentBranches(updatedBranches.filter(branch => branch.instituteId === id));
        toast.success(`Section ${sectionName} deleted successfully`, { position: 'top-center' });
    };

    // Toggle branch accordion
    const toggleBranchAccordion = (branchId) => {
        setOpenBranchIds((prev) =>
            prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
        );
    };

    // Faculty functions
    const handleAddTeacher = () => {
        if (!newTeacherName.trim()) {
            toast.error('Teacher name is required');
            return;
        }

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const initialAvailability = {};

        days.forEach(day => {
            const periods = periodsPerDay;
            for (let period = 1; period <= periods; period++) {
                const slotKey = `${day}-${period}`;
                initialAvailability[slotKey] = {
                    unavailable: false,
                    allocated: false,
                    message: 'No commitment'
                };
            }
        });

        const teacher = {
            name: newTeacherName,
            email: teacherEmail || 'N/A',
            branch: teacherBranch || 'N/A',
            instituteId: id,
            teacherId: Date.now().toString(),
            unavailability: initialAvailability
        };

        const updatedFaculty = [...faculty, teacher];
        setFaculty(updatedFaculty);
        localStorage.setItem('faculty', JSON.stringify(updatedFaculty));

        setNewTeacherName('');
        setTeacherEmail('');
        setTeacherBranch('N/A');
        setIsFacultyModalOpen(false);
        toast.success('Teacher added successfully');
    };

    // Open modal to add a new teacher
    const openEditModal = (teacher) => {
        setEditingTeacher(JSON.parse(JSON.stringify(teacher)));
        setIsEditModalOpen(true);
    };

    // Save edited teacher
    const handleSaveTeacher = () => {
        if (!editingTeacher.name.trim()) {
            toast.error('Teacher name is required');
            return;
        }

        const updatedFaculty = faculty.map(teacher =>
            teacher.teacherId === editingTeacher.teacherId ? editingTeacher : teacher
        );

        setFaculty(updatedFaculty);
        localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
        setIsEditModalOpen(false);
        toast.success('Teacher updated successfully');
    };

    // Delete a teacher
    const deleteTeacher = (teacherId) => {
        if (confirm('Are you sure you want to delete this teacher?')) {
            const updatedFaculty = faculty.filter(t => t.teacherId !== teacherId);
            setFaculty(updatedFaculty);
            localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
            toast.success('Teacher deleted successfully');
        }
    };

    // Open modal to manage unavailability
    const openUnavailabilityModal = (teacher) => {
        setCurrentTeacher(JSON.parse(JSON.stringify(teacher)));
        setIsUnavailabilityModalOpen(true);
    };

    // Close unavailability modal
    const closeUnavailabilityModal = () => {
        setIsUnavailabilityModalOpen(false);
        setCurrentTeacher(null);
    };

    // Toggle unavailability for a specific slot
    const toggleUnavailability = (slotKey) => {
        if (currentTeacher.unavailability[slotKey]?.allocated) {
            toast.error('This slot is already allocated to a class. Cannot toggle unavailability.');
            return;
        }

        setCurrentTeacher(prev => {
            const newUnavailability = { ...prev.unavailability };
            const currentSlot = newUnavailability[slotKey] || {
                unavailable: false,
                allocated: false,
                message: 'No commitment'
            };

            const newStatus = !currentSlot.unavailable;

            newUnavailability[slotKey] = {
                ...currentSlot,
                unavailable: newStatus,
                message: newStatus
                    ? 'Not available (personal)'
                    : 'No commitment'
            };

            return { ...prev, unavailability: newUnavailability };
        });
    };

    // Open message modal for unavailability
    const openMessageModal = (slotKey, message) => {
        setCurrentSlot(slotKey);
        setCurrentMessage(message || '');
        setIsMessageModalOpen(true);
    };

    // Close message modal for unavailability
    const closeMessageModal = () => {
        setIsMessageModalOpen(false);
        setCurrentSlot('');
        setCurrentMessage('');
    };

    // Save message for unavailability
    const saveMessage = () => {
        setCurrentTeacher(prev => {
            const newUnavailability = { ...prev.unavailability };
            newUnavailability[currentSlot] = {
                unavailable: true,
                message: currentMessage
            };
            return { ...prev, unavailability: newUnavailability };
        });
        closeMessageModal();
    };

    // Save unavailability changes
    const saveUnavailability = () => {
        const updatedFaculty = faculty.map(teacher =>
            teacher.teacherId === currentTeacher.teacherId ? currentTeacher : teacher
        );

        setFaculty(updatedFaculty);
        localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
        closeUnavailabilityModal();
        toast.success('Unavailability updated successfully');
    };

    const navigateToSemester = (branchId, semesterName) => {
        router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterName)}`);
    };

    const navigateToSection = (branchId, semesterName, section) => {
        router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterName)}/section/${section}`);
    };

    

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-600">Loading institute data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-white">
            <Toaster />
            <Navbar />
            <main className="flex-1 mt-16 p-6">
                {/* Header */}
                <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <FaUniversity className="text-4xl text-indigo-600" />
                            <h1 className="text-3xl font-bold text-gray-800">{currentInstitute.instituteName}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
                                <FaGraduationCap className="text-indigo-500" />
                                <span>
                                    Branches: <span className="font-semibold">{currentInstitute.branches?.length || 0}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
                                <FaUsers className="text-indigo-500" />
                                <span>
                                    Faculty: <span className="font-semibold">{faculty.length}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Modified Section */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('branches')}
                        className={`px-4 py-2 font-medium ${activeTab === 'branches' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    >
                        Branches
                    </button>
                    <button
                        onClick={() => setActiveTab('faculty')}
                        className={`px-4 py-2 font-medium ${activeTab === 'faculty' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                    >
                        Faculty Pool
                    </button>
                </div>


                {/* Branches Section */}
                {activeTab === 'branches' && (
                    <>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-6">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-100 rounded-xl">
                                            <IoMdSchool className="text-3xl text-indigo-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">Branches</h2>
                                            <p className="text-gray-500">{filteredBranches.length} {filteredBranches.length === 1 ? 'branch' : 'branches'}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaSearch className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search branches..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition whitespace-nowrap"
                                        >
                                            <FaPlus className="text-lg" />
                                            Add Branch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filteredBranches.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl shadow border border-gray-200">
                                <MdOutlineDashboard className="mx-auto text-4xl text-gray-400 mb-3" />
                                <h4 className="text-lg font-medium text-gray-700">
                                    {searchQuery ? 'No matching branches found' : 'No branches yet'}
                                </h4>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery ? 'Try a different search term' : 'Add your first branch to get started'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Create Branch
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredBranches.map((branch) => (
                                    <div key={branch.branchId} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center p-5 group hover:bg-gray-50 transition-colors duration-200">
                                            {editingBranch === branch.branchId ? (
                                                <div className="flex items-center gap-3 w-full">
                                                    <input
                                                        type="text"
                                                        value={newBranchName}
                                                        onChange={(e) => setNewBranchName(e.target.value)}
                                                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => saveEditedBranch(branch.branchId)}
                                                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEditingBranch}
                                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        className="flex justify-between items-center px-5 py-1 group hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full"
                                                        onClick={(e) => {
                                                            if (!e.target.closest('.action-button')) {
                                                                toggleBranchAccordion(branch.branchId);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="p-2 bg-indigo-200 rounded-lg">
                                                                <MdOutlineClass className="text-indigo-600 text-2xl" />
                                                            </div>
                                                            <span className="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 tracking-wide">
                                                                {branch.branchName}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingBranch(branch);
                                                                }}
                                                                className="p-2 text-xl text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors action-button"
                                                                title="Rename branch"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteBranch(branch.branchId);
                                                                }}
                                                                className="p-2 text-xl text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors action-button"
                                                                title="Delete branch"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                            <div className="ml-2">
                                                                {openBranchIds.includes(branch.branchId) ? (
                                                                    <FaChevronUp className="text-gray-500" />
                                                                ) : (
                                                                    <FaChevronDown className="text-gray-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {openBranchIds.includes(branch.branchId) && (
                                            <div className="px-5 pb-5">
                                                <div className="space-y-4">
                                                    {branch.semesters.map((sem, idx) => (
                                                        <div key={idx} className="border-l-4 border-indigo-500 pl-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-indigo-500 text-xl" />
                                                                    {editingSemester === sem.semesterName ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={newSemesterName}
                                                                                onChange={(e) => setNewSemesterName(e.target.value)}
                                                                                className="p-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                                                                autoFocus
                                                                            />
                                                                            <button
                                                                                onClick={() => saveEditedSemester(branch.branchId, sem.semesterName)}
                                                                                className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button
                                                                                onClick={cancelEditingSemester}
                                                                                className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <h4 className="font-medium text-lg text-gray-700">{sem.semesterName}</h4>
                                                                            <button
                                                                                onClick={() => startEditingSemester(sem.semesterName)}
                                                                                className="ml-2 text-indigo-500 hover:text-indigo-700"
                                                                                title="Rename semester"
                                                                            >
                                                                                <FaEdit className='text-xl' />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => deleteSemester(branch.branchId, sem.semesterName)}
                                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                                        title="Delete semester"
                                                                    >
                                                                        <FaTrash className='text-lg' />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="ml-6">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2 text-gray-500">
                                                                        <FaUsers className="text-gray-400" />
                                                                        <span>Sections:</span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => navigateToSemester(branch.branchId, sem.semesterName)}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 transition-colors"
                                                                        >
                                                                            <FaTable />
                                                                            View All Timetables
                                                                        </button>
                                                                        <Link
                                                                            href={`/institution/${id}/branch/${branch.branchId}/semester/${encodeURIComponent(sem.semesterName)}/curriculum`}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                                                                        >
                                                                            <FaBook />
                                                                            Manage Curriculum
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {sem.sectionNames.map((sectionName, i) => (
                                                                        <div key={i} className="relative group">
                                                                            <button
                                                                                onClick={() => navigateToSection(branch.branchId, sem.semesterName, sectionName)}
                                                                                className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-lg text-sm transition-colors border border-gray-200 flex items-center gap-1"
                                                                            >
                                                                                <FaUsers />
                                                                                {sectionName}
                                                                            </button>
                                                                            {sem.sectionNames.length > 1 && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (confirm(`Delete ${sectionName}?`)) {
                                                                                            deleteSection(branch.branchId, sem.semesterName, sectionName);
                                                                                        }
                                                                                    }}
                                                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                                                                    title="Delete section"
                                                                                >
                                                                                    <FaTimes />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {sem.sectionNames.length < 5 && (
                                                                        <button
                                                                            onClick={() => addSection(branch.branchId, sem.semesterName)}
                                                                            className="ml-2 p-3 w-10 h-10 flex justify-center items-center text-lg rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                                                                            title="Add section"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        </div>
                                                    ))}
                                                </div>
                                                {branch.semesters.length < 5 && (
                                                    <div className="flex justify-center mt-4">
                                                        <button
                                                            onClick={() => addSemester(branch.branchId)}
                                                            className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                        >
                                                            <FaPlus size={12} />
                                                            Add Semester
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'faculty' && (
                    <>
                        {/* Faculty Header */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-6">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-100 rounded-xl">
                                            <FaUsers className="text-3xl text-indigo-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">Faculty Pool</h2>
                                            <p className="text-gray-500">{faculty.length} {faculty.length === 1 ? 'teacher' : 'teachers'}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaSearch className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search teachers..."
                                                value={facultySearchQuery}
                                                onChange={(e) => setFacultySearchQuery(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsFacultyModalOpen(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition whitespace-nowrap"
                                        >
                                            <FaPlus className="text-lg" />
                                            Add Teacher
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Faculty Table - Now Separate Component */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                            <div className="overflow-x-auto">
                                {filteredFaculty.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <FaUsers className="mx-auto text-4xl text-gray-400 mb-3" />
                                        <h4 className="text-lg font-medium text-gray-700">No faculty members yet</h4>
                                        <p className="text-gray-500 mb-4">Add your first teacher to get started</p>
                                        <button
                                            onClick={() => setIsFacultyModalOpen(true)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            Add Teacher
                                        </button>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 text-center font-semibold text-gray-600 text-xl">
                                            <tr>
                                                <th className="px-6 py-4">NAME</th>
                                                <th className="px-6 py-4">EMAIL</th>
                                                <th className="px-6 py-4">BRANCH</th>
                                                <th className="px-6 py-4">ACTIONS</th>
                                            </tr>
                                        </thead>

                                        <tbody className="bg-white divide-y divide-gray-200 text-center text-lg font-serif">
                                            {faculty.map(teacher => (
                                                <tr key={teacher.teacherId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-gray-800">{teacher.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-gray-600">{teacher.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-gray-600">
                                                            {teacher.branch || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex justify-center gap-4">
                                                            <button
                                                                onClick={() => openEditModal(teacher)}
                                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                                title="Edit teacher"
                                                            >
                                                                <FaEdit className="text-lg" />
                                                            </button>
                                                            <button
                                                                onClick={() => openUnavailabilityModal(teacher)}
                                                                className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                                                title="Edit availability"
                                                            >
                                                                <FaCalendarAlt className="text-lg" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteTeacher(teacher.teacherId)}
                                                                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Delete teacher"
                                                            >
                                                                <FaTrash className="text-lg" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}

            </main>
            <Footer />

            {/* Add Branch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
                            onClick={() => setIsModalOpen(false)}
                        ></div>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-50 relative overflow-hidden transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <IoMdSchool className="text-indigo-600 text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold">Create New Branch</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <span>Branch Name</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="e.g. Computer Science"
                                                value={branchName}
                                                onChange={(e) => setBranchName(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10"
                                            />
                                            <FaGraduationCap className="absolute left-3 top-3.5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <span>Semesters</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={numSemesters}
                                                    onChange={(e) => handleNumSemestersChange(e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none pl-10"
                                                >
                                                    <option value="">Select</option>
                                                    {[1, 2, 3, 4, 5].map((num) => (
                                                        <option key={num} value={num}>
                                                            {num}
                                                        </option>
                                                    ))}
                                                </select>
                                                <FaCalendarAlt className="absolute left-3 top-3.5 text-gray-400" />
                                                <div className="absolute right-3 top-3.5 pointer-events-none">
                                                    <FaChevronDown className="text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <span>Type</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex space-x-4 bg-gray-100 p-2 rounded-lg">
                                                <label className="flex items-center space-x-2 flex-1">
                                                    <input
                                                        type="radio"
                                                        checked={semesterType === 'odd'}
                                                        onChange={() => handleSemesterTypeChange('odd')}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-gray-700">Odd (1,3,5...)</span>
                                                </label>
                                                <label className="flex items-center space-x-2 flex-1">
                                                    <input
                                                        type="radio"
                                                        checked={semesterType === 'even'}
                                                        onChange={() => handleSemesterTypeChange('even')}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-gray-700">Even (2,4,6...)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {semestersData.length > 0 && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                <FaCalendarAlt className="text-indigo-400" />
                                                Semester Details
                                            </h3>
                                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {semestersData.map((sem, idx) => (
                                                    <div key={idx} className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Semester Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={sem.semesterName}
                                                                onChange={(e) => handleSemesterNameChange(idx, e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Sections
                                                            </label>
                                                            <select
                                                                value={sem.sections}
                                                                onChange={(e) => handleSectionChange(idx, e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            >
                                                                {[1, 2, 3, 4, 5].map((sec) => (
                                                                    <option key={sec} value={sec}>
                                                                        {sec}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBranch}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                                >
                                    Create Branch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Faculty Modal */}
            {isFacultyModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
                            onClick={() => setIsFacultyModalOpen(false)}
                        ></div>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-50 relative overflow-hidden transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <FaUsers className="text-indigo-600 text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold">Add New Teacher</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={newTeacherName}
                                            onChange={(e) => setNewTeacherName(e.target.value)}
                                            placeholder="Teacher's name"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={teacherEmail}
                                            onChange={(e) => setTeacherEmail(e.target.value)}
                                            placeholder="teacher@example.com"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1">Branch</label>
                                        <select
                                            value={teacherBranch}
                                            onChange={(e) => setTeacherBranch(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="N/A">N/A (General Faculty)</option>
                                            {currentBranches.map(branch => (
                                                <option key={branch.branchId} value={branch.branchName}>
                                                    {branch.branchName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                                <button
                                    onClick={() => setIsFacultyModalOpen(false)}
                                    className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddTeacher}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                                >
                                    Add Teacher
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {isEditModalOpen && editingTeacher && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
                            onClick={() => setIsEditModalOpen(false)}
                        ></div>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-50 relative overflow-hidden transform transition-all">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FaUserEdit className="text-blue-600 text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold">Edit Teacher</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editingTeacher.name}
                                            onChange={(e) => setEditingTeacher({
                                                ...editingTeacher,
                                                name: e.target.value
                                            })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editingTeacher.email}
                                            onChange={(e) => setEditingTeacher({
                                                ...editingTeacher,
                                                email: e.target.value
                                            })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1">Branch</label>
                                        <select
                                            value={editingTeacher.branch || 'N/A'}
                                            onChange={(e) => setEditingTeacher({
                                                ...editingTeacher,
                                                branch: e.target.value === 'N/A' ? "N/A" : e.target.value
                                            })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="N/A">N/A (General Faculty)</option>
                                            {currentBranches.map(branch => (
                                                <option key={branch.branchId} value={branch.branchName}>
                                                    {branch.branchName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTeacher}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unavailability Modal */}
            {isUnavailabilityModalOpen && currentTeacher && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-40"
                            onClick={closeUnavailabilityModal}
                        />

                        {/* Modal Container */}
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col z-50 overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <FaCalendarAlt className="text-2xl text-indigo-600" />
                                        <h2 className="text-xl font-bold">Availability for {currentTeacher.name}</h2>
                                    </div>
                                    <button
                                        onClick={closeUnavailabilityModal}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <FaTimes className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-sm">Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-sm">Allocated</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-sm">Unavailable</span>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto p-6">
                                <div className="grid grid-cols-6 gap-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="col-span-1">
                                            <div className="bg-indigo-100 text-indigo-800 text-center py-2 rounded-t-lg font-medium">
                                                {day}
                                            </div>
                                            <div className="space-y-2 p-2 border border-t-0 border-gray-200 rounded-b-lg">
                                                {Array.from({ length: periodsPerDay }, (_, i) => {
                                                    const period = i + 1;
                                                    const slotKey = `${day}-${period}`;
                                                    const slot = currentTeacher.unavailability?.[slotKey] || {
                                                        unavailable: false,
                                                        allocated: false,
                                                        message: 'No commitment'
                                                    };

                                                    const status = slot.allocated ? 'allocated' :
                                                        slot.unavailable ? 'unavailable' : 'available';

                                                    const statusClasses = {
                                                        available: 'bg-green-100 text-green-800 hover:bg-green-200',
                                                        allocated: 'bg-blue-500 text-white cursor-not-allowed',
                                                        unavailable: 'bg-red-500 text-white hover:bg-red-600'
                                                    };

                                                    return (
                                                        <div key={period} className="flex flex-col">
                                                            <div className="flex">
                                                                <button
                                                                    onClick={() => toggleUnavailability(slotKey)}
                                                                    className={`flex-1 py-2 text-sm rounded-l transition-all ${statusClasses[status]}`}
                                                                    title={slot.allocated ? "Allocated in timetable" : ""}
                                                                >
                                                                    P{period}
                                                                </button>
                                                                <button
                                                                    onClick={() => !slot.allocated && openMessageModal(slotKey, slot.message)}
                                                                    className={`py-2 px-3 rounded-r ${status === 'allocated' ? 'bg-blue-600 text-white cursor-not-allowed' :
                                                                        'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                        }`}
                                                                    disabled={slot.allocated || !slot.unavailable}
                                                                >
                                                                    <FaEdit className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            {slot.message && (
                                                                <div className="mt-1 text-xs text-gray-500 truncate" title={slot.message}>
                                                                    {slot.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t sticky bottom-0">
                                <button
                                    onClick={closeUnavailabilityModal}
                                    className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveUnavailability}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
                            onClick={closeMessageModal}
                        ></div>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-50 relative overflow-hidden transform transition-all">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Unavailability Reason</h2>
                                    <button
                                        onClick={closeMessageModal}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <FaTimes className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for {currentSlot} unavailability
                                    </label>
                                    <textarea
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                        rows={3}
                                        placeholder="e.g. Meeting, Personal time, Other commitment..."
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                                <button
                                    onClick={closeMessageModal}
                                    className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveMessage}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                                >
                                    Save Reason
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Institution;