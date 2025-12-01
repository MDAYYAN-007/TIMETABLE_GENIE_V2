'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generateTimetableForSections } from '@/utils/timetableGenerator';
import { FaSpinner, FaEye, FaDownload, FaCheck, FaTimes, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast, { Toaster } from 'react-hot-toast';

const TimetableGenerationPage = () => {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const branchId = Number(params.branchId);
    const semesterID = decodeURIComponent(params.semesterID);

    const [isLoading, setIsLoading] = useState(false);
    const [timetableData, setTimetableData] = useState(null);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [labs, setLabs] = useState([]);
    const [branches, setBranches] = useState([]);
    const [currentSemester, setCurrentSemester] = useState(null);
    const [generationStep, setGenerationStep] = useState('not_started'); // 'not_started', 'generating', 'preview', 'confirmed'
    const [showDetailedPreview, setShowDetailedPreview] = useState(false);

    // Load data from localStorage on component mount
    useEffect(() => {
        const loadData = () => {
            try {
                const semesterConfigs = JSON.parse(localStorage.getItem('semesterConfigs')) || [];
                const currentConfig = semesterConfigs.find(
                    config =>
                        config.instituteId === Number(id) &&
                        config.branchId === Number(branchId) &&
                        config.semesterId === semesterID
                );

                if (!currentConfig) {
                    setError('No configuration found for this semester');
                    return;
                }

                setConfig(currentConfig);

                // Load faculty data
                const facultyData = JSON.parse(localStorage.getItem('faculty')) || [];
                setFaculty(facultyData.filter(teacher => teacher.instituteId === Number(id)));

                // Load labs data
                const labsData = JSON.parse(localStorage.getItem('labs')) || [];
                setLabs(labsData.filter(lab => lab.instituteId === Number(id)));

                // Load branches data
                const branchesData = JSON.parse(localStorage.getItem('branches')) || [];
                setBranches(branchesData);

                // Find current semester info
                const currentBranch = branchesData.find(b => b.branchId === Number(branchId));
                if (currentBranch) {
                    const semester = currentBranch.semesters.find(s => s.semesterId === semesterID);
                    setCurrentSemester(semester);
                }

                // Check if timetable already exists
                const existingTimetables = JSON.parse(localStorage.getItem('generatedTimetables')) || [];
                const existingTimetable = existingTimetables.find(
                    t => t.instituteId === Number(id) &&
                        t.branchId === Number(branchId) &&
                        t.semesterId === semesterID
                );

                if (existingTimetable) {
                    setGenerationStep('confirmed');
                    setTimetableData(existingTimetable.timetableData);
                }

            } catch (err) {
                setError('Failed to load data: ' + err.message);
            }
        };

        loadData();
    }, [id, branchId, semesterID]);

    const generateTimetable = async () => {
        setIsLoading(true);
        setError(null);
        setGenerationStep('generating');

        try {
            if (!config) {
                throw new Error('No configuration available');
            }

            const currentBranch = branches.find(b => b.branchId === config.branchId);
            const currentSemesterBranch = currentBranch?.semesters.find(s => s.semesterId === semesterID);
            if (!currentBranch) {
                throw new Error('Branch data not found');
            }

            // Generate timetable
            const result = await generateTimetableForSections(config, faculty, labs, currentSemesterBranch);
            setTimetableData(result);
            setGenerationStep('preview');

            // Log to console
            console.log('Generated Timetable Preview:', result);

            toast.success('Timetable generated successfully! Review and confirm.');

        } catch (err) {
            setError(err.message);
            setGenerationStep('not_started');
            console.error('Timetable generation error:', err);
            toast.error('Failed to generate timetable: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmAndSaveTimetable = () => {
        try {
            if (!timetableData) {
                throw new Error('No timetable data to save');
            }

            // Update teacher and lab availability
            updateAvailabilityInLocalStorage(timetableData);

            // Save the timetable
            const existingTimetables = JSON.parse(localStorage.getItem('generatedTimetables')) || [];
            
            // Remove existing timetable for this semester if any
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
                branchName: branches.find(b => b.branchId === Number(branchId))?.branchName || 'Branch',
                generationDate: new Date().toISOString(),
                timetableData: timetableData
            };

            localStorage.setItem('generatedTimetables', JSON.stringify([...filteredTimetables, newTimetableEntry]));
            
            setGenerationStep('confirmed');
            toast.success('Timetable confirmed and saved successfully!');
            
            // Auto-refresh after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err) {
            toast.error('Failed to save timetable: ' + err.message);
            console.error('Save error:', err);
        }
    };

    const updateAvailabilityInLocalStorage = (timetable) => {
        // Update teacher availability
        const allFaculty = JSON.parse(localStorage.getItem('faculty')) || [];
        const updatedFaculty = [...allFaculty];
        
        // Update lab availability
        const allLabs = JSON.parse(localStorage.getItem('labs')) || [];
        const updatedLabs = [...allLabs];

        // Iterate through all sections and days to mark allocated slots
        Object.keys(timetable).forEach(section => {
            Object.keys(timetable[section]).forEach(day => {
                const periods = timetable[section][day];
                
                Object.keys(periods).forEach(periodKey => {
                    const slot = periods[periodKey];
                    
                    if (slot.type === 'subject' || slot.type === 'lab') {
                        // Update teacher availability
                        if (slot.teacherId) {
                            const teacherIndex = updatedFaculty.findIndex(t => t.teacherId === slot.teacherId);
                            if (teacherIndex !== -1) {
                                const availabilityKey = `${day}-${periodKey}`;
                                updatedFaculty[teacherIndex].unavailability[availabilityKey] = {
                                    ...updatedFaculty[teacherIndex].unavailability[availabilityKey],
                                    allocated: true,
                                    message: `Teaching ${slot.name} to ${section}`
                                };
                            }
                        }
                        
                        // Update lab availability if lab room is assigned
                        if (slot.labRoomId) {
                            const labIndex = updatedLabs.findIndex(l => l.labId === slot.labRoomId);
                            if (labIndex !== -1) {
                                const availabilityKey = `${day}-${periodKey}`;
                                updatedLabs[labIndex].unavailability[availabilityKey] = {
                                    ...updatedLabs[labIndex].unavailability[availabilityKey],
                                    allocated: true,
                                    message: `Used by ${section} for ${slot.name}`
                                };
                            }
                        }
                    }
                });
            });
        });

        // Save updated data back to localStorage
        localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
        localStorage.setItem('labs', JSON.stringify(updatedLabs));
    };

    const downloadTimetableData = () => {
        if (!timetableData) return;

        const dataStr = JSON.stringify(timetableData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `timetable-${semesterID}-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const regenerateTimetable = () => {
        setGenerationStep('not_started');
        setTimetableData(null);
    };

    const renderTimetablePreview = () => {
        if (!timetableData) return null;

        const sections = Object.keys(timetableData);
        const firstSection = sections[0];
        const days = timetableData[firstSection] ? Object.keys(timetableData[firstSection]) : [];

        return (
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Timetable Preview
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={downloadTimetableData}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <FaDownload />
                            Download JSON
                        </button>
                        <button
                            onClick={() => setShowDetailedPreview(!showDetailedPreview)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FaEye />
                            {showDetailedPreview ? 'Hide Details' : 'Show Details'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">Sections Generated</h3>
                        <ul className="list-disc list-inside text-blue-700">
                            {sections.map(section => (
                                <li key={section}>{section}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Days Scheduled</h3>
                        <ul className="list-disc list-inside text-green-700">
                            {days.map(day => (
                                <li key={day}>{day}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-medium text-purple-800 mb-2">Status</h3>
                        <p className="text-purple-700">Ready for confirmation</p>
                        <p className="text-sm text-purple-600 mt-1">
                            Click "Confirm & Save" to finalize
                        </p>
                    </div>
                </div>

                {showDetailedPreview && (
                    <div className="mt-6">
                        <h3 className="font-medium text-gray-700 mb-3">Detailed View (First Section)</h3>
                        {days.map(day => (
                            <div key={day} className="mb-6">
                                <h4 className="font-medium text-gray-600 mb-2">{day}</h4>
                                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="py-2 px-4 text-left">Period</th>
                                                <th className="py-2 px-4 text-left">Type</th>
                                                <th className="py-2 px-4 text-left">Subject/Lab</th>
                                                <th className="py-2 px-4 text-left">Teacher</th>
                                                <th className="py-2 px-4 text-left">Room</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(timetableData[firstSection][day]).map(([period, slot]) => (
                                                <tr key={period} className="border-t border-gray-200">
                                                    <td className="py-2 px-4">{period}</td>
                                                    <td className="py-2 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs ${slot.type === 'subject' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                            {slot.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4">{slot.name}</td>
                                                    <td className="py-2 px-4">
                                                        {slot.teacherId ? 
                                                            faculty.find(t => t.teacherId === slot.teacherId)?.name || slot.teacherId
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                    <td className="py-2 px-4">{slot.labRoomId || 'Classroom'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={regenerateTimetable}
                        className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2"
                    >
                        <FaTimes />
                        Regenerate
                    </button>
                    <button
                        onClick={confirmAndSaveTimetable}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                    >
                        <FaCheck />
                        Confirm & Save Timetable
                    </button>
                </div>
            </div>
        );
    };

    const renderConfirmedTimetable = () => {
        return (
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-green-800">
                        ✓ Timetable Confirmed and Saved
                    </h2>
                    <button
                        onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/view`)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        View Timetable
                    </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-green-600 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-green-800 font-medium mb-1">Timetable Successfully Saved</p>
                            <p className="text-green-700 text-sm">
                                The timetable has been saved to your system. Teacher and lab availability have been updated.
                                You can now view the complete timetable or generate a new one if needed.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={regenerateTimetable}
                        className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors"
                    >
                        Generate New Timetable
                    </button>
                    <button
                        onClick={downloadTimetableData}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FaDownload />
                        Download JSON Backup
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Toaster position="top-center" />
                <Navbar />

                <main className="flex-1 mt-16 mx-auto px-4 py-8 max-w-6xl w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`)}
                            className="flex items-center text-gray-600 hover:text-indigo-700 mb-4 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" /> Back to Curriculum
                        </button>

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Timetable Generation
                            </h1>
                            <p className="text-gray-600 mb-4">
                                Generate and confirm the timetable for {currentSemester?.semesterName || 'this semester'}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                    {currentSemester?.sections} Section{currentSemester?.sections !== 1 ? 's' : ''}
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                    {config?.subjects?.length || 0} Subjects
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                    {config?.labs?.length || 0} Labs
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Timetable Generation Process
                            </h2>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${generationStep === 'not_started' ? 'bg-gray-200' : 'bg-green-100 text-green-600'}`}>
                                        1
                                    </div>
                                    <span className={`${generationStep === 'not_started' ? 'text-gray-500' : 'text-green-600'}`}>Generate</span>
                                    
                                    <div className="w-12 h-0.5 bg-gray-200"></div>
                                    
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${generationStep === 'preview' || generationStep === 'confirmed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}>
                                        2
                                    </div>
                                    <span className={`${generationStep === 'preview' || generationStep === 'confirmed' ? 'text-blue-600' : 'text-gray-500'}`}>Preview</span>
                                    
                                    <div className="w-12 h-0.5 bg-gray-200"></div>
                                    
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${generationStep === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-gray-200'}`}>
                                        3
                                    </div>
                                    <span className={`${generationStep === 'confirmed' ? 'text-green-600' : 'text-gray-500'}`}>Confirmed</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {generationStep === 'not_started' && (
                            <div className="text-center py-8">
                                <div className="mx-auto h-20 w-20 text-indigo-500 mb-4 flex items-center justify-center bg-indigo-50 rounded-full">
                                    <FaEye className="w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Timetable</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    Click the button below to generate a timetable based on your curriculum configuration.
                                    You'll be able to preview it before confirming.
                                </p>
                                <button
                                    onClick={generateTimetable}
                                    disabled={isLoading || !config}
                                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors mx-auto shadow-md hover:shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FaEye />
                                            Generate Timetable
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {generationStep === 'generating' && (
                            <div className="text-center py-12">
                                <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Timetable</h3>
                                <p className="text-gray-500">This may take a few moments...</p>
                            </div>
                        )}

                        {generationStep === 'preview' && renderTimetablePreview()}
                        {generationStep === 'confirmed' && renderConfirmedTimetable()}

                        {!config && !error && (
                            <div className="text-center py-8">
                                <div className="mx-auto h-20 w-20 text-yellow-500 mb-4 flex items-center justify-center bg-yellow-50 rounded-full">
                                    <FaInfoCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration Required</h3>
                                <p className="text-gray-500 mb-6">
                                    Please set up the semester curriculum first before generating a timetable.
                                </p>
                                <button
                                    onClick={() => router.push(`/institution/${id}/branch/${branchId}/semester/${encodeURIComponent(semesterID)}/curriculum`)}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    Go to Curriculum Setup
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default TimetableGenerationPage;
