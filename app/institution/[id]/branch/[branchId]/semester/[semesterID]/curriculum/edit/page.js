'use client';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave, FaFlask, FaUsers, FaExclamationTriangle, FaMinus, FaChalkboardTeacher, FaBook, FaCog, FaArrowLeft, FaUniversity } from 'react-icons/fa';

const SemesterSetup = () => {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const branchId = Number(params.branchId);
    const semesterID = decodeURIComponent(params.semesterID);

    // Loading state
    const [loading, setLoading] = useState(true);

    // Branches state
    const [currentBranches, setCurrentBranches] = useState([]);
    const [currentSemester, setCurrentSemester] = useState(null);
    const [sectionsCount, setSectionsCount] = useState(0);

    // Faculty state
    const [faculty, setFaculty] = useState([]);

    // Teacher form states
    const [newTeacherName, setNewTeacherName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const [teacherBranch, setTeacherBranch] = useState('N/A');
    const periodsPerDay = 8;

    // Modal state for adding teachers
    const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

    // Lab state
    const [labs, setLabs] = useState([]);

    // Lab form states
    const [newLabName, setNewLabName] = useState('');
    const [labRoomNumber, setLabRoomNumber] = useState('');
    const [labBuilding, setLabBuilding] = useState('');

    // Modal state for adding new lab room
    const [isLabModalOpen, setIsLabModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        weekdayPeriods: 6,
        saturdayPeriods: 4,
        shortBreakAfter: 2,
        lunchBreakAfter: 4,
        subjects: [
            {
                id: 1,
                name: 'Subject 1',
                frequency: 1,
                teachers: ['']
            }
        ],
        labs: []
    });

    useEffect(() => {
        const fetchData = () => {
            try {
                // Fetch faculty for this institution
                const allFaculty = JSON.parse(localStorage.getItem('faculty')) || [];
                const instituteFaculty = allFaculty.filter(
                    teacher => teacher.instituteId === id
                );
                setFaculty(instituteFaculty);

                // Fetch branches for the current institute
                const allBranches = JSON.parse(localStorage.getItem('branches')) || [];
                const branchesForInstitute = allBranches.filter((branch) => branch.instituteId == id);
                setCurrentBranches(branchesForInstitute);

                // Find current branch and semester
                const currentBranch = branchesForInstitute.find(branch => branch.branchId == branchId);
                if (currentBranch) {
                    const semester = currentBranch.semesters.find(sem => sem.semesterId === semesterID);
                    if (semester) {
                        setCurrentSemester(semester);
                        setSectionsCount(semester.sections || 0);
                    }
                }

                // Fetch labs for the current institute
                const allLabs = JSON.parse(localStorage.getItem('labs')) || [];
                const labsForInstitute = allLabs.filter(lab => lab.instituteId === id);
                setLabs(labsForInstitute);

                // Check for existing semester configuration
                const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];
                const existingConfig = semesterConfigs.find(
                    config =>
                        config.instituteId === id &&
                        config.branchId === branchId &&
                        config.semesterId === semesterID
                );

                if (existingConfig) {
                    setFormData(existingConfig);
                }
            } catch (error) {
                toast.error('Failed to load data');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, branchId, semesterID, sectionsCount]);

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

    // Add new lab
    const handleAddLab = () => {
        if (!newLabName.trim()) {
            toast.error('Lab name is required');
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
                    message: 'Available'
                };
            }
        });

        const lab = {
            labName: newLabName,
            roomNumber: labRoomNumber || 'N/A',
            building: labBuilding || 'N/A',
            instituteId: id,
            labId: Date.now().toString(),
            unavailability: initialAvailability
        };

        const updatedLabs = [...labs, lab];
        setLabs(updatedLabs);
        localStorage.setItem('labs', JSON.stringify(updatedLabs));

        setNewLabName('');
        setLabRoomNumber('');
        setLabBuilding('');
        setIsLabModalOpen(false);
        toast.success('Lab added successfully');
    };

    // Handle input change for form fields of periods section
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (value === '') {
            setFormData(prev => ({
                ...prev,
                [name]: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: Number(value)
            }));
        }
    };

    // Add new subject form
    const addSubjectForm = () => {
        setFormData(prev => ({
            ...prev,
            subjects: [...prev.subjects, {
                id: prev.subjects.length ? prev.subjects[prev.subjects.length - 1].id + 1 : 1,
                name: `Subject ${prev.subjects.length + 1}`,
                frequency: 1,
                teachers: ['']
            }]
        }));
    };

    // Update subject form
    const updateSubject = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject => {
                if (subject.id === id) {
                    return { ...subject, [field]: value };
                }
                return subject;
            })
        }));
    };

    // Remove subject form
    const removeSubject = (id) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter(subject => subject.id !== id)
        }));
    };

    // Add teacher to a specific subject
    const addTeacherToSubject = (subjectId) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject =>
                subject.id === subjectId
                    ? {
                        ...subject,
                        teachers: [...subject.teachers, '']
                    }
                    : subject
            )
        }));
    };

    // Remove teacher from a specific subject
    const removeTeacherFromSubject = (subjectId, teacherIndex) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject =>
                subject.id === subjectId
                    ? {
                        ...subject,
                        teachers: subject.teachers.filter((_, index) => index !== teacherIndex)
                    }
                    : subject
            )
        }));
    };

    // Update teacher in subject
    const updateSubjectTeacher = (subjectId, teacherIndex, value) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject =>
                subject.id === subjectId
                    ? {
                        ...subject,
                        teachers: subject.teachers.map((teacher, index) =>
                            index === teacherIndex ? value : teacher
                        )
                    }
                    : subject
            )
        }));
    };

    // Add lab form
    const addLabForm = () => {
        setFormData(prev => ({
            ...prev,
            labs: [...prev.labs, {
                id: prev.labs.length ? prev.labs[prev.labs.length - 1].id + 1 : 1,
                name: `Lab ${prev.labs.length + 1}`,
                frequency: 1,
                labRoom: '',
                teachers: ['']
            }]
        }));
    };

    // Update lab
    const updateLab = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab => {
                if (lab.id === id) {
                    return { ...lab, [field]: value };
                }
                return lab;
            })
        }));
    };

    // Remove lab 
    const removeLab = (id) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.filter(lab => lab.id !== id)
        }));
    };

    // Add teacher to lab
    const addTeacherToLab = (labId) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab => {
                if (lab.id === labId) {
                    return { ...lab, teachers: [...(lab.teachers || []), ''] };
                }
                return lab;
            })
        }));
    };

    // Remove teacher from lab
    const removeTeacherFromLab = (labId, teacherIndex) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab => {
                if (lab.id === labId) {
                    // Don't allow removing the only teacher
                    if (lab.teachers.length <= 1) return lab;
                    return {
                        ...lab,
                        teachers: lab.teachers.filter((_, index) => index !== teacherIndex)
                    };
                }
                return lab;
            })
        }));
    };

    // Update teacher in lab
    const updateLabTeacher = (labId, teacherIndex, value) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab => {
                if (lab.id === labId) {
                    const updatedTeachers = [...(lab.teachers || [])];
                    updatedTeachers[teacherIndex] = value;
                    return { ...lab, teachers: updatedTeachers };
                }
                return lab;
            })
        }));
    };

    // Save configuration
    const saveConfiguration = () => {
        if (formData.weekdayPeriods === 0) {
            toast.error('Weekday Periods cannot be zero');
            return;
        }

        // Validate before saving
        if (formData.subjects.length === 0 && formData.labs.length === 0) {
            toast.error('Please add at least one subject or lab');
            return;
        }

        // Validate subjects
        for (const subject of formData.subjects) {
            if (!subject.name.trim()) {
                toast.error('Please fill in all subject names');
                return;
            }
            if (subject.frequency < 1) {
                toast.error('Subject frequency must be at least 1');
                return;
            }
            for (const teacherId of subject.teachers) {
                if (!teacherId) {
                    toast.error('Please assign teachers to all subjects');
                    return;
                }
            }
        }

        // Validate labs (removed labRoom validation)
        for (const lab of formData.labs) {
            if (lab.frequency < 1) {
                toast.error('Lab frequency must be at least 1');
                return;
            }

            if (!lab.name?.trim()) {
                toast.error('Please enter a name for all lab sessions');
                return;
            }

            // Lab room is optional, so no validation for it

            for (const teacherId of lab.teachers) {
                if (!teacherId) {
                    toast.error('Please assign teachers to all lab sessions');
                    return;
                }
            }
        }

        const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];

        // Remove existing config if any
        const filteredConfigs = semesterConfigs.filter(
            config =>
                !(config.instituteId === id &&
                    config.branchId === branchId &&
                    config.semesterId === semesterID)
        );

        const newConfig = {
            instituteId: id,
            branchId: branchId,
            semesterId: semesterID,
            ...formData
        };

        localStorage.setItem('semesterConfigs', JSON.stringify([...filteredConfigs, newConfig]));
        toast.success('Configuration saved successfully');

        router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Toaster position="top-center" />
                <Navbar />

                <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-6xl w-full">
                    {/* Header Section */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push(`#`)}
                            className="flex items-center text-gray-600 hover:text-indigo-700 mb-4 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" /> Back to Branch
                        </button>

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">
                                        {currentSemester?.semesterName}
                                        {' '} Curriculum
                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        Configure your semester timetable settings and assign faculty
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsFacultyModalOpen(true)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md self-start md:self-auto"
                                >
                                    <FaChalkboardTeacher /> Add New Faculty
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                                    <FaUsers className="mr-2" />
                                    {currentSemester?.sections} Section{currentSemester?.sections !== 1 ? 's' : ''}
                                </span>

                                {currentSemester?.sectionNames && currentSemester.sectionNames.length > 0 && (
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-600 mr-2">Sections:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {currentSemester.sectionNames.map((section, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium"
                                                >
                                                    {section}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {faculty.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100 text-center">
                            <div className="mx-auto h-20 w-20 text-yellow-500 mb-4 flex items-center justify-center bg-yellow-50 rounded-full">
                                <FaExclamationTriangle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                No Faculty Members Found
                            </h2>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                You need to add teachers before you can create subjects and labs for this semester.
                            </p>
                            <button
                                onClick={() => setIsFacultyModalOpen(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-sm hover:shadow-md"
                            >
                                <FaPlus /> Add First Teacher
                            </button>
                        </div>
                    )}

                    {faculty.length > 0 && <>
                        {/* Period Configuration Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <FaCog className="text-xl" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Period Configuration
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Weekday Settings */}
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Weekday Periods
                                        </label>
                                        <input
                                            type="number"
                                            name="weekdayPeriods"
                                            min="1"
                                            max="10"
                                            value={formData.weekdayPeriods}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Number of periods on weekdays (Mon-Fri)
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Short Break After
                                        </label>
                                        <input
                                            type="number"
                                            name="shortBreakAfter"
                                            min="1"
                                            max={formData.weekdayPeriods - 1}
                                            value={formData.shortBreakAfter}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            After how many periods to have a short break
                                        </p>
                                    </div>
                                </div>

                                {/* Weekend Settings */}
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Saturday Periods
                                        </label>
                                        <input
                                            type="number"
                                            name="saturdayPeriods"
                                            min="0"
                                            max="8"
                                            value={formData.saturdayPeriods}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Number of periods on Saturday (0 for no classes)
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lunch Break After
                                        </label>
                                        <input
                                            type="number"
                                            name="lunchBreakAfter"
                                            min="1"
                                            max={formData.weekdayPeriods - 1}
                                            value={formData.lunchBreakAfter}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            After how many periods to have lunch break
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subjects Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <FaBook className="text-xl" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Subjects
                                    </h2>
                                </div>
                                {formData.subjects.length === 0 && (
                                    <button
                                        onClick={addSubjectForm}
                                        disabled={faculty.length === 0}
                                        className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${faculty.length === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                                            }`}
                                    >
                                        <FaPlus /> Add Subject
                                    </button>
                                )}
                            </div>

                            {formData.subjects.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="mx-auto h-20 w-20 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                                        <FaBook className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects added</h3>
                                    <p className="text-gray-500 mb-4">
                                        {faculty.length === 0
                                            ? 'Add teachers first to create subjects'
                                            : 'Add your first subject to get started'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {formData.subjects.map((subject, index) => (
                                        <div key={subject.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative transition-all hover:shadow-sm">
                                            <button
                                                onClick={() => removeSubject(subject.id)}
                                                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                                title="Delete subject"
                                            >
                                                <FaTrash />
                                            </button>
                                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                                <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3">
                                                    {index + 1}
                                                </span>
                                                Subject Details
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Subject Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={subject.name}
                                                        onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                        placeholder="e.g. Data Structures"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Frequency (per week)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={subject.frequency}
                                                        onChange={(e) => updateSubject(subject.id, 'frequency', Number(e.target.value))}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                            </div>

                                            {/* Teachers Section */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-700">Teachers:</h4>
                                                    <button
                                                        onClick={() => addTeacherToSubject(subject.id)}
                                                        disabled={subject.teachers?.length >= sectionsCount * 2}
                                                        className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${subject.teachers?.length >= sectionsCount * 2
                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        <FaPlus className="text-xs" /> Add Teacher
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {subject.teachers?.map((teacherId, teacherIndex) => (
                                                        <div key={teacherIndex} className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <label className="block text-xs text-gray-600 mb-1">
                                                                    Teacher {teacherIndex + 1}
                                                                </label>
                                                                <select
                                                                    value={teacherId}
                                                                    onChange={(e) => updateSubjectTeacher(subject.id, teacherIndex, e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                                >
                                                                    <option value="">Select Teacher</option>
                                                                    {faculty.map(teacher => (
                                                                        <option key={teacher.teacherId} value={teacher.teacherId}>
                                                                            {teacher.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            {subject.teachers.length > 1 && (
                                                                <button
                                                                    onClick={() => removeTeacherFromSubject(subject.id, teacherIndex)}
                                                                    className="mt-5 p-2 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-lg"
                                                                    title="Remove teacher"
                                                                >
                                                                    <FaMinus />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {subject.teachers?.length >= sectionsCount && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Maximum {sectionsCount} teachers recommended (one per section)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {formData.subjects.length !== 0 && (
                                        <div className="flex justify-end border-t border-gray-200 pt-5 mt-5">
                                            <button
                                                onClick={addSubjectForm}
                                                disabled={faculty.length === 0}
                                                className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${faculty.length === 0
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                                                    }`}
                                            >
                                                <FaPlus /> Add Subject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Labs Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <FaFlask className="text-xl" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Laboratory Sessions
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsLabModalOpen(true)}
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                >
                                    <FaPlus /> Add New Lab Room
                                </button>
                            </div>

                            {formData.labs.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="mx-auto h-20 w-20 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                                        <FaFlask className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No lab sessions added</h3>
                                    <p className="text-gray-500 mb-6">Click &quot;Add Lab Session&quot; to get started</p>
                                    <button
                                        onClick={addLabForm}
                                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        <FaPlus /> Add Lab Session
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {formData.labs.map((lab, index) => (
                                        <div key={lab.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative transition-all hover:shadow-sm">
                                            <button
                                                onClick={() => removeLab(lab.id)}
                                                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                                title="Delete lab session"
                                            >
                                                <FaTrash />
                                            </button>

                                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                                <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mr-3">
                                                    {index + 1}
                                                </span>
                                                Lab Session Details
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Lab Session Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lab.name}
                                                        onChange={(e) => updateLab(lab.id, 'name', e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                        placeholder="e.g. Chemistry Lab"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Frequency (per week)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={lab.frequency}
                                                        onChange={(e) => updateLab(lab.id, 'frequency', Number(e.target.value))}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Lab Room (Optional)
                                                </label>
                                                <select
                                                    value={lab.labRoom || ''}
                                                    onChange={(e) => updateLab(lab.id, 'labRoom', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                >
                                                    <option value="">Select Lab Room (Optional)</option>
                                                    {labs.map(labRoom => (
                                                        <option key={labRoom.labId} value={labRoom.labId}>
                                                            {labRoom.labName} ({labRoom.roomNumber})
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Optional: Select if you want to assign a specific lab room
                                                </p>
                                            </div>

                                            {/* Teachers Assignment Section */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-700">
                                                        Assign Teachers
                                                    </h4>

                                                    <button
                                                        onClick={() => addTeacherToLab(lab.id)}
                                                        disabled={lab.teachers?.length >= 10}
                                                        className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${lab.teachers?.length >= 10
                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        <FaPlus className="text-xs" /> Add Teacher
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {lab.teachers?.map((teacherId, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <label className="block text-xs text-gray-600 mb-1">
                                                                    Teacher {index + 1}
                                                                    {index === 0 && <span className="text-red-500"> (Required)</span>}
                                                                </label>
                                                                <select
                                                                    value={teacherId || ''}
                                                                    onChange={(e) => updateLabTeacher(lab.id, index, e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                                >
                                                                    <option value="">Select Teacher</option>
                                                                    {faculty.map(teacher => (
                                                                        <option key={teacher.teacherId} value={teacher.teacherId}>
                                                                            {teacher.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {index > 0 && (
                                                                <button
                                                                    onClick={() => removeTeacherFromLab(lab.id, index)}
                                                                    className="mt-5 p-2 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-lg"
                                                                    title="Remove extra teacher"
                                                                >
                                                                    <FaMinus />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {formData.labs.length > 0 && (
                                <div className="flex justify-end border-t border-gray-200 mt-5 pt-5">
                                    <button
                                        onClick={addLabForm}
                                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        <FaPlus /> Add Lab Session
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <button
                                onClick={() => router.push(`/institution/${id}/branch/${branchId}`)}
                                className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveConfiguration}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <FaSave /> Save Configuration
                            </button>
                        </div>
                    </>
                    }
                </main>
                <Footer />

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

                {/* Add Lab Modal */}
                {isLabModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <div
                                className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
                                onClick={() => setIsLabModalOpen(false)}
                            ></div>
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-50 relative overflow-hidden transform transition-all">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <FaUniversity className="text-indigo-600 text-xl" />
                                        </div>
                                        <h2 className="text-xl font-bold">Add New Laboratory</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <span>Lab Name</span>
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newLabName}
                                                onChange={(e) => setNewLabName(e.target.value)}
                                                placeholder="e.g. Computer Lab, Physics Lab"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                            <input
                                                type="text"
                                                value={labRoomNumber}
                                                onChange={(e) => setLabRoomNumber(e.target.value)}
                                                placeholder="e.g. 101, A-12"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1">Building/Block</label>
                                            <input
                                                type="text"
                                                value={labBuilding}
                                                onChange={(e) => setLabBuilding(e.target.value)}
                                                placeholder="e.g. Main Building, Science Block"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                                    <button
                                        onClick={() => setIsLabModalOpen(false)}
                                        className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddLab}
                                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                                    >
                                        Add Laboratory
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SemesterSetup;

// 'use client';
// import Footer from '@/components/Footer';
// import Navbar from '@/components/Navbar';
// import { useParams, useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import toast, { Toaster } from 'react-hot-toast';
// import { FaPlus, FaTrash, FaSave, FaFlask, FaUsers, FaExclamationTriangle, FaMinus, FaChalkboardTeacher, FaBook, FaCog, FaArrowLeft, FaUniversity } from 'react-icons/fa';

// const SemesterSetup = () => {
//     const params = useParams();
//     const router = useRouter();
//     const id = Number(params.id);
//     const branchId = Number(params.branchId);
//     const semesterID = decodeURIComponent(params.semesterID);

//     // Loading state
//     const [loading, setLoading] = useState(true);

//     // Branches state
//     const [currentBranches, setCurrentBranches] = useState([]);
//     const [currentSemester, setCurrentSemester] = useState(null);
//     const [sectionsCount, setSectionsCount] = useState(0);

//     // Faculty state
//     const [faculty, setFaculty] = useState([]);

//     // Teacher form states
//     const [newTeacherName, setNewTeacherName] = useState('');
//     const [teacherEmail, setTeacherEmail] = useState('');
//     const [teacherBranch, setTeacherBranch] = useState('N/A');
//     const periodsPerDay = 8;

//     // Modal state for adding teachers
//     const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

//     // Lab state
//     const [labs, setLabs] = useState([]);

//     //Lab form states
//     // New lab form states
//     const [newLabName, setNewLabName] = useState('');
//     const [labRoomNumber, setLabRoomNumber] = useState('');
//     const [labBuilding, setLabBuilding] = useState('');

//     // Modal state for adding new lab room
//     const [isLabModalOpen, setIsLabModalOpen] = useState(false);

//     // Form state
//     const [formData, setFormData] = useState({
//         weekdayPeriods: 6,
//         saturdayPeriods: 4,
//         shortBreakAfter: 2,
//         lunchBreakAfter: 4,
//         subjects: [
//             {
//                 id: 1,
//                 name: 'Subject 1',
//                 frequency: 1,
//                 teachers: [''],
//                 isElective: false,
//                 electiveOptions: []
//             }
//         ],
//         labs: []
//     });

//     useEffect(() => {
//         const fetchData = () => {
//             try {
//                 // Fetch faculty for this institution
//                 const allFaculty = JSON.parse(localStorage.getItem('faculty')) || [];
//                 console.log('All Faculty:', allFaculty);

//                 const instituteFaculty = allFaculty.filter(
//                     teacher => teacher.instituteId === id

//                 );
//                 console.log('Filtered Faculty:', instituteFaculty);
//                 console.log('Institute Faculty:', instituteFaculty);
//                 setFaculty(instituteFaculty);

//                 // Fetch branches for the current institute
//                 const allBranches = JSON.parse(localStorage.getItem('branches')) || [];
//                 const branchesForInstitute = allBranches.filter((branch) => branch.instituteId == id);
//                 setCurrentBranches(branchesForInstitute);

//                 // Find current branch and semester
//                 const currentBranch = branchesForInstitute.find(branch => branch.branchId == branchId);
//                 console.log('Current Branch:', currentBranch);
//                 if (currentBranch) {
//                     const semester = currentBranch.semesters.find(sem => sem.semesterId === semesterID);
//                     console.log('Current Semester:', semester);
//                     if (semester) {
//                         setCurrentSemester(semester);
//                         setSectionsCount(semester.sections || 0);
//                     }
//                 }

//                 // Fetch labs for the current institute
//                 const allLabs = JSON.parse(localStorage.getItem('labs')) || [];
//                 const labsForInstitute = allLabs.filter(lab => lab.instituteId === id);
//                 setLabs(labsForInstitute);

//                 // Check for existing semester configuration
//                 const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];
//                 console.log('Semester Configs:', semesterConfigs);
//                 const existingConfig = semesterConfigs.find(
//                     config =>
//                         config.instituteId === id &&
//                         config.branchId === branchId &&
//                         config.semesterId === semesterID
//                 );

//                 console.log('Existing Config:', existingConfig);
//                 console.log('Current ID:', id);
//                 console.log('Current Branch ID:', branchId);
//                 console.log('Current Semester ID:', semesterID);

//                 if (existingConfig) {
//                     console.log('Existing Semester Config:', existingConfig);
//                     setFormData(existingConfig);
//                 }
//             } catch (error) {
//                 toast.error('Failed to load data');
//                 console.error(error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, [id, branchId, semesterID, sectionsCount]);

//     // Faculty functions
//     const handleAddTeacher = () => {
//         if (!newTeacherName.trim()) {
//             toast.error('Teacher name is required');
//             return;
//         }

//         const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         const initialAvailability = {};

//         days.forEach(day => {
//             const periods = periodsPerDay;
//             for (let period = 1; period <= periods; period++) {
//                 const slotKey = `${day}-${period}`;
//                 initialAvailability[slotKey] = {
//                     unavailable: false,
//                     allocated: false,
//                     message: 'No commitment'
//                 };
//             }
//         });

//         const teacher = {
//             name: newTeacherName,
//             email: teacherEmail || 'N/A',
//             branch: teacherBranch || 'N/A',
//             instituteId: id,
//             teacherId: Date.now().toString(),
//             unavailability: initialAvailability
//         };

//         const updatedFaculty = [...faculty, teacher];
//         setFaculty(updatedFaculty);
//         localStorage.setItem('faculty', JSON.stringify(updatedFaculty));

//         setNewTeacherName('');
//         setTeacherEmail('');
//         setTeacherBranch('N/A');
//         setIsFacultyModalOpen(false);
//         toast.success('Teacher added successfully');
//     };

//     // Add new lab
//     const handleAddLab = () => {
//         if (!newLabName.trim()) {
//             toast.error('Lab name is required');
//             return;
//         }

//         const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         const initialAvailability = {};

//         days.forEach(day => {
//             const periods = periodsPerDay;
//             for (let period = 1; period <= periods; period++) {
//                 const slotKey = `${day}-${period}`;
//                 initialAvailability[slotKey] = {
//                     unavailable: false,
//                     allocated: false,
//                     message: 'Available'
//                 };
//             }
//         });

//         const lab = {
//             labName: newLabName,
//             roomNumber: labRoomNumber || 'N/A',
//             building: labBuilding || 'N/A',
//             instituteId: id,
//             labId: Date.now().toString(),
//             unavailability: initialAvailability
//         };

//         const updatedLabs = [...labs, lab];
//         setLabs(updatedLabs);
//         localStorage.setItem('labs', JSON.stringify(updatedLabs));

//         setNewLabName('');
//         setLabRoomNumber('');
//         setLabBuilding('');
//         setIsLabModalOpen(false);
//         toast.success('Lab added successfully');
//     };

//     // Handle input change for form fields of periods section
//     const handleInputChange = (e) => {
//         const { name, value } = e.target;

//         // Handle empty input (when user clears the field)
//         if (value === '') {
//             setFormData(prev => ({
//                 ...prev,
//                 [name]: '' // Set to empty string instead of 0
//             }));
//         } else {
//             // Convert to number only if value is not empty
//             setFormData(prev => ({
//                 ...prev,
//                 [name]: Number(value)
//             }));
//         }
//     };

//     // Add new subject form
//     const addSubjectForm = () => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: [...prev.subjects, {
//                 id: prev.subjects.length ? prev.subjects[prev.subjects.length - 1].id + 1 : 1,
//                 name: `Subject ${prev.subjects.length + 1}`,
//                 frequency: 1,
//                 teachers: [''],
//                 isElective: false,
//                 electiveOptions: []
//             }]
//         }));
//     };

//     // Update subject form
//     const updateSubject = (id, field, value) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === id) {
//                     return { ...subject, [field]: value };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Remove subject form
//     const removeSubject = (id) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.filter(subject => subject.id !== id)
//         }));
//     };

//     // Add teacher to a specific subject
//     const addTeacherToSubject = (subjectId) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject =>
//                 subject.id === subjectId
//                     ? {
//                         ...subject,
//                         teachers: [...subject.teachers, '']
//                     }
//                     : subject
//             )
//         }));
//     };

//     // Remove teacher from a specific subject
//     const removeTeacherFromSubject = (subjectId, teacherIndex) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject =>
//                 subject.id === subjectId
//                     ? {
//                         ...subject,
//                         teachers: subject.teachers.filter((_, index) => index !== teacherIndex)
//                     }
//                     : subject
//             )
//         }));
//     };

//     // Update teacher in subject
//     const updateSubjectTeacher = (subjectId, teacherIndex, value) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject =>
//                 subject.id === subjectId
//                     ? {
//                         ...subject,
//                         teachers: subject.teachers.map((teacher, index) =>
//                             index === teacherIndex ? value : teacher
//                         )
//                     }
//                     : subject
//             )
//         }));
//     };

//     // Toggle elective subject
//     const toggleElectiveSubject = (subjectId) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     const updatedIsElective = !subject.isElective;
//                     let ch = 'A';
//                     return {
//                         ...subject,
//                         isElective: updatedIsElective,
//                         teachers: updatedIsElective ? [] : [''],
//                         electiveOptions: updatedIsElective ?
//                             [{ id: Date.now(), name: `${subject.name} - Elective ${ch}`, teachers: [''] }] :
//                             []
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Add another option in elective subject
//     const addElectiveOption = (subjectId) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     return {
//                         ...subject,
//                         electiveOptions: [
//                             ...subject.electiveOptions,
//                             {
//                                 id: Date.now(),
//                                 name: `${subject.name} - Elective ${String.fromCharCode(65 + subject.electiveOptions.length)}`,
//                                 teachers: ['']
//                             }
//                         ]
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Update elective option
//     const updateElectiveOption = (subjectId, optionId, field, value) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     return {
//                         ...subject,
//                         electiveOptions: subject.electiveOptions.map(option => {
//                             if (option.id === optionId) {
//                                 return { ...option, [field]: value };
//                             }
//                             return option;
//                         })
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Remove elective option
//     const removeElectiveOption = (subjectId, optionId) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     return {
//                         ...subject,
//                         electiveOptions: subject.electiveOptions.filter(option => option.id !== optionId)
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Add teacher to elective option
//     const addTeacherToElectiveOption = (subjectId, optionId) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     return {
//                         ...subject,
//                         electiveOptions: subject.electiveOptions.map(option => {
//                             if (option.id === optionId) {
//                                 return {
//                                     ...option,
//                                     teachers: [...option.teachers, '']
//                                 };
//                             }
//                             return option;
//                         })
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Remove teacher from elective option
//     const removeTeacherFromElectiveOption = (subjectId, optionId, teacherIndex) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     return {
//                         ...subject,
//                         electiveOptions: subject.electiveOptions.map(option => {
//                             if (option.id === optionId) {
//                                 return {
//                                     ...option,
//                                     teachers: option.teachers.filter((_, index) => index !== teacherIndex)
//                                 };
//                             }
//                             return option;
//                         })
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Update elective option teacher
//     const updateElectiveOptionTeacher = (subjectId, optionId, teacherIndex, value) => {
//         setFormData(prev => ({
//             ...prev,
//             subjects: prev.subjects.map(subject => {
//                 if (subject.id === subjectId) {
//                     return {
//                         ...subject,
//                         electiveOptions: subject.electiveOptions.map(option => {
//                             if (option.id === optionId) {
//                                 const updatedTeachers = [...option.teachers];
//                                 updatedTeachers[teacherIndex] = value;
//                                 return { ...option, teachers: updatedTeachers };
//                             }
//                             return option;
//                         })
//                     };
//                 }
//                 return subject;
//             })
//         }));
//     };

//     // Add lab form
//     const addLabForm = () => {
//         setFormData(prev => ({
//             ...prev,
//             labs: [...prev.labs, {
//                 id: prev.labs.length ? prev.labs[prev.labs.length - 1].id + 1 : 1,
//                 name: `Lab Session ${prev.labs.length + 1}`,
//                 frequency: 1,
//                 labRooms: [''],
//                 teachersRequired: 1,
//                 sessionType: 'fullClass',
//                 batchScheduleType: '',
//                 numberOfBatches: 1,
//                 teachers: Array(1).fill(''),
//                 keepSameTeachers: false
//             }]
//         }));
//     };

//     // Update lab
//     const updateLab = (id, field, value) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === id) {
//                     const updatedLab = { ...lab, [field]: value };

//                     if (field === 'sessionType' && value === 'batchWise') {
//                         updatedLab.batchScheduleType = 'samePeriod';
//                         updatedLab.numberOfBatches = 2;
//                         // For same period batch-wise, ensure we have enough lab rooms
//                         updatedLab.labRooms = updatedLab.labRooms || [''];
//                         if (updatedLab.labRooms.length < 2) {
//                             updatedLab.labRooms = Array(2).fill('').map((_, i) =>
//                                 updatedLab.labRooms[i] || ''
//                             );
//                         }
//                     }

//                     if (field === 'sessionType' && value === 'fullClass') {
//                         updatedLab.batchScheduleType = '';
//                         updatedLab.numberOfBatches = 1;
//                         // For full class, ensure we have at least one lab room
//                         updatedLab.labRooms = updatedLab.labRooms && updatedLab.labRooms.length > 0
//                             ? updatedLab.labRooms
//                             : [''];
//                     }

//                     // When batchScheduleType changes
//                     if (field === 'batchScheduleType') {
//                         if (value === 'samePeriod') {
//                             // For same period, ensure we have enough lab rooms
//                             updatedLab.labRooms = updatedLab.labRooms || [''];
//                             if (updatedLab.labRooms.length < (updatedLab.numberOfBatches || 2)) {
//                                 updatedLab.labRooms = Array(updatedLab.numberOfBatches || 2).fill('').map((_, i) =>
//                                     updatedLab.labRooms[i] || ''
//                                 );
//                             }
//                         } else {
//                             // For different periods, we only need at least one lab room
//                             updatedLab.labRooms = updatedLab.labRooms && updatedLab.labRooms.length > 0
//                                 ? updatedLab.labRooms
//                                 : [''];
//                         }
//                     }

//                     // When numberOfBatches changes for same period
//                     if (field === 'numberOfBatches' && updatedLab.batchScheduleType === 'samePeriod') {
//                         updatedLab.labRooms = updatedLab.labRooms || [''];
//                         if (updatedLab.labRooms.length < value) {
//                             // Add more lab rooms if needed
//                             updatedLab.labRooms = Array(value).fill('').map((_, i) =>
//                                 updatedLab.labRooms[i] || ''
//                             );
//                         } else if (updatedLab.labRooms.length > value) {
//                             // Remove extra lab rooms if needed (but keep at least the required number)
//                             updatedLab.labRooms = updatedLab.labRooms.slice(0, value);
//                         }
//                     }

//                     // When teachersRequired changes, adjust teachers array
//                     if (field === 'teachersRequired' || field === 'numberOfBatches' || field === 'sessionType' || field === 'batchScheduleType') {
//                         const minTeachers = getMinTeachersRequired(updatedLab);

//                         // Resize teachers array to meet new minimum requirement
//                         if (!updatedLab.teachers || updatedLab.teachers.length < minTeachers) {
//                             updatedLab.teachers = Array(minTeachers).fill('').map((_, i) =>
//                                 lab.teachers?.[i] || ''
//                             );
//                         }
//                     }

//                     return updatedLab;
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Add lab room to a session
//     const addLabRoomToBatch = (labId) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === labId) {
//                     const currentRooms = lab.labRooms || [''];
//                     return {
//                         ...lab,
//                         labRooms: [...currentRooms, '']
//                     };
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Update lab room for a specific index
//     const updateLabRoomForBatch = (labId, roomIndex, value) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === labId) {
//                     const currentRooms = lab.labRooms || [''];
//                     const updatedRooms = [...currentRooms];
//                     updatedRooms[roomIndex] = value;
//                     return { ...lab, labRooms: updatedRooms };
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Remove lab room from a session
//     const removeLabRoomFromBatch = (labId, roomIndex) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === labId) {
//                     const currentRooms = lab.labRooms || [''];

//                     // Don't allow removing below minimum required for same period batch-wise
//                     if (lab.sessionType === 'batchWise' &&
//                         lab.batchScheduleType === 'samePeriod' &&
//                         currentRooms.length <= (lab.numberOfBatches || 2)) {
//                         return lab;
//                     }

//                     // Don't allow removing the only lab room for other session types
//                     if (currentRooms.length <= 1) {
//                         return lab;
//                     }

//                     return {
//                         ...lab,
//                         labRooms: currentRooms.filter((_, index) => index !== roomIndex)
//                     };
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Remove lab 
//     const removeLab = (id) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.filter(lab => lab.id !== id)
//         }));
//     };

//     // Calculate minimum teachers required based on scenario
//     const getMinTeachersRequired = (lab) => {
//         if (lab.sessionType === 'fullClass') {
//             return lab.teachersRequired || 1;
//         } else if (lab.batchScheduleType === 'samePeriod') {
//             return (lab.teachersRequired || 1) * (lab.numberOfBatches || 2);
//         } else {
//             return lab.teachersRequired || 1;
//         }
//     };

//     // Add teacher to lab (works for all scenarios)
//     const addTeacherToLab = (labId) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === labId) {
//                     return { ...lab, teachers: [...(lab.teachers || []), ''] };
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Remove teacher from lab (works for all scenarios)
//     const removeTeacherFromLab = (labId, teacherIndex) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === labId) {
//                     const minTeachers = getMinTeachersRequired(lab);
//                     // Don't allow removing below minimum required
//                     if (lab.teachers.length <= minTeachers) return lab;
//                     return {
//                         ...lab,
//                         teachers: lab.teachers.filter((_, index) => index !== teacherIndex)
//                     };
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Update teacher in lab (works for all scenarios)
//     const updateLabTeacher = (labId, teacherIndex, value) => {
//         setFormData(prev => ({
//             ...prev,
//             labs: prev.labs.map(lab => {
//                 if (lab.id === labId) {
//                     const updatedTeachers = [...(lab.teachers || [])];
//                     updatedTeachers[teacherIndex] = value;
//                     return { ...lab, teachers: updatedTeachers };
//                 }
//                 return lab;
//             })
//         }));
//     };

//     // Save configuration
//     const saveConfiguration = () => {

//         if (formData.weekdayPeriods === 0) {
//             toast.error('Weekday Periods cannot be zero');
//             return;
//         }

//         // Validate before saving
//         if (formData.subjects.length === 0 && formData.labs.length === 0) {
//             toast.error('Please add at least one subject or lab');
//             return;
//         }

//         // Validate subjects
//         for (const subject of formData.subjects) {
//             if (!subject.name.trim()) {
//                 toast.error('Please fill in all subject names');
//                 return;
//             }
//             if (subject.frequency < 1) {
//                 toast.error('Subject frequency must be at least 1');
//                 return;
//             }
//             for (const teacherId of subject.teachers) {
//                 if (!teacherId) {
//                     toast.error('Please assign teachers to all subjects');
//                     return;
//                 }
//             }
//         }

//         // Validate elective subjects
//         for (const subject of formData.subjects) {
//             if (subject.isElective) {
//                 if (subject.electiveOptions.length < 1) {
//                     toast.error('Elective subjects must have at least 2 options');
//                     return;
//                 }
//                 for (const option of subject.electiveOptions) {
//                     if (!option.name.trim()) {
//                         toast.error('Please fill in all elective option names');
//                         return;
//                     }
//                     for (const teacherId of option.teachers) {
//                         if (!teacherId) {
//                             toast.error('Please assign teachers to all elective options');
//                             return;
//                         }
//                     }
//                 }
//             }
//         }

//         // Validate labs
//         for (const lab of formData.labs) {
//             if (lab.frequency < 1) {
//                 toast.error('Lab frequency must be at least 1');
//                 return;
//             }

//             if (!lab.name?.trim()) {
//                 toast.error('Please enter a name for all lab sessions');
//                 return;
//             }

//             // Validate minimum teachers based on scenario
//             const minTeachers = getMinTeachersRequired(lab);
//             for (let i = 0; i < minTeachers; i++) {
//                 if (!lab.teachers?.[i]) {
//                     let errorMessage = `Please assign all ${minTeachers} required teachers for ${lab.name}`;

//                     if (lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod') {
//                         errorMessage = `Please assign all ${minTeachers} required teachers for ${lab.name} (${lab.teachersRequired} teachers × ${lab.numberOfBatches} batches)`;
//                     }

//                     toast.error(errorMessage);
//                     return;
//                 }
//             }
//         }

//         const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];

//         // Remove existing config if any
//         const filteredConfigs = semesterConfigs.filter(
//             config =>
//                 !(config.instituteId === id &&
//                     config.branchId === branchId &&
//                     config.semesterId === semesterID)
//         );

//         const newConfig = {
//             instituteId: id,
//             branchId: branchId,
//             semesterId: semesterID,
//             ...formData
//         };

//         console.log(newConfig);
//         localStorage.setItem('semesterConfigs', JSON.stringify([...filteredConfigs, newConfig]));
//         toast.success('Configuration saved successfully');
//         // router.push(`/institution/${id}/branch/${branchId}/semester/${semesterID}/timetables`);
//     };

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center h-screen">
//                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
//             </div>
//         );
//     }

//     return (
//         <>
//             <div className="min-h-screen flex flex-col bg-gray-50">
//                 <Toaster position="top-center" />
//                 <Navbar />

//                 <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-6xl w-full">
//                     {/* Header Section */}
//                     <div className="mb-8">
//                         <button
//                             onClick={() => router.push(`/institution/${id}/branch/${branchId}`)}
//                             className="flex items-center text-gray-600 hover:text-indigo-700 mb-4 transition-colors"
//                         >
//                             <FaArrowLeft className="mr-2" /> Back to Branch
//                         </button>

//                         <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
//                             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
//                                 <div>
//                                     <h1 className="text-3xl font-bold text-gray-800">
//                                         Curriculum
//                                     </h1>
//                                     <p className="text-gray-600 mt-2">
//                                         Configure your semester timetable settings and assign faculty
//                                     </p>
//                                 </div>
//                                 <button
//                                     onClick={() => setIsFacultyModalOpen(true)}
//                                     className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md self-start md:self-auto"
//                                 >
//                                     <FaChalkboardTeacher /> Add New Faculty
//                                 </button>
//                             </div>

//                             <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
//                                 <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
//                                     <FaUsers className="mr-2" />
//                                     {currentSemester?.sections} Section{currentSemester?.sections !== 1 ? 's' : ''}
//                                 </span>

//                                 {currentSemester?.sectionNames && currentSemester.sectionNames.length > 0 && (
//                                     <div className="flex items-center">
//                                         <span className="text-sm text-gray-600 mr-2">Sections:</span>
//                                         <div className="flex flex-wrap gap-1">
//                                             {currentSemester.sectionNames.map((section, index) => (
//                                                 <span
//                                                     key={index}
//                                                     className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium"
//                                                 >
//                                                     {section}
//                                                 </span>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {faculty.length === 0 && (
//                         <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100 text-center">
//                             <div className="mx-auto h-20 w-20 text-yellow-500 mb-4 flex items-center justify-center bg-yellow-50 rounded-full">
//                                 <FaExclamationTriangle className="w-10 h-10" />
//                             </div>
//                             <h2 className="text-2xl font-bold text-gray-800 mb-2">
//                                 No Faculty Members Found
//                             </h2>
//                             <p className="text-gray-600 mb-6 max-w-md mx-auto">
//                                 You need to add teachers before you can create subjects and labs for this semester.
//                             </p>
//                             <button
//                                 onClick={() => setIsFacultyModalOpen(true)}
//                                 className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-sm hover:shadow-md"
//                             >
//                                 <FaPlus /> Add First Teacher
//                             </button>
//                         </div>
//                     )}

//                     {faculty.length > 0 && <>
//                         {/* Period Configuration Card */}
//                         <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
//                             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
//                                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
//                                     <FaCog className="text-xl" />
//                                 </div>
//                                 <h2 className="text-xl font-semibold text-gray-800">
//                                     Period Configuration
//                                 </h2>
//                             </div>

//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 {/* Weekday Settings */}
//                                 <div className="space-y-5">
//                                     <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             Weekday Periods
//                                         </label>
//                                         <input
//                                             type="number"
//                                             name="weekdayPeriods"
//                                             min="1"
//                                             max="10"
//                                             value={formData.weekdayPeriods}
//                                             onChange={handleInputChange}
//                                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                         />
//                                         <p className="mt-2 text-xs text-gray-500">
//                                             Number of periods on weekdays (Mon-Fri)
//                                         </p>
//                                     </div>

//                                     <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             Short Break After
//                                         </label>
//                                         <input
//                                             type="number"
//                                             name="shortBreakAfter"
//                                             min="1"
//                                             max={formData.weekdayPeriods - 1}
//                                             value={formData.shortBreakAfter}
//                                             onChange={handleInputChange}
//                                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                         />
//                                         <p className="mt-2 text-xs text-gray-500">
//                                             After how many periods to have a short break
//                                         </p>
//                                     </div>
//                                 </div>

//                                 {/* Weekend Settings */}
//                                 <div className="space-y-5">
//                                     <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             Saturday Periods
//                                         </label>
//                                         <input
//                                             type="number"
//                                             name="saturdayPeriods"
//                                             min="0"
//                                             max="8"
//                                             value={formData.saturdayPeriods}
//                                             onChange={handleInputChange}
//                                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                         />
//                                         <p className="mt-2 text-xs text-gray-500">
//                                             Number of periods on Saturday (0 for no classes)
//                                         </p>
//                                     </div>

//                                     <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
//                                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                                             Lunch Break After
//                                         </label>
//                                         <input
//                                             type="number"
//                                             name="lunchBreakAfter"
//                                             min="1"
//                                             max={formData.weekdayPeriods - 1}
//                                             value={formData.lunchBreakAfter}
//                                             onChange={handleInputChange}
//                                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                         />
//                                         <p className="mt-2 text-xs text-gray-500">
//                                             After how many periods to have lunch break
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Subjects Section */}
//                         <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
//                             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
//                                 <div className="flex items-center gap-3">
//                                     <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
//                                         <FaBook className="text-xl" />
//                                     </div>
//                                     <h2 className="text-xl font-semibold text-gray-800">
//                                         Subjects
//                                     </h2>
//                                 </div>
//                                 {formData.subjects.length === 0 && (
//                                     <button
//                                         onClick={addSubjectForm}
//                                         disabled={faculty.length === 0}
//                                         className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${faculty.length === 0
//                                             ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                                             : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
//                                             }`}
//                                     >
//                                         <FaPlus /> Add Subject
//                                     </button>
//                                 )}
//                             </div>

//                             {formData.subjects.length === 0 ? (
//                                 <div className="text-center py-8">
//                                     <div className="mx-auto h-20 w-20 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
//                                         <FaBook className="w-8 h-8" />
//                                     </div>
//                                     <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects added</h3>
//                                     <p className="text-gray-500 mb-4">
//                                         {faculty.length === 0
//                                             ? 'Add teachers first to create subjects'
//                                             : 'Add your first subject to get started'}
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-5">
//                                     {formData.subjects.map((subject, index) => (
//                                         <div key={subject.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative transition-all hover:shadow-sm">
//                                             <button
//                                                 onClick={() => removeSubject(subject.id)}
//                                                 className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
//                                                 title="Delete subject"
//                                             >
//                                                 <FaTrash />
//                                             </button>
//                                             <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                                                 <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3">
//                                                     {index + 1}
//                                                 </span>
//                                                 Subject Details
//                                             </h3>

//                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                         Subject Name
//                                                     </label>
//                                                     <input
//                                                         type="text"
//                                                         value={subject.name}
//                                                         onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
//                                                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                         placeholder="e.g. Data Structures"
//                                                     />
//                                                 </div>

//                                                 <div>
//                                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                         Frequency (per week)
//                                                     </label>
//                                                     <input
//                                                         type="number"
//                                                         min="1"
//                                                         max="10"
//                                                         value={subject.frequency}
//                                                         onChange={(e) => updateSubject(subject.id, 'frequency', Number(e.target.value))}
//                                                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                     />
//                                                 </div>

//                                                 <div className="flex items-end">
//                                                     <label className="flex items-center h-full">
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={subject.isElective}
//                                                             onChange={() => toggleElectiveSubject(subject.id)}
//                                                             className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                                                         />
//                                                         <span className="text-sm font-medium text-gray-700">
//                                                             Elective Subject
//                                                         </span>
//                                                     </label>
//                                                 </div>
//                                             </div>

//                                             {/* Elective Options Section - Outside the grid */}
//                                             {subject.isElective && (
//                                                 <div className="mt-6 pt-4 border-t border-gray-200">
//                                                     <div className="flex items-center justify-between mb-4">
//                                                         <h4 className="text-md font-medium text-gray-700">Elective Options:</h4>
//                                                         <button
//                                                             onClick={() => addElectiveOption(subject.id)}
//                                                             className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
//                                                         >
//                                                             <FaPlus className="text-xs" /> Add Option
//                                                         </button>
//                                                     </div>

//                                                     <div className="space-y-4">
//                                                         {subject.electiveOptions.map((option, optionIndex) => (
//                                                             <div key={option.id} className="bg-white p-4 rounded-lg border border-gray-200 relative">
//                                                                 <button
//                                                                     onClick={() => removeElectiveOption(subject.id, option.id)}
//                                                                     className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
//                                                                     title="Remove option"
//                                                                 >
//                                                                     <FaTrash className="text-sm" />
//                                                                 </button>

//                                                                 <h5 className="text-sm font-medium text-gray-700 mb-3">Option {optionIndex + 1}</h5>

//                                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
//                                                                     <div>
//                                                                         <label className="block text-xs text-gray-600 mb-1">Option Name</label>
//                                                                         <input
//                                                                             type="text"
//                                                                             value={option.name}
//                                                                             onChange={(e) => updateElectiveOption(subject.id, option.id, 'name', e.target.value)}
//                                                                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                                             placeholder="e.g. Business Analytics"
//                                                                         />
//                                                                     </div>
//                                                                 </div>

//                                                                 {/* Teachers for this elective option */}
//                                                                 <div className="mt-3">
//                                                                     <div className="flex items-center justify-between mb-2">
//                                                                         <h6 className="text-xs font-medium text-gray-600">Teachers for this option:</h6>
//                                                                         <button
//                                                                             onClick={() => addTeacherToElectiveOption(subject.id, option.id)}
//                                                                             disabled={option.teachers.length >= sectionsCount * 2}
//                                                                             className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${option.teachers.length >= sectionsCount * 2
//                                                                                 ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                                                                                 : 'bg-green-100 text-green-700 hover:bg-green-200'
//                                                                                 }`}
//                                                                         >
//                                                                             <FaPlus className="text-xs" /> Add Teacher
//                                                                         </button>
//                                                                     </div>

//                                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                                                         {option.teachers.map((teacherId, teacherIndex) => (
//                                                                             <div key={teacherIndex} className="flex items-center gap-2">
//                                                                                 <div className="flex-1">
//                                                                                     <label className="block text-xs text-gray-500 mb-1">
//                                                                                         Teacher {teacherIndex + 1}
//                                                                                     </label>
//                                                                                     <select
//                                                                                         value={teacherId}
//                                                                                         onChange={(e) => updateElectiveOptionTeacher(subject.id, option.id, teacherIndex, e.target.value)}
//                                                                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
//                                                                                     >
//                                                                                         <option value="">Select Teacher</option>
//                                                                                         {faculty.map(teacher => (
//                                                                                             <option key={teacher.teacherId} value={teacher.teacherId}>
//                                                                                                 {teacher.name}
//                                                                                             </option>
//                                                                                         ))}
//                                                                                     </select>
//                                                                                 </div>
//                                                                                 {option.teachers.length > 1 && (
//                                                                                     <button
//                                                                                         onClick={() => removeTeacherFromElectiveOption(subject.id, option.id, teacherIndex)}
//                                                                                         className="mt-5 p-1.5 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded"
//                                                                                         title="Remove teacher"
//                                                                                     >
//                                                                                         <FaMinus className="text-xs" />
//                                                                                     </button>
//                                                                                 )}
//                                                                             </div>
//                                                                         ))}
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 </div>
//                                             )}

//                                             {/* Regular Teachers Section - Only show if not elective */}
//                                             {!subject.isElective && (
//                                                 <div className="mt-6">
//                                                     <div className="flex items-center justify-between mb-3">
//                                                         <h4 className="text-sm font-medium text-gray-700">Teachers:</h4>
//                                                         <button
//                                                             onClick={() => addTeacherToSubject(subject.id)}
//                                                             disabled={subject.teachers?.length >= sectionsCount * 2}
//                                                             className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${subject.teachers?.length >= sectionsCount * 2
//                                                                 ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                                                                 : 'bg-green-100 text-green-700 hover:bg-green-200'
//                                                                 }`}
//                                                         >
//                                                             <FaPlus className="text-xs" /> Add Teacher
//                                                         </button>
//                                                     </div>

//                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                                         {subject.teachers?.map((teacherId, teacherIndex) => (
//                                                             <div key={teacherIndex} className="flex items-center gap-2">
//                                                                 <div className="flex-1">
//                                                                     <label className="block text-xs text-gray-600 mb-1">
//                                                                         Teacher {teacherIndex + 1}
//                                                                     </label>
//                                                                     <select
//                                                                         value={teacherId}
//                                                                         onChange={(e) => updateSubjectTeacher(subject.id, teacherIndex, e.target.value)}
//                                                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                                     >
//                                                                         <option value="">Select Teacher</option>
//                                                                         {faculty.map(teacher => (
//                                                                             <option key={teacher.teacherId} value={teacher.teacherId}>
//                                                                                 {teacher.name}
//                                                                             </option>
//                                                                         ))}
//                                                                     </select>
//                                                                 </div>
//                                                                 {subject.teachers.length > 1 && (
//                                                                     <button
//                                                                         onClick={() => removeTeacherFromSubject(subject.id, teacherIndex)}
//                                                                         className="mt-5 p-2 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-lg"
//                                                                         title="Remove teacher"
//                                                                     >
//                                                                         <FaMinus />
//                                                                     </button>
//                                                                 )}
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                     {subject.teachers?.length >= sectionsCount && (
//                                                         <p className="text-xs text-gray-500 mt-2">
//                                                             Maximum {sectionsCount} teachers allowed (one per section)
//                                                         </p>
//                                                     )}
//                                                 </div>
//                                             )}
//                                         </div>
//                                     ))}
//                                     {formData.subjects.length !== 0 && (
//                                         <div className="flex justify-end border-t border-gray-200 pt-5 mt-5">
//                                             <button
//                                                 onClick={addSubjectForm}
//                                                 disabled={faculty.length === 0}
//                                                 className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${faculty.length === 0
//                                                     ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                                                     : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
//                                                     }`}
//                                             >
//                                                 <FaPlus /> Add Subject
//                                             </button>
//                                         </div>
//                                     )}
//                                 </div>
//                             )}
//                         </div>

//                         {/* Labs Section */}
//                         <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
//                             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
//                                 <div className="flex items-center gap-3">
//                                     <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
//                                         <FaFlask className="text-xl" />
//                                     </div>
//                                     <h2 className="text-xl font-semibold text-gray-800">
//                                         Laboratory Sessions
//                                     </h2>
//                                 </div>
//                                 <button
//                                     onClick={() => setIsLabModalOpen(true)}
//                                     className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
//                                 >
//                                     <FaPlus /> Add New Lab Room
//                                 </button>
//                             </div>

//                             {labs.length === 0 ? (
//                                 <div className="text-center py-8">
//                                     <div className="mx-auto h-20 w-20 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
//                                         <FaFlask className="w-8 h-8" />
//                                     </div>
//                                     <h3 className="text-lg font-medium text-gray-900 mb-1">No labs added</h3>
//                                     <p className="text-gray-500 mb-6">Add lab rooms first to create lab sessions</p>
//                                     <button
//                                         onClick={() => setIsLabModalOpen(true)}
//                                         className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
//                                     >
//                                         <FaPlus /> Add Lab Room
//                                     </button>
//                                 </div>
//                             ) : formData.labs.length === 0 ? (
//                                 <div className="text-center py-8">
//                                     <div className="mx-auto h-20 w-20 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
//                                         <FaFlask className="w-8 h-8" />
//                                     </div>
//                                     <h3 className="text-lg font-medium text-gray-900 mb-1">No lab sessions added</h3>
//                                     <p className="text-gray-500 mb-6">Click &quot;Add Lab Session&quot; to get started</p>
//                                     <button
//                                         onClick={addLabForm}
//                                         className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
//                                     >
//                                         <FaPlus /> Add Lab Session
//                                     </button>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-5">
//                                     {formData.labs.map((lab, index) => (
//                                         <div key={lab.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative transition-all hover:shadow-sm">
//                                             <button
//                                                 onClick={() => removeLab(lab.id)}
//                                                 className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
//                                                 title="Delete lab session"
//                                             >
//                                                 <FaTrash />
//                                             </button>

//                                             <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
//                                                 <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mr-3">
//                                                     {index + 1}
//                                                 </span>
//                                                 Lab Session Details
//                                             </h3>

//                                             {/* First Row: Name and Frequency */}
//                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                         Lab Session Name
//                                                     </label>
//                                                     <input
//                                                         type="text"
//                                                         value={lab.name}
//                                                         onChange={(e) => updateLab(lab.id, 'name', e.target.value)}
//                                                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                         placeholder="e.g. Chemistry Lab Session"
//                                                     />
//                                                 </div>
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                         Frequency (per week)
//                                                     </label>
//                                                     <input
//                                                         type="number"
//                                                         min="1"
//                                                         max="10"
//                                                         value={lab.frequency}
//                                                         onChange={(e) => updateLab(lab.id, 'frequency', Number(e.target.value))}
//                                                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                     />
//                                                 </div>
//                                             </div>

//                                             {/* Second Row: Session Type and Batch Schedule (conditional) */}
//                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                         Session Type
//                                                     </label>
//                                                     <div className="flex space-x-4 bg-gray-100 p-3 rounded-lg">
//                                                         <label className="flex items-center space-x-2">
//                                                             <input
//                                                                 type="radio"
//                                                                 value="fullClass"
//                                                                 checked={lab.sessionType === 'fullClass'}
//                                                                 onChange={(e) => updateLab(lab.id, 'sessionType', e.target.value)}
//                                                                 className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                                                             />
//                                                             <span className="text-sm text-gray-700">Full Class</span>
//                                                         </label>
//                                                         <label className="flex items-center space-x-2">
//                                                             <input
//                                                                 type="radio"
//                                                                 value="batchWise"
//                                                                 checked={lab.sessionType === 'batchWise'}
//                                                                 onChange={(e) => updateLab(lab.id, 'sessionType', e.target.value)}
//                                                                 className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                                                             />
//                                                             <span className="text-sm text-gray-700">Batch Wise</span>
//                                                         </label>
//                                                     </div>
//                                                 </div>

//                                                 {lab.sessionType === 'fullClass' && (
//                                                     <div>
//                                                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                             Teachers Required
//                                                         </label>
//                                                         <select
//                                                             value={lab.teachersRequired || 1}
//                                                             onChange={(e) => updateLab(lab.id, 'teachersRequired', Number(e.target.value))}
//                                                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                         >
//                                                             <option value={1}>1 Teacher</option>
//                                                             <option value={2}>2 Teachers</option>
//                                                             <option value={3}>3 Teachers</option>
//                                                             <option value={4}>4 Teachers</option>
//                                                         </select>
//                                                     </div>
//                                                 )}

//                                                 {lab.sessionType === 'batchWise' && (
//                                                     <div>
//                                                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                             Batch Schedule
//                                                         </label>
//                                                         <div className="flex space-x-4 bg-gray-100 p-3 rounded-lg">
//                                                             <label className="flex items-center space-x-2">
//                                                                 <input
//                                                                     type="radio"
//                                                                     value="samePeriod"
//                                                                     checked={lab.batchScheduleType === 'samePeriod'}
//                                                                     onChange={(e) => updateLab(lab.id, 'batchScheduleType', e.target.value)}
//                                                                     className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                                                                 />
//                                                                 <span className="text-sm text-gray-700">Same Period</span>
//                                                             </label>
//                                                             <label className="flex items-center space-x-2">
//                                                                 <input
//                                                                     type="radio"
//                                                                     value="differentPeriods"
//                                                                     checked={lab.batchScheduleType === 'differentPeriods'}
//                                                                     onChange={(e) => updateLab(lab.id, 'batchScheduleType', e.target.value)}
//                                                                     className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                                                                 />
//                                                                 <span className="text-sm text-gray-700">Different Periods</span>
//                                                             </label>
//                                                         </div>
//                                                     </div>
//                                                 )}
//                                             </div>

//                                             {/* Third Row: Teachers Required and Number of Batches (conditional) */}
//                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                                                 {lab.sessionType === 'batchWise' && (<div>
//                                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                         Teachers Required
//                                                     </label>
//                                                     <select
//                                                         value={lab.teachersRequired || 1}
//                                                         onChange={(e) => updateLab(lab.id, 'teachersRequired', Number(e.target.value))}
//                                                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                     >
//                                                         <option value={1}>1 Teacher</option>
//                                                         <option value={2}>2 Teachers</option>
//                                                         <option value={3}>3 Teachers</option>
//                                                         <option value={4}>4 Teachers</option>
//                                                     </select>
//                                                 </div>)}

//                                                 {lab.sessionType === 'batchWise' && (
//                                                     <div>
//                                                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                             Number of Batches
//                                                         </label>
//                                                         <select
//                                                             value={lab.numberOfBatches || 2}
//                                                             onChange={(e) => updateLab(lab.id, 'numberOfBatches', Number(e.target.value))}
//                                                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                         >
//                                                             <option value={2}>2 Batches</option>
//                                                             <option value={3}>3 Batches</option>
//                                                             <option value={4}>4 Batches</option>
//                                                         </select>
//                                                     </div>
//                                                 )}
//                                             </div>

//                                             {/* Lab Room Selection */}
//                                             <div className="mb-4">
//                                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                                     Select Lab Room{lab.labRooms && lab.labRooms.length > 1 ? 's' : ''}
//                                                     {lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod' &&
//                                                         ` (Minimum ${lab.numberOfBatches || 2} rooms required)`}
//                                                 </label>

//                                                 <div className="space-y-3">
//                                                     {/* Render lab room dropdowns */}
//                                                     {(lab.labRooms || ['']).map((labRoomId, roomIndex) => (
//                                                         <div key={roomIndex} className="flex items-center gap-2">
//                                                             <div className="flex-1">
//                                                                 <label className="block text-xs text-gray-600 mb-1">
//                                                                     {lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod' && roomIndex < lab.numberOfBatches
//                                                                         ? `Batch ${roomIndex + 1} Lab Room`
//                                                                         : lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod'
//                                                                             ? `Extra Lab for safer side`
//                                                                             : `Lab Room ${roomIndex + 1}`
//                                                                     }
//                                                                 </label>
//                                                                 <select
//                                                                     value={labRoomId || ''}
//                                                                     onChange={(e) => updateLabRoomForBatch(lab.id, roomIndex, e.target.value)}
//                                                                     className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                                     required={
//                                                                         lab.sessionType === 'batchWise' &&
//                                                                         lab.batchScheduleType === 'samePeriod' &&
//                                                                         roomIndex < (lab.numberOfBatches || 2)
//                                                                     }
//                                                                 >
//                                                                     <option value="">Select Lab Room</option>
//                                                                     {labs.map(labRoom => (
//                                                                         <option key={labRoom.labId} value={labRoom.labId}>
//                                                                             {labRoom.labName} ({labRoom.roomNumber})
//                                                                         </option>
//                                                                     ))}
//                                                                 </select>
//                                                             </div>

//                                                             {/* Show remove button only if we have more than the minimum required */}
//                                                             {(roomIndex > 0 &&
//                                                                 (!(lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod') ||
//                                                                     roomIndex >= (lab.numberOfBatches || 2))) && (
//                                                                     <button
//                                                                         onClick={() => removeLabRoomFromBatch(lab.id, roomIndex)}
//                                                                         className="mt-5 p-2 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-lg"
//                                                                         title="Remove lab room"
//                                                                     >
//                                                                         <FaMinus />
//                                                                     </button>
//                                                                 )}
//                                                         </div>
//                                                     ))}

//                                                     {/* Add lab room button */}
//                                                     <button
//                                                         onClick={() => addLabRoomToBatch(lab.id)}
//                                                         className="px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center gap-1"
//                                                     >
//                                                         <FaPlus className="text-xs" /> Add Lab Room
//                                                     </button>
//                                                 </div>
//                                             </div>

//                                             {/* Teachers Assignment Section */}
//                                             <div className="mt-6">
//                                                 <div className="flex items-center justify-between mb-3">
//                                                     <h4 className="text-sm font-medium text-gray-700">
//                                                         Assign Teachers
//                                                         {lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod' &&
//                                                             ` (All Batches - Minimum ${getMinTeachersRequired(lab)} teachers)`
//                                                         }
//                                                         {lab.sessionType === 'batchWise' && lab.batchScheduleType === 'differentPeriods' &&
//                                                             ` (Can be Shared Across Batches - Minimum ${getMinTeachersRequired(lab)} teachers)`
//                                                         }
//                                                     </h4>

//                                                     <button
//                                                         onClick={() => addTeacherToLab(lab.id)}
//                                                         disabled={lab.teachers?.length >= 10} // Maximum 10 teachers
//                                                         className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${lab.teachers?.length >= 10
//                                                             ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                                                             : 'bg-green-100 text-green-700 hover:bg-green-200'
//                                                             }`}
//                                                     >
//                                                         <FaPlus className="text-xs" /> Add Teacher
//                                                     </button>
//                                                 </div>

//                                                 {/* Minimum requirement info */}
//                                                 <div className="mb-3 p-2 bg-blue-50 rounded-lg">
//                                                     <p className="text-xs text-blue-700">
//                                                         {lab.sessionType === 'fullClass' ?
//                                                             `Minimum ${getMinTeachersRequired(lab)} teacher(s) required for full class` :
//                                                             lab.batchScheduleType === 'samePeriod' ?
//                                                                 `Minimum ${getMinTeachersRequired(lab)} teachers required (${lab.teachersRequired} teachers × ${lab.numberOfBatches} batches at same time)` :
//                                                                 `Minimum ${getMinTeachersRequired(lab)} teacher(s) required (can be shared across batches at different times)`
//                                                         }
//                                                     </p>
//                                                 </div>

//                                                 {/* Teachers Grid */}
//                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                                     {lab.teachers?.map((teacherId, index) => {
//                                                         const minTeachers = getMinTeachersRequired(lab);
//                                                         const isRequired = index < minTeachers;

//                                                         return (
//                                                             <div key={index} className="flex items-center gap-2">
//                                                                 <div className="flex-1">
//                                                                     <label className="block text-xs text-gray-600 mb-1">
//                                                                         Teacher {index + 1}
//                                                                         {isRequired ?
//                                                                             <span className="text-red-500"> (Required)</span> :
//                                                                             <span className="text-green-600"> (Extra)</span>
//                                                                         }
//                                                                     </label>
//                                                                     <select
//                                                                         value={teacherId || ''}
//                                                                         onChange={(e) => updateLabTeacher(lab.id, index, e.target.value)}
//                                                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                                                                     >
//                                                                         <option value="">Select Teacher</option>
//                                                                         {faculty.map(teacher => (
//                                                                             <option key={teacher.teacherId} value={teacher.teacherId}>
//                                                                                 {teacher.name}
//                                                                             </option>
//                                                                         ))}
//                                                                     </select>
//                                                                 </div>

//                                                                 {/* Show remove button only for extra teachers (non-required) */}
//                                                                 {!isRequired && (
//                                                                     <button
//                                                                         onClick={() => removeTeacherFromLab(lab.id, index)}
//                                                                         className="mt-5 p-2 text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 rounded-lg"
//                                                                         title="Remove extra teacher"
//                                                                     >
//                                                                         <FaMinus />
//                                                                     </button>
//                                                                 )}
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>

//                                                 {/* Maximum teachers warning */}
//                                                 {lab.teachers?.length >= 10 && (
//                                                     <p className="mt-2 text-xs text-orange-600">
//                                                         Maximum 10 teachers reached
//                                                     </p>
//                                                 )}
//                                             </div>

//                                             <div className="mt-4">
//                                                 <label className="flex items-center">
//                                                     <input
//                                                         type="checkbox"
//                                                         checked={lab.keepSameTeachers || false}
//                                                         onChange={(e) => updateLab(lab.id, 'keepSameTeachers', e.target.checked)}
//                                                         className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                                                     />
//                                                     <span className="text-sm font-medium text-gray-700">
//                                                         Keep same set of teachers for all sessions of this lab
//                                                     </span>
//                                                 </label>
//                                                 <p className="text-xs text-gray-500 mt-1 ml-6">
//                                                     When enabled, the same teachers will be assigned to all weekly sessions of this lab
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}

//                             {formData.labs.length > 0 && (
//                                 <div className="flex justify-end border-t border-gray-200 mt-5 pt-5">
//                                     <button
//                                         onClick={addLabForm}
//                                         className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
//                                     >
//                                         <FaPlus /> Add Lab Session

//                                     </button>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Save Button */}
//                         <div className="flex justify-end gap-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
//                             <button
//                                 onClick={() => router.push(`/institution/${id}/branch/${branchId}`)}
//                                 className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={saveConfiguration}
//                                 className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
//                             >
//                                 <FaSave /> Save Configuration
//                             </button>
//                         </div>
//                     </>
//                     }
//                 </main>
//                 <Footer />

//                 {/* Add Faculty Modal */}
//                 {isFacultyModalOpen && (
//                     <div className="fixed inset-0 z-50 overflow-y-auto">
//                         <div className="flex items-center justify-center min-h-screen px-4">
//                             <div
//                                 className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
//                                 onClick={() => setIsFacultyModalOpen(false)}
//                             ></div>
//                             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-50 relative overflow-hidden transform transition-all">
//                                 <div className="p-6">
//                                     <div className="flex items-center gap-3 mb-4">
//                                         <div className="p-2 bg-indigo-100 rounded-lg">
//                                             <FaUsers className="text-indigo-600 text-xl" />
//                                         </div>
//                                         <h2 className="text-xl font-bold">Add New Teacher</h2>
//                                     </div>

//                                     <div className="space-y-4">
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-700 mb-1">Name</label>
//                                             <input
//                                                 type="text"
//                                                 value={newTeacherName}
//                                                 onChange={(e) => setNewTeacherName(e.target.value)}
//                                                 placeholder="Teacher's name"
//                                                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-700 mb-1">Email</label>
//                                             <input
//                                                 type="email"
//                                                 value={teacherEmail}
//                                                 onChange={(e) => setTeacherEmail(e.target.value)}
//                                                 placeholder="teacher@example.com"
//                                                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-700 mb-1">Branch</label>
//                                             <select
//                                                 value={teacherBranch}
//                                                 onChange={(e) => setTeacherBranch(e.target.value)}
//                                                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
//                                             >
//                                                 <option value="N/A">N/A (General Faculty)</option>
//                                                 {currentBranches.map(branch => (
//                                                     <option key={branch.branchId} value={branch.branchName}>
//                                                         {branch.branchName}
//                                                     </option>
//                                                 ))}
//                                             </select>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
//                                     <button
//                                         onClick={() => setIsFacultyModalOpen(false)}
//                                         className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
//                                     >
//                                         Cancel
//                                     </button>
//                                     <button
//                                         onClick={handleAddTeacher}
//                                         className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
//                                     >
//                                         Add Teacher
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Add Lab Modal */}
//                 {isLabModalOpen && (
//                     <div className="fixed inset-0 z-50 overflow-y-auto">
//                         <div className="flex items-center justify-center min-h-screen px-4">
//                             <div
//                                 className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
//                                 onClick={() => setIsLabModalOpen(false)}
//                             ></div>
//                             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-50 relative overflow-hidden transform transition-all">
//                                 <div className="p-6">
//                                     <div className="flex items-center gap-3 mb-4">
//                                         <div className="p-2 bg-indigo-100 rounded-lg">
//                                             <FaUniversity className="text-indigo-600 text-xl" />
//                                         </div>
//                                         <h2 className="text-xl font-bold">Add New Laboratory</h2>
//                                     </div>

//                                     <div className="space-y-4">
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
//                                                 <span>Lab Name</span>
//                                                 <span className="text-red-500">*</span>
//                                             </label>
//                                             <input
//                                                 type="text"
//                                                 value={newLabName}
//                                                 onChange={(e) => setNewLabName(e.target.value)}
//                                                 placeholder="e.g. Computer Lab, Physics Lab"
//                                                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-700 mb-1">Room Number</label>
//                                             <input
//                                                 type="text"
//                                                 value={labRoomNumber}
//                                                 onChange={(e) => setLabRoomNumber(e.target.value)}
//                                                 placeholder="e.g. 101, A-12"
//                                                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="text-sm font-medium text-gray-700 mb-1">Building/Block</label>
//                                             <input
//                                                 type="text"
//                                                 value={labBuilding}
//                                                 onChange={(e) => setLabBuilding(e.target.value)}
//                                                 placeholder="e.g. Main Building, Science Block"
//                                                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
//                                     <button
//                                         onClick={() => setIsLabModalOpen(false)}
//                                         className="px-5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
//                                     >
//                                         Cancel
//                                     </button>
//                                     <button
//                                         onClick={handleAddLab}
//                                         className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
//                                     >
//                                         Add Laboratory
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// };

// export default SemesterSetup;
