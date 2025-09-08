"use client";

import {
  useState,
  useEffect,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteField,
  writeBatch,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

type ComplaintType =
  | "Plumbing"
  | "Electrical"
  | "Security"
  | "Carpentry"
  | "Cleaning"
  | "Parking"
  | "Elevator"
  | "Other";

// 2. Define Complaint Interface
// interface Complaint {
//   id: number;
//   type: ComplaintType;
//   title: string;
//   status: string;
//   date: string;
// }

const COMPLAINT_TYPES: Record<
  ComplaintType,
  { bg: string; text: string; icon: string }
> = {
  Plumbing: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  Electrical: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  Security: {
    bg: "bg-red-100",
    text: "text-red-600",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  Carpentry: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    icon: "M5 13l4 4L19 7",
  },
  Cleaning: {
    bg: "bg-green-100",
    text: "text-green-600",
    icon: "M3 6h18M3 12h18M3 18h18",
  },
  Parking: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    icon: "M12 8v8m0 0h4m-4 0H8",
  },
  Elevator: {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    icon: "M5 12h14M12 5l7 7-7 7",
  },
  Other: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: "M12 4.354a4 4 0 110 7.292M12 16v.01",
  },
};

const COMPLAINT_TYPE_ARRAY: ComplaintType[] = Object.keys(
  COMPLAINT_TYPES
) as ComplaintType[];

const VehicleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-5a1 1 0 00-.293-.707l-4-4A1 1 0 0016 4H3z" />
  </svg>
);

const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const ComplaintsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
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
);

const PaymentsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CommitteeIcon = () => (
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
      d="M17 20h2a2 2 0 002-2V4a2 2 0 00-2-2h-2M4 18.5V17a2 2 0 012-2h2a2 2 0 012 2v1.5M10 12a2 2 0 100-4 2 2 0 000 4zm5-4a2 2 0 100-4 2 2 0 000 4z"
    />
  </svg>
);

const NoticesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const EventsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
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
);

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MenuIcon = () => (
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
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="black"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const TestimonialsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
);

interface CommitteeMember {
  id: string;
  name: string;
  phone: number;
  email: string;
  position: string;
  description: string;
}

