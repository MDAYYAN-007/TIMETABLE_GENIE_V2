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

        // const sections = parseInt(branchData.sections);
        const sections = 3;
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
                console.log(`Not enough teachers: Need ${totalTeachersNeeded}, have ${validTeachers.length}`);
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
                    console.log(`Couldn't find enough teachers for batch ${batch + 1}`);
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

        const maxRetries = 200;
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

                for (let j = 0; j < batchWiseDifferentPeriodLabs.length; j++) {
                    const lab = batchWiseDifferentPeriodLabs[j];
                    const allocated = allocateBatchWiseLabsDifferentPeriods(lab, sectionTimetable, facultyAllocations, facultyMap, labMap);
                    if (!allocated) {
                        console.log(`❌ Failed to place ${lab.name} in section ${section} on attempt ${retryCount + 1}`);
                        sectionLabsPlaced = false;
                        break;
                    }
                }

                for (let j = 0; j < batchWiseSamePeriodLabs.length; j++) {
                    const lab = batchWiseSamePeriodLabs[j];
                    const allocated = allocateBatchWiseLabsSamePeriod(lab, sectionTimetable, facultyAllocations, facultyMap, labMap);
                    if (!allocated) {
                        console.log(`❌ Failed to place ${lab.name} in section ${section} on attempt ${retryCount + 1}`);
                        sectionLabsPlaced = false;
                        break;
                    }
                }

                for (let j = 0; j < fullClassLabs.length; j++) {
                    const lab = fullClassLabs[j];
                    const allocated = allocateFullClassLabs(lab, sectionTimetable, facultyAllocations, facultyMap, labMap);

                    if (!allocated) {
                        console.log(`❌ Failed to place ${lab.name} in section ${section} on attempt ${retryCount + 1}`);
                        sectionLabsPlaced = false;
                        break;
                    }
                }

                if (sectionLabsPlaced) {
                    sectionTimetables[section] = sectionTimetable;
                    console.log(`✅ All labs placed for section ${section}`);
                } else {
                    allSectionsSuccessful = false;
                    console.log(`❌ Some labs failed for section ${section}`);
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
                console.log(`Retrying... (${retryCount}/${maxRetries})`);
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