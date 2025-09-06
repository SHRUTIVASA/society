// app/bylaws/page.tsx
"use client";

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const generatePDF = async (bylawsContent: any, sections: any) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  // Set properties
  doc.setProperties({
    title: "Yesh Krupa Society Bylaws",
    subject: "Official bylaws document",
    author: "Yesh Krupa Society",
  });

  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  // Add logo/header
  doc.setFontSize(20);
  doc.setTextColor(21, 34, 56); // #152238
  doc.text("Yesh Krupa Society", margin, 15);
  doc.setFontSize(16);
  doc.text("Official Bylaws", margin, 25);

  doc.setDrawColor(21, 34, 56);
  doc.line(margin, 30, doc.internal.pageSize.width - margin, 30);

  yPosition = 40;

  // Add content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  sections.forEach((section: any) => {
    const sectionData = bylawsContent[section.id as keyof typeof bylawsContent];

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Section title
    doc.setFontSize(14);
    doc.setTextColor(21, 34, 56);
    doc.text(sectionData.title, margin, yPosition);
    yPosition += 10;

    // Section content
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    sectionData.content.forEach((item: any) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Item title
      doc.setFont("bold");
      doc.text(`${item.title}:`, margin, yPosition);
      yPosition += 6;

      // Item text (split into multiple lines if needed)
      doc.setFont("normal");
      const splitText = doc.splitTextToSize(
        item.text,
        doc.internal.pageSize.width - 2 * margin
      );
      doc.text(splitText, margin + 5, yPosition);
      yPosition += splitText.length * lineHeight + 8;
    });

    // Add some space between sections
    yPosition += 10;
  });

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
    doc.text(
      "Yesh Krupa Society Bylaws",
      margin,
      doc.internal.pageSize.height - 10
    );
  }

  // Save the PDF
  doc.save("Yesh_Krupa_Society_Bylaws.pdf");
};

