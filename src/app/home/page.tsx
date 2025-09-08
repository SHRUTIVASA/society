"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false);
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFaqsModal, setShowFaqsModal] = useState(false);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [previewFaqs, setPreviewFaqs] = useState<FAQ[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface Testimonial {
    id: string;
    name: string;
    unit: string;
    content: string;
    rating: number;
    createdAt: Timestamp | any;
    approved: boolean;
  }

  interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
  }

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const fetchFaqs = async () => {
    try {
      setFaqsLoading(true);
      const faqsQuery = query(collection(db, "faqs"));
      const querySnapshot = await getDocs(faqsQuery);

      const faqsData: FAQ[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        faqsData.push({
          id: doc.id,
          question: data.question || "",
          answer: data.answer || "",
          order: data.order || 0,
        });
      });

      setFaqs(faqsData);
      setPreviewFaqs(faqsData.slice(0, 3));
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setFaqsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setResetError("");
  setResetSuccess("");
  setIsResetting(true);

  try {
    const adminsQuery = query(
      collection(db, "admins"),
      where("email", "==", resetEmail)
    );

    const membersQuery = query(
      collection(db, "members"),
      where("email", "==", resetEmail)
    );

    const [adminsSnapshot, membersSnapshot] = await Promise.all([
      getDocs(adminsQuery),
      getDocs(membersQuery),
    ]);

    let userEmail = "";

    if (!adminsSnapshot.empty) {
      userEmail = adminsSnapshot.docs[0].data().email;
    } else if (!membersSnapshot.empty) {
      userEmail = membersSnapshot.docs[0].data().email;
    } else {
      setResetError("Email/Unit number not found");
      setIsResetting(false);
      return;
    }

    await sendPasswordResetEmail(auth, userEmail);
    setResetSuccess("Password reset email sent! Check your inbox.");
    setResetEmail("");
  } catch (err: any) {
    setResetError(err.message);
  } finally {
    setIsResetting(false);
  }
};

  const fetchAllTestimonials = async () => {
    try {
      setTestimonialsLoading(true);
      const testimonialsQuery = query(
        collection(db, "testimonials"),
        where("approved", "==", true)
      );
      const querySnapshot = await getDocs(testimonialsQuery);

      const testimonialsData: Testimonial[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Anonymous",
          unit: data.unit || "",
          content: data.content || "",
          rating: data.rating || 5,
          createdAt: data.createdAt,
          approved: data.approved || false,
        };
      });

      setAllTestimonials(testimonialsData);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTestimonials();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const adminsQuery = query(
        collection(db, "admins"),
        where("unitNumber", "==", email)
      );

      const membersQuery = query(
        collection(db, "members"),
        where("unitNumber", "==", email)
      );

      const [adminsSnapshot, membersSnapshot] = await Promise.all([
        getDocs(adminsQuery),
        getDocs(membersQuery),
      ]);

      let userEmail = "";
      let isAdmin = false;

      if (!adminsSnapshot.empty) {
        const adminDoc = adminsSnapshot.docs[0];
        userEmail = adminDoc.data().email;
        isAdmin = true;
      } else if (!membersSnapshot.empty) {
        const memberDoc = membersSnapshot.docs[0];
        userEmail = memberDoc.data().email;
        isAdmin = false;
      } else {
        setError("Invalid unit number or password");
        setIsLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        userEmail,
        password
      );
      
      const user = userCredential.user;
      setIsLoggedIn(true);

      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/member");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPreviewTestimonials = async () => {
      try {
        setTestimonialsLoading(true);
        const testimonialsQuery = query(
          collection(db, "testimonials"),
          where("approved", "==", true),
          limit(2)
        );

        const querySnapshot = await getDocs(testimonialsQuery);
        const testimonialsData: Testimonial[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          testimonialsData.push({
            id: doc.id,
            name: data.name || "Anonymous",
            unit: data.unit || "",
            content: data.content || "",
            rating: data.rating || 5,
            createdAt: data.createdAt,
            approved: data.approved || false,
          });
        });

        setTestimonials(testimonialsData);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    fetchPreviewTestimonials();
  }, []);

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

  const imageSlides = [
    "/assets/s1.jpg",
    "/assets/s2.jpg",
    "/assets/s3.jpg",
    "/assets/s4.jpg",
    "/assets/s5.jpg",
  ];

  const notices = [
    {
      id: 1,
      title: "Annual General Meeting on July 15th",
      pdf: "/notices/agm.pdf",
    },
    {
      id: 2,
      title: "Maintenance Schedule for June",
      pdf: "/notices/maintenance.pdf",
    },
    { id: 3, title: "Swimming Pool Timings Revised", pdf: "/notices/pool.pdf" },
    {
      id: 4,
      title: "Security Guidelines Update",
      pdf: "/notices/security.pdf",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === imageSlides.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [imageSlides.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>YeshKrupa Society Management</title>
        <meta
          name="description"
          content="YeshKrupa society management portal"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
            YK
          </div>
          <h1 className="text-xl font-semibold text-gray-800">YeshKrupa Society</h1>
        </div>
        
        {isMobile && (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="p-2 rounded-full bg-blue-100 text-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </nav> */}
      <nav className="bg-[#152238] py-3 px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#b9c7e2] rounded-full flex items-center justify-center text-black text-xl font-bold mr-3">
            YK
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-wide">
            YeshKrupa Society
          </h1>
        </div>

        <div className="hidden md:flex items-center space-x-10 mr-40">
          <button
            onClick={() => setShowContactModal(true)}
            className="flex items-center text-white text-m opacity-80 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
            Contact Us
          </button>
        </div>

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <div className="relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-[#1f2d4a] text-white shadow hover:bg-[#27365c] transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setShowContactModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Contact Us
                </button>
                {/* <button
                  onClick={() => {
                    router.push("/committee");
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Committee
                </button> */}
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        )}
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

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Grid section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2 rounded-xl overflow-hidden shadow-lg">
            <div className="relative h-80">
              <Image
                src={imageSlides[currentIndex]}
                alt="Society gallery"
                className="w-full h-full object-cover"
                fill
                priority={currentIndex === 0}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-light bg-black/40"></div>
            </div>
          </div>

          {/* ✅ Login Box (Desktop) */}
          {!isMobile && (
            <div className="bg-white rounded-xl p-6 shadow-lg relative before:absolute before:top-0 before:left-0 before:w-full before:h-2 before:rounded-t-xl before:shadow-[0_-4px_10px_rgba(0,0,0,0.1)] before:pointer-events-none">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                Login
              </h2>
              <form onSubmit={handleLogin}>
                {/* In the login form */}
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="email"
                  >
                    Username
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Enter your unit number"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-6">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:underline text-sm mb-4 cursor-pointer"
                >
                  Forgot Password?
                </button>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors flex items-center justify-center cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
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
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Reset Password
                  </h2>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetError("");
                      setResetSuccess("");
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    disabled={isResetting}
                  >
                    ✖
                  </button>
                </div>

                {resetSuccess ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {resetSuccess}
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword}>
                    {resetError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {resetError}
                      </div>
                    )}

                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-medium mb-2"
                        htmlFor="reset-email"
                      >
                        Email Address
                      </label>
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholder="Enter your email address"
                        required
                        disabled={isResetting}
                      />
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      Enter your email address and we'll send you a link to
                      reset your password.
                    </p>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors flex items-center justify-center cursor-pointer"
                      disabled={isResetting}
                    >
                      {isResetting ? (
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
                        "Send Reset Link"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ✅ Login Modal (Mobile) */}
          {showLoginModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Login</h2>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    disabled={isLoading}
                  >
                    ✖
                  </button>
                </div>
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="mobile-email"
                    >
                      Email
                    </label>
                    <input
                      id="mobile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="mb-6">
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="mobile-password"
                    >
                      Password
                    </label>
                    <input
                      id="mobile-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-blue-600 hover:underline text-sm mb-4 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors flex items-center justify-center cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? (
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
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Boxes and notices section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left side - 4 boxes */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Society Bylaws Box */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Society Bylaws
                </h3>
              </div>
              <p className="text-gray-600">
                Rules and regulations that govern our community. All members are
                expected to abide by these guidelines.
              </p>
              <button
                onClick={() => router.push("/bylaws")}
                className="mt-4 text-blue-600 hover:underline flex items-center cursor-pointer"
              >
                Read more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
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

            {/* Events Calendar Box */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Events Calendar
                </h3>
              </div>
              <p className="text-gray-600">
                Stay updated with upcoming society events, meetings, and
                community gatherings.
              </p>
              <button
                onClick={() => router.push("/calendar")}
                className="mt-4 text-blue-600 hover:underline flex items-center cursor-pointer"
              >
                View calendar
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
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

            {/* FAQs Box */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Frequently Asked Questions
                </h3>
              </div>

              {faqsLoading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : previewFaqs.length > 0 ? (
                <div className="space-y-4 mb-4">
                  {previewFaqs.map((faq, index) => (
                    <div
                      key={faq.id}
                      className="border-l-4 border-green-400 pl-3"
                    >
                      <h4 className="text-md font-medium text-gray-800 mb-1">
                        {faq.question}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No FAQs available yet.</p>
              )}

              <button
                onClick={() => setShowFaqsModal(true)}
                className="mt-2 text-blue-600 hover:underline flex items-center cursor-pointer"
              >
                View all FAQs
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
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

            {/* Resident Testimonials*/}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 
          3.292a1 1 0 00.95.69h3.462c.969 0 
          1.371 1.24.588 1.81l-2.8 2.034a1 
          1 0 00-.364 1.118l1.07 3.292c.3.921-.755 
          1.688-1.539 1.118l-2.8-2.034a1 1 
          0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 
          1 0 00-.364-1.118L5.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 
          0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Resident Testimonials
                </h3>
              </div>

              {/* Preview testimonials */}
              {testimonialsLoading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : testimonials.length > 0 ? (
                <div className="space-y-6">
                  {testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="border-l-4 border-yellow-400 pl-3"
                    >
                      {/* Stars + Date */}
                      <div className="flex items-center mb-1">
                        <div className="flex mr-3">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={`${testimonial.id}-star-${i}`}
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 ${
                                i < testimonial.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 
                  0l1.07 3.292a1 1 0 00.95.69h3.462c.969 
                  0 1.371 1.24.588 1.81l-2.8 2.034a1 
                  1 0 00-.364 1.118l1.07 3.292c.3.921-.755 
                  1.688-1.539 1.118l-2.8-2.034a1 1 
                  0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 
                  1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 
                  1 0 00.951-.69l1.07-3.292z"
                              />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {testimonial.createdAt?.toDate
                            ? testimonial.createdAt
                                .toDate()
                                .toLocaleDateString()
                            : "Recent"}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-gray-600 italic mb-1">
                        "{testimonial.content}"
                      </p>
                      <p className="text-sm text-gray-700 font-medium">
                        - {testimonial.name}, {testimonial.unit}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No testimonials yet. Be the first!
                </p>
              )}

              {/* View All button */}
              <button
                onClick={() => {
                  setShowTestimonialsModal(true);
                  fetchAllTestimonials();
                }}
                className="mt-4 text-blue-600 hover:underline flex items-center"
              >
                View all testimonials
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
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

            {showTestimonialsModal && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Resident Testimonials
                    </h2>
                    <button
                      onClick={() => setShowTestimonialsModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ✖
                    </button>
                  </div>

                  {testimonialsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                  ) : allTestimonials.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {allTestimonials.map((testimonial) => (
                        <div
                          key={testimonial.id}
                          className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <p className="text-gray-600 italic mb-4">
                            "{testimonial.content}"
                          </p>
                          <p className="text-sm text-gray-700 font-medium">
                            - {testimonial.name}, {testimonial.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-10">
                      No testimonials available yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Notices */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Latest Notices
            </h2>
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-m font-medium text-gray-900">
                        {notice.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Posted on June 12, 2023
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full text-center py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors">
              View All Notices
            </button>
          </div>
        </div>
      </main>

      {/* FAQs Modal */}
      {showFaqsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Frequently Asked Questions
              </h2>
              <button
                onClick={() => setShowFaqsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✖
              </button>
            </div>

            {faqsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : faqs.length > 0 ? (
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500">
                  No FAQs available at the moment.
                </p>
              </div>
            )}
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
