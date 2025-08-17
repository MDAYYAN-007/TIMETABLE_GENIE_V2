import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import React from "react";
import { FaArrowRight, FaUniversity, FaChalkboardTeacher, FaLaptopCode, FaProjectDiagram, FaFlask, FaDownload, FaMagic, FaBook, FaUserTie, FaCalendarCheck, FaSyncAlt, FaMobileAlt } from "react-icons/fa";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen mt-16">
        <header className="min-h-[90vh] bg-gradient-to-br from-[#8e44ad] via-[#482cc2] to-[#3498db] text-white flex items-center relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-[#ff8a65] blur-3xl animate-float-slow"></div>
            <div className="absolute bottom-1/3 right-1/3 w-60 h-60 rounded-full bg-[#3498db] blur-3xl animate-float-medium"></div>
            <div className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full bg-[#ffe0b2] blur-3xl animate-float-fast"></div>
          </div>

          <div className="container mx-auto px-6 text-center max-w-5xl relative">
            <span className="inline-block px-5 py-2 text-sm font-medium bg-white/15 backdrop-blur-sm rounded-full border border-white/20 mb-6 tracking-wide uppercase text-[#ffde59]">
              Timetable Genie
            </span>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              <span className="text-white">Institutional Scheduling</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ffde59] to-[#ff914d]">
                Reimagined
              </span>
            </h1>

            <p className="text-lg md:text-xl font-light mb-10 max-w-3xl mx-auto text-white/85 leading-relaxed">
              A complete solution for academic institutions to manage complex timetables across departments,
              faculties, and semesters — with perfect coordination and zero hassle.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link
                href="/create-institution"
                className="inline-flex items-center justify-center text-lg font-semibold text-[#2c2c54] px-8 py-4 rounded-lg shadow-lg bg-gradient-to-r from-[#ffde59] to-[#ff914d] hover:opacity-90 transition-all duration-300"
              >
                Start Creating <FaArrowRight className="ml-3 mt-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center text-lg font-semibold px-8 py-4 rounded-lg border border-white/40 text-white hover:bg-white/10 transition-all duration-300"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </header>

        {/* Institution Types */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-widest text-[#8e44ad] uppercase bg-[#8e44ad]/10 rounded-full">
                Adaptive Scheduling
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8e44ad] to-[#3498db]">Diverse Academic Needs</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Manage timetables for your entire institution — branches, semesters, sections — with conflict-free scheduling, lab block allocation, and instant downloads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  icon: <FaUniversity className="text-5xl" />,
                  title: "Whole Institution",
                  desc: "Oversee timetables for every branch, semester, and section from one dashboard.",
                },
                {
                  icon: <FaChalkboardTeacher className="text-5xl" />,
                  title: "Common Faculty Pool",
                  desc: "Prevent double-booking with a shared faculty database across all schedules.",
                },
                {
                  icon: <FaLaptopCode className="text-5xl" />,
                  title: "Section-Level Planning",
                  desc: "Generate section-specific timetables that respect teacher availability.",
                },
                {
                  icon: <FaProjectDiagram className="text-5xl" />,
                  title: "Lab Scheduling",
                  desc: "Allocate two consecutive periods for labs and avoid scheduling gaps.",
                },
                {
                  icon: <FaFlask className="text-5xl" />,
                  title: "Conflict-Free Automation",
                  desc: "Ensure no teacher is assigned to 2–3 periods at the same time.",
                },
                {
                  icon: <FaDownload className="text-5xl" />,
                  title: "Download & Share",
                  desc: "Export timetables in PDF/CSV formats for quick distribution.",
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition border-t-4 border-[#8e44ad] text-center"
                >
                  <div className="text-[#8e44ad] flex justify-center mb-5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Process Timeline - Enhanced */}
        <section className="py-24 bg-gradient-to-br from-[#f9f0ff] to-[#e6f7ff]">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-widest text-[#3498db] uppercase bg-[#3498db]/10 rounded-full">
                IMPLEMENTATION
              </span>
              <h2 className="text-4xl font-bold text-[#2c3e50] mb-6">
                Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8e44ad] to-[#3498db]">4-Step Process</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Transform your scheduling from weeks of work to just minutes
              </p>
            </div>

            <div className="relative">
              {/* Progress line */}
              <div className="hidden md:block absolute left-0 right-0 top-1/2 h-1 bg-gray-200 transform -translate-y-1/2"></div>
              <div className="hidden md:block absolute left-0 top-1/2 h-1 bg-gradient-to-r from-[#8e44ad] to-[#3498db] transform -translate-y-1/2 transition-all duration-1000" style={{ width: "100%" }}></div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                {[
                  {
                    icon: <FaUniversity className="text-2xl" />,
                    title: "Define Institution",
                    desc: "Set up your academic hierarchy and structure",
                    bg: "bg-gradient-to-br from-[#8e44ad] to-[#9b59b6]",
                    step: "1"
                  },
                  {
                    icon: <FaChalkboardTeacher className="text-2xl" />,
                    title: "Add Faculty",
                    desc: "Input teachers with their availability constraints",
                    bg: "bg-gradient-to-br from-[#3498db] to-[#5dade2]",
                    step: "2"
                  },
                  {
                    icon: <FaBook className="text-2xl" />,
                    title: "Configure Curriculum",
                    desc: "Map subjects to programs and semesters",
                    bg: "bg-gradient-to-br from-[#2c3e50] to-[#34495e]",
                    step: "3"
                  },
                  {
                    icon: <FaMagic className="text-2xl" />,
                    title: "Generate Schedules",
                    desc: "Get department, faculty, and section timetables",
                    bg: "bg-gradient-to-br from-[#ff8a65] to-[#ff9e7d]",
                    step: "4"
                  }
                ].map((step, index) => (
                  <div
                    key={index}
                    className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <p className="text-lg font-semibold text-[#8e44ad] border-b-2 border-[#8e44ad] max-w-max"> Step {step.step}</p>
                    <div className={`w-16 h-16 rounded-full ${step.bg} text-white text-lg font-bold flex items-center justify-center mb-6 mx-auto shadow-md`}>
                      <div className="relative">
                        {step.icon}

                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-center text-[#2c3e50]">{step.title}</h3>
                    <p className="text-gray-600 text-center">{step.desc}</p>
                    <div className="mt-4 flex justify-center">
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-[#8e44ad] bg-[#8e44ad]/10 rounded-full">
                        {index === 0 ? "Start here" : index === 3 ? "Final step" : `Step ${index + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-2 mb-4 text-xs font-bold tracking-widest text-[#8e44ad] uppercase bg-[#8e44ad]/10 rounded-full">
                CORE FEATURES
              </span>
              <h2 className="text-4xl font-bold text-[#2c3e50] mb-6">
                Powerful <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8e44ad] to-[#3498db]">Institution-Wide</span> Solutions
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Comprehensive tools designed specifically for educational institutions of all sizes
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                {
                  icon: <FaUniversity className="text-3xl" />,
                  title: "Centralized Faculty Management",
                  desc: "Define all teachers once with their availability constraints, then reuse across all departments and semesters.",
                  color: "text-[#8e44ad]",
                  badge: "Organization"
                },
                {
                  icon: <FaUserTie className="text-3xl" />,
                  title: "Teacher-Centric Scheduling",
                  desc: "Each faculty member gets their personalized schedule respecting all their constraints automatically.",
                  color: "text-[#3498db]",
                  badge: "Faculty"
                },
                {
                  icon: <FaCalendarCheck className="text-3xl" />,
                  title: "Cross-Semester Coordination",
                  desc: "Handle shared faculty between different programs and semesters without double-booking.",
                  color: "text-[#ff8a65]",
                  badge: "Coordination"
                },
                {
                  icon: <FaSyncAlt className="text-3xl" />,
                  title: "Real-Time Conflict Resolution",
                  desc: "Instant alerts and smart suggestions when scheduling conflicts arise across departments.",
                  color: "text-[#2c3e50]",
                  badge: "Automation"
                },
                {
                  icon: <FaProjectDiagram className="text-3xl" />,
                  title: "Institutional Overview",
                  desc: "See the complete picture of all schedules across your organization in one dashboard.",
                  color: "text-[#8e44ad]",
                  badge: "Analytics"
                },
                {
                  icon: <FaMobileAlt className="text-3xl" />,
                  title: "Mobile Accessibility",
                  desc: "Faculty and administrators can access schedules anytime, anywhere with our mobile app.",
                  color: "text-[#3498db]",
                  badge: "Access"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="absolute top-0 right-0 m-4">
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#8e44ad] to-[#3498db] rounded-full">
                      {feature.badge}
                    </span>
                  </div>
                  <div className={`${feature.color} mb-5 flex items-center`}>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm mr-4 group-hover:shadow-md transition-shadow">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-[#2c3e50]">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 pl-16">{feature.desc}</p>
                  {/* <div className="mt-6 pt-4 border-t border-gray-100 flex items-center">
                    <a href="#" className="text-sm font-semibold text-[#8e44ad] hover:text-[#6c3483] flex items-center">
                      Learn more
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </a>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#8e44ad] to-[#3498db] text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Scheduling?</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto">
              Join institutions worldwide that have eliminated scheduling headaches with Timetable Genie V2
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center text-lg font-semibold px-8 py-4 rounded-xl shadow-2xl bg-white text-[#2c3e50] hover:scale-105 transition-all duration-300 hover:shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center text-lg font-semibold px-8 py-4 rounded-xl shadow-2xl bg-transparent border-2 border-white text-white hover:bg-white/10 hover:scale-105 transition-all duration-300"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}