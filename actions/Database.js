// "use server";
// import { query } from '@/actions/db';

// const deleteAll = async () => {
//     try {
//         await query(`
//             DELETE FROM timetables;
//             DELETE FROM generated_timetables;
//             DELETE FROM timetable_users;
//             DELETE FROM timetable_formdata;
//             `);
//         console.log("All tables have been deleted");
//         return true;
//     } catch (error) {
//         console.error(error);
//     }
// }

// export default deleteAll;

// "use server";
// import { query } from '@/actions/db';

// const getAllData = async () => {
//     try {
//         const [timetables, generatedTimetables, users, formData] = await Promise.all([
//             query(`SELECT * FROM timetables`),
//             query(`SELECT * FROM generated_timetables`),
//             query(`SELECT * FROM timetable_users`),
//             query(`SELECT * FROM timetable_formdata`)
//         ]);
        
//         console.log("All data:", {
//             timetables: timetables.rows,
//             generatedTimetables: generatedTimetables.rows,
//             users: users.rows,
//             formData: formData.rows
//         });
        
//         return {
//             timetables: timetables.rows,
//             generatedTimetables: generatedTimetables.rows,
//             users: users.rows,
//             formData: formData.rows
//         };
//     } catch (error) {
//         console.error("Error fetching data:", error);
//         throw error;
//     }
// }

// export default getAllData;

// 'use server';
// import { query } from '@/actions/db';

// const dropAllTables = async () => {
//     try {
//         await query(`
//             DROP TABLE IF EXISTS 
//                 timetables, 
//                 generated_timetables, 
//                 timetable_users, 
//                 timetable_formdata 
//             CASCADE;
//         `);
//         console.log("All specified tables dropped successfully.");
//         return true;
//     } catch (error) {
//         console.error("Error dropping tables:", error.message);
//         throw new Error("Failed to drop all tables");
//     }
// };

// export default dropAllTables;

//Create timetable_users table

// 'use server';
// import { query } from '@/actions/db';

// const createTimetableUsersTable = async () => {
//     try {
//         await query(`
//             CREATE TABLE IF NOT EXISTS timetable_users(
//                 id SERIAL PRIMARY KEY,
//                 email VARCHAR(255) UNIQUE NOT NULL,
//                 password TEXT NOT NULL
//             );
//         `);
//         console.log("timetable_users table created successfully.");
//         //Verufy if the table is created or not
//         const checkResult = await query(`SELECT * FROM timetable_users`);
//         if (checkResult.rowCount > 0) {
//             console.log('timetable_users table exists and has data:', checkResult.rows);
//         } else {
//             console.log('timetable_users table exists but is empty');
//         }
//         return true;
//     } catch (error) {
//         console.error("Error creating timetable_users table:", error.message);
//         throw new Error("Failed to create timetable_users table");
//     }
// }

// export default createTimetableUsersTable;