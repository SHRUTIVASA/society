"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { addDoc, serverTimestamp } from "firebase/firestore";
import Head from "next/head";
import Link from "next/link";

interface Event {
  id: string;
  date: Date;
  description: string;
  location: string;
  title: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // New state for navigation loading
  const router = useRouter();
  const auth = getAuth();
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const IMAGE_BASE_PATH = "/society";

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    // if (!auth.currentUser) {
    //   router.push("/");
    //   return;
    // }

    fetchEvents();
  }, []);

  const handleNavigateHome = () => {
    setIsNavigating(true); // Set loading state
    router.push("/");
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    setContactSuccess("");

    // Basic validation
    if (!contactName || !contactEmail || !contactQuery) {
      setContactError("Please fill in all required fields");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(contactEmail)) {
      setContactError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, "queries"), {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        query: contactQuery,
        createdAt: serverTimestamp(),
        status: "new",
      });

      console.log("Query submitted with ID: ", docRef.id);

      // Reset form
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactQuery("");

      setContactSuccess(
        "Your message has been sent successfully! We'll get back to you soon."
      );

      setTimeout(() => {
        setShowContactModal(false);
        setContactSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error submitting query: ", err);
      setContactError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsQuery = query(
        collection(db, "events"),
        orderBy("date", "asc")
      );
      const querySnapshot = await getDocs(eventsQuery);

      const eventsData: Event[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        eventsData.push({
          id: doc.id,
          date: data.date.toDate(),
          description: data.description,
          location: data.location,
          title: data.title,
        });
      });

      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const getEventsForMonth = (date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();

    return events.filter((event) => {
      const eventDate = event.date;
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = event.date;
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateToMonth = (event: Event) => {
    setSelectedDate(new Date(event.date));
    setSelectedEvent(event);
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDay; i++) {
      const day = prevMonthLastDay - startingDay + i + 1;
      days.push(
        <div key={`prev-${i}`} className="text-center text-gray-400 p-2">
          {day}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayEvents = getEventsForDay(currentDate);
      const hasEvents = dayEvents.length > 0;

      days.push(
        <div
          key={`current-${day}`}
          className={`text-center p-2 border border-gray-200 cursor-pointer relative ${
            selectedDate.getDate() === day && selectedDate.getMonth() === month
              ? "bg-blue-100"
              : ""
          }`}
          onClick={() => setSelectedDate(currentDate)}
        >
          {day}
          {hasEvents && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
          )}
        </div>
      );
    }

    // Next month days
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - (startingDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div key={`next-${i}`} className="text-center text-gray-400 p-2">
          {i}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            &lt;
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-medium text-black p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Events Calendar - YeshKrupa Society</title>
        <meta name="description" content="YeshKrupa society events calendar" />
      </Head>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Redirecting to home page...</p>
          </div>
        </div>
      )}

      <nav className="bg-[#152238] py-3 px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#b9c7e2] rounded-full flex items-center justify-center text-black text-xl font-bold mr-3">
            <Link
            href="/"
            className="flex items-center text-m m:text-base opacity-80 hover:opacity-100 transition-opacity duration-200"
          >
            YK
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-wide">
            Events Calendar
          </h1>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-10">
          <Link
            href="/"
            className="flex items-center text-white text-sm sm:text-base opacity-80 hover:opacity-100 transition-opacity duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="hidden xs:inline">Home</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 text-black">
            {renderCalendar()}

            {/* Day events */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4 text-black">
                Events on {isMounted ? selectedDate.toLocaleDateString() : ""}
              </h3>

              {getEventsForDay(selectedDate).length === 0 ? (
                <p className="text-black">No events scheduled for this day.</p>
              ) : (
                <div className="space-y-4">
                  {getEventsForDay(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <h4 className="font-medium text-black">{event.title}</h4>
                      <p className="text-sm text-black">{event.location}</p>
                      <p className="text-sm text-black">
                        {event.date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Events list */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4 text-black">
              All Events
            </h3>

            {events.length === 0 ? (
              <p className="text-black">No events scheduled.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedEvent?.id === event.id
                        ? "bg-blue-50 border border-blue-200"
                        : "border border-gray-200"
                    }`}
                    onClick={() => navigateToMonth(event)}
                  >
                    <h4 className="font-medium text-black">{event.title}</h4>
                    <p className="text-sm text-black">{event.location}</p>
                    <p className="text-sm text-black">
                      {event.date.toLocaleDateString()} at{" "}
                      {event.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Contact Us Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Contact Us
              </h2>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactError("");
                  setContactSuccess("");
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                ✖
              </button>
            </div>

            {contactSuccess ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {contactSuccess}
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                {contactError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {contactError}
                  </div>
                )}

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="contact-name"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Your full name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="contact-email"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Your email address"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="contact-phone"
                  >
                    Phone Number
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Your phone number"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-6">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="contact-query"
                  >
                    Query <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-query"
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Please describe your query or concern"
                    rows={4}
                    required
                    disabled={isSubmitting}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Location Map Modal */}
      {showLocationMapModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Our Location
              </h2>
              <button
                onClick={() => setShowLocationMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✖
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>YeshKrupa Society</strong>
                <br />
                Chikuwadi, Shimpoli Road, Borivali West, Mumbai, Maharashtra
                400092
              </p>
            </div>

            <div className="rounded-lg overflow-hidden h-auto">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3767.4028589321724!2d72.83919877520906!3d19.22126673201342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b12deca71f1d%3A0x8ef4e4db439a4f26!2sYesh%20Krupa%20Corporate%20Housing%20Society%20Ltd.!5e0!3m2!1sen!2sin!4v1756839224219!5m2!1sen!2sin"
                width="500"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="YeshKrupa Society Location"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative py-16 px-6 mt-auto shadow-top">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{backgroundImage: `url('${IMAGE_BASE_PATH}/assets/b3.jpg')`}}
          ></div>

          <div className="absolute inset-0 bg-white/50 z-10"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Society Information */}
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  YeshKrupa Society
                </h3>
              </div>
              <p className="text-gray-600 text-m leading-relaxed mb-6">
                Managing our community with care and professionalism since 2003.
                We strive to create a harmonious living environment for all
                residents.
              </p>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>Chikuwadi, Shimpoli Road, Borivali West</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                  <span>office@yeshkrupasociety.org</span>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div>
              <h4 className="text-xl font-semibold text-gray-800 mb-6">
                Office Hours
              </h4>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Saturday</span>
                    <span className="font-medium">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sunday</span>
                    <span className="font-medium text-red-500">Closed</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </h5>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.707 14.293a1 1 0 01-1.414 1.414l-2.829-2.828a1 1 0 010-1.415l2.829-2.829a1 1 0 011.414 1.415l-1.829 1.828 1.829 1.828zM5 6a1 1 0 011-1h6a1 1 0 010 2H6a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>+91 90 1234 5678 (24/7)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-gray-300 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                © 2003 - {new Date().getFullYear()} YeshKrupa Society. All
                rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <button
                onClick={() => setShowLocationMapModal(true)}
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-300"
              >
                Our Location
              </button>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-300 cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .shadow-top {
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08),
              0 -2px 6px rgba(0, 0, 0, 0.05);
          }
        `}</style>
      </footer>
    </div>
  );
}
