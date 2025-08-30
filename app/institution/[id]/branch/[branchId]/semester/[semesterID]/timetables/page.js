'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { generateTimetableForSections } from '@/utils/timetableGenerator';
import { FaSpinner, FaEye, FaDownload } from 'react-icons/fa';

const TimetableTestPage = () => {
    const params = useParams();
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

            } catch (err) {
                setError('Failed to load data: ' + err.message);
            }
        };

        loadData();
    }, [id, branchId, semesterID]);

    const generateTimetable = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!config) {
                throw new Error('No configuration available');
            }

            const currentBranch = branches.find(b => b.branchId === config.branchId);
            const currentSemesterBranch = currentBranch?.semesters.find(s => s.semesterId === semesterID);
            if (!currentBranch) {
                throw new Error('Branch data not found');
            }

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

            // Generate timetable
            const result = await generateTimetableForSections(config, faculty, labs, currentSemesterBranch);
            setTimetableData(result);

            // Log to console
            console.log('Generated Timetable Data:', result);

        } catch (err) {
            setError(err.message);
            console.error('Timetable generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTimetableData = () => {
        if (!timetableData) return;

        const dataStr = JSON.stringify(timetableData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `timetable-${semesterID}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Timetable Generation Test
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Test the timetable generation algorithm
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-blue-800 mb-2">How it works</h2>
                        <ul className="list-disc list-inside text-blue-700 space-y-1">
                            <li>Click "Generate Timetable" to run the algorithm</li>
                            <li>Results will be displayed in the console and available for download</li>
                            <li>Check the browser console (F12) to see the detailed timetable data</li>
                            <li>Download the JSON file to inspect the complete structure</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={generateTimetable}
                            disabled={isLoading || !config}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
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

                        {timetableData && (
                            <button
                                onClick={downloadTimetableData}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <FaDownload />
                                Download JSON
                            </button>
                        )}
                    </div>
                </div>

                {timetableData && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Generation Results
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-700 mb-2">Sections Generated</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {Object.keys(timetableData).map(section => (
                                        <li key={section}>{section}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-700 mb-2">Days in Timetable</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {timetableData[Object.keys(timetableData)[0]] &&
                                        Object.keys(timetableData[Object.keys(timetableData)[0]]).map(day => (
                                            <li key={day}>{day}</li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-medium text-gray-700 mb-2">Sample Day (First Section, Monday)</h3>
                            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                <pre className="text-sm text-gray-600">
                                    {timetableData[Object.keys(timetableData)[0]] &&
                                        JSON.stringify(
                                            timetableData[Object.keys(timetableData)[0]].Mon,
                                            null,
                                            2
                                        )
                                    }
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {!config && !error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <p className="text-yellow-700">
                            No configuration found. Please set up the semester curriculum first.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimetableTestPage;