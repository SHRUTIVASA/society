"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { addDoc, serverTimestamp } from "firebase/firestore";

// Define the CommitteeMember type
interface CommitteeMember {
  id: string;
  name: string;
  phone: number;
  email: string;
  position: string;
  description: string;
}

export default function Committee() {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMember, setActiveMember] = useState<CommitteeMember | null>(
    null
  );
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);

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
    const fetchCommitteeMembers = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "committee"));
        const querySnapshot = await getDocs(q);

        const members: CommitteeMember[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          members.push({
            id: doc.id,
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            position: data.position || "",
            description: data.description || "",
          });
        });

        setCommitteeMembers(members);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching committee members:", err);
        setError("Failed to load committee information");
        setLoading(false);
      }
    };

    fetchCommitteeMembers();
  }, []);

  // Group members by position type for better organization
  const groupedMembers = {
    leadership: committeeMembers.filter((member) =>
      ["Chairperson", "Vice Chairperson", "Treasurer", "Secretary"].includes(
        member.position
      )
    ),
    members: committeeMembers.filter(
      (member) =>
        !["Chairperson", "Vice Chairperson", "Treasurer", "Secretary"].includes(
          member.position
        )
    ),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading committee information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg max-w-md mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-600 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Committee
            </h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      // Add query to Firestore
      const docRef = await addDoc(collection(db, "queries"), {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        query: contactQuery,
        createdAt: serverTimestamp(),
        status: "new", // You can add additional fields like status
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

      // Auto-close the modal after success
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Committee | Yesh Krupa Society</title>
        <meta
          name="description"
          content="Yesh Krupa Society Committee Members"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header with back navigation */}
      <nav className="bg-[#152238] py-3 px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="w-12 h-12 bg-[#b9c7e2] rounded-full flex items-center justify-center text-black text-xl font-bold mr-3">
              YK
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-wide">
              Yesh Krupa Society
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-10">
          <Link
            href="/"
            className="flex items-center text-white text-m opacity-80 hover:opacity-100 transition-opacity duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 mr-2"
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
          </Link>
        </div>
      </nav>

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
                <strong>Yesh Krupa Society</strong>
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
                title="Yesh Krupa Society Location"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="relative py-16 text-black">
        <div className="absolute inset-0 "></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Management Committee
            </h1>
            <p className="text-xl opacity-90">
              Dedicated residents working together for the betterment of our
              community
            </p>
          </div>
        </div>
      </div>

      {/* Committee Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Leadership Section */}
          {groupedMembers.leadership.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                Leadership Team
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {groupedMembers.leadership.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-xl duration-300 cursor-pointer"
                    onClick={() => setActiveMember(member)}
                  >
                    <div className="relative h-64 bg-gray-200 flex items-center justify-center">
                      <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {member.name}
                          </h3>
                          <p className="text-blue-200">{member.position}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 line-clamp-3">
                        {member.description ||
                          "Committee member dedicated to serving our community."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Committee Members Section */}
          {groupedMembers.members.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                Committee Members
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {groupedMembers.members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-xl duration-300 cursor-pointer"
                    onClick={() => setActiveMember(member)}
                  >
                    <div className="relative h-56 bg-gray-200 flex items-center justify-center">
                      <div className="w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {member.name}
                          </h3>
                          <p className="text-blue-200">{member.position}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 line-clamp-3">
                        {member.description ||
                          "Committee member dedicated to serving our community."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {committeeMembers.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                No Committee Information Available
              </h3>
              <p className="text-gray-500">
                Committee details will be posted here once available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Member Detail Modal */}
      {activeMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative h-72 bg-gray-200 flex items-center justify-center">
              <div className="w-40 h-40 bg-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                {activeMember.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <button
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white transition-colors z-10"
                onClick={() => setActiveMember(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-8">
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {activeMember.name}
                  </h2>
                  <p className="text-blue-200 text-lg">
                    {activeMember.position}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  About
                </h3>
                <p className="text-gray-600">
                  {activeMember.description ||
                    "Committee member dedicated to serving our community."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeMember.email && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Email
                    </h3>
                    <a
                      href={`mailto:${activeMember.email}`}
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {activeMember.email}
                    </a>
                  </div>
                )}

                {activeMember.phone && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Phone
                    </h3>
                    <a
                      href={`tel:${activeMember.phone}`}
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {activeMember.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative py-16 px-6 mt-auto shadow-top">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/assets/b3.jpg')" }}
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
                  Yesh Krupa Society
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
                © 2003 - {new Date().getFullYear()} Yesh Krupa Society. All
                rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <button
                onClick={() => setShowLocationMapModal(true)}
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-300 cursor-pointer"
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