export default function Bylaws() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
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

  // Table of Contents
  const sections = [
    { id: "general", title: "General Provisions" },
    { id: "membership", title: "Membership" },
    { id: "governance", title: "Governance" },
    { id: "meetings", title: "Meetings" },
    { id: "financial", title: "Financial Management" },
    { id: "property", title: "Property Use" },
    { id: "maintenance", title: "Maintenance" },
    { id: "dispute", title: "Dispute Resolution" },
    { id: "amendments", title: "Amendments" },
  ];

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

  // Dummy bylaws content
  const bylawsContent = {
    general: {
      title: "General Provisions",
      content: [
        {
          title: "Name and Location",
          text: "The name of the society shall be Yesh Krupa Society, located at Chikuwadi, Shimpoli Road, Borivali West, Mumbai, Maharashtra.",
        },
        {
          title: "Definitions",
          text: "In these bylaws, unless the context otherwise requires: 'Society' means Yesh Krupa Society; 'Member' means a person who owns a flat in the society; 'Committee' means the managing committee of the society; 'Flat' means an apartment in the society building.",
        },
        {
          title: "Objectives",
          text: "The primary objectives of the society are to manage, maintain, and administer the property; to promote the welfare of members; to provide common amenities; and to ensure peaceful coexistence among all residents.",
        },
      ],
    },
    membership: {
      title: "Membership",
      content: [
        {
          title: "Eligibility",
          text: "Every person who owns a flat in the society shall be a member. Membership is automatic upon ownership transfer and registration with the society office.",
        },
        {
          title: "Rights of Members",
          text: "Each member has the right to: vote in general meetings; stand for election to the managing committee; use common areas and facilities; inspect society records with prior notice; and receive copies of minutes and financial statements.",
        },
        {
          title: "Obligations of Members",
          text: "Each member shall: pay maintenance charges and other dues promptly; abide by the society's rules and regulations; not use their flat for illegal or immoral purposes; not make structural changes without permission; and cooperate with the managing committee in discharge of its duties.",
        },
        {
          title: "Cessation of Membership",
          text: "Membership ceases when a member transfers ownership of their flat, or in exceptional circumstances, when terminated by a special resolution for acts prejudicial to the society's interests.",
        },
      ],
    },
    governance: {
      title: "Governance",
      content: [
        {
          title: "Managing Committee",
          text: "The society's affairs shall be managed by a committee of 9 members elected from among the members: Chairperson, Vice-Chairperson, Secretary, Joint Secretary, Treasurer, and 4 Committee Members.",
        },
        {
          title: "Elections",
          text: "Committee elections shall be held every two years by secret ballot. Any member in good standing may contest elections. The election process shall be conducted by an returning officer appointed by the outgoing committee.",
        },
        {
          title: "Powers and Duties",
          text: "The committee has powers to: manage society affairs; maintain accounts; implement decisions of general meetings; appoint staff; enforce rules; and represent the society in legal matters.",
        },
        {
          title: "Meetings",
          text: "The committee shall meet at least once every month. Quorum for committee meetings shall be 5 members. Decisions shall be by majority vote with the chairperson having a casting vote.",
        },
      ],
    },
    // Additional sections would follow the same pattern
    meetings: {
      title: "Meetings",
      content: [
        {
          title: "Annual General Meeting",
          text: "The society shall hold an Annual General Meeting (AGM) within six months of the close of the financial year. Notice of at least 14 days shall be given to all members.",
        },
        // More content would be here
      ],
    },
    financial: {
      title: "Financial Management",
      content: [
        {
          title: "Fiscal Year",
          text: "The society's financial year shall be from April 1st to March 31st of the following year.",
        },
      ],
    },
    property: {
      title: "Property Use",
      content: [
        {
          title: "Common Areas",
          text: "All common areas shall be used responsibly by members and their guests. Damage to common property will be charged to the responsible member.",
        },
      ],
    },
    maintenance: {
      title: "Maintenance",
      content: [
        {
          title: "Regular Maintenance",
          text: "The society shall conduct regular maintenance of all common areas and facilities as per the maintenance schedule approved by the managing committee.",
        },
      ],
    },
    dispute: {
      title: "Dispute Resolution",
      content: [
        {
          title: "Grievance Procedure",
          text: "Members with grievances should first approach the managing committee. Unresolved disputes may be referred to mediation as per society rules.",
        },
      ],
    },
    amendments: {
      title: "Amendments",
      content: [
        {
          title: "Amendment Process",
          text: "These bylaws may be amended by a special resolution passed by a two-thirds majority of members present and voting at a general meeting.",
        },
      ],
    },
  };

  // Function to handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsLoading(true);
    router.push(path);
  };

  // Function to download PDF
  const downloadPDF = async () => {
    setIsLoading(true);
    try {
      await generatePDF(bylawsContent, sections);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Yesh Krupa Society - Bylaws</title>
        <meta name="description" content="Yesh Krupa Society Bylaws" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-[#152238] py-3 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#b9c7e2] rounded-full flex items-center justify-center text-black text-xl font-bold mr-3">
            <Link
            href="/"
            className="flex items-center text-m m:text-base opacity-80 hover:opacity-100 transition-opacity duration-200"
          >
            YK
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-wide">
            Yesh Krupa Society
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#152238] mb-4">
            Society Bylaws
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The rules and regulations that govern our community. All members are
            expected to be familiar with and abide by these bylaws.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Table of Contents
              </h2>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? "bg-[#152238] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleNavigation("/")}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Home
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#152238] mb-6 pb-2 border-b border-gray-200">
                {
                  bylawsContent[activeSection as keyof typeof bylawsContent]
                    ?.title
                }
              </h2>

              <div className="space-y-6">
                {bylawsContent[
                  activeSection as keyof typeof bylawsContent
                ]?.content.map((item, index) => (
                  <div key={index} className="pb-6 last:pb-0">
                    <h3 className="text-xl font-semibold text-[#152238] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Navigation between sections */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => {
                    const currentIndex = sections.findIndex(
                      (s) => s.id === activeSection
                    );
                    if (currentIndex > 0)
                      setActiveSection(sections[currentIndex - 1].id);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeSection === sections[0].id}
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous Section
                </button>

                <button
                  onClick={() => {
                    const currentIndex = sections.findIndex(
                      (s) => s.id === activeSection
                    );
                    if (currentIndex < sections.length - 1)
                      setActiveSection(sections[currentIndex + 1].id);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeSection === sections[sections.length - 1].id}
                >
                  Next Section
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Download Section */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Download Complete Bylaws
                  </h3>
                  <p className="text-gray-600">
                    Get a printable PDF version of all society bylaws.
                  </p>
                </div>
                <button
                  onClick={downloadPDF}
                  className="mt-4 md:mt-0 px-6 py-3 bg-[#152238] text-white rounded-lg hover:bg-[#1f2d4a] transition-colors flex items-center"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-300"
              >
                Our Location
              </button>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-300"
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
