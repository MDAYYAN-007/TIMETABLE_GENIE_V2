'use client';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaEdit,
    FaBook,
    FaFlask,
    FaUsers,
    FaCalendarAlt,
    FaArrowLeft,
    FaPlus,
    FaExclamationTriangle,
    FaEye,
    FaTable,
    FaPlay,
    FaCheck,
    FaTimes,
    FaUniversity,
    FaGraduationCap
} from 'react-icons/fa';

const CurriculumPage = () => {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const branchId = Number(params.branchId);
    const semesterID = decodeURIComponent(params.semesterID);

    const [loading, setLoading] = useState(true);
    const [currentSemester, setCurrentSemester] = useState(null);
    const [curriculum, setCurriculum] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [labs, setLabs] = useState([]);
    const [hasTimetable, setHasTimetable] = useState(false);

    useEffect(() => {
        const fetchData = () => {
            try {
                // Fetch branches
                const allBranches = JSON.parse(localStorage.getItem('branches')) || [];
                const branchesForInstitute = allBranches.filter((branch) => branch.instituteId == id);

                // Find current branch and semester
                const currentBranch = branchesForInstitute.find(branch => branch.branchId == branchId);
                if (currentBranch) {
                    const semester = currentBranch.semesters.find(sem => sem.semesterId === semesterID);
                    if (semester) {
                        setCurrentSemester(semester);
                    }
                }

                // Fetch curriculum
                const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];
                const existingConfig = semesterConfigs.find(
                    config =>
                        config.instituteId === id &&
                        config.branchId === branchId &&
                        config.semesterId === semesterID
                );

                if (existingConfig) {
                    setCurriculum(existingConfig);
                }

                // Fetch faculty
                const allFaculty = JSON.parse(localStorage.getItem('faculty')) || [];
                const instituteFaculty = allFaculty.filter(
                    teacher => teacher.instituteId === id
                );
                setFaculty(instituteFaculty);

                // Fetch labs
                const allLabs = JSON.parse(localStorage.getItem('labs')) || [];
                const labsForInstitute = allLabs.filter(lab => lab.instituteId === id);
                setLabs(labsForInstitute);

                // Check if timetable exists
                const existingTimetables = JSON.parse(localStorage.getItem('generatedTimetables')) || [];
                const existingTimetable = existingTimetables.find(
                    t => t.instituteId === Number(id) &&
                        t.branchId === Number(branchId) &&
                        t.semesterId === semesterID
                );

                setHasTimetable(!!existingTimetable);

            } catch (error) {
                toast.error('Failed to load data');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, branchId, semesterID]);

    const handleEditCurriculum = () => {
        router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum/edit`);
    };

    const handleCreateCurriculum = () => {
        router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum/edit`);
    };

    const handleViewTimetable = () => {
        router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/timetables`);
    };

    const getTeacherName = (teacherId) => {
        const teacher = faculty.find(t => t.teacherId === teacherId);
        return teacher ? teacher.name : teacherId;
    };

    const getLabRoomName = (labId) => {
        if (!labId) return 'Classroom';
        const lab = labs.find(l => l.labId === labId);
        return lab ? `${lab.labName} (${lab.roomNumber})` : labId;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Toaster position="top-center" />
            <Navbar />

            <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-6xl w-full">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/institution/${id}/branch/${branchId}`)}
                        className="flex items-center text-gray-600 hover:text-indigo-700 mb-4 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Branch
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {currentSemester?.semesterName || 'Semester'} Curriculum
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    View and manage curriculum configuration for timetable generation
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {curriculum && (
                                    <button
                                        onClick={handleEditCurriculum}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        <FaEdit /> Edit Curriculum
                                    </button>
                                )}

                                <button
                                    onClick={handleViewTimetable}
                                    className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                >
                                    <FaTable /> View Timetable
                                </button>
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${curriculum ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {curriculum ? (
                                    <>
                                        <FaCheck className="mr-2" />
                                        Curriculum Configured
                                    </>
                                ) : (
                                    <>
                                        <FaExclamationTriangle className="mr-2" />
                                        No Curriculum
                                    </>
                                )}
                            </span>

                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${hasTimetable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {hasTimetable ? (
                                    <>
                                        <FaCheck className="mr-2" />
                                        Timetable Generated
                                    </>
                                ) : (
                                    <>
                                        <FaTimes className="mr-2" />
                                        No Timetable
                                    </>
                                )}
                            </span>

                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                                <FaUsers className="mr-2" />
                                {currentSemester?.sections || 0} Section{currentSemester?.sections !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {!curriculum ? (
                    // No Curriculum State
                    <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100 text-center">
                        <div className="mx-auto h-20 w-20 text-yellow-500 mb-4 flex items-center justify-center bg-yellow-50 rounded-full">
                            <FaExclamationTriangle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            No Curriculum Configured
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            You need to set up the curriculum before you can generate timetables for this semester.
                            The curriculum includes period settings, subjects, labs, and faculty assignments.
                        </p>
                        <button
                            onClick={handleCreateCurriculum}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-sm hover:shadow-md"
                        >
                            <FaPlus /> Create Curriculum
                        </button>
                    </div>
                ) : (
                    // Curriculum View
                    <>
                        {/* Period Configuration */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <FaCalendarAlt className="text-xl" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Period Configuration
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Weekday Periods</h3>
                                    <p className="text-2xl font-bold text-indigo-600">{curriculum.weekdayPeriods}</p>
                                    <p className="text-xs text-gray-500 mt-1">Mon-Fri periods per day</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Saturday Periods</h3>
                                    <p className="text-2xl font-bold text-indigo-600">{curriculum.saturdayPeriods}</p>
                                    <p className="text-xs text-gray-500 mt-1">Saturday periods (0 = no classes)</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Short Break After</h3>
                                    <p className="text-2xl font-bold text-indigo-600">{curriculum.shortBreakAfter}</p>
                                    <p className="text-xs text-gray-500 mt-1">Period number for short break</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Lunch Break After</h3>
                                    <p className="text-2xl font-bold text-indigo-600">{curriculum.lunchBreakAfter}</p>
                                    <p className="text-xs text-gray-500 mt-1">Period number for lunch break</p>
                                </div>
                            </div>
                        </div>

                        {/* Subjects Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <FaBook className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Subjects
                                    </h2>
                                    <p className="text-sm text-gray-500">{curriculum.subjects?.length || 0} subjects configured</p>
                                </div>
                            </div>

                            {curriculum.subjects?.length === 0 ? (
                                <div className="text-center py-6">
                                    <FaBook className="mx-auto text-4xl text-gray-300 mb-3" />
                                    <p className="text-gray-500">No subjects added to this semester</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {curriculum.subjects?.map((subject, index) => (
                                        <div key={subject.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                                                        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3 text-sm">
                                                            {index + 1}
                                                        </span>
                                                        {subject.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 ml-9 mt-1">
                                                        Frequency: <span className="font-medium">{subject.frequency} periods/week</span>
                                                    </p>
                                                </div>
                                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                                                    {subject.teachers?.length || 0} teacher{subject.teachers?.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {subject.teachers && subject.teachers.length > 0 && (
                                                <div className="ml-9">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Teachers:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {subject.teachers.map((teacherId, idx) => (
                                                            <span key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm flex items-center gap-2">
                                                                <FaGraduationCap className="text-gray-400" />
                                                                {getTeacherName(teacherId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Labs Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <FaFlask className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Laboratory Sessions
                                    </h2>
                                    <p className="text-sm text-gray-500">{curriculum.labs?.length || 0} labs configured</p>
                                </div>
                            </div>

                            {curriculum.labs?.length === 0 ? (
                                <div className="text-center py-6">
                                    <FaFlask className="mx-auto text-4xl text-gray-300 mb-3" />
                                    <p className="text-gray-500">No lab sessions added to this semester</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {curriculum.labs?.map((lab, index) => (
                                        <div key={lab.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                                                        <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mr-3 text-sm">
                                                            {index + 1}
                                                        </span>
                                                        {lab.name}
                                                    </h3>
                                                    <div className="ml-9 mt-1 space-y-1">
                                                        <p className="text-sm text-gray-600">
                                                            Frequency: <span className="font-medium">{lab.frequency} sessions/week</span>
                                                        </p>
                                                        {lab.labRoom && (
                                                            <p className="text-sm text-gray-600">
                                                                Lab Room: <span className="font-medium">{getLabRoomName(lab.labRoom)}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                                    {lab.teachers?.length || 0} teacher{lab.teachers?.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {lab.teachers && lab.teachers.length > 0 && (
                                                <div className="ml-9">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Teachers:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lab.teachers.map((teacherId, idx) => (
                                                            <span key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm flex items-center gap-2">
                                                                <FaGraduationCap className="text-gray-400" />
                                                                {getTeacherName(teacherId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CurriculumPage;