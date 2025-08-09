'use server';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/actions/db';
import storeUserLoginData from '@/actions/storeUserLoginData';
import bcrypt from 'bcrypt';
import getUserData from '@/actions/getUserData';
import { cookies } from "next/headers";
import getDraftData from '@/actions/getDraftData';
import migrateLocalDataToDB from '@/actions/migrateLocalDataToDB';

const saltRounds = 10;

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
                isSignUp: { label: 'Is Sign Up', type: 'hidden' }
            },
            async authorize(credentials) {
                try {
                    const isSignUp = credentials.isSignUp === 'true';
                    console.log("Credentials:", credentials);
                    if (isSignUp) {
                        const checkResult = await query(`SELECT * FROM timetable_users WHERE email = $1`, [credentials.username]);
                        console.log(checkResult.rows);
                        if (checkResult.rowCount > 0) {
                            throw new Error('User already exists');
                        }
                        const hashedPassword = await bcrypt.hash(credentials.password, saltRounds);
                        const userData = {
                            email: credentials.username,
                            password: hashedPassword
                        };
                        await storeUserLoginData(userData);
                        const result = await getUserData(credentials.username);
                        return {
                            id: result.id,
                            email: result.email,
                            isNewUser: true
                        };
                    } else {
                        const user = await getUserData(credentials.username);
                        if (!user) {
                            throw new Error('User not found !!');
                        }
                        const isValid = await bcrypt.compare(credentials.password, user.password);
                        if (!isValid) {
                            throw new Error('Incorrect Password !!');
                        }
                        return { id: user.id, email: user.email, isNewUser: false };
                    }

                }
                catch (error) {
                    console.log(error);
                    throw new Error(error.message || 'An error occurred');
                }
            },
        })
    ],
    callbacks: {
        async signIn({ user, account, req }) {
            try {
                console.log("User", user);
                console.log("Account", account);
                if (account?.provider === 'google') {
                    user.password = 'google';
                    const email = user.email;
                    console.log("Email:", email);
                    if (email) {
                        const checkResult = await query(`SELECT * FROM timetable_users WHERE email = $1`, [email]);
                        console.log("Check Result:", checkResult.rows);
                        if (checkResult.rowCount > 0) {
                            user.id = checkResult.rows[0].id;
                            user.isNewUser = false;
                        } else {
                            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                            const userData = {
                                email: email,
                                password: hashedPassword
                            };
                            await storeUserLoginData(userData);
                        }

                        const cookieStore = await cookies();
                        const UUIDOfStoredData = cookieStore.get("UUIDOfStoredData");

                        console.log("UUIDOfStoredData:", UUIDOfStoredData);

                        if (UUIDOfStoredData) {
                            const storedData = await getDraftData(UUIDOfStoredData.value);
                            console.log("Stored Data:", storedData);
                            if (storedData) {
                                const { form_data, timetables, generated_timetables } = storedData;
                                console.log("Form Data:", form_data);
                                console.log("Timetables:", timetables);
                                console.log("Generated Timetables:", generated_timetables);
                                const res = await migrateLocalDataToDB(timetables, form_data, generated_timetables, email);
                                if (res) {
                                    console.log("Local data migrated to DB successfully!");
                                }
                                // router.push("/timetables");
                            }
                        }
                    }
                }

                if (user.isNewUser) {
                    console.log("New user detected, storing login data.");
                    await storeUserLoginData(user);
                }
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },
        async session({ session }) {
            try {
                if (session.user && session.user.email) {
                    const user = await getUserData(session.user.email);
                    // console.log(user);
                    session.user.id = user.id;
                    session.user.email = user.email;
                }
                return session;
            } catch (error) {
                console.log(error);
                return session;
            }
        },
    },
});

export { handler as GET, handler as POST };