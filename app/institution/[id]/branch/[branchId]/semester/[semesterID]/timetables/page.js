'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generateTimetableForSections } from '@/utils/timetableGenerator';
import {
    FaSpinner, FaEye, FaDownload, FaCheck, FaTimes, FaArrowLeft,
    FaInfoCircle, FaSync, FaChevronLeft, FaChevronRight, FaTable,
    FaBook, FaCalendarAlt, FaExclamationTriangle, FaPlay, FaEdit,
    FaChevronUp, FaChevronDown, FaUserGraduate, FaClock,
    FaCalendarDay, FaLayerGroup, FaSchool, FaChalkboardTeacher,
    FaPalette, FaArrowRight, FaTimesCircle, FaCalendarCheck
} from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast, { Toaster } from 'react-hot-toast';

const TimetableViewPage = () => {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const branchId = Number(params.branchId);
    const semesterID = decodeURIComponent(params.semesterID);

    const [loading, setLoading] = useState(true);
    const [timetableData, setTimetableData] = useState(null);
    const [config, setConfig] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [branches, setBranches] = useState([]);
    const [currentSemester, setCurrentSemester] = useState(null);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [savedTimetable, setSavedTimetable] = useState(null);
    const [newGeneratedTimetable, setNewGeneratedTimetable] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [sections, setSections] = useState([]);
    const [expandedDays, setExpandedDays] = useState({});
    const [activeDayFilter, setActiveDayFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Days with full names
    const days = [
        { short: 'Mon', full: 'Monday', color: 'from-blue-500 to-blue-600' },
        { short: 'Tue', full: 'Tuesday', color: 'from-purple-500 to-purple-600' },
        { short: 'Wed', full: 'Wednesday', color: 'from-green-500 to-green-600' },
        { short: 'Thu', full: 'Thursday', color: 'from-yellow-500 to-yellow-600' },
        { short: 'Fri', full: 'Friday', color: 'from-red-500 to-red-600' },
        { short: 'Sat', full: 'Saturday', color: 'from-indigo-500 to-indigo-600' }
    ];

    useEffect(() => {
        const loadData = () => {
            try {
                const branchesData = JSON.parse(localStorage.getItem('branches')) || [];
                setBranches(branchesData);

                const currentBranchData = branchesData.find(b => b.branchId === Number(branchId));
                setCurrentBranch(currentBranchData);

                if (currentBranchData) {
                    const semester = currentBranchData.semesters.find(s => s.semesterId === semesterID);
                    setCurrentSemester(semester);

                    if (semester?.sectionNames) {
                        setSections(semester.sectionNames);
                        setSelectedSection(semester.sectionNames[0]);
                    }
                }

                const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];
                const currentConfig = semesterConfigs.find(
                    config => config.instituteId === Number(id) &&
                        config.branchId === Number(branchId) &&
                        config.semesterId === semesterID
                );

                if (currentConfig) {
                    setConfig(currentConfig);
                }

                const facultyData = JSON.parse(localStorage.getItem('faculty')) || [];
                setFaculty(facultyData.filter(teacher => teacher.instituteId === Number(id)));

                const existingTimetables = JSON.parse(localStorage.getItem('generatedTimetables')) || [];
                const existingTimetable = existingTimetables.find(
                    t => t.instituteId === Number(id) &&
                        t.branchId === Number(branchId) &&
                        t.semesterId === semesterID
                );

                if (existingTimetable) {
                    setSavedTimetable(existingTimetable);
                    setTimetableData(existingTimetable.timetableData?.sectionTimetables || null);
                }

            } catch (err) {
                toast.error('Failed to load data: ' + err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, branchId, semesterID]);

    const generateNewTimetable = async () => {
        if (!config) {
            toast.error('No curriculum configuration found');
            return;
        }

        setIsGenerating(true);
        try {
            const currentSemesterBranch = currentBranch?.semesters.find(s => s.semesterId === semesterID);
            if (!currentBranch || !currentSemesterBranch) {
                throw new Error('Branch or semester data not found');
            }

            // LOCAL generator – no API call, no keys
            const result = await generateTimetableForSections(
                config,
                faculty,
                [],                    // labRoomsData (wire later if you add lab rooms)
                currentSemesterBranch  // branchData
            );

            console.log("🧠 Local timetable result:", result);

            if (!result.success) {
                toast.error(result.error || 'Timetable generation reported a problem');
                return;
            }

            // Always treat as "proposal" until user accepts
            setNewGeneratedTimetable(result);
            setShowComparison(true);
            toast.success('✨ New timetable generated! Please review and confirm.');
        } catch (err) {
            toast.error('Failed to generate timetable: ' + err.message);
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const acceptNewTimetable = () => {
        if (!newGeneratedTimetable) return;

        const sectionTimetables = newGeneratedTimetable.sectionTimetables || newGeneratedTimetable;

        // Update faculty availability based on accepted timetable
        updateAvailabilityInLocalStorage(sectionTimetables);

        const existingTimetables = JSON.parse(localStorage.getItem('generatedTimetables')) || [];
        const filteredTimetables = existingTimetables.filter(
            t => !(t.instituteId === Number(id) &&
                t.branchId === Number(branchId) &&
                t.semesterId === semesterID)
        );

        const newTimetableEntry = {
            instituteId: Number(id),
            branchId: Number(branchId),
            semesterId: semesterID,
            semesterName: currentSemester?.semesterName || 'Semester',
            branchName: currentBranch?.branchName || 'Branch',
            generationDate: new Date().toISOString(),
            timetableData: newGeneratedTimetable
        };

        localStorage.setItem('generatedTimetables', JSON.stringify([...filteredTimetables, newTimetableEntry]));

        setSavedTimetable(newTimetableEntry);
        setTimetableData(sectionTimetables);
        setNewGeneratedTimetable(null);
        setShowComparison(false);
        toast.success('✅ New timetable accepted and saved!');
    };

    const keepOldTimetable = () => {
        setNewGeneratedTimetable(null);
        setShowComparison(false);
        toast.success('Keeping the existing timetable.');
    };

    const updateAvailabilityInLocalStorage = (sectionTimetables) => {
        const allFaculty = JSON.parse(localStorage.getItem('faculty')) || [];
        const updatedFaculty = allFaculty.map(teacher => {
            const newUnavailability = { ...(teacher.unavailability || {}) };
            Object.keys(newUnavailability).forEach(key => {
                if (newUnavailability[key]?.allocated) {
                    newUnavailability[key] = {
                        ...newUnavailability[key],
                        allocated: false,
                        message: 'No commitment'
                    };
                }
            });
            return { ...teacher, unavailability: newUnavailability };
        });

        Object.keys(sectionTimetables).forEach(section => {
            Object.keys(sectionTimetables[section]).forEach(day => {
                const periodsArray = sectionTimetables[section][day];
                if (Array.isArray(periodsArray)) {
                    periodsArray.forEach((slot, periodIndex) => {
                        if (slot && (slot.type === 'subject' || slot.type === 'lab') && slot.teacherId) {
                            const teacherIndex = updatedFaculty.findIndex(t => t.teacherId === slot.teacherId);
                            if (teacherIndex !== -1) {
                                // 👇 match generator format: "Mon-1", "Tue-3"
                                const availabilityKey = `${day}-${periodIndex + 1}`;
                                updatedFaculty[teacherIndex].unavailability = updatedFaculty[teacherIndex].unavailability || {};
                                updatedFaculty[teacherIndex].unavailability[availabilityKey] = {
                                    ...updatedFaculty[teacherIndex].unavailability[availabilityKey],
                                    allocated: true,
                                    message: `Teaching ${slot.name} to ${section}`
                                };
                            }
                        }
                    });
                }
            });
        });

        localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
    };

    const downloadTimetable = () => {
        if (!timetableData) return;

        const dataStr = JSON.stringify(timetableData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const fileName = `timetable-${currentSemester?.semesterName || 'semester'}-${new Date().toISOString().split('T')[0]}.json`;

        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('📥 Timetable downloaded successfully!');
    };

    const getTeacherName = (teacherId) => {
        const teacher = faculty.find(t => t.teacherId === teacherId);
        return teacher ? teacher.name : teacherId;
    };

    const getSubjectColor = (subjectId) => {
        const colors = [
            'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
            'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
            'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
            'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
            'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
            'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200',
            'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200',
            'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200',
            'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
            'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'
        ];
        return colors[subjectId % colors.length];
    };

    const getDayColor = (day) => {
        const dayObj = days.find(d => d.short === day);
        return dayObj ? dayObj.color : 'from-gray-500 to-gray-600';
    };

    const renderTimetableSlot = (slot, periodIndex) => {
        if (!slot) {
            return (
                <div className="h-full p-3 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                    <div className="text-gray-400 text-sm mb-1">P{periodIndex + 1}</div>
                    <div className="text-xs text-gray-500 italic">Free Period</div>
                    <div className="text-xs text-gray-400 mt-2">No class scheduled</div>
                </div>
            );
        }

        const subjectColor = getSubjectColor(slot.subjectId || 0);

        return (
            <div className={`h-full p-3 flex flex-col justify-between border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${subjectColor}`}>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">P{periodIndex + 1}</div>
                        <h4 className="font-bold text-gray-800 text-sm mb-1">{slot.name}</h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${slot.type === 'lab' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {slot.type === 'lab' ? '🔬 Lab' : '📚 Theory'}
                    </span>
                </div>

                <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                        <FaChalkboardTeacher className="text-gray-500" />
                        <span className="font-medium">{slot.teacherName || getTeacherName(slot.teacherId)}</span>
                    </div>

                    {slot.labRoomId && (
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                            <FaSchool className="text-gray-500" />
                            <span>Room: {slot.labRoomId}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-700">
                        <FaClock className="text-gray-500" />
                        <span>{slot.duration || 1} hour(s)</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderTimetableGrid = (data, title = 'Timetable') => {
        if (!data || !selectedSection || !data[selectedSection]) {
            return (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Timetable Data</h3>
                    <p className="text-gray-500 mb-4">
                        Unable to load timetable for {selectedSection || 'this section'}
                    </p>
                    <button
                        onClick={generateNewTimetable}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
                    >
                        Generate Timetable
                    </button>
                </div>
            );
        }

        const sectionData = data[selectedSection];
        const weekdayPeriods = config?.weekdayPeriods || 6;
        const saturdayPeriods = config?.saturdayPeriods || 0;
        const shortBreakAfter = config?.shortBreakAfter || 0;  // e.g. 2 → break after P2
        const lunchBreakAfter = config?.lunchBreakAfter || 0;  // e.g. 4 → break after P4

        // Days we actually show (hide Sat if 0 periods)
        const visibleDays = days.filter(
            (d) => d.short !== 'Sat' || saturdayPeriods > 0
        );

        // Max rows = weekdayPeriods (Sat just has fewer entries)
        const maxPeriods = weekdayPeriods;

        const getPeriodTime = (periodIndex) => {
            // same dummy times you used before – adjust if needed
            switch (periodIndex) {
                case 0: return '8:00 AM';
                case 1: return '9:00 AM';
                case 2: return '10:00 AM';
                case 3: return '11:00 AM';
                case 4: return '12:00 PM';
                default: return '1:00 PM';
            }
        };

        return (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <p className="text-indigo-100 text-sm mt-1">
                                {currentSemester?.semesterName} • {selectedSection} • {weekdayPeriods} periods/day
                            </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                                <FaCalendarDay className="inline mr-1" />
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Timetable Grid */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr>
                                {/* Period column */}
                                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-500" />
                                        <span>Period</span>
                                    </div>
                                </th>
                                {visibleDays.map((day) => (
                                    <th
                                        key={day.short}
                                        className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold text-white"
                                    >
                                        <div
                                            className={`w-full h-full px-3 py-2 rounded-xl bg-gradient-to-r ${getDayColor(
                                                day.short
                                            )} shadow-sm`}
                                        >
                                            <div className="text-sm font-bold">{day.short}</div>
                                            <div className="text-[11px] opacity-90">{day.full}</div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: maxPeriods }, (_, periodIndex) => {
                                const periodNumber = periodIndex + 1;
                                const rows = [];

                                // MAIN ROW FOR THIS PERIOD
                                rows.push(
                                    <tr key={`period-${periodNumber}`} className="border-b border-gray-100">
                                        {/* Period cell */}
                                        <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-4 py-3 align-top">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-indigo-600">
                                                    P{periodNumber}
                                                </div>
                                                <div className="text-[11px] text-gray-500 mt-1">
                                                    {getPeriodTime(periodIndex)}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Day cells */}
                                        {visibleDays.map((day) => {
                                            const periodsForDay =
                                                day.short === 'Sat' ? saturdayPeriods : weekdayPeriods;

                                            const slot =
                                                periodIndex < periodsForDay
                                                    ? sectionData[day.short]?.[periodIndex]
                                                    : null;

                                            return (
                                                <td
                                                    key={`${day.short}-${periodNumber}`}
                                                    className="px-2 py-2 align-top border-r border-gray-100"
                                                >
                                                    {renderTimetableSlot(slot, periodIndex)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );

                                // SHORT BREAK ROW (between periods)
                                if (shortBreakAfter && periodNumber === shortBreakAfter) {
                                    rows.push(
                                        <tr key={`short-break-${periodNumber}`}>
                                            <td
                                                colSpan={visibleDays.length + 1}
                                                className="bg-yellow-50 border-y border-yellow-200 px-4 py-2 text-center text-xs font-semibold text-yellow-800"
                                            >
                                                ☕ Short Break
                                            </td>
                                        </tr>
                                    );
                                }

                                // LUNCH BREAK ROW
                                if (lunchBreakAfter && periodNumber === lunchBreakAfter) {
                                    rows.push(
                                        <tr key={`lunch-break-${periodNumber}`}>
                                            <td
                                                colSpan={visibleDays.length + 1}
                                                className="bg-orange-50 border-y border-orange-200 px-4 py-2 text-center text-xs font-semibold text-orange-800"
                                            >
                                                🍽️ Lunch Break
                                            </td>
                                        </tr>
                                    );
                                }

                                return rows;
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
                <Navbar />
                <div className="flex-1 flex items-center justify-center mt-16">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FaCalendarCheck className="text-indigo-600 text-2xl" />
                            </div>
                        </div>
                        <p className="text-gray-600 mt-4 text-lg font-medium">Loading your timetable...</p>
                        <p className="text-gray-400 text-sm mt-2">Preparing your schedule</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
                <Toaster position="top-right" />
                <Navbar />
                <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-4xl w-full">
                    <div className="mb-8">
                        <button
                            onClick={() => router.push(`/institution/${id}/branch/${branchId}`)}
                            className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 mb-6 transition-all px-4 py-2 rounded-lg hover:bg-white hover:shadow-sm"
                        >
                            <FaArrowLeft /> Back to Branch
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mb-6">
                            <FaExclamationTriangle className="w-12 h-12 text-yellow-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">
                            Curriculum Not Configured
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                            You need to set up the curriculum before generating timetables.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`)}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl"
                            >
                                <FaBook /> View Curriculum
                            </button>
                            <button
                                onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum/edit`)}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl"
                            >
                                <FaEdit /> Create Curriculum
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const hasCurrentTimetable = !!(savedTimetable && timetableData);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            <Toaster position="top-right" />
            <Navbar />

            <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-7xl w-full">
                {/* ================= FIRST TIME FLOW (NO CURRENT TIMETABLE) ================= */}
                {!hasCurrentTimetable ? (
                    <>
                        {/* If no proposal yet: show "Ready to generate" */}
                        {!showComparison || !newGeneratedTimetable ? (
                            <>
                                <div className="mb-8">
                                    <button
                                        onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 mb-6 transition-all px-4 py-2 rounded-lg hover:bg-white hover:shadow-sm"
                                    >
                                        <FaArrowLeft /> Back to Curriculum
                                    </button>

                                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-100">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                                            <div>
                                                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    {currentSemester?.semesterName} Timetable
                                                </h1>
                                                <p className="text-gray-600 mt-3 text-lg">
                                                    Generate your first timetable for this semester
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-5 py-2.5 rounded-full border border-green-200">
                                                <FaCheck className="text-green-600" />
                                                <span className="font-semibold">Curriculum Ready</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
                                    <div className="text-center mb-10">
                                        <div className="mx-auto w-28 h-28 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                                            <FaTable className="w-16 h-16 text-indigo-600" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-gray-800 mb-3">
                                            Ready to Generate Timetable
                                        </h2>
                                        <p className="text-gray-600 text-lg max-w-xl mx-auto">
                                            Your curriculum is set up. Generate your first timetable, review it, and confirm.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 text-center hover:shadow-lg transition-shadow">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaBook className="text-white text-xl" />
                                            </div>
                                            <div className="text-3xl font-bold text-indigo-600 mb-1">{config.subjects?.length || 0}</div>
                                            <div className="text-gray-700 font-medium">Subjects</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 text-center hover:shadow-lg transition-shadow">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaLayerGroup className="text-white text-xl" />
                                            </div>
                                            <div className="text-3xl font-bold text-purple-600 mb-1">{config.labs?.length || 0}</div>
                                            <div className="text-gray-700 font-medium">Labs</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 text-center hover:shadow-lg transition-shadow">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaUserGraduate className="text-white text-xl" />
                                            </div>
                                            <div className="text-3xl font-bold text-green-600 mb-1">{sections.length}</div>
                                            <div className="text-gray-700 font-medium">Sections</div>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            onClick={generateNewTimetable}
                                            disabled={isGenerating}
                                            className="group px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-3 mx-auto shadow-xl hover:shadow-2xl disabled:opacity-70 text-lg font-semibold"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Generating Timetable...
                                                </>
                                            ) : (
                                                <>
                                                    <FaPlay className="group-hover:scale-110 transition-transform" />
                                                    Generate Timetable Proposal
                                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        <p className="text-gray-500 text-sm mt-4">
                                            <FaClock className="inline mr-1" />
                                            This may take a few moments depending on the complexity
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // We HAVE a proposed timetable, but no current one yet
                            <>
                                <div className="mb-8">
                                    <button
                                        onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 mb-6 transition-all px-4 py-2 rounded-lg hover:bg-white hover:shadow-sm"
                                    >
                                        <FaArrowLeft /> Back to Curriculum
                                    </button>

                                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-100">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                                            <div>
                                                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    {currentSemester?.semesterName} Timetable Proposal
                                                </h1>
                                                <p className="text-gray-600 mt-3 text-lg">
                                                    Review the generated timetable and confirm if it looks good.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    {renderTimetableGrid(newGeneratedTimetable.sectionTimetables || newGeneratedTimetable, 'Proposed Timetable')}
                                </div>

                                <div className="flex flex-col sm:flex-row justify-center gap-6 mt-4 p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100">
                                    <button
                                        onClick={generateNewTimetable}
                                        disabled={isGenerating}
                                        className="group px-8 py-3.5 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-semibold disabled:opacity-70"
                                    >
                                        <FaSync className={isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'} />
                                        {isGenerating ? 'Regenerating...' : 'Regenerate Proposal'}
                                    </button>
                                    <button
                                        onClick={acceptNewTimetable}
                                        className="group px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl font-semibold"
                                    >
                                        <FaCheck className="group-hover:scale-110 transition-transform" />
                                        Accept Timetable
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    /* ================= AFTER FIRST ACCEPT (HAVE CURRENT TIMETABLE) ================= */
                    <>
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`)}
                                className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 mb-6 transition-all px-4 py-2 rounded-lg hover:bg-white hover:shadow-sm"
                            >
                                <FaArrowLeft /> Back to Curriculum
                            </button>

                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-100">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                                    <div>
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            {currentSemester?.semesterName} Timetable
                                        </h1>
                                        <p className="text-gray-600 mt-3 text-lg">
                                            View and manage your generated timetable
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={downloadTimetable}
                                            className="group px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                                        >
                                            <FaDownload className="group-hover:animate-bounce" /> Download JSON
                                        </button>
                                        <button
                                            onClick={generateNewTimetable}
                                            disabled={isGenerating || showComparison}
                                            className="group px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
                                        >
                                            <FaSync className={isGenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'} />
                                            {isGenerating ? 'Generating...' : 'Regenerate'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-200">
                                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
                                        <FaCheck className="inline mr-2" />
                                        Timetable Generated
                                    </span>
                                    <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
                                        <FaCalendarDay className="inline mr-2" />
                                        {savedTimetable.generationDate ? new Date(savedTimetable.generationDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Recently'}
                                    </span>
                                    <span className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold border border-indigo-200">
                                        <FaUserGraduate className="inline mr-2" />
                                        {sections.length} Section{sections.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section Selection */}
                        {sections.length > 1 && (
                            <div className="mb-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-4 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaUserGraduate className="text-indigo-600" />
                                    Select Section
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {sections.map(section => (
                                        <button
                                            key={section}
                                            onClick={() => setSelectedSection(section)}
                                            className={`px-5 py-2.5 rounded-xl transition-all transform hover:scale-105 ${selectedSection === section
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
                                                }`}
                                        >
                                            {section}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Main Timetable Display */}
                        <div className="mb-8">
                            {renderTimetableGrid(timetableData, 'Current Timetable')}
                        </div>

                        {/* Comparison View */}
                        {showComparison && newGeneratedTimetable && (
                            <div className="mb-8 animate-fadeIn">
                                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 mb-8 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                                            <FaInfoCircle className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-yellow-800 mb-2">
                                                New Timetable Generated!
                                            </h3>
                                            <p className="text-yellow-700">
                                                Compare the new timetable with your current one. Choose which version works best for your schedule.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-t-xl border border-gray-200">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                Current Timetable
                                            </h3>
                                            <p className="text-gray-600 text-sm mt-1">Last updated: {savedTimetable.generationDate ? new Date(savedTimetable.generationDate).toLocaleDateString() : 'Recently'}</p>
                                        </div>
                                        {renderTimetableGrid(timetableData)}
                                    </div>
                                    <div>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-t-xl border border-green-200">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                                New Timetable
                                            </h3>
                                            <p className="text-gray-600 text-sm mt-1">Generated just now</p>
                                        </div>
                                        {renderTimetableGrid(newGeneratedTimetable.sectionTimetables || newGeneratedTimetable, 'New Generated')}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10 p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100">
                                    <button
                                        onClick={keepOldTimetable}
                                        className="group px-8 py-3.5 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-semibold"
                                    >
                                        <FaTimesCircle className="group-hover:scale-110 transition-transform" />
                                        Keep Current Timetable
                                    </button>
                                    <button
                                        onClick={acceptNewTimetable}
                                        className="group px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl font-semibold"
                                    >
                                        <FaCheck className="group-hover:scale-110 transition-transform" />
                                        Accept New Timetable
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default TimetableViewPage;
