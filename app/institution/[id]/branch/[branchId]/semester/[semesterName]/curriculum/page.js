'use client';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave, FaFlask, FaUsers, FaExclamationTriangle, FaMinus } from 'react-icons/fa';

const SemesterSetup = () => {
    const params = useParams();
    const router = useRouter();
    const { id, branchId, semesterName } = params;

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
                console.log('All Faculty:', allFaculty);

                const instituteFaculty = allFaculty.filter(
                    teacher => teacher.instituteId === id

                );
                console.log('Filtered Faculty:', instituteFaculty);
                console.log('Institute Faculty:', instituteFaculty);
                setFaculty(instituteFaculty);

                // Fetch branches for the current institute
                const allBranches = JSON.parse(localStorage.getItem('branches')) || [];
                const branchesForInstitute = allBranches.filter((branch) => branch.instituteId == id);
                setCurrentBranches(branchesForInstitute);

                // Find current branch and semester
                const currentBranch = branchesForInstitute.find(branch => branch.branchId == branchId);
                if (currentBranch) {
                    const semester = currentBranch.semesters.find(sem => sem.semesterName === decodeURIComponent(semesterName));
                    if (semester) {
                        setCurrentSemester(semester);
                        setSectionsCount(semester.sections || 0);
                    }
                }

                // Check for existing semester configuration
                const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];
                const existingConfig = semesterConfigs.find(
                    config =>
                        config.instituteId === Number(id) &&
                        config.branchId === Number(branchId) &&
                        config.semesterName === decodeURIComponent(semesterName)
                );

                if (existingConfig) {
                    // Convert old teacher field to teachers array if needed
                    const updatedSubjects = existingConfig.subjects.map(subject => {
                        if (subject.teacher && !subject.teachers) {
                            return {
                                ...subject,
                                teachers: sectionsCount > 0 ?
                                    Array(sectionsCount).fill(subject.teacher) :
                                    [subject.teacher]
                            };
                        }
                        return subject;
                    });

                    setFormData({
                        ...existingConfig,
                        subjects: updatedSubjects
                    });
                } else {
                    // Initialize with empty teachers arrays based on sections count
                    setFormData(prev => ({
                        ...prev,
                        subjects: prev.subjects.map(subject => ({
                            ...subject,
                            teachers: Array(sectionsCount).fill('')
                        }))
                    }));
                }
            } catch (error) {
                toast.error('Failed to load data');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, branchId, semesterName, sectionsCount]);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: Number(value)
        }));
    };

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

    const updateSubject = (id, field, value, sectionIndex = null) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.map(subject => {
                if (subject.id === id) {
                    if (sectionIndex !== null && field === 'teacher') {
                        // Update specific teacher in the teachers array
                        const updatedTeachers = [...subject.teachers];
                        updatedTeachers[sectionIndex] = value;
                        return { ...subject, teachers: updatedTeachers };
                    }
                    return { ...subject, [field]: value };
                }
                return subject;
            })
        }));
    };

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

    const addLabForm = () => {
        setFormData(prev => ({
            ...prev,
            labs: [...prev.labs, {
                id: prev.labs.length ? prev.labs[prev.labs.length - 1].id + 1 : 1,
                name: `Lab ${prev.labs.length + 1}`,
                frequency: 1,
                teachers: ['', '']
            }]
        }));
    };

    const updateLab = (id, field, value, teacherIndex = null) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab => {
                if (lab.id === id) {
                    if (teacherIndex !== null && field === 'teacher') {
                        // Update specific teacher in the teachers array
                        const updatedTeachers = [...lab.teachers];
                        updatedTeachers[teacherIndex] = value;
                        return { ...lab, teachers: updatedTeachers };
                    }
                    return { ...lab, [field]: value };
                }
                return lab;
            })
        }));
    };

    const removeLab = (id) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.filter(lab => lab.id !== id)
        }));
    };

    // Add teacher to a specific lab
    const addTeacherToLab = (labId) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab =>
                lab.id === labId
                    ? {
                        ...lab,
                        teachers: [...lab.teachers, '']
                    }
                    : lab
            )
        }));
    };

    // Remove teacher from a specific lab
    const removeTeacherFromLab = (labId, teacherIndex) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab =>
                lab.id === labId
                    ? {
                        ...lab,
                        teachers: lab.teachers.filter((_, index) => index !== teacherIndex)
                    }
                    : lab
            )
        }));
    };

    // Update teacher in lab
    const updateLabTeacher = (labId, teacherIndex, value) => {
        setFormData(prev => ({
            ...prev,
            labs: prev.labs.map(lab =>
                lab.id === labId
                    ? {
                        ...lab,
                        teachers: lab.teachers.map((teacher, index) =>
                            index === teacherIndex ? value : teacher
                        )
                    }
                    : lab
            )
        }));
    };

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

        // Validate labs
        for (const lab of formData.labs) {
            if (!lab.name.trim()) {
                toast.error('Please fill in all lab names');
                return;
            }
            if (lab.frequency < 1) {
                toast.error('Lab frequency must be at least 1');
                return;
            }
            for (const teacherId of lab.teachers) {
                if (!teacherId) {
                    toast.error('Please assign teachers to all labs');
                    return;
                }
            }
        }

        const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];

        // Remove existing config if any
        const filteredConfigs = semesterConfigs.filter(
            config =>
                !(config.instituteId === Number(id) &&
                    config.branchId === Number(branchId) &&
                    config.semesterName === decodeURIComponent(semesterName))
        );

        const newConfig = {
            instituteId: Number(id),
            branchId: Number(branchId),
            semesterName: decodeURIComponent(semesterName),
            ...formData
        };

        localStorage.setItem('semesterConfigs', JSON.stringify([...filteredConfigs, newConfig]));
        toast.success('Configuration saved successfully');
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

                <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-6xl">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {decodeURIComponent(semesterName)} Curriculum Setup
                                </h1>
                                <p className="text-lg text-gray-600 mt-1">
                                    Configure your semester timetable settings
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                    <FaUsers className="mr-2" />
                                    {currentSemester?.sections} Sections: {currentSemester?.sectionNames?.join(', ') || ''}
                                </span>
                                <button
                                    onClick={() => setIsFacultyModalOpen(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                                >
                                    <FaPlus /> Add Teacher
                                </button>
                            </div>
                        </div>
                    </div>

                    {faculty.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-200 text-center">
                            <div className="mx-auto h-24 w-24 text-yellow-400 mb-4">
                                <FaExclamationTriangle className="w-full h-full" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                No Faculty Members Found
                            </h2>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                You need to add teachers before you can create subjects and labs for this semester.
                            </p>
                            <button
                                onClick={() => setIsFacultyModalOpen(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 mx-auto shadow-sm"
                            >
                                <FaPlus /> Add First Teacher
                            </button>
                        </div>
                    )}

                    {/* Period Configuration Card */}
                    {faculty.length > 0 && <>
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                                <span className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
                                Period Configuration
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Weekday Settings */}
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-4 rounded-lg">
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Number of periods on weekdays (Mon-Fri)
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            After how many periods to have a short break
                                        </p>
                                    </div>
                                </div>

                                {/* Weekend Settings */}
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-4 rounded-lg">
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            Number of periods on Saturday (0 for no classes)
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            After how many periods to have lunch break
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subjects Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                    <span className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
                                    Subjects
                                </h2>
                                {formData.subjects.length === 0 && (
                                    <button
                                        onClick={addSubjectForm}
                                        disabled={faculty.length === 0}
                                        className={`px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm ${faculty.length === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        <FaPlus /> Add Subject
                                    </button>
                                )}
                            </div>

                            {formData.subjects.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects added</h3>
                                    <p className="text-gray-500 mb-4">
                                        {faculty.length === 0
                                            ? 'Add teachers first to create subjects'
                                            : 'Add your first subject to get started'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.subjects.map((subject, index) => (
                                        <div key={subject.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200 relative">
                                            <button
                                                onClick={() => removeSubject(subject.id)}
                                                className="absolute top-3 right-3 text-red-600 hover:text-red-800 transition"
                                            >
                                                <FaTrash />
                                            </button>
                                            <h3 className="text-lg font-medium text-gray-800 mb-4">Subject {index + 1}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Subject Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={subject.name}
                                                        onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                            </div>

                                            {/* Teachers Section - Flexible */}
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-700">Teachers:</h4>
                                                    <button
                                                        onClick={() => addTeacherToSubject(subject.id)}
                                                        disabled={subject.teachers?.length >= sectionsCount}
                                                        className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${subject.teachers?.length >= sectionsCount
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
                                                                    className="mt-5 p-2 text-red-600 hover:text-red-800 transition"
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
                                                        Maximum {sectionsCount} teachers allowed (one per section)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {formData.subjects.length !== 0 && (
                                        <button
                                            onClick={addSubjectForm}
                                            disabled={faculty.length === 0}
                                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm ${faculty.length === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                        >
                                            <FaPlus /> Add Subject
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Labs Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="w-2 h-8 bg-indigo-600 rounded-full mr-4"></div>
                                    <h2 className="text-2xl font-semibold text-gray-800">Laboratory Sessions</h2>
                                </div>
                                <button
                                    onClick={addLabForm}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <FaFlask /> Add Lab
                                </button>
                            </div>

                            {formData.labs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No labs added yet. Click "Add Lab" to get started.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.labs.map((lab, index) => (
                                        <div key={lab.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200 relative">
                                            <button
                                                onClick={() => removeLab(lab.id)}
                                                className="absolute top-3 right-3 text-red-600 hover:text-red-800 transition"
                                            >
                                                <FaTrash />
                                            </button>
                                            <h3 className="text-lg font-medium text-gray-800 mb-4">Lab {index + 1}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Lab Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lab.name}
                                                        onChange={(e) => updateLab(lab.id, 'name', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                        placeholder="e.g. Data Structures Lab"
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
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                            </div>

                                            {/* Teachers Section - Dynamic */}
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-700">Teachers (2-6 required):</h4>
                                                    <button
                                                        onClick={() => addTeacherToLab(lab.id)}
                                                        disabled={lab.teachers.length >= 6}
                                                        className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${lab.teachers.length >= 6
                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        <FaPlus className="text-xs" /> Add Teacher
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {lab.teachers.map((teacherId, teacherIndex) => (
                                                        <div key={teacherIndex} className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <label className="block text-xs text-gray-600 mb-1">
                                                                    Teacher {teacherIndex + 1}
                                                                </label>
                                                                <select
                                                                    value={teacherId}
                                                                    onChange={(e) => updateLabTeacher(lab.id, teacherIndex, e.target.value)}
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
                                                            {lab.teachers.length > 2 && (
                                                                <button
                                                                    onClick={() => removeTeacherFromLab(lab.id, teacherIndex)}
                                                                    className="mt-5 p-2 text-red-600 hover:text-red-800 transition"
                                                                    title="Remove teacher"
                                                                >
                                                                    <FaMinus />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {lab.teachers.length >= 6 && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Maximum 6 teachers allowed per lab
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => router.push(`/institution/${id}/branch/${branchId}`)}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveConfiguration}
                                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md"
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
            </div>
        </>
    );
};

export default SemesterSetup;