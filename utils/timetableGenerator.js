'use client';

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export async function generateTimetableForSections(config, originalFacultyData, originalLabsData, branchData) {
    try {
        console.log(config);
        console.log(branchData);


        // Deriving basic data
        let days = {};
        let periods = parseInt(config.weekdayPeriods);
        let satPeriods = parseInt(config.saturdayPeriods);

        if (satPeriods === 0) {
            days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        } else {
            days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        }
        const shortBreak = parseInt(config.shortBreak);
        const lunchBreak = parseInt(config.lunchBreak);

        const sections = parseInt(branchData.sections);
        // const sections = 3;
        const subjects = config.subjects;
        const labs = config.labs;

        const electiveSubjects = subjects.filter(subject => subject.isElective === true);
        electiveSubjects.forEach(element => {
            const allTeachers = element.electiveOptions.flatMap(option => option.teachers);
            element.allTeachers = allTeachers;
        });

        const regularSubjects = subjects.filter(subject => subject.isElective === false);

        // Build lookup maps (O(1) access)
        const initialFacultyMap = new Map(originalFacultyData.map(f => [f.teacherId, f]));
        const initialLabMap = new Map(originalLabsData.map(l => [l.labId, l]));

        // Function to calculate teacher working hours per week and per day
        function calculateTeacherWorkingHours(teacherId) {
            const teacher = initialFacultyMap.get(teacherId);
            if (!teacher) return [0, [0, 0, 0, 0, 0, 0]];
            const availabilityArray = Object.entries(teacher.unavailability).map(([key, value]) => {
                return { slot: key, ...value };
            })
            const unavailableSlots = availabilityArray.filter(slot => slot.unavailable === true);
            const monSlots = unavailableSlots.filter(slot => slot.slot.startsWith("Mon")).length;
            const tueSlots = unavailableSlots.filter(slot => slot.slot.startsWith("Tue")).length;
            const wedSlots = unavailableSlots.filter(slot => slot.slot.startsWith("Wed")).length;
            const thuSlots = unavailableSlots.filter(slot => slot.slot.startsWith("Thu")).length;
            const friSlots = unavailableSlots.filter(slot => slot.slot.startsWith("Fri")).length;
            const satSlots = unavailableSlots.filter(slot => slot.slot.startsWith("Sat")).length;

            const weekdayUnavailablility = [monSlots, tueSlots, wedSlots, thuSlots, friSlots, satSlots];
            const totalHours = unavailableSlots.length || 0;
            return [totalHours, weekdayUnavailablility];
        }

        // Keeping track of faculty allocations
        let initialFacultyAllocations = {};
        for (const teacher of originalFacultyData) {
            const workingHours = calculateTeacherWorkingHours(teacher.teacherId);
            initialFacultyAllocations[teacher.teacherId] = {
                name: teacher.name,
                workingHours: workingHours[0],
                eachDayUnavailability: workingHours[1]
            };
        }

        // Checking if the particular teacher is available on that specific day and period
        function isTeacherAvailable(teacher, day, period, facultyMap) {
            const teacherInfo = facultyMap.get(teacher);
            if (!teacherInfo) return false;
            return teacherInfo.unavailability[`${day}-${period}`].unavailable !== true;
        }

        // Check if the room is available for this specific period
        function isRoomAvailable(roomId, day, period, labMap) {
            const labRoom = labMap.get(roomId);
            if (!labRoom) return false;
            return !labRoom.unavailability[`${day}-${period}`]?.unavailable;
        }

        // Checking if the subject can be placed in the timetable
        function canPlaceSubject(day, period, subjectName, teachers, attempts, timetable, facultyMap, dailySubjectCount) {
            if (period > (day === "Sat" ? satPeriods : periods)) return false;
            if (timetable[day][period] !== null) return false;
            if (Array.isArray(teachers)) {
                for (const teacher of teachers) {
                    if (!isTeacherAvailable(teacher, day, period + 1, facultyMap)) {
                        return false;
                    }
                }
            } else {
                if (!isTeacherAvailable(teachers, day, period + 1, facultyMap)) {
                    return false;
                }
            }

            const prev = period > 0 ? timetable[day][period - 1] : null;
            const next = period < timetable[day].length ? timetable[day][period] : null;
            if ((prev && prev.subject === subjectName) || (next && next.subject === subjectName)) return false;

            if (attempts > 30) return true;
            if (dailySubjectCount[day][subjectName] >= 1) return false;

            if (attempts > 50) return true;
            if (dailySubjectCount[day][subjectName] >= 2) return false;

            return true;
        }

        // Function to place all elective subjects 
        function placeAllElectives(electives, facultyAllocations, facultyMap, timetable, dailySubjectCount) {
            const lengthofElecs = electives.length;
            for (let i = 0; i < lengthofElecs; i++) {
                const elective = electives[i];
                const frequency = elective.frequency;
                let allocated = 0;
                let attempts = 0;
                while (allocated < frequency && attempts < 100) {
                    let period;
                    const day = days[Math.floor(Math.random() * days.length)];
                    let randomChoice = Math.floor(Math.random() * 2);
                    const half = Math.floor(day === "Sat" ? satPeriods / 2 : periods / 2);
                    if (randomChoice === 0) {
                        period = Math.floor(Math.random() * half);
                    } else {
                        period = Math.floor(Math.random() * ((day === "Sat" ? satPeriods : periods) - half)) + half;
                    }

                    if (canPlaceSubject(day, period, elective.name, elective.allTeachers, attempts, timetable, facultyMap, dailySubjectCount)) {
                        timetable[day][period] = {
                            subject: elective.name,
                            type: "Elective",
                            teachers: elective.allTeachers
                        };
                        dailySubjectCount[day][elective.name]++;
                        allocated++;
                        for (const teacher of elective.allTeachers) {
                            facultyAllocations[teacher].workingHours++;
                            facultyAllocations[teacher].eachDayUnavailability[days.indexOf(day)]++;
                            facultyMap.get(teacher).unavailability[`${day}-${period + 1}`].unavailable = true;
                        }
                    }
                    attempts++;
                }
            }
        }

        function canPlaceFullClassLab(day, period, lab, attempts, sectionTimetable) {
            if (period >= (day === "Sat" ? satPeriods - 1 : periods - 1)) return false;
            if (period === shortBreak - 1 || period === lunchBreak - 1) return false;
            if (sectionTimetable[day][period] !== null || sectionTimetable[day][period + 1] !== null) return false;

            if (attempts > 15) return true;
            const prev = period - 1 >= 0 ? sectionTimetable[day][period - 1] : null;
            const next = period + 2 < sectionTimetable[day].length ? sectionTimetable[day][period + 2] : null;
            if ((prev && prev.type === "Lab") || (next && next.type === "Lab")) return false;


            if (sectionTimetable[day].some(slot => slot && slot.type === "Lab" && slot.name === lab)) return false;

            const dayIndex = days.indexOf(day);
            if (dayIndex > 0) {
                const prevDay = days[dayIndex - 1];
                if (sectionTimetable[prevDay][period - 1]?.name === lab || sectionTimetable[prevDay][period]?.name === lab) return false;
            }
            if (dayIndex < days.length - 1) {
                const nextDay = days[dayIndex + 1];
                if (sectionTimetable[nextDay][period - 1]?.name === lab || sectionTimetable[nextDay][period]?.name === lab) return false;
            }

            return true;
        }

        function selectFullClassTeachers(requiredTeachers, allTeachers, dayIndex, day, period, facultyMap, facultyAllocations) {

            const validTeachers = allTeachers.filter(
                teacherId => teacherId && facultyAllocations[teacherId]
            );

            if (validTeachers.length < requiredTeachers) {
                return false;
            }

            const sorted = [...validTeachers].sort((a, b) => {
                const aWeekly = facultyAllocations[a]?.workingHours || 0;
                const bWeekly = facultyAllocations[b]?.workingHours || 0;

                if (aWeekly !== bWeekly) return aWeekly - bWeekly;

                const aDaily = facultyAllocations[a]?.eachDayUnavailability[dayIndex] || 0;
                const bDaily = facultyAllocations[b]?.eachDayUnavailability[dayIndex] || 0;
                return aDaily - bDaily;
            });

            const selected = [];

            for (const teacherId of sorted) {
                if (isTeacherAvailable(teacherId, day, period + 1, facultyMap) &&
                    isTeacherAvailable(teacherId, day, period + 2, facultyMap)) {

                    selected.push(teacherId);

                    if (selected.length === requiredTeachers) {
                        return selected;
                    }
                }
            }

            return false;
        }

        function allocateFullClassLabs(lab, sectionTimetable, facultyAllocations, facultyMap, labMap) {
            const frequency = lab.frequency;
            const requiredTeachers = lab.teachersRequired;
            const allTeachers = lab.teachers;
            const keepSameTeachers = lab.keepSameTeachers;
            const labRooms = lab.labRooms.filter(roomId => roomId && roomId !== "");

            let allocated = false;
            let attempts = 0;

            while (!allocated && attempts < 100) {
                attempts++;

                let masterTeachers = null;
                let placedSlots = [];

                for (let k = 0; k < frequency; k++) {
                    let success = false;
                    let innerAttempts = 0;

                    while (!success && innerAttempts < 200) {
                        const dayIndex = Math.floor(Math.random() * days.length);
                        const day = days[dayIndex];
                        const maxPeriods = (day === "Sat" ? satPeriods : periods);
                        const period = Math.floor(Math.random() * (maxPeriods));

                        let selectedTeachers;

                        if (keepSameTeachers) {
                            if (k === 0) {
                                masterTeachers = selectFullClassTeachers(requiredTeachers, allTeachers, dayIndex, day, period, facultyMap, facultyAllocations);
                                if (!masterTeachers) {
                                    innerAttempts++;
                                    continue;
                                }
                            }
                            selectedTeachers = masterTeachers;

                            const allAvailable = selectedTeachers.every(teacherId =>
                                isTeacherAvailable(teacherId, day, period + 1, facultyMap) &&
                                isTeacherAvailable(teacherId, day, period + 2, facultyMap)
                            );

                            if (!allAvailable) {
                                innerAttempts++;
                                continue;
                            }
                        } else {
                            selectedTeachers = selectFullClassTeachers(requiredTeachers, allTeachers, dayIndex, day, period, facultyMap, facultyAllocations);
                            if (!selectedTeachers) {
                                innerAttempts++;
                                continue;
                            }
                        }

                        let selectedLabRoom = null;
                        for (const room of labRooms) {
                            if (isRoomAvailable(room, day, period + 1, labMap) && isRoomAvailable(room, day, period + 2, labMap)) {
                                selectedLabRoom = room;
                                break;
                            }
                        }

                        if (!selectedLabRoom) {
                            innerAttempts++;
                            continue;
                        }

                        if (canPlaceFullClassLab(day, period, lab.name, innerAttempts, sectionTimetable)) {
                            const labRoomDetails = labMap.get(selectedLabRoom);
                            sectionTimetable[day][period] = {
                                subject: lab.name,
                                type: "Lab",
                                teachers: selectedTeachers,
                                batchType: "Full Class",
                                labRoom: selectedLabRoom,
                                labRoomName: labRoomDetails?.labName || "Unknown Lab",
                                roomNumber: labRoomDetails?.roomNumber || "",
                                building: labRoomDetails?.building || ""
                            };
                            sectionTimetable[day][period + 1] = {
                                subject: lab.name,
                                type: "Lab",
                                teachers: selectedTeachers,
                                batchType: "Full Class",
                                labRoom: selectedLabRoom,
                                labRoomName: labRoomDetails?.labName || "Unknown Lab",
                                roomNumber: labRoomDetails?.roomNumber || "",
                                building: labRoomDetails?.building || ""
                            };

                            placedSlots.push({
                                day,
                                period,
                                teachers: [...selectedTeachers],
                                labRoom: selectedLabRoom
                            });

                            // Update allocations
                            for (const teacher of selectedTeachers) {
                                facultyAllocations[teacher].workingHours += 2;
                                facultyAllocations[teacher].eachDayUnavailability[dayIndex] += 2;
                                facultyMap.get(teacher).unavailability[`${day}-${period + 1}`].unavailable = true;
                                facultyMap.get(teacher).unavailability[`${day}-${period + 2}`].unavailable = true;
                            }

                            const labRoomObj = labMap.get(selectedLabRoom);
                            if (labRoomObj) {
                                labRoomObj.unavailability[`${day}-${period + 1}`].unavailable = true;
                                labRoomObj.unavailability[`${day}-${period + 2}`].unavailable = true;
                            }

                            success = true;
                        }
                        innerAttempts++;
                    }

                    if (!success) {
                        // Rollback ALL placed slots for this lab
                        placedSlots.forEach(slot => {
                            for (const teacher of slot.teachers) {
                                facultyAllocations[teacher].workingHours -= 2;
                                facultyAllocations[teacher].eachDayUnavailability[days.indexOf(slot.day)] -= 2;
                                facultyMap.get(teacher).unavailability[`${slot.day}-${slot.period + 1}`].unavailable = false;
                                facultyMap.get(teacher).unavailability[`${slot.day}-${slot.period + 2}`].unavailable = false;
                            }

                            const labRoomObj = labMap.get(slot.labRoom);
                            if (labRoomObj) {
                                labRoomObj.unavailability[`${slot.day}-${slot.period + 1}`].unavailable = false;
                                labRoomObj.unavailability[`${slot.day}-${slot.period + 2}`].unavailable = false;
                            }

                            sectionTimetable[slot.day][slot.period] = null;
                            sectionTimetable[slot.day][slot.period + 1] = null;
                        });

                        placedSlots = [];
                        masterTeachers = null; // Reset master teachers if failed
                        break;
                    }
                }

                if (placedSlots.length === frequency) {
                    allocated = true;
                }
            }

            return allocated;
        }

        function selectBatchWiseSamePeriodTeachers(requiredTeachers, allTeachers, numberOfBatches, day, period, facultyMap, facultyAllocations) {
            const validTeachers = allTeachers.filter(
                teacherId => teacherId && facultyAllocations[teacherId]
            );

            const totalTeachersNeeded = requiredTeachers * numberOfBatches;

            if (validTeachers.length < totalTeachersNeeded) {
                // console.log(`Not enough teachers: Need ${totalTeachersNeeded}, have ${validTeachers.length}`);
                return false;
            }

            // Sort teachers by workload (least loaded first)
            const sorted = [...validTeachers].sort((a, b) => {
                const aWeekly = facultyAllocations[a]?.workingHours || 0;
                const bWeekly = facultyAllocations[b]?.workingHours || 0;
                return aWeekly - bWeekly;
            });

            const selectedTeachers = [];
            const usedTeachers = new Set();

            // Try to select teachers for all batches
            for (let batch = 0; batch < numberOfBatches; batch++) {
                const batchTeachers = [];

                for (const teacherId of sorted) {
                    if (usedTeachers.has(teacherId)) continue;

                    if (isTeacherAvailable(teacherId, day, period + 1, facultyMap) &&
                        isTeacherAvailable(teacherId, day, period + 2, facultyMap)) {

                        batchTeachers.push(teacherId);
                        usedTeachers.add(teacherId);

                        if (batchTeachers.length === requiredTeachers) {
                            selectedTeachers.push(batchTeachers);
                            break;
                        }
                    }
                }

                // If we couldn't find enough teachers for this batch
                if (batchTeachers.length < requiredTeachers) {
                    // console.log(`Couldn't find enough teachers for batch ${batch + 1}`);
                    return false;
                }
            }

            return selectedTeachers;
        }

        function allocateBatchWiseLabsSamePeriod(lab, sectionTimetable, facultyAllocations, facultyMap, labMap) {
            const frequency = lab.frequency;
            const requiredTeachers = lab.teachersRequired;
            const allTeachers = lab.teachers;
            const numberOfBatches = lab.numberOfBatches;
            const keepSameTeachers = lab.keepSameTeachers;
            const labRooms = lab.labRooms.filter(roomId => roomId && roomId !== "");

            let allocated = false;
            let attempts = 0;
            let masterBatchTeachers = null; // Store teachers for all batches when keepSameTeachers is true

            while (!allocated && attempts < 100) {
                attempts++;

                let placedSlots = [];

                for (let k = 0; k < frequency; k++) {
                    let success = false;
                    let innerAttempts = 0;

                    while (!success && innerAttempts < 200) {
                        const dayIndex = Math.floor(Math.random() * days.length);
                        const day = days[dayIndex];
                        const maxPeriods = (day === "Sat" ? satPeriods : periods);
                        const period = Math.floor(Math.random() * (maxPeriods - 1));

                        // Check if the period is available for all batches
                        if (sectionTimetable[day][period] !== null || sectionTimetable[day][period + 1] !== null || period === shortBreak - 1 || period === lunchBreak - 1) {
                            innerAttempts++;
                            continue;
                        }

                        // Get available lab rooms - optimized approach
                        const neededRooms = Math.min(labRooms.length, numberOfBatches);
                        const availableLabRooms = [];

                        for (const roomId of labRooms) {
                            if (availableLabRooms.length >= neededRooms) break;

                            if (isRoomAvailable(roomId, day, period + 1, labMap) &&
                                isRoomAvailable(roomId, day, period + 2, labMap)) {
                                availableLabRooms.push(roomId);
                            }
                        }

                        if (availableLabRooms.length < neededRooms && innerAttempts < 50) {
                            // console.log(`❌ No available lab rooms for ${lab.name} on ${day} during period ${period + 1}`);
                            innerAttempts++;
                            continue;
                        }

                        // Select teachers for all batches - handle keepSameTeachers
                        let batchTeachers;

                        if (keepSameTeachers) {
                            if (k === 0) {
                                // First session: select teachers for all batches
                                masterBatchTeachers = selectBatchWiseSamePeriodTeachers(
                                    requiredTeachers, allTeachers, numberOfBatches, day, period,
                                    facultyMap, facultyAllocations
                                );
                                if (!masterBatchTeachers) {
                                    innerAttempts++;
                                    continue;
                                }
                            }
                            batchTeachers = masterBatchTeachers;

                            // Verify all teachers are still available for this session
                            const allAvailable = batchTeachers.every(batch =>
                                batch.every(teacherId =>
                                    isTeacherAvailable(teacherId, day, period + 1, facultyMap) &&
                                    isTeacherAvailable(teacherId, day, period + 2, facultyMap)
                                )
                            );

                            if (!allAvailable) {
                                innerAttempts++;
                                continue;
                            }
                        } else {
                            // Select new teachers for each session
                            batchTeachers = selectBatchWiseSamePeriodTeachers(
                                requiredTeachers, allTeachers, numberOfBatches, day, period,
                                facultyMap, facultyAllocations
                            );
                            if (!batchTeachers) {
                                innerAttempts++;
                                continue;
                            }
                        }

                        // Create lab entries for all batches
                        const allBatches = [];

                        for (let batch = 0; batch < numberOfBatches; batch++) {
                            // Use available lab room if we have one, otherwise leave as undefined
                            const selectedLabRoom = availableLabRooms[batch] || undefined;
                            const labRoomDetails = selectedLabRoom ? labMap.get(selectedLabRoom) : null;
                            const teachersForBatch = batchTeachers[batch];

                            const batchData = {
                                subject: lab.name,
                                type: "Lab",
                                teachers: teachersForBatch,
                                batchType: `Batch ${batch + 1}`,
                                batchNumber: batch + 1,
                                labRoom: selectedLabRoom,
                                labRoomName: labRoomDetails?.labName || "No Lab Room",
                                roomNumber: labRoomDetails?.roomNumber || "",
                                building: labRoomDetails?.building || ""
                            };

                            allBatches.push(batchData);

                            placedSlots.push({
                                day,
                                period,
                                batch: batch + 1,
                                teachers: [...teachersForBatch],
                                labRoom: selectedLabRoom
                            });

                            // Update teacher allocations
                            for (const teacher of teachersForBatch) {
                                facultyAllocations[teacher].workingHours += 2;
                                facultyAllocations[teacher].eachDayUnavailability[dayIndex] += 2;
                                facultyMap.get(teacher).unavailability[`${day}-${period + 1}`].unavailable = true;
                                facultyMap.get(teacher).unavailability[`${day}-${period + 2}`].unavailable = true;
                            }

                            // Update lab room allocations only if we have a room
                            if (selectedLabRoom) {
                                const labRoomObj = labMap.get(selectedLabRoom);
                                if (labRoomObj) {
                                    labRoomObj.unavailability[`${day}-${period + 1}`].unavailable = true;
                                    labRoomObj.unavailability[`${day}-${period + 2}`].unavailable = true;
                                }
                            }
                        }

                        // Store all batches in the timetable
                        sectionTimetable[day][period] = allBatches;
                        sectionTimetable[day][period + 1] = allBatches;

                        success = true;
                    }

                    if (!success) {
                        // Reset master teachers if we're using keepSameTeachers and failed
                        if (keepSameTeachers) {
                            masterBatchTeachers = null;
                        }

                        // Only rollback if we actually placed some slots
                        if (placedSlots.length > 0) {
                            placedSlots.forEach(slot => {
                                for (const teacher of slot.teachers) {
                                    facultyAllocations[teacher].workingHours -= 2;
                                    facultyAllocations[teacher].eachDayUnavailability[days.indexOf(slot.day)] -= 2;
                                    facultyMap.get(teacher).unavailability[`${slot.day}-${slot.period + 1}`].unavailable = false;
                                    facultyMap.get(teacher).unavailability[`${slot.day}-${slot.period + 2}`].unavailable = false;
                                }

                                if (slot.labRoom) {
                                    const labRoomObj = labMap.get(slot.labRoom);
                                    if (labRoomObj) {
                                        labRoomObj.unavailability[`${slot.day}-${slot.period + 1}`].unavailable = false;
                                        labRoomObj.unavailability[`${slot.day}-${slot.period + 2}`].unavailable = false;
                                    }
                                }
                            });

                            sectionTimetable[placedSlots[0].day][placedSlots[0].period] = null;
                            sectionTimetable[placedSlots[0].day][placedSlots[0].period + 1] = null;
                        }

                        placedSlots = [];
                        break;
                    }
                }

                if (placedSlots.length === frequency * numberOfBatches) {
                    allocated = true;
                }
            }

            return allocated;
        }

        function selectTeachersForBatch(requiredTeachers, allTeachers, day, period, facultyMap, facultyAllocations, usedTeachers = new Set()) {
            const validTeachers = allTeachers.filter(
                teacherId => teacherId && facultyAllocations[teacherId] && !usedTeachers.has(teacherId)
            );

            if (validTeachers.length < requiredTeachers) {
                return false;
            }

            // Sort teachers by workload (least loaded first)
            const dayIndex = days.indexOf(day);
            const sorted = [...validTeachers].sort((a, b) => {
                const aWeekly = facultyAllocations[a]?.workingHours || 0;
                const bWeekly = facultyAllocations[b]?.workingHours || 0;
                if (aWeekly !== bWeekly) return aWeekly - bWeekly;

                const aDaily = facultyAllocations[a]?.eachDayUnavailability[dayIndex] || 0;
                const bDaily = facultyAllocations[b]?.eachDayUnavailability[dayIndex] || 0;
                return aDaily - bDaily;
            });

            const selected = [];

            for (const teacherId of sorted) {
                if (isTeacherAvailable(teacherId, day, period + 1, facultyMap) &&
                    isTeacherAvailable(teacherId, day, period + 2, facultyMap)) {

                    selected.push(teacherId);
                    if (selected.length === requiredTeachers) {
                        return selected;
                    }
                }
            }

            return false;
        }

        let persistentBatchTeachers = new Map();

        function allocateBatchWiseLabsDifferentPeriods(allBatchSessions, sectionTimetable, facultyAllocations, facultyMap, labMap) {

            const sessionsWithStatus = allBatchSessions.map(session => ({
                ...session,
                placed: false
            }));

            let batchesPlaced = 0;
            const maxAttempts = 2000;
            let totalAttempts = 0;

            while (batchesPlaced < sessionsWithStatus.length && totalAttempts < maxAttempts) {
                totalAttempts++;

                const unplacedSessions = sessionsWithStatus.filter(session => !session.placed);
                if (unplacedSessions.length === 0) break;

                const randomNum = Math.random() < 0.7 ? 0 : 1;
                let selectedBatchIndices = [];

                if (randomNum === 0 && unplacedSessions.length > 1) {
                    let attempts = 0;
                    const maxAttempts = 50;
                    const maxBatchesToSelect = Math.min(4, unplacedSessions.length);

                    do {
                        selectedBatchIndices = [];
                        const numBatchesToSelect = Math.floor(Math.random() * (maxBatchesToSelect - 1)) + 2;

                        for (let i = 0; i < numBatchesToSelect; i++) {
                            let newIndex;
                            let attempt = 0;
                            const maxSingleAttempts = 20;

                            do {
                                newIndex = Math.floor(Math.random() * unplacedSessions.length);
                                attempt++;

                                if (attempt > maxSingleAttempts) break;
                            } while (
                                selectedBatchIndices.includes(newIndex) ||
                                selectedBatchIndices.some(idx =>
                                    unplacedSessions[idx].batchNumber === unplacedSessions[newIndex].batchNumber
                                )
                            );

                            if (attempt <= maxSingleAttempts) {
                                selectedBatchIndices.push(newIndex);
                            }
                        }
                        attempts++;

                        if (attempts > maxAttempts || selectedBatchIndices.length < 2) {
                            break;
                        }
                    } while (selectedBatchIndices.length < 2 && attempts <= maxAttempts);

                    if (selectedBatchIndices.length < 2) {
                        // Fallback to single batch if couldn't find multiple
                        selectedBatchIndices = [Math.floor(Math.random() * unplacedSessions.length)];
                    }
                } else {
                    // Place single batch
                    selectedBatchIndices = [Math.floor(Math.random() * unplacedSessions.length)];
                }


                if (selectedBatchIndices.length > 1) {
                    // Choose a random valid day/period for this placement attempt
                    let day, period, dayIndex, maxPeriods, tries = 0, found = false;
                    while (tries < 150 && !found) {
                        dayIndex = Math.floor(Math.random() * days.length);
                        day = days[dayIndex];
                        maxPeriods = (day === "Sat" ? satPeriods : periods);
                        // we need two consecutive periods; avoid short/lunch & last slot
                        period = Math.floor(Math.random() * (maxPeriods - 1));
                        if (period === shortBreak - 1 || period === lunchBreak - 1) { tries++; continue; }

                        const slot0 = sectionTimetable[day][period];
                        const slot1 = sectionTimetable[day][period + 1];

                        const usable =
                            ((slot0 === null && slot1 === null) ||
                                (Array.isArray(slot0) && Array.isArray(slot1)));

                        found = usable;
                        tries++;
                    }
                    if (!found) {
                        // couldn't find a usable slot right now; skip this multi-batch attempt
                        continue;
                    }

                    // Avoid teacher and lab-room double-use within this chosen slot
                    const usedTeachers = new Set();
                    const usedRooms = new Set();

                    // If slot already has batch entries, reserve their teachers/rooms to prevent conflicts
                    const existing = Array.isArray(sectionTimetable[day][period]) ? sectionTimetable[day][period] : [];
                    for (const b of existing) {
                        (b.teachers || []).forEach(t => usedTeachers.add(t));
                        if (b.labRoom) usedRooms.add(b.labRoom);
                    }

                    // Figure out which of the selected batches we can actually place in this slot
                    const toPlace = [];

                    for (const idx of selectedBatchIndices) {
                        const batch = unplacedSessions[idx];

                        const key = `${batch.labName}#${batch.batchNumber}`;

                        let teachersForThisBatch = batch.keepSameTeachers ? persistentBatchTeachers.get(key) || null : null;

                        if (!teachersForThisBatch) {
                            // fresh selection with conflict avoidance for this slot
                            teachersForThisBatch = selectTeachersForBatch(
                                batch.requiredTeachers,
                                batch.teachers,
                                day,
                                period,
                                facultyMap,
                                facultyAllocations,
                                usedTeachers
                            );
                            if (!teachersForThisBatch) {
                                continue; // can't staff this batch in this slot
                            }
                            // Pin teachers for future sessions of the same batch
                            persistentBatchTeachers.set(key, teachersForThisBatch);
                        } else {
                            // ensure pinned teachers are actually free now
                            const okNow = teachersForThisBatch.every(t =>
                                isTeacherAvailable(t, day, period + 1, facultyMap) &&
                                isTeacherAvailable(t, day, period + 2, facultyMap) &&
                                !usedTeachers.has(t)
                            );
                            if (!okNow) {
                                // try to re-select (do not overwrite persistent map if we can't)
                                const alt = selectTeachersForBatch(
                                    batch.requiredTeachers,
                                    batch.teachers,
                                    day,
                                    period,
                                    facultyMap,
                                    facultyAllocations,
                                    usedTeachers
                                );
                                if (!alt) continue;
                                teachersForThisBatch = alt; // use alternates for this slot only
                            }
                        }

                        let selectedLabRoom = null;
                        if (Array.isArray(batch.labRooms) && batch.labRooms.length > 0) {
                            // pick the first available room that is not already used in this slot and free for both periods
                            for (const roomId of batch.labRooms) {
                                if (usedRooms.has(roomId)) continue;
                                if (isRoomAvailable(roomId, day, period + 1, labMap) &&
                                    isRoomAvailable(roomId, day, period + 2, labMap)) {
                                    selectedLabRoom = roomId;
                                    break;
                                }
                            }
                            if (!selectedLabRoom) {
                                continue;
                            }
                        }

                        // This batch can be placed in this slot
                        toPlace.push({ batch, teachersForThisBatch, selectedLabRoom, day, period, dayIndex });
                        // reserve teachers/room for this slot to avoid collision with other selected batches
                        teachersForThisBatch.forEach(t => usedTeachers.add(t));
                        if (selectedLabRoom) usedRooms.add(selectedLabRoom);
                    }

                    if (toPlace.length > 0) {
                        // write/append to the timetable; normalize to an array of batch entries
                        const slotArray0 = Array.isArray(sectionTimetable[day][period]) ? sectionTimetable[day][period] : [];
                        const slotArray1 = Array.isArray(sectionTimetable[day][period + 1]) ? sectionTimetable[day][period + 1] : [];

                        for (const item of toPlace) {
                            const { batch, teachersForThisBatch, selectedLabRoom, day, period, dayIndex } = item;

                            const labRoomDetails = selectedLabRoom ? labMap.get(selectedLabRoom) : null;

                            const batchEntry = {
                                subject: batch.labName,
                                type: "Lab",
                                teachers: teachersForThisBatch,
                                batchType: `Batch ${batch.batchNumber}`,
                                batchNumber: batch.batchNumber,
                                labRoom: selectedLabRoom || undefined,
                                labRoomName: selectedLabRoom ? (labRoomDetails?.labName || "Unknown Lab") : "No Lab Room",
                                roomNumber: selectedLabRoom ? (labRoomDetails?.roomNumber || "") : "",
                                building: selectedLabRoom ? (labRoomDetails?.building || "") : ""
                            };

                            slotArray0.push(batchEntry);
                            slotArray1.push(batchEntry);

                            // update teacher allocations/unavailability
                            for (const t of teachersForThisBatch) {
                                facultyAllocations[t].workingHours += 2;
                                facultyAllocations[t].eachDayUnavailability[dayIndex] += 2;
                                facultyMap.get(t).unavailability[`${day}-${period + 1}`].unavailable = true;
                                facultyMap.get(t).unavailability[`${day}-${period + 2}`].unavailable = true;
                            }

                            // update room unavailability
                            if (selectedLabRoom) {
                                const roomObj = labMap.get(selectedLabRoom);
                                if (roomObj) {
                                    roomObj.unavailability[`${day}-${period + 1}`].unavailable = true;
                                    roomObj.unavailability[`${day}-${period + 2}`].unavailable = true;
                                }
                            }

                            // mark this session as placed
                            const placedRef = sessionsWithStatus.find(s =>
                                s.labName === batch.labName &&
                                s.batchNumber === batch.batchNumber &&
                                s.sessionNumber === batch.sessionNumber
                            );
                            if (placedRef) placedRef.placed = true;
                        }

                        // commit back to the timetable
                        sectionTimetable[day][period] = slotArray0;
                        sectionTimetable[day][period + 1] = slotArray1;

                        // bump the placed counter by the number we actually placed
                        batchesPlaced += toPlace.length;
                    }
                }

                else if (selectedBatchIndices.length === 1) {
                    // Single batch placement logic (similar to above but for one batch)
                    const batch = unplacedSessions[selectedBatchIndices[0]];

                    let day, period, dayIndex, maxPeriods, tries = 0, found = false;
                    while (tries < 150 && !found) {
                        dayIndex = Math.floor(Math.random() * days.length);
                        day = days[dayIndex];
                        maxPeriods = (day === "Sat" ? satPeriods : periods);

                        period = Math.floor(Math.random() * (maxPeriods - 1));
                        if (period === shortBreak - 1 || period === lunchBreak - 1) {
                            tries++;
                            continue;
                        }

                        const slot0 = sectionTimetable[day][period];
                        const slot1 = sectionTimetable[day][period + 1];

                        const usable =
                            (slot0 === null && slot1 === null);

                        found = usable;
                        tries++;
                    }

                    if (!found) {
                        continue;
                    }

                    const key = `${batch.labName}#${batch.batchNumber}`;

                    let teachersForThisBatch = batch.keepSameTeachers ? persistentBatchTeachers.get(key) || null : null;

                    const usedTeachers = new Set();
                    const usedRooms = new Set();

                    if (!teachersForThisBatch) {
                        // fresh selection with conflict avoidance for this slot
                        teachersForThisBatch = selectTeachersForBatch(
                            batch.requiredTeachers,
                            batch.teachers,
                            day,
                            period,
                            facultyMap,
                            facultyAllocations,
                            usedTeachers
                        );
                        if (!teachersForThisBatch) {
                            continue; // can't staff this batch in this slot
                        }
                        // Pin teachers for future sessions of the same batch
                        persistentBatchTeachers.set(key, teachersForThisBatch);
                    } else {
                        // ensure pinned teachers are actually free now
                        const okNow = teachersForThisBatch.every(t =>
                            isTeacherAvailable(t, day, period + 1, facultyMap) &&
                            isTeacherAvailable(t, day, period + 2, facultyMap)
                        );
                        if (!okNow) {
                            const alt = selectTeachersForBatch(
                                batch.requiredTeachers,
                                batch.teachers,
                                day,
                                period,
                                facultyMap,
                                facultyAllocations,
                                usedTeachers
                            );
                            if (!alt) continue;
                            teachersForThisBatch = alt;
                        }
                    }

                    let selectedLabRoom = null;
                    if (Array.isArray(batch.labRooms) && batch.labRooms.length > 0) {
                        // pick the first available room that is not already used in this slot and free for both periods
                        for (const roomId of batch.labRooms) {
                            if (usedRooms.has(roomId)) continue;
                            if (isRoomAvailable(roomId, day, period + 1, labMap) &&
                                isRoomAvailable(roomId, day, period + 2, labMap)) {
                                selectedLabRoom = roomId;
                                break;
                            }
                        }
                        if (!selectedLabRoom) {
                            continue;
                        }
                    }

                    const labRoomDetails = selectedLabRoom ? labMap.get(selectedLabRoom) : null;

                    const batchEntry = {
                        subject: batch.labName,
                        type: "Lab",
                        teachers: teachersForThisBatch,
                        batchType: `Batch ${batch.batchNumber}`,
                        batchNumber: batch.batchNumber,
                        labRoom: selectedLabRoom || undefined,
                        labRoomName: selectedLabRoom ? (labRoomDetails?.labName || "Unknown Lab") : "No Lab Room",
                        roomNumber: selectedLabRoom ? (labRoomDetails?.roomNumber || "") : "",
                        building: selectedLabRoom ? (labRoomDetails?.building || "") : ""
                    };

                    sectionTimetable[day][period] = [batchEntry];
                    sectionTimetable[day][period + 1] = [batchEntry];

                    for (const t of teachersForThisBatch) {
                        facultyAllocations[t].workingHours += 2;
                        facultyAllocations[t].eachDayUnavailability[dayIndex] += 2;
                        facultyMap.get(t).unavailability[`${day}-${period + 1}`].unavailable = true;
                        facultyMap.get(t).unavailability[`${day}-${period + 2}`].unavailable = true;
                    }

                    // update room unavailability
                    if (selectedLabRoom) {
                        const roomObj = labMap.get(selectedLabRoom);
                        if (roomObj) {
                            roomObj.unavailability[`${day}-${period + 1}`].unavailable = true;
                            roomObj.unavailability[`${day}-${period + 2}`].unavailable = true;
                        }
                    }
                    sessionsWithStatus.find(s =>
                        s.labName === batch.labName &&
                        s.batchNumber === batch.batchNumber &&
                        s.sessionNumber === batch.sessionNumber
                    ).placed = true;

                    batchesPlaced += 1;
                    // console.log(`Placed 1 batch at ${day} P${period + 1}-${period + 2}`);
                }
            }

            const allPlaced = batchesPlaced === sessionsWithStatus.length;

            return allPlaced;
        }

        const maxRetries = 1000;
        let retryCount = 0;
        let success = false;
        let finalResult = null;

        while (retryCount < maxRetries && !success) {
            // Creating an empty timetable
            let timetable = {};
            for (let day of days) {
                timetable[day] = new Array(day === "Sat" ? satPeriods : periods).fill(null);
            }

            let facultyData = JSON.parse(JSON.stringify(originalFacultyData));
            let facultyMap = new Map(facultyData.map(f => [f.teacherId, f]));
            let facultyAllocations = JSON.parse(JSON.stringify(initialFacultyAllocations));
            let labData = JSON.parse(JSON.stringify(originalLabsData));
            let labMap = new Map(labData.map(l => [l.labId, l]));
            persistentBatchTeachers = new Map();

            let dailySubjectCount = {};
            for (let day of days) {
                dailySubjectCount[day] = {};
                for (let subject of subjects) {
                    dailySubjectCount[day][subject.name] = 0;
                }
            }

            placeAllElectives(electiveSubjects, facultyAllocations, facultyMap, timetable, dailySubjectCount);

            let allSectionsSuccessful = true;
            let sectionTimetables = {};

            for (let i = 0; i < sections; i++) {
                let sectionTimetable = JSON.parse(JSON.stringify(timetable));
                const section = branchData.sectionNames[i];
                const batchWiseSamePeriodLabs = labs.filter(lab => lab.sessionType === 'batchWise' && lab.batchScheduleType === 'samePeriod');
                const batchWiseDifferentPeriodLabs = labs.filter(lab => lab.sessionType === 'batchWise' && lab.batchScheduleType === 'differentPeriods');
                const fullClassLabs = labs.filter(lab => lab.sessionType === 'fullClass');
                let sectionLabsPlaced = true;

                // Convert all batch-wise different periods labs into individual batch sessions
                const allIndividualBatchSessions = [];
                for (let j = 0; j < batchWiseDifferentPeriodLabs.length; j++) {
                    const lab = batchWiseDifferentPeriodLabs[j];
                    for (let batch = 1; batch <= lab.numberOfBatches; batch++) {
                        for (let session = 1; session <= lab.frequency; session++) {
                            allIndividualBatchSessions.push({
                                labName: lab.name,
                                batchNumber: batch,
                                sessionNumber: session,
                                requiredTeachers: lab.teachersRequired,
                                keepSameTeachers: lab.keepSameTeachers,
                                teachers: [...lab.teachers], // Copy the array
                                labRooms: [...lab.labRooms.filter(roomId => roomId && roomId !== "")] // Copy the array
                            });
                        }
                    }
                }

                // Convert all batch-wise different periods labs into individual batch sessions
                // ... (you already build allIndividualBatchSessions) ...

                // console.log(`All individual batch sessions for section ${section}:`, allIndividualBatchSessions);

                // Pass all individual batch sessions to the function
                const allocatedBWDP = allocateBatchWiseLabsDifferentPeriods(allIndividualBatchSessions, sectionTimetable, facultyAllocations, facultyMap, labMap);

                // If allocation failed, mark section as failed and break
                if (!allocatedBWDP) {
                    // console.log(`❌ Failed to place batch-wise different periods labs in section ${section} on attempt ${retryCount + 1}`);
                    sectionLabsPlaced = false;
                }

                for (let j = 0; j < batchWiseSamePeriodLabs.length; j++) {
                    const lab = batchWiseSamePeriodLabs[j];
                    const allocated = allocateBatchWiseLabsSamePeriod(lab, sectionTimetable, facultyAllocations, facultyMap, labMap);
                    if (!allocated) {
                        // console.log(`❌ Failed to place ${lab.name} in section ${section} on attempt ${retryCount + 1}`);
                        sectionLabsPlaced = false;
                        break;
                    }
                }

                for (let j = 0; j < fullClassLabs.length; j++) {
                    const lab = fullClassLabs[j];
                    const allocated = allocateFullClassLabs(lab, sectionTimetable, facultyAllocations, facultyMap, labMap);

                    if (!allocated) {
                        // console.log(`❌ Failed to place ${lab.name} in section ${section} on attempt ${retryCount + 1}`);
                        sectionLabsPlaced = false;
                        break;
                    }
                }

                if (sectionLabsPlaced) {
                    sectionTimetables[section] = sectionTimetable;
                    // console.log(`✅ All labs placed for section ${section}`);
                } else {
                    allSectionsSuccessful = false;
                    // console.log(`❌ Some labs failed for section ${section}`);
                    break; // No need to check other sections if one fails
                }
            }

            if (allSectionsSuccessful) {
                success = true;
                finalResult = {
                    success: true,
                    timetable: timetable,
                    sectionTimetables: sectionTimetables,
                    facultyAllocations: facultyAllocations,
                    attempts: retryCount + 1
                };
                console.log(finalResult);
                console.log(`🎉 Success! All labs placed after ${retryCount + 1} attempts`);
            } else {
                retryCount++;
                // console.log(`Retrying... (${retryCount}/${maxRetries})`);
            }
        }

        if (!success) {
            finalResult = {
                success: false,
                error: `Failed to place all labs after ${maxRetries} attempts`,
                attempts: maxRetries
            };
            console.log(`💥 Failed after ${maxRetries} attempts`);
        } else {
            console.log(`🎉 Success! All labs placed after ${retryCount + 1} attempts`);
            return finalResult;
        }

    } catch (error) {
        console.error('Timetable generation error:', error);
        return {
            success: false,
            error: error.message,
            timetable: null,
            teacherAllocations: null,
            labRoomAllocations: null
        };
    }
}