export default function MemberDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [suggestionFilter, setSuggestionFilter] = useState("all");
  const [activeMember, setActiveMember] = useState<CommitteeMember | null>(
    null
  );
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(
    []
  );
  const [committeeFilter, setCommitteeFilter] = useState("all");

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    content: "",
    rating: 5,
  });

  const [userRedevelopmentForms, setUserRedevelopmentForms] = useState<any[]>(
    []
  );
  const [formComment, setFormComment] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserRedevelopmentForms();
    }
  }, [user, activeTab]);

  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [vehicleWingFilter, setVehicleWingFilter] = useState("all");
  const [vehicleFlatFilter, setVehicleFlatFilter] = useState("all");
  const [showAddVehiclePopup, setShowAddVehiclePopup] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    type: "Car",
    model: "",
    numberPlate: "",
    parking: false,
    startDate: new Date().toISOString().split("T")[0],
    isCurrent: true,
    endDate: "",
    rcBookNumber: "",
  });

  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(
    null
  );
  const [newVehicleFiles, setNewVehicleFiles] = useState<File[]>([]);

  // const suggestionsQuery = query(
  //   collection(db, "suggestions"),
  //   where("userId", "==", user?.uid || ""),
  //   orderBy("createdAt", "desc")
  // );

  // const unsubscribeSuggestions = onSnapshot(suggestionsQuery, (snapshot) => {
  //   const suggestionsData = snapshot.docs.map((doc) => ({
  //     id: doc.id,
  //     ...doc.data(),
  //   }));
  //   setSuggestions(suggestionsData);
  // });

  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [serviceProviderFilter, setServiceProviderFilter] = useState("all");

  const [showRedevelopmentForm, setShowRedevelopmentForm] = useState(false);
  const [redevelopmentForm, setRedevelopmentForm] = useState({
    name: "",
    phone: "",
    email: "",
    vacateDate: null as Date | null,
    alternateAddress: "",
    comments: "",
    files: [] as File[],
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmittingRedevelopment, setIsSubmittingRedevelopment] =
    useState(false);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);

  const [newComplaint, setNewComplaint] = useState({
    type: "",
    title: "",
    description: "",
  });
  const [editProfileData, setEditProfileData] = useState<EditProfileData>({
    name: "",
    phone: 0,
    unitNumber: "",
    familyMembers: [],
    vehicles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const [unreadMessageCounts, setUnreadMessageCounts] = useState<{
    [complaintId: string]: number;
  }>({});
  const [selectedComplaintChat, setSelectedComplaintChat] = useState<
    string | null
  >(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);

  const [editingForm, setEditingForm] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    vacateDate: "",
    alternateAddress: "",
    comments: "",
  });

  // Function to handle edit button click
  const handleEditForm = (form: any) => {
    setEditingForm(form);

    const vacateDate = form.vacateDate?.toDate
      ? form.vacateDate.toDate().toISOString().split("T")[0]
      : "";

    setEditFormData({
      vacateDate: vacateDate,
      alternateAddress: form.alternateAddress || "",
      comments: "",
    });
  };

  // Function to handle form update submission
  const handleSubmitFormUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;

    const formUpdates = {
      alternateAddress: editFormData.alternateAddress,
      vacateDate: editFormData.vacateDate
        ? Timestamp.fromDate(new Date(editFormData.vacateDate))
        : null,
    };

    const { comments } = editFormData;

    const success = await handleUpdateRedevelopmentForm(
      editingForm.id,
      formUpdates
    );

    if (success && comments.trim()) {
      await handleAddFormComment(editingForm.id, comments);
    }

    if (success) {
      setEditingForm(null);
      setEditFormData({
        vacateDate: "",
        alternateAddress: "",
        comments: "",
      });
    }
  };

  // Main member document
  type Member = {
    name: string;
    phone: number;
    unitNumber: string;
    memberSince?: string;
    alternateAddress?: string;
    propertyStatus?: "owned" | "rented";
    agreementStartDate?: string;
    agreementEndDate?: string;
  };

  // Subcollection: familyMembers
  type FamilyMember = {
    age: number;
    name: string;
    relation: string;
  };

  // Subcollection: vehicles
  type Vehicle = {
    model: string;
    numberPlate: string;
    type: string;
    parking: boolean;
    isCurrent: boolean;
    startDate: Timestamp | string;
    endDate: Timestamp | string;
    rcBookNumber?: string;
    FileUrls?: string[];
  };

  type EditProfileData = Member & {
    familyMembers: FamilyMember[];
    vehicles: Vehicle[];
  };

  const handleUpdateRedevelopmentForm = async (
    formId: string,
    updates: any
  ) => {
    if (!user) return;

    try {
      const formRef = doc(db, "redevelopmentForms", formId);

      // Check if user owns this form
      const formDoc = await getDoc(formRef);
      if (formDoc.exists() && formDoc.data().userId === user.uid) {
        await updateDoc(formRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        fetchUserRedevelopmentForms();
        alert("Form updated successfully!");
        return true;
      } else {
        alert("You can only update your own forms");
        return false;
      }
    } catch (error) {
      console.error("Error updating form:", error);
      alert("Failed to update form");
      return false;
    }
  };

  const handleOpenChat = async (complaintId: string) => {
    setSelectedComplaintChat(complaintId);
    setShowChatModal(true);

    // Mark messages as read when opening chat
    await markMessagesAsRead(complaintId);

    // Listen for chat messages
    const chatRef = collection(db, "complaintChats", complaintId, "messages");
    const q = query(chatRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChatMessages(messages);
    });

    return () => unsubscribe();
  };

  const handleAddComment = async (
    suggestionId: string,
    commentText: string
  ) => {
    if (!user || !commentText.trim()) return;

    try {
      const suggestionRef = doc(db, "suggestions", suggestionId);

      await updateDoc(suggestionRef, {
        comments: arrayUnion({
          userId: user.uid,
          userName: userData?.name || "Member",
          comment: commentText.trim(),
          timestamp: Timestamp.now(),
        }),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error adding comment. Please try again.");
    }
  };

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

  const [suggestionSearch, setSuggestionSearch] = useState("");
  const [currentSuggestionPage, setCurrentSuggestionPage] = useState(1);
  const [suggestionsPerPage, setSuggestionsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("newest");

  const filterSuggestions = (suggestions: any[]) => {
    return suggestions.filter((suggestion) => {
      // Status filter
      if (
        suggestionFilter !== "all" &&
        suggestion.status !== suggestionFilter
      ) {
        return false;
      }

      // Search filter
      if (suggestionSearch) {
        const searchTerm = suggestionSearch.toLowerCase();
        const title = suggestion.title?.toLowerCase() || "";
        const description = suggestion.description?.toLowerCase() || "";
        const userName = suggestion.userName?.toLowerCase() || "";

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          userName.includes(searchTerm)
        );
      }

      return true;
    });
  };

  const sortSuggestions = (suggestions: any[]) => {
    const sorted = [...suggestions];

    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });

      case "most-votes":
        return sorted.sort((a, b) => {
          const aVotes = (a.votes?.upvotes || 0) - (a.votes?.downvotes || 0);
          const bVotes = (b.votes?.upvotes || 0) - (b.votes?.downvotes || 0);
          return bVotes - aVotes;
        });

      case "least-votes":
        return sorted.sort((a, b) => {
          const aVotes = (a.votes?.upvotes || 0) - (a.votes?.downvotes || 0);
          const bVotes = (b.votes?.upvotes || 0) - (b.votes?.downvotes || 0);
          return aVotes - bVotes;
        });

      default:
        return suggestions;
    }
  };

  // Get current suggestions for pagination
  const filteredSuggestions = sortSuggestions(filterSuggestions(suggestions));
  const indexOfLastSuggestion = currentSuggestionPage * suggestionsPerPage;
  const indexOfFirstSuggestion = indexOfLastSuggestion - suggestionsPerPage;
  const currentSuggestions = filteredSuggestions.slice(
    indexOfFirstSuggestion,
    indexOfLastSuggestion
  );
  const [searchTerm, setSearchTerm] = useState("");

  const totalPages = Math.ceil(filteredSuggestions.length / suggestionsPerPage);

  // const fetchUnreadMessageCounts = async () => {
  //   try {
  //     const counts: { [complaintId: string]: number } = {};

  //     for (const complaint of complaints) {
  //       const chatRef = collection(
  //         db,
  //         "complaintChats",
  //         complaint.id,
  //         "messages"
  //       );
  //       const q = query(
  //         chatRef,
  //         where("sender", "==", "admin"),
  //          where("readBy", "not-in", [[user.uid]])
  //       );

  //       const snapshot = await getDocs(q);
  //       counts[complaint.id] = snapshot.size;
  //     }

  //     setUnreadMessageCounts(counts);
  //   } catch (error) {
  //     console.error("Error fetching unread message counts:", error);
  //   }
  // };

  useEffect(() => {
    if (!user || complaints.length === 0) return;

    const unsubscribeFunctions: (() => void)[] = [];

    complaints.forEach((complaint) => {
      const chatRef = collection(
        db,
        "complaintChats",
        complaint.id,
        "messages"
      );

      const q = query(chatRef, where("sender", "==", "admin"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let unreadCount = 0;
        snapshot.forEach((doc) => {
          const messageData = doc.data();
          const readBy = messageData.readBy || [];

          if (!readBy.includes(user.uid)) {
            unreadCount++;
          }
        });

        setUnreadMessageCounts((prev) => ({
          ...prev,
          [complaint.id]: unreadCount,
        }));
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [complaints, user]);

  const fetchUserRedevelopmentForms = async () => {
    if (!user) return;

    try {
      const formsQuery = query(
        collection(db, "redevelopmentForms"),
        where("userId", "==", user.uid)
      );
      const formsSnapshot = await getDocs(formsQuery);
      const formsData = [];

      for (const formDoc of formsSnapshot.docs) {
        const formData = formDoc.data();

        // Fetch comments for this form
        const commentsQuery = query(
          collection(db, "redevelopmentForms", formDoc.id, "comments"),
          orderBy("timestamp", "asc")
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        formsData.push({
          id: formDoc.id,
          ...formData,
          comments: commentsData,
        });
      }

      setUserRedevelopmentForms(formsData);
    } catch (error) {
      console.error("Error fetching redevelopment forms:", error);
    }
  };

  // Add comment to form
  const handleAddFormComment = async (formId: string, comment: string) => {
    if (!user || !comment.trim()) return;

    try {
      await addDoc(collection(db, "redevelopmentForms", formId, "comments"), {
        userId: user.uid,
        userName: userData?.name || "Member",
        userType: "member",
        comment: comment.trim(),
        timestamp: serverTimestamp(),
      });

      setFormComment("");
      fetchUserRedevelopmentForms();
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  const markMessagesAsRead = async (complaintId: string) => {
    try {
      if (!user) return;

      const chatRef = collection(db, "complaintChats", complaintId, "messages");
      const q = query(chatRef, where("sender", "==", "admin"));

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        const messageData = doc.data();
        const currentReadBy = messageData.readBy || [];

        if (!currentReadBy.includes(user.uid)) {
          const messageRef = doc.ref;
          batch.update(messageRef, {
            readBy: arrayUnion(user.uid),
          });
        }
      });

      await batch.commit();

      setUnreadMessageCounts((prev) => ({
        ...prev,
        [complaintId]: 0,
      }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintChat || !newMessage.trim() || !user) return;

    try {
      const chatRef = collection(
        db,
        "complaintChats",
        selectedComplaintChat,
        "messages"
      );

      await addDoc(chatRef, {
        sender: "member",
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        senderId: user.uid,
        senderName: userData?.name || "Member",
        readBy: [user.uid],
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
        setupRealtimeListeners(currentUser.uid);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

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

  const fetchUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "members", userId));
      if (userDoc.exists()) {
        const data = userDoc.data() as Member;
        setUserData(data); // Set userData state

        // Fetch family members
        const familySnapshot = await getDocs(
          collection(db, "members", userId, "familyMembers")
        );
        const familyData: FamilyMember[] = familySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<FamilyMember, "id">),
        }));

        // Fetch vehicles
        const vehiclesSnapshot = await getDocs(
          collection(db, "members", userId, "vehicles")
        );
        const vehiclesData: Vehicle[] = vehiclesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Vehicle, "id">),
        }));

        // Update state
        setEditProfileData({
          name: data.name || "",
          phone:
            typeof data.phone === "string"
              ? parseInt(data.phone)
              : data.phone || 0,
          unitNumber: data.unitNumber || "",
          alternateAddress: data.alternateAddress || "",
          propertyStatus: data.propertyStatus || "owned",
          agreementStartDate: data.agreementStartDate || "",
          agreementEndDate: data.agreementEndDate || "",
          familyMembers: familyData,
          vehicles: vehiclesData,
        });

        setFamilyMembers(familyData);
        setVehicles(vehiclesData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const setupRealtimeListeners = (userId: string) => {
    // Listen for family members subcollection
    const familyQuery = query(
      collection(db, "members", userId, "familyMembers"),
      orderBy("name", "asc")
    );

    const unsubscribeFamily = onSnapshot(familyQuery, (snapshot) => {
      const familyData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFamilyMembers(familyData);
    });

    // Listen for vehicles subcollection
    const vehiclesQuery = query(
      collection(db, "members", userId, "vehicles"),
      orderBy("type", "asc")
    );

    const unsubscribeVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
      const vehiclesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVehicles(vehiclesData);
    });

    const testimonialsQuery = query(
      collection(db, "testimonials"),
      where("approved", "==", true)
    );

    const unsubscribeTestimonials = onSnapshot(
      testimonialsQuery,
      (snapshot) => {
        const testimonialsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTestimonials(testimonialsData);
      }
    );

    // Listen for complaints
    const complaintsDocRef = doc(db, "complaints", userId);

    const unsubscribeComplaints = onSnapshot(
      complaintsDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const complaintsData = docSnapshot.data();
          const complaintsArray = [];

          for (const [complaintId, complaintData] of Object.entries(
            complaintsData
          )) {
            if (complaintId !== "userId" && typeof complaintData === "object") {
              complaintsArray.push({
                id: complaintId,
                ...complaintData,
              });
            }
          }

          complaintsArray.sort((a, b) => {
            const dateA = getDateFromFirestore(a.createdAt);
            const dateB = getDateFromFirestore(b.createdAt);
            return dateB - dateA;
          });

          setComplaints(complaintsArray);
        } else {
          setComplaints([]);
        }
      }
    );

    // Listen for payments
    const paymentsDocRef = doc(db, "payments", userId);

    const unsubscribePayments = onSnapshot(paymentsDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const paymentsData = docSnapshot.data();
        const paymentsArray = [];

        for (const [transactionId, paymentData] of Object.entries(
          paymentsData
        )) {
          if (transactionId !== "userId" && typeof paymentData === "object") {
            paymentsArray.push({
              id: transactionId,
              ...paymentData,
            });
          }
        }
        paymentsArray.sort((a, b) => {
          const dateA = getDateFromFirestore(a.dueDate);
          const dateB = getDateFromFirestore(b.dueDate);
          return dateA - dateB;
        });

        setPayments(paymentsArray);
      } else {
        setPayments([]);
      }
    });

    // Listen for notices
    const noticesQuery = query(
      collection(db, "documents"),
      where("isPublic", "==", true)
    );
    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      const noticesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(noticesData);
    });

    const serviceProvidersQuery = query(
      collection(db, "serviceProviders"),
      where("isActive", "==", true)
    );

    const unsubscribeServiceProviders = onSnapshot(
      serviceProvidersQuery,
      (snapshot) => {
        const providersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServiceProviders(providersData);
      }
    );

    const suggestionsQuery = query(
      collection(db, "suggestions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeSuggestions = onSnapshot(suggestionsQuery, (snapshot) => {
      const suggestionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuggestions(suggestionsData);
    });

    // Listen for events
    const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
    });

    setLoading(false);

    // Cleanup function
    return () => {
      unsubscribeFamily();
      unsubscribeVehicles();
      unsubscribeComplaints();
      unsubscribePayments();
      unsubscribeNotices();
      unsubscribeEvents();
      unsubscribeTestimonials();
      unsubscribeServiceProviders();
      unsubscribeSuggestions();
    };
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    // Filter by status
    if (vehicleFilter === "current" && !vehicle.isCurrent) return false;
    if (vehicleFilter === "past" && vehicle.isCurrent) return false;

    // Filter by wing (if implemented)
    if (vehicleWingFilter !== "all" && vehicle.memberUnit) {
      const unitParts = vehicle.memberUnit.split("-");
      if (unitParts.length > 0 && unitParts[0] !== vehicleWingFilter)
        return false;
    }

    // Filter by flat (if implemented)
    if (vehicleFlatFilter !== "all" && vehicle.memberUnit) {
      const unitParts = vehicle.memberUnit.split("-");
      if (unitParts.length > 1 && unitParts[1] !== vehicleFlatFilter)
        return false;
    }

    return true;
  });

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    try {
      await addDoc(collection(db, "suggestions"), {
        title: newSuggestion.title,
        description: newSuggestion.description,
        category: newSuggestion.category,
        priority: newSuggestion.priority,
        status: "pending" as const,
        userId: user.uid,
        userName: userData.name,
        unitNumber: userData.unitNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        votes: {
          upvotes: 0,
          downvotes: 0,
          voters: [],
        },
        comments: [],
      });

      setNewSuggestion({
        title: "",
        description: "",
        category: "General",
        priority: "medium",
      });

      setShowSuggestionModal(false);
      alert("Suggestion submitted successfully!");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      alert("Error submitting suggestion. Please try again.");
    }
  };

  const handleVoteSuggestion = async (
    suggestionId: string,
    voteType: "upvote" | "downvote"
  ) => {
    if (!user) return;

    try {
      const suggestionRef = doc(db, "suggestions", suggestionId);
      const suggestionDoc = await getDoc(suggestionRef);

      if (!suggestionDoc.exists()) {
        alert("Suggestion not found");
        return;
      }

      const suggestionData = suggestionDoc.data();
      const currentVotes = suggestionData.votes || {
        upvotes: 0,
        downvotes: 0,
        voters: [],
      };
      const hasUpvoted = currentVotes.voters.includes(`${user.uid}_upvote`);
      const hasDownvoted = currentVotes.voters.includes(`${user.uid}_downvote`);

      let updates = {};

      if (voteType === "upvote") {
        if (hasUpvoted) {
          // Remove upvote
          updates = {
            "votes.upvotes": currentVotes.upvotes - 1,
            "votes.voters": arrayRemove(`${user.uid}_upvote`),
          };
        } else {
          // Add upvote, remove downvote if exists
          updates = {
            "votes.upvotes": currentVotes.upvotes + 1,
            "votes.voters": arrayUnion(`${user.uid}_upvote`),
          };

          if (hasDownvoted) {
            updates = {
              ...updates,
              "votes.downvotes": currentVotes.downvotes - 1,
              "votes.voters": arrayRemove(`${user.uid}_downvote`),
            };
          }
        }
      } else {
        if (hasDownvoted) {
          // Remove downvote
          updates = {
            "votes.downvotes": currentVotes.downvotes - 1,
            "votes.voters": arrayRemove(`${user.uid}_downvote`),
          };
        } else {
          // Add downvote, remove upvote if exists
          updates = {
            "votes.downvotes": currentVotes.downvotes + 1,
            "votes.voters": arrayUnion(`${user.uid}_downvote`),
          };

          if (hasUpvoted) {
            updates = {
              ...updates,
              "votes.upvotes": currentVotes.upvotes - 1,
              "votes.voters": arrayRemove(`${user.uid}_upvote`),
            };
          }
        }
      }

      await updateDoc(suggestionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error voting on suggestion:", error);
      alert("Error voting on suggestion. Please try again.");
    }
  };

  const formatDateTime = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return "N/A";

    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.();
    if (!date) return "N/A";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const formatDateToDDMMYYYY = (
    timestamp: Timestamp | Date | undefined
  ): string => {
    if (!timestamp) return "N/A";

    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.();
    if (!date) return "N/A";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, "testimonials"), {
        content: newTestimonial.content,
        rating: newTestimonial.rating,
        name: userData?.name || "Anonymous",
        unit: userData?.unitNumber || "",
        approved: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      setNewTestimonial({
        content: "",
        rating: 5,
      });

      setShowAddTestimonialModal(false);
      alert("Testimonial submitted for approval!");
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      alert("Error submitting testimonial. Please try again.");
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newVehicleFiles.length > 0) {
      console.log(
        "Dummy uploading files:",
        newVehicleFiles.map((f) => f.name)
      );
    }

    try {
      const vehiclesRef = collection(db, "members", user.uid, "vehicles");

      await addDoc(vehiclesRef, {
        ...newVehicle,
        memberId: user.uid,
        memberName: userData?.name || "Member",
        memberUnit: userData?.unitNumber || "",
        createdAt: new Date(),
        rcBookFileUrls: [],
      });

      setNewVehicle({
        type: "Car",
        model: "",
        numberPlate: "",
        parking: false,
        startDate: new Date().toISOString().split("T")[0],
        isCurrent: true,
        endDate: "",
        rcBookNumber: "",
      });

      setNewVehicleFiles([]);

      setShowAddVehiclePopup(false);
      alert("Vehicle added successfully!");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("Error adding vehicle. Please try again.");
    }
  };

  const handleUpdateVehicleStatus = async (
    vehicleId: string,
    isCurrent: boolean,
    endDate?: string
  ) => {
    if (!user) return;

    try {
      const vehicleDocRef = doc(db, "members", user.uid, "vehicles", vehicleId);

      const updateData: any = {
        isCurrent,
      };

      if (isCurrent) {
        updateData.endDate = deleteField();
      } else if (endDate) {
        updateData.endDate = endDate;
      } else {
        updateData.endDate = new Date().toISOString();
      }

      await updateDoc(vehicleDocRef, updateData);
      alert("Vehicle status updated successfully!");
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      alert("Error updating vehicle status. Please try again.");
    }
  };

  const SuggestionCard = ({
    suggestion,
    user,
    onVote,
    onAddComment,
    expandedSuggestion,
    setExpandedSuggestion,
  }: {
    suggestion: {
      id: string;
      title: string;
      description: string;
      category: string;
      priority: string;
      status: string;
      userName: string;
      unitNumber: string;
      createdAt: any;
      updatedAt?: any;
      votes?: { upvotes: number; downvotes: number; voters: string[] };
      comments?: { userName: string; timestamp: any; comment: string }[];
    };
    user: { uid: string } | null;
    onVote: (
      suggestionId: string,
      voteType: "upvote" | "downvote",
      currentVotes: { upvotes: number; downvotes: number; voters: string[] }
    ) => void;
    onAddComment: (suggestionId: string, comment: string) => void;
    expandedSuggestion: string | null;
    setExpandedSuggestion: React.Dispatch<React.SetStateAction<string | null>>;
  }) => {

    const [commentInput, setCommentInput] = useState("");

    const handleAddComment = () => {
      if (commentInput.trim()) {
        onAddComment(suggestion.id, commentInput);
        setCommentInput(""); 
      }
    };

    return (
      <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-blue-500/5 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 bg-indigo-400/5 rounded-full"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {suggestion.title}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    suggestion.category === "Maintenance"
                      ? "bg-blue-100 text-blue-800"
                      : suggestion.category === "Security"
                      ? "bg-red-100 text-red-800"
                      : suggestion.category === "Amenities"
                      ? "bg-green-100 text-green-800"
                      : suggestion.category === "Events"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {suggestion.category}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    suggestion.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : suggestion.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {suggestion.priority} Priority
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    suggestion.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : suggestion.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : suggestion.status === "implemented"
                      ? "bg-indigo-100 text-indigo-800"
                      : suggestion.status === "under-review"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {suggestion.status.charAt(0).toUpperCase() +
                    suggestion.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  onVote(
                    suggestion.id,
                    "upvote",
                    suggestion.votes || { upvotes: 0, downvotes: 0, voters: [] }
                  )
                }
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                  (suggestion.votes?.voters || []).includes(
                    `${user?.uid}_upvote`
                  )
                    ? "bg-blue-100 text-blue-600 shadow-inner"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>{suggestion.votes?.upvotes || 0}</span>
              </button>

              <button
                onClick={() =>
                  onVote(
                    suggestion.id,
                    "downvote",
                    suggestion.votes || { upvotes: 0, downvotes: 0, voters: [] }
                  )
                }
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                  (suggestion.votes?.voters || []).includes(
                    `${user?.uid}_downvote`
                  )
                    ? "bg-red-100 text-red-600 shadow-inner"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c-.163 0-.326-.02-.485-.06L17 4m0 0v9m0-9h2.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 13H17m0 0v2a2 2 0 01-2 2h-2"
                  />
                </svg>
                <span>{suggestion.votes?.downvotes || 0}</span>
              </button>
            </div>
          </div>

          <p className="text-gray-700 mb-4 leading-relaxed">
            {suggestion.description}
          </p>

          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>
              Submitted by {suggestion.userName} ({suggestion.unitNumber}) on{" "}
              {formatDateTime(suggestion.createdAt)}
            </span>
            {suggestion.updatedAt &&
              suggestion.updatedAt !== suggestion.createdAt && (
                <span>
                  Last updated: {formatDateTime(suggestion.updatedAt)}
                </span>
              )}
          </div>

          {/* Comments section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-800">
                Comments ({suggestion.comments?.length || 0})
              </h4>
              <button
                onClick={() =>
                  setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )
                }
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
              >
                {expandedSuggestion === suggestion.id ? "Collapse" : "Expand"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ml-1 transition-transform ${
                    expandedSuggestion === suggestion.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {(expandedSuggestion === suggestion.id ||
              (suggestion.comments && suggestion.comments.length > 0)) && (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {suggestion.comments && suggestion.comments.length > 0 ? (
                  suggestion.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {comment.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-2 text-sm">
                    No comments yet
                  </p>
                )}
              </div>
            )}

            {/* Add comment form */}
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a comment..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      setUser(null);
      setUserData(null);
      setFamilyMembers([]);
      setVehicles([]);
      setComplaints([]);
      setPayments([]);

      await signOut(auth);

      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Add these handler functions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setRedevelopmentForm({
        ...redevelopmentForm,
        files: filesArray,
      });
    }
  };

  const handleSubmitRedevelopment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (
      !redevelopmentForm.name.trim() ||
      !redevelopmentForm.email.trim() ||
      !redevelopmentForm.phone.trim()
    ) {
      alert("Please fill in all compulsory fields: Name, Email, and Phone.");
      return;
    }

    setIsSubmittingRedevelopment(true);
    setUploadProgress(0);

    try {
      // Upload files to Firebase Storage if any
      let fileUrls: string[] = [];
      if (redevelopmentForm.files.length > 0) {
        // You'll need to implement file upload logic here
        // This is a placeholder for the actual implementation
        for (let i = 0; i < redevelopmentForm.files.length; i++) {
          // Simulate upload progress
          setUploadProgress((i / redevelopmentForm.files.length) * 100);
          // Actual upload code would go here
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate upload delay
        }
        setUploadProgress(100);
      }

      const vacateDateTimestamp = redevelopmentForm.vacateDate
        ? Timestamp.fromDate(redevelopmentForm.vacateDate)
        : null;

      // Save form data to Firestore
      const formRef = await addDoc(collection(db, "redevelopmentForms"), {
        userId: user.uid,
        userName: userData?.name || "",
        userUnit: userData?.unitNumber || "",
        userEmail: user.email || "",
        name: redevelopmentForm.name,
        phone: redevelopmentForm.phone,
        email: redevelopmentForm.email,
        vacateDate: vacateDateTimestamp,
        alternateAddress: redevelopmentForm.alternateAddress,
        fileUrls: [],
        submittedAt: serverTimestamp(),
        status: "pending",
        initialComments: redevelopmentForm.comments.trim() || null,
      });

      if (redevelopmentForm.comments.trim()) {
        await addDoc(
          collection(db, "redevelopmentForms", formRef.id, "comments"),
          {
            userId: user.uid,
            userName: userData?.name || "Member",
            userType: "member",
            comment: redevelopmentForm.comments.trim(),
            timestamp: serverTimestamp(),
          }
        );
      }

      // Reset form
      setRedevelopmentForm({
        name: "",
        phone: "",
        email: "",
        vacateDate: null,
        alternateAddress: "",
        comments: "",
        files: [],
      });

      setShowRedevelopmentForm(false);
      fetchUserRedevelopmentForms();
      alert("Redevelopment form submitted successfully!");
    } catch (error) {
      console.error("Error submitting redevelopment form:", error);
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmittingRedevelopment(false);
      setUploadProgress(0);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const complaintId = `#${Date.now().toString().slice(-6)}`;
      const userComplaintsDocRef = doc(db, "complaints", user.uid);

      const docSnapshot = await getDoc(userComplaintsDocRef);

      if (docSnapshot.exists()) {
        // Update existing document with new complaint
        await updateDoc(userComplaintsDocRef, {
          [complaintId]: {
            type: newComplaint.type,
            title: newComplaint.title,
            description: newComplaint.description,
            status: "Pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new document with first complaint
        await setDoc(userComplaintsDocRef, {
          userId: user.uid,
          [complaintId]: {
            type: newComplaint.type,
            title: newComplaint.title,
            description: newComplaint.description,
            status: "Pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      setNewComplaint({
        type: "",
        title: "",
        description: "",
      });

      setShowComplaintModal(false);
      alert("Complaint submitted successfully!");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Error submitting complaint. Please try again.");
    }
  };

  const renderSafeDate = (timestamp: any): string => {
    if (!timestamp) return "Not available";

    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    // Handle JavaScript Date
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    // Handle string dates
    if (typeof timestamp === "string") {
      try {
        const date = new Date(timestamp);
        return isNaN(date.getTime())
          ? timestamp
          : date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
      } catch {
        return timestamp;
      }
    }

    return String(timestamp);
  };

  //   const handleMakePayment = async (paymentId: string, amount: number, type: string = 'Maintenance') => {
  //     if (!user) return;

  //     const pid = `${user.uid}_${Date.now()}`;

  //     try {
  //       // Create or update payment document with a unique ID
  //       await setDoc(doc(db, 'payments', pid), {
  //         userId: user.uid,
  //         id: paymentId,
  //         type: type,
  //         amount: amount,
  //         status: 'Paid',
  //         paidAt: new Date(),
  //         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  //       });

  //       alert('Payment successful!');
  //     } catch (error) {
  //       console.error("Error processing payment:", error);
  //       alert('Error processing payment. Please try again.');
  //     }
  //   };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Update main member document
      await updateDoc(doc(db, "members", user.uid), {
        name: editProfileData.name,
        phone: editProfileData.phone,
        unitNumber: editProfileData.unitNumber,
        alternateAddress: editProfileData.alternateAddress || "",
        propertyStatus: editProfileData.propertyStatus || "owned",
        agreementStartDate:
          editProfileData.propertyStatus === "rented"
            ? editProfileData.agreementStartDate
            : "",
        agreementEndDate:
          editProfileData.propertyStatus === "rented"
            ? editProfileData.agreementEndDate
            : "",
        updatedAt: new Date(),
      });

      // Update family members subcollection
      const familyMembersRef = collection(
        db,
        "members",
        user.uid,
        "familyMembers"
      );
      const existingFamily = await getDocs(familyMembersRef);
      const deletePromises = existingFamily.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      const addFamilyPromises = editProfileData.familyMembers.map((member) =>
        addDoc(familyMembersRef, {
          name: member.name,
          relation: member.relation,
          age: member.age,
        })
      );
      await Promise.all(addFamilyPromises);

      // Update vehicles subcollection
      const vehiclesRef = collection(db, "members", user.uid, "vehicles");
      const existingVehicles = await getDocs(vehiclesRef);
      const deleteVehiclePromises = existingVehicles.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteVehiclePromises);

      const addVehiclePromises = editProfileData.vehicles.map((vehicle) => {
        // Convert string dates to Timestamp objects
        const startDate =
          typeof vehicle.startDate === "string"
            ? Timestamp.fromDate(new Date(vehicle.startDate))
            : vehicle.startDate;

        const endDate =
          vehicle.isCurrent || !vehicle.endDate
            ? null
            : typeof vehicle.endDate === "string"
            ? Timestamp.fromDate(new Date(vehicle.endDate))
            : vehicle.endDate;

        return addDoc(vehiclesRef, {
          type: vehicle.type,
          numberPlate: vehicle.numberPlate,
          model: vehicle.model,
          rcBookNumber: vehicle.rcBookNumber || "",
          rcBookFileUrls: [],
          parking: vehicle.parking || false,
          isCurrent: vehicle.isCurrent,
          startDate: startDate,
          endDate: endDate,
        });
      });
      await Promise.all(addVehiclePromises);

      // Update local state
      setUserData({
        ...userData,
        name: editProfileData.name,
        phone: editProfileData.phone,
        unitNumber: editProfileData.unitNumber,
      });

      // Refresh vehicles list
      const vehiclesSnapshot = await getDocs(vehiclesRef);
      const vehiclesData = vehiclesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVehicles(vehiclesData);

      setShowEditProfileModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const getDateFromFirestore = (timestamp: any) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return null;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
            {userData?.name?.charAt(0) || "M"}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">YeshKrupa</h1>
            <p className="text-xs text-gray-600">Member Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-100 cursor-pointer text-black"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Sidebar Navigation  */}
      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block md:w-75 flex flex-col fixed md:relative inset-0 z-50 md:z-auto`}
        style={{ backgroundColor: "#152238" }}
      >
        <div className="p-6 border-b border-blue-200 hidden md:block">
          <h1 className="text-xl font-bold text-white">YeshKrupa Society</h1>
          <p className="text-sm text-blue-200">Member Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4 ">
          <nav className="space-y-1 px-3 ">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <DashboardIcon />
              <span className="ml-3">Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("committee");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "committee"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <CommitteeIcon />
              <span className="ml-3">Committee</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("suggestions");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "suggestions"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span className="ml-3">Suggestions</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("redevelopment");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "redevelopment"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="ml-3">Redevelopment</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("complaints");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "complaints"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <ComplaintsIcon />
              <span className="ml-3">My Complaints</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("payments");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "payments"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <PaymentsIcon />
              <span className="ml-3">Payments</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("notices");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "notices"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <NoticesIcon />
              <span className="ml-3">Notices</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("events");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "events"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <EventsIcon />
              <span className="ml-3">Events</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("serviceProviders");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "serviceProviders"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
              <span className="ml-3">Service Providers</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("vehicles");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "vehicles"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <VehicleIcon />
              <span className="ml-3">My Vehicles</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("testimonials");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "testimonials"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <TestimonialsIcon />
              <span className="ml-3">Testimonials</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "profile"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <ProfileIcon />
              <span className="ml-3">Profile</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-blue-200">
          <div className="flex items-center px-2 py-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                {userData?.name?.charAt(0) || "M"}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-m font-medium text-white">
                {userData?.name || "Member"}
              </p>
              <p className="text-m text-blue-200">
                {userData?.unitNumber || "Unit"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full mt-3 px-4 py-2 bg-blue-200 text-black text-sm font-medium rounded-lg transition-colors cursor-pointer"
            onMouseEnter={(e) => (
              (e.currentTarget.style.backgroundColor = "#152238"),
              (e.currentTarget.style.color = "white")
            )}
            onMouseLeave={(e) => (
              (e.currentTarget.style.backgroundColor = ""),
              (e.currentTarget.style.color = "black")
            )}
          >
            {isLoggingOut ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-16 md:pt-0 flex flex-col">
        <div className="container mx-auto px-4 md:px-6 py-6 flex-1">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <div>
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>

                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      Dashboard Overview
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {/* Pending Payments Card */}
                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 overflow-hidden group transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-white/10 transform origin-bottom rotate-12 scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-blue-100">
                        Pending Payments
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                        {
                          payments.filter(
                            (p) =>
                              p.status === "pending" || p.status === "Pending"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Complaints Card */}
                <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 overflow-hidden group transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-white/10 transform origin-bottom rotate-12 scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
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
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-amber-100">
                        Active Complaints
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                        {
                          complaints.filter(
                            (c) =>
                              c.status === "pending" ||
                              c.status === "Pending" ||
                              c.status === "in-progress"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upcoming Events Card */}
                <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl p-6 overflow-hidden group transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-white/10 transform origin-bottom rotate-12 scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
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
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-emerald-100">
                        Upcoming Events
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                        {
                          events.filter((e) => {
                            const eventDate = getDateFromFirestore(e.date);
                            return eventDate && eventDate > new Date();
                          }).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Notices Card */}
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 overflow-hidden group transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-white/10 transform origin-bottom rotate-12 scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-purple-100">
                        New Notices
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                        {
                          notices.filter((n) => {
                            const noticeDate = getDateFromFirestore(
                              n.createdAt
                            );
                            return (
                              noticeDate &&
                              noticeDate >
                                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            );
                          }).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <button
                  onClick={() => setShowRedevelopmentForm(true)}
                  className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors text-black">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">
                    Redevelopment Form
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Submit redevelopment information
                  </p>
                </button>

                <button
                  onClick={() => setShowSuggestionModal(true)}
                  className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors text-black">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">
                    Make a Suggestion
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Share your ideas to improve our community
                  </p>
                </button>

                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors text-black">
                      <ComplaintsIcon />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">
                    Raise Complaint
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Submit a new maintenance request
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("payments")}
                  className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors text-black">
                      <PaymentsIcon />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">Make Payment</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Pay your maintenance dues
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("events")}
                  className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors text-black">
                      <EventsIcon />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">View Events</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Check upcoming society events
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("profile")}
                  className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors text-black">
                      <ProfileIcon />
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-800">
                    Update Profile
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your personal information
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Recent Notices */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Recent Notices
                  </h2>
                  <div className="space-y-4">
                    {notices.slice(0, 3).map((notice) => (
                      <div
                        key={notice.id}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-100"
                      >
                        <h4 className="font-medium text-gray-900">
                          {notice.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(
                            getDateFromFirestore(notice.uploadedAt)
                          ) || "Date not available"}
                        </p>

                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {notice.content}
                        </p>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No notices available
                      </p>
                    )}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Upcoming Events
                  </h2>
                  <div className="space-y-4">
                    {events
                      .filter((event) => {
                        const eventDate = getDateFromFirestore(event.date);
                        return eventDate && eventDate >= new Date();
                      })
                      .slice(0, 2)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <h3 className="text-lg font-semibold text-gray-800">
                            {event.title}
                          </h3>
                          <p className="mt-2 text-gray-600 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 flex-shrink-0"
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
                            <span>
                              {formatDate(getDateFromFirestore(event.date)) ||
                                "Date not available"}
                            </span>
                          </p>
                          <p className="mt-2 text-gray-600 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{event.location}</span>
                          </p>
                        </div>
                      ))}
                    {events.filter((event) => {
                      const eventDate = getDateFromFirestore(event.date);
                      return eventDate && eventDate >= new Date();
                    }).length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No upcoming events
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Committee Members */}
          {activeTab === "committee" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      Management Committee
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    <select
                      value={committeeFilter}
                      onChange={(e) => setCommitteeFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white/80 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Positions</option>
                      <option value="Chairperson">Chairperson</option>
                      <option value="Vice Chairperson">Vice Chairperson</option>
                      <option value="Treasurer">Treasurer</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Member">Committee Member</option>
                    </select>
                  </div>
                </div>
              </header>

              {committeeMembers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 
              0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 
              3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-
              1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 
              3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 
              0 2 2 0 014 0zM7 10a2 2 0 11-4 
              0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Committee Members Available
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Committee details will be posted here once available.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{ backgroundColor: "#022658" }}>
                      <tr>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {committeeMembers
                        .filter(
                          (member) =>
                            committeeFilter === "all" ||
                            member.position === committeeFilter
                        )
                        .map((member) => (
                          <tr
                            key={member.id}
                            className="transition-all hover:bg-gray-50/80"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                {member.position}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {member.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {member.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-normal break-words">
                              <div className="text-sm text-gray-600">
                                {member.description ||
                                  "Committee member dedicated to serving our community."}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Redevelopment Form */}
          {activeTab === "redevelopment" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                {/* Header content */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      My Redevelopment Forms
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                  </div>

                  <button
                    onClick={() => setShowRedevelopmentForm(true)}
                    className="px-5 py-3 bg-white/80 text-black rounded-xl hover:from-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
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
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 01118 0z"
                      />
                    </svg>
                    <span>Submit New Form</span>
                  </button>
                </div>
              </header>

              {/* Forms List */}
              <div className="space-y-10">
                {userRedevelopmentForms.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="h-12 w-12 text-blue-500"
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No forms submitted yet
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Submit your first redevelopment form to get started.
                    </p>
                  </div>
                ) : (
                  userRedevelopmentForms.map((form) => (
                    <div
                      key={form.id}
                      className="border border-gray-200 rounded-xl p-6"
                    >
                      {/* Form header with edit button */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Form #{form.id.slice(-6)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Submitted on {formatDateTime(form.submittedAt)}
                            {form.updatedAt &&
                              ` | Updated on ${formatDateTime(form.updatedAt)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              form.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : form.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : form.status === "reviewed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {form.status.charAt(0).toUpperCase() +
                              form.status.slice(1)}
                          </span>
                          <button
                            onClick={() => handleEditForm(form)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                          >
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Edit Form (when in edit mode) */}
                      {editingForm && editingForm.id === form.id ? (
                        <form
                          onSubmit={handleSubmitFormUpdate}
                          className="mb-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vacate Date
                              </label>
                              <input
                                type="date"
                                value={editFormData.vacateDate}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    vacateDate: e.target.value,
                                  })
                                }
                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alternate Address
                              </label>
                              <input
                                type="text"
                                value={editFormData.alternateAddress}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    alternateAddress: e.target.value,
                                  })
                                }
                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Alternate address"
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Additional Comments
                            </label>
                            <textarea
                              value={editFormData.comments}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  comments: e.target.value,
                                })
                              }
                              className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg"
                              rows={3}
                              placeholder="Add any additional comments..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingForm(null)}
                              className="px-4 py-2 cursor-pointer bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Vacate Date
                              </p>
                              <p className="font-medium text-black">
                                {form.vacateDate
                                  ? formatDateToDDMMYYYY(form.vacateDate)
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Alternate Address
                              </p>
                              <p className="font-medium text-black">
                                {form.alternateAddress || "Not specified"}
                              </p>
                            </div>
                          </div>
                          {form.initialComments && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">
                                Initial Comments
                              </p>
                              <p className="font-medium text-black">
                                {form.initialComments}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Comments Section */}
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-md font-medium text-gray-800 mb-3">
                          Comments
                        </h4>

                        <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                          {form.comments &&
                            form.comments.map(
                              (comment: {
                                id: Key | null | undefined;
                                userType:
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | ReactElement<
                                      unknown,
                                      string | JSXElementConstructor<any>
                                    >
                                  | Iterable<ReactNode>
                                  | Promise<
                                      | string
                                      | number
                                      | bigint
                                      | boolean
                                      | ReactPortal
                                      | ReactElement<
                                          unknown,
                                          string | JSXElementConstructor<any>
                                        >
                                      | Iterable<ReactNode>
                                      | null
                                      | undefined
                                    >
                                  | null
                                  | undefined;
                                userName:
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | ReactElement<
                                      unknown,
                                      string | JSXElementConstructor<any>
                                    >
                                  | Iterable<ReactNode>
                                  | ReactPortal
                                  | Promise<
                                      | string
                                      | number
                                      | bigint
                                      | boolean
                                      | ReactPortal
                                      | ReactElement<
                                          unknown,
                                          string | JSXElementConstructor<any>
                                        >
                                      | Iterable<ReactNode>
                                      | null
                                      | undefined
                                    >
                                  | null
                                  | undefined;
                                timestamp: Timestamp | undefined;
                                comment:
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | ReactElement<
                                      unknown,
                                      string | JSXElementConstructor<any>
                                    >
                                  | Iterable<ReactNode>
                                  | ReactPortal
                                  | Promise<
                                      | string
                                      | number
                                      | bigint
                                      | boolean
                                      | ReactPortal
                                      | ReactElement<
                                          unknown,
                                          string | JSXElementConstructor<any>
                                        >
                                      | Iterable<ReactNode>
                                      | null
                                      | undefined
                                    >
                                  | null
                                  | undefined;
                              }) => (
                                <div
                                  key={comment.id}
                                  className={`p-3 rounded-lg ${
                                    comment.userType === "admin"
                                      ? "bg-blue-50 border border-blue-100"
                                      : "bg-gray-50 border border-gray-100"
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-black text-sm">
                                      {comment.userName} ({comment.userType})
                                    </span>
                                    <span className="text-xs text-black text-gray-500">
                                      {formatDateTime(comment.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-black mt-1">
                                    {comment.comment}
                                  </p>
                                </div>
                              )
                            )}

                          {(form.comments || []).length === 0 && (
                            <p className="text-gray-500 text-center py-2">
                              No comments yet
                            </p>
                          )}
                        </div>

                        {/* Add Comment Form */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Add Comment
                          </h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formComment}
                              onChange={(e) => setFormComment(e.target.value)}
                              className="flex-1 text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Type your comment..."
                            />
                            <button
                              onClick={() =>
                                handleAddFormComment(form.id, formComment)
                              }
                              disabled={!formComment.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showRedevelopmentForm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Redevelopment Form
                  </h2>
                  <button
                    onClick={() => setShowRedevelopmentForm(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleSubmitRedevelopment}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={redevelopmentForm.name}
                      onChange={(e) =>
                        setRedevelopmentForm({
                          ...redevelopmentForm,
                          name: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={redevelopmentForm.phone}
                      onChange={(e) =>
                        setRedevelopmentForm({
                          ...redevelopmentForm,
                          phone: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={redevelopmentForm.email}
                      onChange={(e) =>
                        setRedevelopmentForm({
                          ...redevelopmentForm,
                          email: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Vacate Date
                    </label>
                    <input
                      type="date"
                      value={
                        redevelopmentForm.vacateDate
                          ? redevelopmentForm.vacateDate
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setRedevelopmentForm({
                          ...redevelopmentForm,
                          vacateDate: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Alternate Address
                    </label>
                    <textarea
                      value={redevelopmentForm.alternateAddress}
                      onChange={(e) =>
                        setRedevelopmentForm({
                          ...redevelopmentForm,
                          alternateAddress: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Upload Documents
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Initial Comments
                    </label>
                    <textarea
                      value={redevelopmentForm.comments}
                      onChange={(e) =>
                        setRedevelopmentForm({
                          ...redevelopmentForm,
                          comments: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      rows={4}
                      placeholder="Add any additional comments or information..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowRedevelopmentForm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRedevelopment}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingRedevelopment ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "serviceProviders" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>

                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      Service Providers
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    <select
                      value={serviceProviderFilter}
                      onChange={(e) => setServiceProviderFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white/80 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="Security">Watchman</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </header>

              {serviceProviders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-blue-500"
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
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No service providers available
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    There are currently no active service providers in our
                    directory.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{ backgroundColor: "#022658" }}>
                      <tr>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {serviceProviders
                        .filter(
                          (provider) =>
                            serviceProviderFilter === "all" ||
                            provider.role === serviceProviderFilter
                        )
                        .map((provider) => (
                          <tr
                            key={provider.id}
                            className="transition-all hover:bg-gray-50/80"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {provider.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {provider.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {provider.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {provider.email}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === "complaints" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div>
                <header
                  className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                  style={{ backgroundImage: "url('/assets/b8.jpg')" }}
                >
                  <div className="absolute inset-0 bg-black/40 z-10"></div>

                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                        My Complaints
                      </h2>
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                    </div>

                    <button
                      onClick={() => setShowComplaintModal(true)}
                      className="px-5 py-3 bg-white/80 text-black rounded-xl hover:from-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>Raise New Complaint</span>
                    </button>
                  </div>
                </header>
              </div>

              {complaints.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No complaints yet
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    You haven't raised any complaints yet. Start by reporting an
                    issue you've encountered.
                  </p>
                  <button
                    onClick={() => setShowComplaintModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Raise Your First Complaint
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{ backgroundColor: "#022658" }}>
                      <tr>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-4 text-left text-m font-bold text-white-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {complaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          className="transition-all hover:bg-gray-50/80"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono font-medium text-gray-600">
                              {complaint.id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-lg mr-3 ${
                                  COMPLAINT_TYPES[
                                    complaint.type as keyof typeof COMPLAINT_TYPES
                                  ]?.bg || "bg-gray-100"
                                } ${
                                  COMPLAINT_TYPES[
                                    complaint.type as keyof typeof COMPLAINT_TYPES
                                  ]?.text || "text-gray-600"
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={
                                      COMPLAINT_TYPES[
                                        complaint.type as keyof typeof COMPLAINT_TYPES
                                      ]?.icon ||
                                      "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    }
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {complaint.type}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {complaint.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                            ${
                              complaint.status === "Resolved"
                                ? "bg-green-100 text-green-700"
                                : complaint.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                            >
                              {complaint.status === "In Progress" && (
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-700"
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
                              )}
                              {complaint.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {formatDateTime(complaint.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenChat(complaint.id)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer text-sm relative"
                            >
                              View Chat
                              {unreadMessageCounts[complaint.id] > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {unreadMessageCounts[complaint.id]}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {showChatModal && selectedComplaintChat && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Complaint Chat
                  </h2>
                  <button
                    onClick={() => {
                      setShowChatModal(false);
                      setSelectedComplaintChat(null);
                      setChatMessages([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No messages yet. Start the conversation.
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === "member"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            msg.sender === "member"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm font-bold">{msg.senderName}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {msg.timestamp
                              ? formatDateTime(msg.timestamp)
                              : "Sending..."}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div>
                <header
                  className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                  style={{ backgroundImage: "url('/assets/b8.jpg')" }}
                >
                  <div className="absolute inset-0 bg-black/40 z-10"></div>

                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                        My Bills
                      </h2>
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                    </div>
                  </div>
                </header>
                <div className="flex items-center space-x-2">
                  {/* <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Export CSV
                </button>
                <button className="p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                </button> */}
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No payment records
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    You don't have any payment records yet. All transactions
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{ backgroundColor: "#022658" }}>
                      <tr>
                        <th className="px-6 py-4 text-left text-s font-semibold text-white-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-s font-semibold text-white-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-s font-semibold text-white-600 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-s font-semibold text-white-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="transition-all hover:bg-gray-50/80"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-lg mr-3 ${
                                  payment.type === "Maintenance"
                                    ? "bg-blue-100 text-blue-600"
                                    : payment.type === "Fine"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-purple-100 text-purple-600"
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {payment.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{payment.amount?.toLocaleString("en-IN") || "0"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {formatDateTime(payment.dueDate) ||
                                "Date not available"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                payment.status === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : payment.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notices Tab */}
          {activeTab === "notices" && (
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>

                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      Society Notices
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                  </div>
                </div>
              </header>

              <div className="space-y-6">
                {notices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <NoticesIcon />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No notices yet
                    </h3>
                    <p className="text-gray-600">
                      No notices have been published yet.
                    </p>
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {notice.title}
                        </h3>
                        <span className="text-sm text-gray-600 mt-1">
                          {formatDateTime(notice.uploadedAt) ||
                            "Date not available"}
                        </span>
                      </div>
                      {notice.category && (
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {notice.category}
                        </span>
                      )}
                      <p className="mt-4 text-gray-700">{notice.description}</p>
                      {notice.fileUrl && (
                        <div className="mt-4">
                          <a
                            href={notice.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            View Document ({notice.fileType},{" "}
                            {Math.round(notice.fileSize / 1024)}KB)
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>

                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      Upcoming Events
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter((event) => {
                  const eventDate =
                    event.date instanceof Date
                      ? event.date
                      : event.date?.toDate?.();

                  return eventDate && eventDate >= new Date();
                }).length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <EventsIcon />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No events scheduled
                    </h3>
                    <p className="text-gray-600">
                      There are no upcoming events at this time.
                    </p>
                  </div>
                ) : (
                  events
                    .filter((event) => {
                      const eventDate =
                        event.date instanceof Date
                          ? event.date
                          : event.date?.toDate?.();

                      return eventDate && eventDate >= new Date();
                    })

                    .map((event) => (
                      <div
                        key={event.id}
                        className="border border-gray-200 rounded-lg p-6 flex flex-col"
                      >
                        <h3 className="text-lg font-semibold text-gray-800">
                          {event.title}
                        </h3>
                        <p className="mt-2 text-gray-600 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1 flex-shrink-0"
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
                          {formatDateToDDMMYYYY(event.date) ||
                            "Date not available"}
                        </p>
                        <p className="mt-2 text-gray-600 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {event.location}
                        </p>
                        <p className="mt-4 text-gray-700 flex-1">
                          {event.description}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div>
                <header
                  className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                  style={{ backgroundImage: "url('/assets/b8.jpg')" }}
                >
                  <div className="absolute inset-0 bg-black/40 z-10"></div>

                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                        My Vehicles
                      </h2>
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                    </div>

                    <button
                      onClick={() => setShowAddVehiclePopup(true)}
                      className="px-4 py-2 bg-white/80 text-black rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md cursor-pointer"
                    >
                      Add New Vehicle
                    </button>
                  </div>
                </header>
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Vehicles</option>
                      <option value="current">Current Vehicles</option>
                      <option value="past">Past Vehicles</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setVehicleFilter("all");
                      }}
                      className="px-5 py-2.5 cursor-pointer bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Clear Filter
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicles Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Vehicle Details",
                          "Parking",
                          "Duration",
                          "Status",
                          "Actions",
                        ].map((header) => (
                          <th
                            key={header}
                            scope="col"
                            className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredVehicles.map((vehicle: any) => (
                        <tr
                          key={vehicle.id}
                          className="hover:bg-blue-50/30 transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.type}
                              </div>
                              <div className="text-sm text-gray-900">
                                {vehicle.model}
                              </div>
                              {vehicle.rcBookNumber && (
                                <div className="text-xs text-gray-500 mt-1">
                                  RC: {vehicle.rcBookNumber}
                                </div>
                              )}
                              <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                                {vehicle.numberPlate}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                vehicle.parking
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {vehicle.parking ? "Assigned" : "Not Assigned"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              Start: {renderSafeDate(vehicle.startDate)}
                            </div>
                            {vehicle.endDate && (
                              <div>End: {renderSafeDate(vehicle.endDate)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                vehicle.isCurrent
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {vehicle.isCurrent ? "Current" : "Past"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {vehicle.isCurrent ? (
                              <button
                                onClick={() => {
                                  const endDate = prompt(
                                    "Enter end date (YYYY-MM-DD):",
                                    new Date().toISOString().split("T")[0]
                                  );
                                  if (endDate) {
                                    handleUpdateVehicleStatus(
                                      vehicle.id,
                                      false,
                                      endDate
                                    );
                                  }
                                }}
                                className="text-orange-600 hover:text-orange-900 mr-3 cursor-pointer"
                              >
                                Mark as Past
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleUpdateVehicleStatus(vehicle.id, true)
                                }
                                className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                              >
                                Mark as Current
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredVehicles.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <VehicleIcon />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {vehicles.length === 0
                          ? "No vehicles found"
                          : "No matching vehicles"}
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {vehicles.length === 0
                          ? "Add vehicles to start tracking them"
                          : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Vehicle Popup */}
          {showAddVehiclePopup && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    Add New Vehicle
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    {/* Vehicle Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        required
                        value={newVehicle.type}
                        onChange={(e) =>
                          setNewVehicle({ ...newVehicle, type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Car">Car</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Bicycle">Bicycle</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Vehicle Model */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        required
                        value={newVehicle.model}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            model: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Vehicle model"
                      />
                    </div>

                    {/* Number Plate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number Plate
                      </label>
                      <input
                        type="text"
                        required
                        value={newVehicle.numberPlate}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            numberPlate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Vehicle number plate"
                      />
                    </div>

                    {/* Parking Status */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newVehicle.parking}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            parking: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Parking space assigned
                      </label>
                    </div>

                    {/* RC Book Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RC Book Number
                      </label>
                      <input
                        type="text"
                        value={newVehicle.rcBookNumber}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            rcBookNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., MH01AB1234"
                      />
                    </div>

                    {/* RC Book File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload RC Book
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setNewVehicleFiles(Array.from(e.target.files));
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newVehicle.startDate}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Current Vehicle */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newVehicle.isCurrent}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            isCurrent: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        This is a current vehicle
                      </label>
                    </div>

                    {/* End Date (if not current) */}
                    {!newVehicle.isCurrent && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          required={!newVehicle.isCurrent}
                          value={newVehicle.endDate}
                          onChange={(e) =>
                            setNewVehicle({
                              ...newVehicle,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Add Vehicle
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddVehiclePopup(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <header
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                style={{ backgroundImage: "url('/assets/b8.jpg')" }}
              >
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                      Community Suggestions
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                    <p className="text-blue-100 mt-2">
                      {filteredSuggestions.length} suggestions found
                    </p>
                  </div>

                  <button
                    onClick={() => setShowSuggestionModal(true)}
                    className="px-5 py-3 bg-white/80 text-black rounded-xl hover:from-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer mt-4 md:mt-0"
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
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 01118 0z"
                      />
                    </svg>
                    <span>New Suggestion</span>
                  </button>
                </div>
              </header>

              {/* Enhanced Filter and Search Section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={suggestionFilter}
                      onChange={(e) => {
                        setSuggestionFilter(e.target.value);
                        setCurrentSuggestionPage(1);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Suggestions</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="reviewed">Reviewed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentSuggestionPage(1);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="most-votes">Most Votes</option>
                      <option value="least-votes">Least Votes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items Per Page
                    </label>
                    <select
                      value={suggestionsPerPage}
                      onChange={(e) => {
                        setSuggestionsPerPage(Number(e.target.value));
                        setCurrentSuggestionPage(1);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="20">20 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSuggestionFilter("all");
                        setSuggestionSearch("");
                        setSortBy("newest");
                        setCurrentSuggestionPage(1);
                      }}
                      className="px-5 py-2.5 cursor-pointer bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Reset Filters
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Suggestions
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={suggestionSearch}
                      onChange={(e) => {
                        setSuggestionSearch(e.target.value);
                        setCurrentSuggestionPage(1);
                      }}
                      className="block w-full text-black pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by title, description, or author..."
                    />
                  </div>
                </div>
              </div>

              {filteredSuggestions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No suggestions found
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {suggestions.length === 0
                      ? "You haven't submitted any suggestions yet. Share your ideas to improve our community!"
                      : "Try adjusting your filters or search terms to see more results."}
                  </p>
                  {suggestions.length === 0 && (
                    <button
                      onClick={() => setShowSuggestionModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Submit Your First Suggestion
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 mb-8">
                    {currentSuggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        user={user}
                        onVote={handleVoteSuggestion}
                        onAddComment={handleAddComment}
                        expandedSuggestion={expandedSuggestion}
                        setExpandedSuggestion={setExpandedSuggestion}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                      <button
                        onClick={() =>
                          setCurrentSuggestionPage((prev) =>
                            Math.max(prev - 1, 1)
                          )
                        }
                        disabled={currentSuggestionPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, i) => {
                          // Show limited page numbers with ellipsis for many pages
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentSuggestionPage <= 4) {
                            pageNum = i + 1;
                            if (i === 6) pageNum = totalPages;
                            else if (i === 5) pageNum = "...";
                          } else if (currentSuggestionPage >= totalPages - 3) {
                            if (i === 0) pageNum = 1;
                            else if (i === 1) pageNum = "...";
                            else pageNum = totalPages - (6 - i);
                          } else {
                            if (i === 0) pageNum = 1;
                            else if (i === 1) pageNum = "...";
                            else if (i === 5) pageNum = "...";
                            else if (i === 6) pageNum = totalPages;
                            else pageNum = currentSuggestionPage - 2 + i;
                          }

                          return (
                            <button
                              key={i}
                              onClick={() =>
                                typeof pageNum === "number" &&
                                setCurrentSuggestionPage(pageNum)
                              }
                              className={`px-3 py-1 text-sm font-medium rounded-lg ${
                                currentSuggestionPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              } ${
                                typeof pageNum !== "number"
                                  ? "cursor-default"
                                  : ""
                              }`}
                              disabled={typeof pageNum !== "number"}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() =>
                          setCurrentSuggestionPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentSuggestionPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {showSuggestionModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    New Suggestion
                  </h2>
                  <button
                    onClick={() => setShowSuggestionModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleSubmitSuggestion}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newSuggestion.title}
                      onChange={(e) =>
                        setNewSuggestion({
                          ...newSuggestion,
                          title: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Brief title for your suggestion"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Category
                    </label>
                    <select
                      value={newSuggestion.category}
                      onChange={(e) =>
                        setNewSuggestion({
                          ...newSuggestion,
                          category: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    >
                      <option value="General">General</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Security">Security</option>
                      <option value="Amenities">Amenities</option>
                      <option value="Events">Events</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={newSuggestion.priority}
                      onChange={(e) =>
                        setNewSuggestion({
                          ...newSuggestion,
                          priority: e.target.value as "low" | "medium" | "high",
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={newSuggestion.description}
                      onChange={(e) =>
                        setNewSuggestion({
                          ...newSuggestion,
                          description: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      rows={4}
                      placeholder="Please provide detailed information about your suggestion..."
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSuggestionModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                    >
                      Submit Suggestion
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "testimonials" && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex flex-col justify-between mb-8 gap-4">
                <header
                  className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                  style={{ backgroundImage: "url('/assets/b8.jpg')" }}
                >
                  <div className="absolute inset-0 bg-black/40 z-10"></div>

                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                        Testimonials
                      </h2>
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                    </div>

                    <button
                      onClick={() => setShowAddTestimonialModal(true)}
                      className="px-5 py-3 bg-white/80 text-black rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
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
                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Add Testimonial</span>
                    </button>
                  </div>
                </header>
              </div>

              {testimonials.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <TestimonialsIcon />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No testimonials yet
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Be the first to share your experience with our society!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${
                                i < testimonial.rating
                                  ? "fill-current"
                                  : "text-gray-300"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 italic mb-4">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {testimonial.name?.charAt(0) || "A"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {testimonial.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {testimonial.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAddTestimonialModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Add Testimonial
                  </h2>
                  <button
                    onClick={() => setShowAddTestimonialModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleSubmitTestimonial}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setNewTestimonial({
                              ...newTestimonial,
                              rating: star,
                            })
                          }
                          className="text-2xl focus:outline-none cursor-pointer"
                        >
                          {star <= newTestimonial.rating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="testimonial-content"
                    >
                      Your Experience
                    </label>
                    <textarea
                      id="testimonial-content"
                      value={newTestimonial.content}
                      onChange={(e) =>
                        setNewTestimonial({
                          ...newTestimonial,
                          content: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      rows={4}
                      placeholder="Share your experience living in our society..."
                      required
                    ></textarea>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddTestimonialModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                    >
                      Submit Testimonial
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && userData && (
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <div>
                <header
                  className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
                  style={{ backgroundImage: "url('/assets/b8.jpg')" }}
                >
                  <div className="absolute inset-0 bg-black/40 z-10"></div>

                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                        My Profile
                      </h2>
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
                    </div>

                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="px-4 py-2 bg-white/80 text-black rounded-lg transition-colors cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  </div>
                </header>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Personal Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                        {userData.name || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                        {user?.email || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                        {userData.phone || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit Number
                      </label>
                      <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                        {userData.unitNumber || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Member Since
                      </label>
                      <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                        {userData.memberSince || "Not available"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Alternate Address
                      </label>
                      <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                        {userData.alternateAddress || "Not provided"}
                      </p>
                    </div>

                    {userData.alternateAddress && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Property Status
                          </label>
                          <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md capitalize">
                            {userData.propertyStatus || "Not specified"}
                          </p>
                        </div>
                        {userData.propertyStatus === "rented" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Agreement Start Date
                              </label>
                              <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                                {userData.agreementStartDate || "Not provided"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Agreement End Date
                              </label>
                              <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">
                                {userData.agreementEndDate || "Not provided"}
                              </p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Family Members
                  </h3>

                  {familyMembers.length > 0 ? (
                    <div className="space-y-4">
                      {familyMembers.map((member) => (
                        <div
                          key={member.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <p className="font-medium text-gray-900">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.relation}, {member.age} years
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 p-4 bg-gray-50 rounded-md">
                      No family members added.
                    </p>
                  )}

                  <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">
                    Vehicles
                  </h3>

                  {vehicles.length > 0 ? (
                    <div className="space-y-4">
                      {vehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <p className="font-medium text-gray-900">
                            {vehicle.type}: {vehicle.numberPlate}
                          </p>
                          <p className="text-sm text-gray-600">
                            {vehicle.model}
                          </p>
                          <p className="text-sm text-gray-600">
                            Parking: {vehicle.parking ? "Yes" : "No"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 p-4 bg-gray-50 rounded-md">
                      No vehicles registered.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Managing our community with care and professionalism since
                  2003. We strive to create a harmonious living environment for
                  all residents.
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
                    <span>info@yeshkrupa.com</span>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-6">
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
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors flex items-center justify-center"
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

        {/* Complaint Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Raise a Complaint
                </h2>
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleSubmitComplaint}>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="complaint-type"
                  >
                    Complaint Type
                  </label>
                  <select
                    id="complaint-type"
                    value={newComplaint.type}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        type: e.target.value as ComplaintType,
                      })
                    }
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  >
                    <option value="">Select a type</option>
                    {COMPLAINT_TYPE_ARRAY.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="complaint-title"
                  >
                    Title
                  </label>
                  <input
                    id="complaint-title"
                    type="text"
                    value={newComplaint.title}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        title: e.target.value,
                      })
                    }
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-medium mb-2"
                    htmlFor="complaint-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="complaint-description"
                    value={newComplaint.description}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        description: e.target.value,
                      })
                    }
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    rows={4}
                    placeholder="Please provide detailed information about the issue..."
                    required
                  ></textarea>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                  >
                    Submit Complaint
                  </button>
                </div>
              </form>
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
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
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

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="name"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={editProfileData.name}
                      onChange={(e) =>
                        setEditProfileData({
                          ...editProfileData,
                          name: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="phone"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={editProfileData.phone}
                      onChange={(e) =>
                        setEditProfileData({
                          ...editProfileData,
                          phone: Number(e.target.value) || 0,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="unitNumber"
                    >
                      Unit Number
                    </label>
                    <input
                      id="unitNumber"
                      type="text"
                      value={editProfileData.unitNumber}
                      onChange={(e) =>
                        setEditProfileData({
                          ...editProfileData,
                          unitNumber: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className="block text-gray-700 text-sm font-medium mb-2"
                      htmlFor="alternateAddress"
                    >
                      Alternate Address
                    </label>
                    <input
                      id="alternateAddress"
                      type="text"
                      value={editProfileData.alternateAddress || ""}
                      onChange={(e) =>
                        setEditProfileData({
                          ...editProfileData,
                          alternateAddress: e.target.value,
                        })
                      }
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Optional alternate address"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Property Status
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="propertyStatus"
                          value="owned"
                          checked={editProfileData.propertyStatus === "owned"}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              propertyStatus: e.target.value as
                                | "owned"
                                | "rented",
                            })
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-black">Owned</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="propertyStatus"
                          value="rented"
                          checked={editProfileData.propertyStatus === "rented"}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              propertyStatus: e.target.value as
                                | "owned"
                                | "rented",
                            })
                          }
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-black">Rented</span>
                      </label>
                    </div>
                  </div>

                  {editProfileData.propertyStatus === "rented" && (
                    <>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Agreement Start Date
                        </label>
                        <input
                          type="date"
                          value={editProfileData.agreementStartDate || ""}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              agreementStartDate: e.target.value,
                            })
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Agreement End Date
                        </label>
                        <input
                          type="date"
                          value={editProfileData.agreementEndDate || ""}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              agreementEndDate: e.target.value,
                            })
                          }
                          className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Family Members Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Family Members
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProfileData({
                          ...editProfileData,
                          familyMembers: [
                            ...editProfileData.familyMembers,
                            { name: "", relation: "", age: 0 },
                          ],
                        });
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-lg hover:bg-blue-200 cursor-pointer"
                    >
                      Add Member
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editProfileData.familyMembers?.map((member, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                const updatedMembers = [
                                  ...editProfileData.familyMembers,
                                ];
                                updatedMembers[index].name = e.target.value;
                                setEditProfileData({
                                  ...editProfileData,
                                  familyMembers: updatedMembers,
                                });
                              }}
                              className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                              placeholder="Full Name"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Relation
                            </label>
                            <div className="space-y-2">
                              <select
                                value={
                                  [
                                    "Father",
                                    "Mother",
                                    "Spouse",
                                    "Son",
                                    "Daughter",
                                    "Brother",
                                    "Sister",
                                  ].includes(member.relation)
                                    ? member.relation
                                    : "Other"
                                }
                                onChange={(e) => {
                                  const updatedMembers = [
                                    ...editProfileData.familyMembers,
                                  ];
                                  updatedMembers[index].relation =
                                    e.target.value;
                                  setEditProfileData({
                                    ...editProfileData,
                                    familyMembers: updatedMembers,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                              >
                                <option value="">Select Relation</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Son">Son</option>
                                <option value="Daughter">Daughter</option>
                                <option value="Brother">Brother</option>
                                <option value="Sister">Sister</option>
                                <option value="Other">Other</option>
                              </select>

                              {member.relation === "Other" && (
                                <input
                                  type="text"
                                  value={member.relation || ""}
                                  onChange={(e) => {
                                    const updatedMembers = [
                                      ...editProfileData.familyMembers,
                                    ];
                                    updatedMembers[index].relation =
                                      e.target.value;
                                    updatedMembers[index].relation = "Other";
                                    setEditProfileData({
                                      ...editProfileData,
                                      familyMembers: updatedMembers,
                                    });
                                  }}
                                  placeholder="Enter custom relation"
                                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Age
                            </label>
                            <input
                              type="number"
                              value={member.age}
                              onChange={(e) => {
                                const updatedMembers = [
                                  ...editProfileData.familyMembers,
                                ];
                                updatedMembers[index].age =
                                  Number(e.target.value) || 0;
                                setEditProfileData({
                                  ...editProfileData,
                                  familyMembers: updatedMembers,
                                });
                              }}
                              className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                              placeholder="Age"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedMembers = [
                              ...editProfileData.familyMembers,
                            ];
                            updatedMembers.splice(index, 1);
                            setEditProfileData({
                              ...editProfileData,
                              familyMembers: updatedMembers,
                            });
                          }}
                          className="mt-3 text-red-600 text-sm hover:text-red-800 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {(!editProfileData.familyMembers ||
                      editProfileData.familyMembers.length === 0) && (
                      <p className="text-gray-500 text-center py-4">
                        No family members added.
                      </p>
                    )}
                  </div>
                </div>

                {/* Vehicles Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Vehicles
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProfileData({
                          ...editProfileData,
                          vehicles: [
                            ...editProfileData.vehicles,
                            {
                              type: "",
                              numberPlate: "",
                              model: "",
                              parking: false,
                              isCurrent: true,
                              startDate: new Date().toISOString().split("T")[0],
                              endDate: "",
                            },
                          ],
                        });
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-lg hover:bg-blue-200 cursor-pointer"
                    >
                      Add Vehicle
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editProfileData.vehicles?.map((vehicle, index) => {
                      const startDateValue =
                        typeof vehicle.startDate === "object" &&
                        "toDate" in vehicle.startDate
                          ? vehicle.startDate
                              .toDate()
                              .toISOString()
                              .split("T")[0]
                          : vehicle.startDate || "";

                      const endDateValue =
                        vehicle.endDate &&
                        typeof vehicle.endDate === "object" &&
                        "toDate" in vehicle.endDate
                          ? vehicle.endDate.toDate().toISOString().split("T")[0]
                          : vehicle.endDate || "";

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Vehicle Type */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Vehicle Type
                              </label>
                              <select
                                value={vehicle.type}
                                onChange={(e) => {
                                  const updatedVehicles = [
                                    ...editProfileData.vehicles,
                                  ];
                                  updatedVehicles[index].type = e.target.value;
                                  setEditProfileData({
                                    ...editProfileData,
                                    vehicles: updatedVehicles,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                              >
                                <option value="">Select Type</option>
                                <option value="Car">Car</option>
                                <option value="Motorcycle">Motorcycle</option>
                                <option value="Scooter">Scooter</option>
                                <option value="Bicycle">Bicycle</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            {/* Number Plate */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Number Plate
                              </label>
                              <input
                                type="text"
                                value={vehicle.numberPlate}
                                onChange={(e) => {
                                  const updatedVehicles = [
                                    ...editProfileData.vehicles,
                                  ];
                                  updatedVehicles[index].numberPlate =
                                    e.target.value;
                                  setEditProfileData({
                                    ...editProfileData,
                                    vehicles: updatedVehicles,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                placeholder="Number Plate"
                              />
                            </div>

                            {/* Model */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Model
                              </label>
                              <input
                                type="text"
                                value={vehicle.model}
                                onChange={(e) => {
                                  const updatedVehicles = [
                                    ...editProfileData.vehicles,
                                  ];
                                  updatedVehicles[index].model = e.target.value;
                                  setEditProfileData({
                                    ...editProfileData,
                                    vehicles: updatedVehicles,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                placeholder="Model"
                              />
                            </div>

                            {/* Parking Status */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Parking Assigned
                              </label>
                              <select
                                value={vehicle.parking ? "yes" : "no"}
                                onChange={(e) => {
                                  const updatedVehicles = [
                                    ...editProfileData.vehicles,
                                  ];
                                  updatedVehicles[index].parking =
                                    e.target.value === "yes";
                                  setEditProfileData({
                                    ...editProfileData,
                                    vehicles: updatedVehicles,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                              >
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                RC Book Number
                              </label>
                              <input
                                type="text"
                                value={vehicle.rcBookNumber || ""}
                                onChange={(e) => {
                                  const updatedVehicles = [
                                    ...editProfileData.vehicles,
                                  ];
                                  updatedVehicles[index].rcBookNumber =
                                    e.target.value;
                                  setEditProfileData({
                                    ...editProfileData,
                                    vehicles: updatedVehicles,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                placeholder="RC Book Number"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Upload New RC Book (Optional)
                            </label>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  console.log(
                                    `Files selected for vehicle ${index}:`,
                                    Array.from(e.target.files).map(
                                      (f) => f.name
                                    )
                                  );
                                  alert(
                                    "File input is for demonstration. Files are not saved on profile update."
                                  );
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                          </div>

                          {/* Vehicle Status (Current/Past) */}
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Vehicle Status
                            </label>
                            <div className="flex space-x-4">
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`vehicle-status-${index}`}
                                  value="current"
                                  checked={vehicle.isCurrent}
                                  onChange={() => {
                                    const updatedVehicles = [
                                      ...editProfileData.vehicles,
                                    ];
                                    updatedVehicles[index].isCurrent = true;
                                    setEditProfileData({
                                      ...editProfileData,
                                      vehicles: updatedVehicles,
                                    });
                                  }}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-black">
                                  Current Vehicle
                                </span>
                              </label>
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`vehicle-status-${index}`}
                                  value="past"
                                  checked={!vehicle.isCurrent}
                                  onChange={() => {
                                    const updatedVehicles = [
                                      ...editProfileData.vehicles,
                                    ];
                                    updatedVehicles[index].isCurrent = false;
                                    setEditProfileData({
                                      ...editProfileData,
                                      vehicles: updatedVehicles,
                                    });
                                  }}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-black">
                                  Past Vehicle
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Date Inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={startDateValue}
                                onChange={(e) => {
                                  const updatedVehicles = [
                                    ...editProfileData.vehicles,
                                  ];
                                  updatedVehicles[index].startDate =
                                    e.target.value;
                                  setEditProfileData({
                                    ...editProfileData,
                                    vehicles: updatedVehicles,
                                  });
                                }}
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                required
                              />
                            </div>

                            {/* End Date (only for past vehicles) */}
                            {!vehicle.isCurrent && (
                              <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={endDateValue}
                                  onChange={(e) => {
                                    const updatedVehicles = [
                                      ...editProfileData.vehicles,
                                    ];
                                    updatedVehicles[index].endDate =
                                      e.target.value;
                                    setEditProfileData({
                                      ...editProfileData,
                                      vehicles: updatedVehicles,
                                    });
                                  }}
                                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                  required={!vehicle.isCurrent}
                                />
                              </div>
                            )}
                          </div>

                          {/* Remove Vehicle */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedVehicles = [
                                ...editProfileData.vehicles,
                              ];
                              updatedVehicles.splice(index, 1);
                              setEditProfileData({
                                ...editProfileData,
                                vehicles: updatedVehicles,
                              });
                            }}
                            className="mt-3 text-red-600 text-sm hover:text-red-800 cursor-pointer"
                          >
                            Remove Vehicle
                          </button>
                        </div>
                      );
                    })}

                    {(!editProfileData.vehicles ||
                      editProfileData.vehicles.length === 0) && (
                      <p className="text-gray-500 text-center py-4">
                        No vehicles added.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors cursor-pointer"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
