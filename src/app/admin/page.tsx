"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  setDoc,
  getDoc,
  deleteField,
  onSnapshot,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

// ==============================
// INTERFACE DEFINITIONS
// ==============================

interface Testimonial {
  id: string;
  name: string;
  unit: string;
  content: string;
  rating: number;
  createdAt: Timestamp;
  approved: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface Query {
  id: string;
  name: string;
  email: string;
  phone?: string;
  query: string;
  status: string;
  createdAt: Timestamp;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberSince: number;
  unitNumber: string;
  createdAt?: Timestamp;
}

interface Payment {
  id: string;
  amount: number;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  status: string;
  transactionId: string;
  type: string;
  memberId: string;
  memberName: string;
}

interface Complaint {
  id: string;
  memberId: string;
  memberName: string;
  unitNumber: string;
  type: string;
  title: string;
  description: string;
  status: string;
  inProgressNotes?: string;
  completedNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  files?: ComplaintFile[];
}

interface ComplaintFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

interface MemberDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitNumber: string;
  memberSince: number;
  createdAt?: Timestamp;
  familyMembers?: FamilyMember[];
  vehicles?: Vehicle[];
  alternateAddress?: string;
  propertyStatus?: string;
  agreementStartDate?: string;
  agreementEndDate?: string;
}

interface FamilyMember {
  id?: string;
  name: string;
  relation: string;
  age: number;
  phone?: string;
}

interface Vehicle {
  id?: string;
  type: string;
  model: string;
  numberPlate: string;
  parking: boolean;
  startDate: Timestamp;
  endDate?: Timestamp;
  isCurrent: boolean;
  rcBookNumber?: string;
  FileUrls?: string[];
}

interface RedevelopmentForm {
  id: string;
  userId: string;
  name: string;
  phone: number;
  userUnit: string;
  email: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  submittedAt: Timestamp;
  alternateAddress?: string;
  vacateDate?: Timestamp;
  fileUrls?: string[];
  comments?: Comment[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userType: string;
  comment: string;
  timestamp: Timestamp;
  statusChange?: "pending" | "reviewed" | "approved" | "rejected";
}

interface ServiceProvider {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  address?: string;
  monthlySalary: number;
  joiningDate: Timestamp;
  isActive: boolean;
  documents?: {
    aadhaar?: string;
    pan?: string;
    contract?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Suggestion {
  id: string;
  memberId: string;
  userName: string;
  unitNumber: string;
  title: string;
  description: string;
  category: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  votes?: {
    upvotes: number;
    downvotes: number;
    voters: string[];
  };
  comments?: Comment[];
}

interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  isPublic: boolean;
  uploadedBy: string;
  uploadedAt: Timestamp;
  category: "document" | "notice";
}

interface CommitteeMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  description: string;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  position: string;
  adminPosition: string;
}

interface DeletionRequest {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  itemType: string;
  itemId: string;
  itemName: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
}

interface ChatMessage {
  id: string;
  sender: "member" | "admin";
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Timestamp;
  readBy?: string[]; 
}

// ==============================
// ICON COMPONENTS
// ==============================

const DashboardIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const VehicleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-5a1 1 0 00-.293-.707l-4-4A1 1 0 0016 4H3z" />
  </svg>
);

const TestimonialsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
    />
  </svg>
);

const FAQsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const SuggestionsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const QueriesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const MembersIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const PaymentsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="h-6 w-6 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 17a2 2 0 100-4 2 2 0 000 4z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 10V7a6 6 0 1112 0v3M5 10h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10z"
    />
  </svg>
);

const UnlockIcon = () => (
  <svg
    className="h-6 w-6 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 17a2 2 0 100-4 2 2 0 000 4z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 10V7a6 6 0 1112 0"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 10h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10z"
    />
  </svg>
);

const ViewIcon = () => (
  <svg
    className="h-6 w-6 text-green-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    className="h-6 w-6 text-red-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-3h2a2 2 0 012 2v1H9V6a2 2 0 012-2z"
    />
  </svg>
);

const DocumentsIcon = () => (
  <svg
    className="h-6 w-6 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 3h8l4 4v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 3v4h4"
    />
  </svg>
);

const NoticesIcon = () => (
  <svg
    className="h-6 w-6 text-teal-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 17h6m-7-4h8m-9-4h10M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6"
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

const RedevelopmentFormIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ComplaintsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ServiceProviderIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);


// ==============================
// UTILITY FUNCTIONS
// ==============================

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

// ==============================
// MAIN COMPONENT
// ==============================

export default function AdminDashboard() {
  const router = useRouter();

   // ==============================
  // STATE MANAGEMENT
  // ==============================
  
  // Authentication & User State
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDetails, setAdminDetails] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data Collections
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [redevelopmentForms, setRedevelopmentForms] = useState<RedevelopmentForm[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  
  // Filter States
  const [wingFilter, setWingFilter] = useState<string>("all");
  const [flatNumberFilter, setFlatNumberFilter] = useState<string>("all");
  const [vehicleWingFilter, setVehicleWingFilter] = useState<string>("all");
  const [vehicleFlatFilter, setVehicleFlatFilter] = useState<string>("all");
  const [testimonialFilter, setTestimonialFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [providerRoleFilter, setProviderRoleFilter] = useState<string>("all");
  const [providerStatusFilter, setProviderStatusFilter] = useState<string>("all");
  const [committeeFilter, setCommitteeFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [suggestionStatusFilter, setSuggestionStatusFilter] = useState<string>("all");
  const [suggestionCategoryFilter, setSuggestionCategoryFilter] = useState<string>("all");
  const [suggestionPriorityFilter, setSuggestionPriorityFilter] = useState<string>("all");
  const [redevelopmentStatusFilter, setRedevelopmentStatusFilter] = useState<string>("all");
  
// Search States
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [redevelopmentSearchTerm, setRedevelopmentSearchTerm] = useState<string>("");
  
// Form States
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    unitNumber: "",
    memberSince: "",
  });

  const [newPayment, setNewPayment] = useState({
    memberId: "",
    amount: "",
    dueDate: "",
    type: "Maintenance",
    status: "pending",
  });

  const [newFAQ, setNewFAQ] = useState({
    question: "",
    answer: "",
  });

  const [newProvider, setNewProvider] = useState({
    name: "",
    role: "Watchman",
    phone: "",
    email: "",
    address: "",
    monthlySalary: "",
    joiningDate: new Date().toISOString().split("T")[0],
    isActive: true,
    documents: {
      aadhaar: "",
      pan: "",
      contract: "",
    },
  });

  const [newVehicle, setNewVehicle] = useState({
    type: "Car",
    model: "",
    numberPlate: "",
    parking: false,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isCurrent: true,
    rcBookNumber: "",
  });

  const [newCommitteeMember, setNewCommitteeMember] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    description: "",
  });

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    position: "",
    //password: "",
    adminPosition: "",
  });

  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    file: null as File | null,
    category: "document" as "document" | "notice",
    isPublic: false,
  });

// Modal States
  const [showAddPaymentPopup, setShowAddPaymentPopup] = useState(false);
  const [showMemberPopup, setShowMemberPopup] = useState(false);
  const [showFAQPopup, setShowFAQPopup] = useState(false);
  const [showAddProviderPopup, setShowAddProviderPopup] = useState(false);
  const [showAddVehiclePopup, setShowAddVehiclePopup] = useState(false);
  const [showAddCommitteePopup, setShowAddCommitteePopup] = useState(false);
  const [showAddAdminPopup, setShowAddAdminPopup] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationMapModal, setShowLocationMapModal] = useState(false);
  const [showDeleteReasonModal, setShowDeleteReasonModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  
  // Selection States
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const [selectedVehicleMember, setSelectedVehicleMember] = useState<Member | null>(null);
  const [selectedComplaintChat, setSelectedComplaintChat] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<RedevelopmentForm | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  
  // Editing States
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [editingCommitteeMember, setEditingCommitteeMember] = useState<CommitteeMember | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  
  // Loading States
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [isEditingFAQ, setIsEditingFAQ] = useState(false);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isAddingCommittee, setIsAddingCommittee] = useState(false);
  const [isEditingCommittee, setIsEditingCommittee] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Other States
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [showVehicleManagement, setShowVehicleManagement] = useState(false);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [tempStatus, setTempStatus] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [suggestionComment, setSuggestionComment] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState<{ itemType: string; itemId: string; itemName: string } | null>(null);
  const [newVehicleFiles, setNewVehicleFiles] = useState<File[]>([]);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<{ [complaintId: string]: number }>({});
  
  // Stats State
  const [stats, setStats] = useState({
    totalTestimonials: 0,
    pendingTestimonials: 0,
    totalFAQs: 0,
    newQueries: 0,
    totalMembers: 0,
    pendingPayments: 0,
    pendingComplaints: 0,
    totalServiceProviders: 0,
    activeServiceProviders: 0,
    unreadMessages: 0,
  });

  const isSuperAdmin = adminDetails?.adminPosition === "Super Admin";

  const generateTransactionId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${randomStr}`.toUpperCase();
  };

  const generateRandomId = (): string => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

// ==============================
// DATA FETCHING FUNCTIONS
// ==============================

const fetchData = async () => {
  try {
    setLoading(true);
    
    await Promise.all([
      fetchTestimonials(),
      fetchFAQs(),
      fetchQueries(),
      fetchMembers(),
      fetchPayments(),
      fetchSuggestions(),
      fetchRedevelopmentForms(),
      fetchCommitteeMembers(),
      fetchAdmins(),
      fetchDocuments(),
      fetchVehicles(),
      fetchServiceProviders(),
      fetchComplaints(),
    ]);
    
    updateStats();
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};

const fetchTestimonials = async () => {
  try {
    const testimonialsQuery = query(collection(db, "testimonials"));
    const testimonialsSnapshot = await getDocs(testimonialsQuery);
    const testimonialsData = testimonialsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Testimonial[];
    setTestimonials(testimonialsData);
    return testimonialsData;
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }
};

const fetchFAQs = async () => {
  try {
    const faqsQuery = query(collection(db, "faqs"));
    const faqsSnapshot = await getDocs(faqsQuery);
    const faqsData = faqsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQ[];
    setFaqs(faqsData);
    return faqsData;
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
};

const fetchQueries = async () => {
  try {
    const queriesQuery = query(collection(db, "queries"));
    const queriesSnapshot = await getDocs(queriesQuery);
    const queriesData = queriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Query[];
    setQueries(queriesData);
    return queriesData;
  } catch (error) {
    console.error("Error fetching queries:", error);
    return [];
  }
};

const fetchMembers = async () => {
  try {
    const membersQuery = query(collection(db, "members"));
    const membersSnapshot = await getDocs(membersQuery);
    const membersData = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];
    setMembers(membersData);
    return membersData;
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
};

const fetchPayments = async () => {
  try {
    const memberNameMap: Record<string, string> = {};
    members.forEach((member) => {
      memberNameMap[member.id] = member.name;
    });

    const paymentsQuery = query(collection(db, "payments"));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const paymentsData: Payment[] = [];

    paymentsSnapshot.forEach((doc) => {
      const paymentDoc = doc.data();
      const memberId = doc.id;

      Object.keys(paymentDoc).forEach((transactionId) => {
        if (transactionId !== "id" && paymentDoc[transactionId]) {
          const payment = paymentDoc[transactionId];
          paymentsData.push({
            id: transactionId,
            memberId: memberId,
            memberName: memberNameMap[memberId] || "Unknown Member",
            amount: payment.amount,
            dueDate: payment.dueDate,
            paidDate: payment.paidDate,
            status: payment.status,
            type: payment.type,
            transactionId: transactionId,
          } as Payment);
        }
      });
    });

    setPayments(paymentsData);
    return paymentsData;
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
};

const fetchSuggestions = async () => {
  try {
    const suggestionsQuery = query(
      collection(db, "suggestions"),
      orderBy("createdAt", "desc")
    );
    const suggestionsSnapshot = await getDocs(suggestionsQuery);
    const suggestionsData = suggestionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as Suggestion[];
    
    setSuggestions(suggestionsData);
    return suggestionsData;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
};

const fetchRedevelopmentForms = async () => {
  try {
    const formsQuery = query(collection(db, "redevelopmentForms"));
    const formsSnapshot = await getDocs(formsQuery);
    const formsData: RedevelopmentForm[] = [];

    for (const formDoc of formsSnapshot.docs) {
      const formData = formDoc.data();
      formsData.push({
        id: formDoc.id,
        userId: formData.userId,
        name: formData.name,
        phone: formData.phone,
        userUnit: formData.userUnit,
        email: formData.email,
        status: formData.status,
        submittedAt: formData.submittedAt,
        alternateAddress: formData.alternateAddress,
        vacateDate: formData.vacateDate,
        fileUrls: formData.fileUrls,
      } as RedevelopmentForm);
    }

    setRedevelopmentForms(formsData);
    return formsData;
  } catch (error) {
    console.error("Error fetching redevelopment forms:", error);
    return [];
  }
};

const fetchCommitteeMembers = async () => {
  try {
    const committeeQuery = query(collection(db, "committee"));
    const committeeSnapshot = await getDocs(committeeQuery);
    const committeeData = committeeSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommitteeMember[];
    setCommitteeMembers(committeeData);
    return committeeData;
  } catch (error) {
    console.error("Error fetching committee members:", error);
    return [];
  }
};

const fetchAdmins = async () => {
  try {
    const adminsQuery = query(collection(db, "admins"));
    const adminsSnapshot = await getDocs(adminsQuery);
    const adminsData = adminsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Admin[];
    setAdmins(adminsData);
    return adminsData;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
};

const fetchDocuments = async () => {
  try {
    const docsQuery = query(collection(db, "documents"));
    const docsSnapshot = await getDocs(docsQuery);
    const docsData = docsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt instanceof Timestamp
        ? doc.data().uploadedAt
        : Timestamp.fromDate(new Date(doc.data().uploadedAt)),
    })) as Document[];
    setDocuments(docsData);
    return docsData;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

const fetchVehicles = async () => {
  try {
    const vehiclesData: (Vehicle & {
      memberId: string;
      memberName: string;
      memberUnit: string;
    })[] = [];

    const membersQuery = query(collection(db, "members"));
    const membersSnapshot = await getDocs(membersQuery);
    const membersData = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];

    for (const member of membersData) {
      try {
        const vehiclesSnapshot = await getDocs(
          collection(db, "members", member.id, "vehicles")
        );

        vehiclesSnapshot.forEach((doc) => {
          const vehicleData = doc.data();
          vehiclesData.push({
            id: doc.id,
            memberId: member.id,
            memberName: member.name,
            memberUnit: member.unitNumber,
            ...vehicleData,
            startDate: vehicleData.startDate instanceof Timestamp
              ? vehicleData.startDate
              : Timestamp.fromDate(new Date(vehicleData.startDate)),
            endDate: vehicleData.endDate instanceof Timestamp
              ? vehicleData.endDate
              : vehicleData.endDate
              ? Timestamp.fromDate(new Date(vehicleData.endDate))
              : undefined,
          } as Vehicle & { memberId: string; memberName: string; memberUnit: string });
        });
      } catch (error) {
        console.error(`Error fetching vehicles for member ${member.id}:`, error);
      }
    }

    setVehicles(vehiclesData);
    return vehiclesData;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
};

const fetchServiceProviders = async () => {
  try {
    const providersQuery = query(collection(db, "serviceProviders"));
    const providersSnapshot = await getDocs(providersQuery);
    const providersData = providersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      joiningDate: doc.data().joiningDate instanceof Timestamp
        ? doc.data().joiningDate
        : Timestamp.fromDate(new Date(doc.data().joiningDate)),
    })) as ServiceProvider[];

    setServiceProviders(providersData);
    
    // Update stats
    const activeProviders = providersData.filter((p) => p.isActive).length;
    setStats((prev) => ({
      ...prev,
      totalServiceProviders: providersData.length,
      activeServiceProviders: activeProviders,
    }));

    return providersData;
  } catch (error) {
    console.error("Error fetching service providers:", error);
    return [];
  }
};

const fetchComplaints = async () => {
  try {
    const complaintsQuery = query(collection(db, "complaints"));
    const complaintsSnapshot = await getDocs(complaintsQuery);
    const complaintsData: Complaint[] = [];

    for (const complaintDoc of complaintsSnapshot.docs) {
      const complaintData = complaintDoc.data();
      const memberId = complaintDoc.id;

      let memberName = "Unknown Member";
      let unitNumber = "Unknown Unit";

      try {
        const memberDocRef = doc(db, "members", memberId);
        const memberDoc = await getDoc(memberDocRef);

        if (memberDoc.exists()) {
          const member = memberDoc.data() as Member;
          memberName = member.name || "Unknown Member";
          unitNumber = member.unitNumber || "Unknown Unit";
        }
      } catch (error) {
        console.error("Error fetching member details:", error);
      }

      Object.keys(complaintData).forEach((complaintId) => {
        if (complaintId !== "id" && complaintData[complaintId]) {
          const complaint = complaintData[complaintId];
          complaintsData.push({
            id: complaintId,
            memberId,
            memberName,
            unitNumber,
            type: complaint.type,
            title: complaint.title,
            description: complaint.description,
            status: complaint.status,
            createdAt: complaint.createdAt,
            updatedAt: complaint.updatedAt || complaint.createdAt,
          } as Complaint);
        }
      });
    }

    setComplaints(complaintsData);
    return complaintsData;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return [];
  }
};

const fetchDeletionRequests = async () => {
  try {
    const requestsQuery = query(collection(db, "deletionRequests"));
    const requestsSnapshot = await getDocs(requestsQuery);
    const requestsData = requestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
      reviewedAt: doc.data().reviewedAt,
    })) as DeletionRequest[];
    setDeletionRequests(requestsData);
    return requestsData;
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    return [];
  }
};

const fetchMemberDetails = async (memberId: string): Promise<MemberDetails> => {
  try {
    const memberDoc = await getDoc(doc(db, "members", memberId));
    if (!memberDoc.exists()) {
      throw new Error("Member not found");
    }

    const memberData = memberDoc.data() as Member;

    // Fetch family members from subcollection
    const familyMembersSnapshot = await getDocs(
      collection(db, "members", memberId, "familyMembers")
    );
    const familyMembers: FamilyMember[] = [];
    familyMembersSnapshot.forEach((doc) => {
      familyMembers.push({ id: doc.id, ...doc.data() } as FamilyMember);
    });

    // Fetch vehicles from subcollection
    const vehiclesSnapshot = await getDocs(
      collection(db, "members", memberId, "vehicles")
    );
    const vehicles: Vehicle[] = [];
    vehiclesSnapshot.forEach((doc) => {
      vehicles.push({ id: doc.id, ...doc.data() } as Vehicle);
    });

    return {
      ...memberData,
      id: memberId,
      familyMembers,
      vehicles,
    };
  } catch (error) {
    console.error("Error fetching member details:", error);
    throw error;
  }
};

const updateStats = () => {

  const pendingTestimonials = testimonials.filter((t) => !t.approved).length;
  const newQueries = queries.filter((q) => q.status === "new").length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending").length;
  
  // Calculate total unread messages across all complaints
  const totalUnread = Object.values(unreadMessageCounts).reduce(
    (sum, count) => sum + count, 0
  );

  setStats({
    totalTestimonials: testimonials.length,
    pendingTestimonials,
    totalFAQs: faqs.length,
    newQueries,
    totalMembers: members.length,
    pendingPayments,
    pendingComplaints,
    totalServiceProviders: serviceProviders.length,
    activeServiceProviders: serviceProviders.filter((p) => p.isActive).length,
    unreadMessages: totalUnread, 
  });
};

// ==============================
// DATA MANIPULATION FUNCTIONS
// ==============================
  
// Testimonial Functions
  const handleApproveTestimonial = async (id: string) => {
    try {
      await updateDoc(doc(db, "testimonials", id), {
        approved: true,
        updatedAt: serverTimestamp(),
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error approving testimonial:", error);
    }
  };

  const handleDeleteTestimonial = (id: string) => {
    const testimonial = testimonials.find((t) => t.id === id);
    initiateDeletion(
      "testimonial",
      id,
      `Testimonial by ${testimonial?.name || "Unknown"}`
    );
  };

// FAQ Functions
 const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingFAQ(true);

    try {
      await addDoc(collection(db, "faqs"), {
        question: newFAQ.question,
        answer: newFAQ.answer,
        createdAt: serverTimestamp(),
      });

      setNewFAQ({
        question: "",
        answer: "",
      });

      fetchData();
      setShowFAQPopup(false);
      alert("FAQ added successfully!");
    } catch (error) {
      console.error("Error adding FAQ:", error);
      alert("Failed to add FAQ. Please try again.");
    } finally {
      setIsAddingFAQ(false);
    }
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowFAQPopup(true);
  };

  const handleUpdateFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFAQ) return;

    try {
      await updateDoc(doc(db, "faqs", editingFAQ.id), {
        question: editingFAQ.question,
        answer: editingFAQ.answer,
        updatedAt: serverTimestamp(),
      });

      setEditingFAQ(null);
      setShowFAQPopup(false); 
      alert("FAQ updated successfully!");
    } catch (error) {
      console.error("Error updating FAQ:", error);
      alert("Failed to update FAQ. Please try again.");
    }
  };

  const handleDeleteFAQ = (id: string) => {
    const faq = faqs.find((f) => f.id === id);
    initiateDeletion(
      "faq",
      id,
      `FAQ: ${faq?.question?.substring(0, 50) || "Unknown"}...`
    );
  };

 // Query Functions
  const handleUpdateQueryStatus = async (id: string, status: string) => {
      try {
        await updateDoc(doc(db, "queries", id), {
          status,
          updatedAt: serverTimestamp(),
        });
        fetchData();
      } catch (error) {
        console.error("Error updating query status:", error);
      }
    };

  const handleReplyToQuery = (email: string, name: string) => {
    const subject = `Re: Your query for Yesh Krupa Society`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}`;
  };

  const handleDeleteQuery = (id: string) => {
    const queryItem = queries.find((q) => q.id === id);
    initiateDeletion(
      "query",
      id,
      `Query: ${queryItem?.name || "Unknown"} - ${
        queryItem?.query?.substring(0, 50) || "Unknown"
      }...`
    );
  };

 // Member Functions
  const handleAddMember = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAddingMember(true);

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newMember.email,
          "TempPassword123"
        );

        const user = userCredential.user;

        await updateProfile(user, {
          displayName: newMember.name,
        });

        await setDoc(doc(db, "members", user.uid), {
          id: user.uid,
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          unitNumber: newMember.unitNumber,
          memberSince: newMember.memberSince,
          createdAt: serverTimestamp(),
        });

        setNewMember({
          name: "",
          email: "",
          phone: "",
          unitNumber: "",
          memberSince: "",
        });

        setShowMemberPopup(false);

        fetchData();

        alert("Member added successfully! Temporary password: TempPassword123");
      } catch (error: any) {
        console.error("Error adding member:", error);

        if (error.code === "auth/email-already-in-use") {
          alert(
            "This email is already registered. Please use a different email."
          );
        } else {
          alert("Failed to add member. Please try again.");
        }
      } finally {
        setIsAddingMember(false);
      }
    };

  const handleDeleteMember = (id: string) => {
    const member = members.find((m) => m.id === id);
    initiateDeletion("member", id, `Member: ${member?.name || "Unknown"}`);
  };

  const handleMemberRowClick = async (memberId: string) => {
    try {
      setLoading(true);
      const details = await fetchMemberDetails(memberId);
      setSelectedMember(details);
      setShowMemberDetails(true);
    } catch (error) {
      console.error("Error loading member details:", error);
      alert("Failed to load member details");
    } finally {
      setLoading(false);
    }
  };

// Payment Functions
  const handleAddPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAddingPayment(true);

      try {
        // Get member document using UID
        const memberDoc = await getDoc(doc(db, "members", newPayment.memberId));
        if (!memberDoc.exists()) {
          alert("Member not found!");
          return;
        }

        const memberData = memberDoc.data();

        const transactionId = generateTransactionId();

        const paymentDocRef = doc(db, "payments", newPayment.memberId);
        const paymentDoc = await getDoc(paymentDocRef);

        if (paymentDoc.exists()) {
          await updateDoc(paymentDocRef, {
            [transactionId]: {
              amount: parseFloat(newPayment.amount),
              dueDate: Timestamp.fromDate(new Date(newPayment.dueDate)),
              type: newPayment.type,
              status: newPayment.status,
              memberId: newPayment.memberId,
              memberName: memberData.name,
              createdAt: serverTimestamp(),
              ...(newPayment.status === "paid" && {
                paidDate: serverTimestamp(),
              }),
            },
          });
        } else {
          await setDoc(paymentDocRef, {
            [transactionId]: {
              amount: parseFloat(newPayment.amount),
              dueDate: Timestamp.fromDate(new Date(newPayment.dueDate)),
              type: newPayment.type,
              status: newPayment.status,
              memberId: newPayment.memberId,
              memberName: memberData.name,
              createdAt: serverTimestamp(),
              ...(newPayment.status === "paid" && {
                paidDate: serverTimestamp(),
              }),
            },
          });
        }

        setNewPayment({
          memberId: "",
          amount: "",
          dueDate: "",
          type: "Maintenance",
          status: "pending",
        });

        setMemberSearchTerm("");
        setShowMemberDropdown(false);

        fetchData();

        setShowAddPaymentPopup(false);

        alert(`Payment added successfully! Transaction ID: ${transactionId}`);
      } catch (error) {
        console.error("Error adding payment:", error);
        alert("Failed to add payment. Please try again.");
      } finally {
        setIsAddingPayment(false);
      }
    };

  const handleUpdatePaymentStatus = async (
    memberId: string,
    transactionId: string,
    status: string
  ) => {
    try {
      const paymentDocRef = doc(db, "payments", memberId);

      await updateDoc(paymentDocRef, {
        [`${transactionId}.status`]: status,
        [`${transactionId}.updatedAt`]: serverTimestamp(),
        ...(status === "paid" && {
          [`${transactionId}.paidDate`]: serverTimestamp(),
        }),
      });

      fetchData();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };
  
  const handleDeletePayment = (memberId: string, transactionId: string) => {
    const member = members.find((m) => m.id === memberId);
    initiateDeletion(
      "payment",
      `${memberId}_${transactionId}`,
      `Payment for ${member?.name || "Unknown Member"}`
    );
  };

  // Complaint Functions
  const handleStatusChange = async (
      memberId: string,
      complaintId: string,
      status: string
    ) => {
      try {
        const complaintDocRef = doc(db, "complaints", memberId);
        const updatedAt = serverTimestamp();

        await updateDoc(complaintDocRef, {
          [`${complaintId}.status`]: status,
          [`${complaintId}.updatedAt`]: updatedAt,
        });

        const currentTimestamp = Timestamp.now();

        setComplaints((prevComplaints) =>
          prevComplaints.map((complaint) =>
            complaint.id === complaintId && complaint.memberId === memberId
              ? {
                  ...complaint,
                  status: status,
                  updatedAt: currentTimestamp,
                }
              : complaint
          )
        );

        if (status === "pending") {
          setStats((prev) => ({
            ...prev,
            pendingComplaints: prev.pendingComplaints + 1,
          }));
        } else {
          setStats((prev) => ({
            ...prev,
            pendingComplaints: Math.max(0, prev.pendingComplaints - 1),
          }));
        }

        alert(`Complaint status updated to ${status} successfully!`);
      } catch (error) {
        console.error("Error updating complaint status:", error);
        alert("Failed to update complaint status. Please try again.");
      }
    };
  
  const handleApproveComplaint = async (
    memberId: string,
    complaintId: string
  ) => {
    try {
      const complaintRef = doc(db, "complaints", memberId);
      const updatedAt = serverTimestamp();

      await updateDoc(complaintRef, {
        [`${complaintId}.status`]: "in-progress",
        [`${complaintId}.updatedAt`]: updatedAt,
      });

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint.id === complaintId && complaint.memberId === memberId
            ? {
                ...complaint,
                status: "in-progress",
                updatedAt: Timestamp.now(),
              }
            : complaint
        )
      );

      setStats((prev) => ({
        ...prev,
        pendingComplaints: Math.max(0, prev.pendingComplaints - 1),
      }));

      alert("Complaint approved and marked as in progress!");
    } catch (error) {
      console.error("Error approving complaint:", error);
      alert("Failed to approve complaint. Please try again.");
    }
  };
  
  const handleDeleteComplaint = (memberId: string, complaintId: string) => {
    const complaint = complaints.find(
      (c) => c.id === complaintId && c.memberId === memberId
    );
    initiateDeletion(
      "complaint",
      `${memberId}_${complaintId}`,
      `Complaint: ${complaint?.title || "Unknown Complaint"} by ${
        complaint?.memberName || "Unknown Member"
      }`
    );
  };
  
 const handleUploadFile = async (memberId: string, complaintId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      try {
        const complaintRef = doc(db, "complaints", memberId);

        for (const file of Array.from(files)) {
          const fileUrl = "https://example.com/file.pdf";

          const newFile = {
            id: `${Date.now()}_${file.name}`,
            name: file.name,
            url: fileUrl,
            uploadedAt: Timestamp.now(),
            uploadedBy: adminDetails?.name || "Admin",
          };

          await updateDoc(complaintRef, {
            [`${complaintId}.files`]: arrayUnion(newFile),
          });
        }

        alert("Files uploaded successfully!");
        fetchComplaints();
      } catch (error) {
        console.error("Error uploading files:", error);
        alert("Failed to upload files. Please try again.");
      }
    };

    input.click();
  };

  // Vehicle Functions
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newVehicleFiles.length > 0) {
      console.log(
        "Dummy uploading files:",
        newVehicleFiles.map((f) => f.name)
      );
    }

    try {
      if (!selectedVehicleMember) {
        alert("Please select a member first");
        return;
      }

      const vehicleData = {
        type: newVehicle.type,
        model: newVehicle.model,
        numberPlate: newVehicle.numberPlate,
        parking: newVehicle.parking,
        startDate: Timestamp.fromDate(new Date(newVehicle.startDate)),
        endDate: newVehicle.endDate
          ? Timestamp.fromDate(new Date(newVehicle.endDate))
          : null,
        isCurrent: newVehicle.isCurrent,
        createdAt: serverTimestamp(),
        rcBookNumber: "",
      };

      await addDoc(
        collection(db, "members", selectedVehicleMember.id, "vehicles"),
        vehicleData
      );

      fetchVehicles();
      setNewVehicle({
        type: "Car",
        model: "",
        numberPlate: "",
        parking: false,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isCurrent: true,
        rcBookNumber: "",
      });

      setNewVehicleFiles([]);

      setShowAddVehiclePopup(false);
      setSelectedVehicleMember(null);

      alert("Vehicle added successfully!");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("Failed to add vehicle. Please try again.");
    }
  };
  
  const handleUpdateVehicleStatus = async (
    memberId: string,
    vehicleId: string,
    isCurrent: boolean,
    endDate?: string
  ) => {
    try {
      const vehicleRef = doc(db, "members", memberId, "vehicles", vehicleId);

      const updateData: any = {
        isCurrent,
        updatedAt: serverTimestamp(),
      };

      if (isCurrent) {
        // If marked current again, remove endDate
        updateData.endDate = deleteField();
      } else if (endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(endDate));
      } else {
        updateData.endDate = serverTimestamp();
      }

      await updateDoc(vehicleRef, updateData);

      fetchVehicles();

      alert("Vehicle status updated successfully!");
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      alert("Failed to update vehicle status. Please try again.");
    }
  };

  const handleDeleteVehicle = async (memberId: string, vehicleId: string) => {
    try {
      // Fetch the specific vehicle data
      const vehicleDoc = await getDoc(
        doc(db, "members", memberId, "vehicles", vehicleId)
      );

      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data();
        const member = members.find((m) => m.id === memberId);

        initiateDeletion(
          "vehicle",
          `${memberId}_${vehicleId}`,
          `Vehicle: ${vehicleData.vehicleNumber || "Unknown Vehicle"} for ${
            member?.name || "Unknown Member"
          }`
        );
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
    }
  };
  
  // Service Provider Functions
  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingProvider(true);

    try {
      const providerData = {
        ...newProvider,
        monthlySalary: parseFloat(newProvider.monthlySalary),
        joiningDate: Timestamp.fromDate(new Date(newProvider.joiningDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "serviceProviders"), providerData);

      setNewProvider({
        name: "",
        role: "Watchman",
        phone: "",
        email: "",
        address: "",
        monthlySalary: "",
        joiningDate: new Date().toISOString().split("T")[0],
        isActive: true,
        documents: {
          aadhaar: "",
          pan: "",
          contract: "",
        },
      });

      setShowAddProviderPopup(false);
      fetchServiceProviders();

      alert("Service provider added successfully!");
    } catch (error) {
      console.error("Error adding service provider:", error);
      alert("Failed to add service provider. Please try again.");
    } finally {
      setIsAddingProvider(false);
    }
  };

  const handleEditProvider = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setNewProvider({
      name: provider.name,
      role: provider.role,
      phone: provider.phone,
      email: provider.email || "",
      address: provider.address || "",
      monthlySalary: provider.monthlySalary.toString(),
      joiningDate: provider.joiningDate.toDate().toISOString().split("T")[0],
      isActive: provider.isActive,
      documents: {
        aadhaar: provider.documents?.aadhaar ?? "",
        pan: provider.documents?.pan ?? "",
        contract: provider.documents?.contract ?? "",
      },
    });
    setShowAddProviderPopup(true);
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    setIsEditingProvider(true);

    try {
      const providerData = {
        ...newProvider,
        monthlySalary: parseFloat(newProvider.monthlySalary),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(
        doc(db, "serviceProviders", editingProvider.id),
        providerData
      );

      setEditingProvider(null);
      setShowAddProviderPopup(false);
      fetchServiceProviders();

      alert("Service provider updated successfully!");
    } catch (error) {
      console.error("Error updating service provider:", error);
      alert("Failed to update service provider. Please try again.");
    } finally {
      setIsEditingProvider(false);
    }
  };

  const handleDeleteProvider = (id: string) => {
    const provider = serviceProviders.find((p) => p.id === id);
    initiateDeletion(
      "serviceProvider",
      id,
      `Service Provider: ${provider?.name || "Unknown"}`
    );
  };

  const handleToggleProviderStatus = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "serviceProviders", id), {
        isActive: !isActive,
        updatedAt: serverTimestamp(),
      });
      fetchServiceProviders();
      alert(
        `Service provider ${
          !isActive ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      console.error("Error toggling service provider status:", error);
      alert("Failed to update service provider status. Please try again.");
    }
  };
  
  // Document Functions
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDocument.file) {
      alert("Please select a file");
      return;
    }

    try {
      const fileUrl = "https://example.com/file.pdf";

      await addDoc(collection(db, "documents"), {
        title: newDocument.title,
        description: newDocument.description,
        fileUrl,
        fileName: newDocument.file.name,
        fileType: newDocument.file.type,
        fileSize: newDocument.file.size,
        isPublic: newDocument.isPublic,
        uploadedBy: adminDetails?.name || "Admin",
        uploadedAt: serverTimestamp(),
        category: newDocument.category,
      });

      setNewDocument({
        title: "",
        description: "",
        file: null,
        category: "document",
        isPublic: false,
      });
      setShowAddDocumentModal(false);
      fetchDocuments();

      alert("Document uploaded successfully!");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    }
  };

  const toggleDocumentVisibility = async (docId: string, isPublic: boolean) => {
    try {
      await updateDoc(doc(db, "documents", docId), {
        isPublic: !isPublic,
      });
      fetchDocuments();
      alert(
        `Document visibility ${!isPublic ? "made public" : "set to private"}!`
      );
    } catch (error) {
      console.error("Error updating document visibility:", error);
      alert("Failed to update document visibility");
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const document = documents.find((d) => d.id === docId);
    initiateDeletion(
      "document",
      docId,
      `Document: ${document?.title || "Unknown"}`
    );
  };
  
  // Committee Member Functions
  const handleAddCommitteeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCommittee(true);

    try {
      await addDoc(collection(db, "committee"), {
        name: newCommitteeMember.name,
        email: newCommitteeMember.email,
        phone: newCommitteeMember.phone,
        position: newCommitteeMember.position,
        description: newCommitteeMember.description,
        createdAt: serverTimestamp(),
      });

      setNewCommitteeMember({
        name: "",
        email: "",
        phone: "",
        position: "",
        description: "",
      });

      setShowAddCommitteePopup(false);
      fetchCommitteeMembers();

      alert("Committee member added successfully!");
    } catch (error) {
      console.error("Error adding committee member:", error);
      alert("Failed to add committee member. Please try again.");
    } finally {
      setIsAddingCommittee(false);
    }
  };

  const handleEditCommitteeMember = (member: CommitteeMember) => {
    setEditingCommitteeMember(member);
    setNewCommitteeMember({
      name: member.name,
      email: member.email,
      phone: member.phone,
      position: member.position,
      description: member.description,
    });
    setShowAddCommitteePopup(true);
  };

  const handleUpdateCommitteeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitteeMember) return;

    setIsEditingCommittee(true);

    try {
      await updateDoc(doc(db, "committee", editingCommitteeMember.id), {
        name: newCommitteeMember.name,
        email: newCommitteeMember.email,
        phone: newCommitteeMember.phone,
        position: newCommitteeMember.position,
        description: newCommitteeMember.description,
        updatedAt: serverTimestamp(),
      });

      setEditingCommitteeMember(null);
      setShowAddCommitteePopup(false);
      fetchCommitteeMembers();

      alert("Committee member updated successfully!");
    } catch (error) {
      console.error("Error updating committee member:", error);
      alert("Failed to update committee member. Please try again.");
    } finally {
      setIsEditingCommittee(false);
    }
  };

  const handleDeleteCommitteeMember = (id: string) => {
    const member = committeeMembers.find((m) => m.id === id);
    initiateDeletion(
      "committee",
      id,
      `Committee Member: ${member?.name || "Unknown"}`
    );
  };
  
  // Admin Functions
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAdmin(true);

    try {
      // First create the auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newAdmin.email,
        "TempPassword123"
      );

      const user = userCredential.user;

      await setDoc(doc(db, "admins", user.uid), {
        id: user.uid,
        name: newAdmin.name,
        email: newAdmin.email,
        position: newAdmin.position,
        createdAt: serverTimestamp(),
        adminPosition: newAdmin.adminPosition,
      });

      setNewAdmin({
        name: "",
        email: "",
        position: "",
        //password: "",
        adminPosition: "",
      });

      setShowAddAdminPopup(false);
      fetchAdmins();

      alert("Admin added successfully!");
    } catch (error: any) {
      console.error("Error adding admin:", error);

      if (error.code === "auth/email-already-in-use") {
        alert(
          "This email is already registered. Please use a different email."
        );
      } else {
        alert("Failed to add admin. Please try again.");
      }
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setNewAdmin({
      name: admin.name,
      email: admin.email,
      position: admin.position,
      //password: "",
      adminPosition: admin.adminPosition,
    });
    setShowAddAdminPopup(true);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setIsEditingAdmin(true);

    try {
      await updateDoc(doc(db, "admins", editingAdmin.id), {
        name: newAdmin.name,
        email: newAdmin.email,
        position: newAdmin.position,
        updatedAt: serverTimestamp(),
        adminPosition: newAdmin.adminPosition,
      });

      setEditingAdmin(null);
      setShowAddAdminPopup(false);
      fetchAdmins();

      alert("Admin updated successfully!");
    } catch (error) {
      console.error("Error updating admin:", error);
      alert("Failed to update admin. Please try again.");
    } finally {
      setIsEditingAdmin(false);
    }
  };

  const handleDeleteAdmin = (id: string) => {
    const admin = admins.find((a) => a.id === id);
    initiateDeletion("admin", id, `Admin: ${admin?.name || "Unknown"}`);
  };
  
  // Suggestion Functions
  const handleUpdateSuggestionStatus = async (
    suggestionId: string,
    status: Suggestion["status"],
    comment?: string
  ) => {
    try {
      const suggestionRef = doc(db, "suggestions", suggestionId);

      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (comment) {
        const commentData = {
          id: generateRandomId(),
          userId: user.uid,
          userName: adminDetails?.name || "Admin",
          userType: "admin",
          comment: comment,
          timestamp: Timestamp.now(),
          statusChange: status,
        };

        await updateDoc(suggestionRef, {
          ...updateData,
          comments: arrayUnion(commentData),
        });
      } else {
        await updateDoc(suggestionRef, updateData);
      }

      fetchSuggestions();
      setShowSuggestionModal(false);
      setSuggestionComment("");

      alert(`Suggestion status updated to ${status}`);
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      alert("Failed to update suggestion status");
    }
  };

  const handleDeleteSuggestion = (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    initiateDeletion(
      "suggestion",
      id,
      `Suggestion: ${suggestion?.title || "Unknown"} by ${
        suggestion?.userName || "Unknown Member"
      }`
    );
  };
  
  // Redevelopment Form Functions
  const handleUpdateFormStatus = async (
    formId: string,
    status: "pending" | "reviewed" | "approved" | "rejected"
  ) => {
    try {
      if (!formNotes.trim()) {
        alert("Please add a comment before updating the status");
        return;
      }

      await addDoc(collection(db, "redevelopmentForms", formId, "comments"), {
        userId: user.uid,
        userName: adminDetails?.name || "Admin",
        userType: "admin",
        comment: formNotes,
        timestamp: serverTimestamp(),
        statusChange: status,
      });

      await updateDoc(doc(db, "redevelopmentForms", formId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminDetails?.name || "Admin",
      });

      fetchRedevelopmentForms();
      setShowFormModal(false);
      setFormNotes("");
      alert(`Form status updated to ${status}`);
    } catch (error) {
      console.error("Error updating form status:", error);
      alert("Failed to update form status");
    }
  };

  const handleExportForms = async () => {
    setExportLoading(true);
    try {
      const headers = [
        "Name",
        "Unit",
        "Phone",
        "Email",
        "Status",
        "Submitted Date",
        "Alternate Address",
        "Vacate Date",
      ];
      const csvContent = [
        headers.join(","),
        ...redevelopmentForms.map((form) =>
          [
            `"${form.name}"`,
            `"${form.userUnit}"`,
            `"${form.phone}"`,
            `"${form.email}"`,
            `"${form.status}"`,
            `"${formatDateTime(form.submittedAt)}"`,
            `"${form.alternateAddress || "N/A"}"`,
            `"${form.vacateDate || "N/A"}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `redevelopment_forms_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Forms exported successfully!");
    } catch (error) {
      console.error("Error exporting forms:", error);
      alert("Failed to export forms");
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewForm = async (form: RedevelopmentForm) => {
    setSelectedForm(form);
    setShowFormModal(true);
    setFormNotes("");

    try {
      const commentsQuery = query(
        collection(db, "redevelopmentForms", form.id, "comments"),
        orderBy("timestamp", "desc")
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsData = commentsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Comment)
      );

      setSelectedForm((prevForm) =>
        prevForm ? { ...prevForm, comments: commentsData } : null
      );
    } catch (error) {
      console.error("Error fetching form comments:", error);
      alert("Could not load form comments.");
    }
  };

  const redevelopmentStats = {
    total: redevelopmentForms.length,
    pending: redevelopmentForms.filter((form) => form.status === "pending")
      .length,
    reviewed: redevelopmentForms.filter((form) => form.status === "reviewed")
      .length,
    approved: redevelopmentForms.filter((form) => form.status === "approved")
      .length,
    rejected: redevelopmentForms.filter((form) => form.status === "rejected")
      .length,
  };
  
  // Deletion Request Functions
  const createDeletionRequest = async (
    itemType: string,
    itemId: string,
    itemName: string,
    reason: string
  ) => {
    try {
      await addDoc(collection(db, "deletionRequests"), {
        adminId: user.uid,
        adminName: adminDetails?.name,
        adminEmail: adminDetails?.email,
        itemType,
        itemId,
        itemName,
        reason: reason || "No reason provided",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Deletion request submitted for Super Admin approval.");
    } catch (error) {
      console.error("Error creating deletion request:", error);
      alert("Failed to submit deletion request. Please try again.");
    }
  };

 const submitDeletionRequest = () => {
    if (!pendingDeletion || !deleteReason.trim()) {
      alert("Please provide a reason for deletion.");
      return;
    }

    createDeletionRequest(
      pendingDeletion.itemType,
      pendingDeletion.itemId,
      pendingDeletion.itemName,
      deleteReason.trim()
    );

    setShowDeleteReasonModal(false);
    setDeleteReason("");
    setPendingDeletion(null);
  };

 const handleDeletionRequest = async (requestId: string, approve: boolean) => {
    try {
      const requestRef = doc(db, "deletionRequests", requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data() as DeletionRequest;

      if (approve) {
        switch (requestData.itemType) {
          case "member":
            await deleteDoc(doc(db, "members", requestData.itemId));
            break;
          case "testimonial":
            await deleteDoc(doc(db, "testimonials", requestData.itemId));
            break;
          case "faq":
            await deleteDoc(doc(db, "faqs", requestData.itemId));
            break;
          case "payment":
          const [memberId, transactionId] = requestId.split("_");
          const paymentRef = doc(db, "payments", memberId);

          const paymentDoc = await getDoc(paymentRef);

          if (paymentDoc.exists()) {
            const paymentData = paymentDoc.data();

            if (paymentData && paymentData[transactionId]) {
              const updatedData = { ...paymentData };
              delete updatedData[transactionId];

              await setDoc(paymentRef, updatedData);
            }
          }
          break;
          case "vehicle":
          const [mId, vehicleId] = requestId.split("_");

          await deleteDoc(doc(db, "members", mId, "vehicles", vehicleId));
          break;
          case "committee":
            await deleteDoc(doc(db, "committee", requestData.itemId));
            break;
          case "admin":
            await deleteDoc(doc(db, "admins", requestData.itemId));
            break;
          case "serviceProvider":
            await deleteDoc(doc(db, "serviceProviders", requestData.itemId));
            break;
          case "document":
            await deleteDoc(doc(db, "documents", requestData.itemId));
            break;
        }
      }

      await updateDoc(requestRef, {
        status: approve ? "approved" : "rejected",
        reviewedBy: adminDetails?.name,
        reviewedAt: serverTimestamp(),
      });

      fetchDeletionRequests();
      fetchData(); 

      alert(
        `Deletion request ${approve ? "approved" : "rejected"} successfully!`
      );
    } catch (error) {
      console.error("Error handling deletion request:", error);
      alert("Failed to process deletion request. Please try again.");
    }
  };

// Deletion approval Functions
  const initiateDeletion = (
    itemType: string,
    itemId: string,
    itemName: string
  ) => {
    if (isSuperAdmin) {
      if (confirm(`Are you sure you want to delete ${itemName}?`)) {
        handleDirectDeletion(itemType, itemId);
      }
    } else {
      setPendingDeletion({ itemType, itemId, itemName });
      setShowDeleteReasonModal(true);
    }
  };

 const handleDirectDeletion = async (itemType: string, itemId: string) => {
    try {
      switch (itemType) {
        case "testimonial":
          await deleteDoc(doc(db, "testimonials", itemId));
          break;
        case "faq":
          await deleteDoc(doc(db, "faqs", itemId));
          break;
        case "member":
          await deleteDoc(doc(db, "members", itemId));
          break;
        case "payment":
          const [memberId, transactionId] = itemId.split("_");
          const paymentRef = doc(db, "payments", memberId);

          const paymentDoc = await getDoc(paymentRef);

          if (paymentDoc.exists()) {
            const paymentData = paymentDoc.data();

            if (paymentData && paymentData[transactionId]) {
              const updatedData = { ...paymentData };
              delete updatedData[transactionId];

              await setDoc(paymentRef, updatedData);
            }
          }
          break;
        case "vehicle":
          const [mId, vehicleId] = itemId.split("_");

          await deleteDoc(doc(db, "members", mId, "vehicles", vehicleId));
          break;
        case "complaint":
          const [memId, complaintId] = itemId.split("_");
          const complaintRef = doc(db, "complaints", memId);
          const complaintDoc = await getDoc(complaintRef);

          if (complaintDoc.exists()) {
            const complaintData = complaintDoc.data();
            if (complaintData && complaintData[complaintId]) {
              const updatedData = { ...complaintData };
              delete updatedData[complaintId];
              await setDoc(complaintRef, updatedData);
            }
          }
          break;
        case "query":
          await deleteDoc(doc(db, "queries", itemId));
          break;
        case "committee":
          await deleteDoc(doc(db, "committee", itemId));
          break;
        case "admin":
          await deleteDoc(doc(db, "admins", itemId));
          break;
        case "serviceProvider":
          await deleteDoc(doc(db, "serviceProviders", itemId));
          break;
        case "document":
          await deleteDoc(doc(db, "documents", itemId));
          break;
        case "suggestion":
  await deleteDoc(doc(db, "suggestions", itemId));
  break;
        default:
          console.error("Unknown item type for deletion:", itemType);
          return;
      }

      fetchData();
      alert("Item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  }; 

  // Chat Functions

// ==============================
// UNREAD MESSAGES FUNCTIONALITY
// ==============================

// Add this useEffect to calculate unread messages when complaints or user changes
useEffect(() => {
  const calculateUnreadMessages = async () => {
    if (!user || complaints.length === 0) return;
    
    const newUnreadCounts: { [key: string]: number } = {};
    
    for (const complaint of complaints) {
      try {
        const chatRef = collection(db, "complaintChats", complaint.id, "messages");
        const q = query(
          chatRef, 
          where("sender", "==", "member"),
          orderBy("timestamp", "asc")
        );
        
        const snapshot = await getDocs(q);
        const unreadMessages = snapshot.docs.filter(doc => {
          const messageData = doc.data() as ChatMessage;
          // Count messages from members that haven't been read by current admin
          return messageData.sender === "member" && 
                 (!messageData.readBy || !messageData.readBy.includes(user.uid));
        });
        
        newUnreadCounts[complaint.id] = unreadMessages.length;
      } catch (error) {
        console.error(`Error loading unread counts for complaint ${complaint.id}:`, error);
        newUnreadCounts[complaint.id] = 0;
      }
    }
    
    setUnreadMessageCounts(newUnreadCounts);
  };

  calculateUnreadMessages();
}, [complaints, user]);

// Add real-time listener for new messages
useEffect(() => {
  if (!user || complaints.length === 0) return;

  const unsubscribeListeners: (() => void)[] = [];

  complaints.forEach(complaint => {
    const chatRef = collection(db, "complaintChats", complaint.id, "messages");
    const q = query(
      chatRef,
      where("sender", "==", "member"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() } as ChatMessage));

      if (newMessages.length > 0) {
        setUnreadMessageCounts(prev => ({
          ...prev,
          [complaint.id]: (prev[complaint.id] || 0) + newMessages.length
        }));
      }
    });

    unsubscribeListeners.push(unsubscribe);
  });

  return () => {
    unsubscribeListeners.forEach(unsubscribe => unsubscribe());
  };
}, [complaints, user]);

  const handleOpenChat = async (complaintId: string, memberId: string) => {
    setSelectedComplaintChat(complaintId);
    setShowChatModal(true);

    await markMessagesAsRead(complaintId);

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

      const messageData = {
        sender: "admin",
        senderId: user.uid,
        senderName: adminDetails.name,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        readBy: [user.uid],
      };

      await addDoc(chatRef, messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    }
  };
  
  const markMessagesAsRead = async (complaintId: string) => {
    if (!user) return;

    try {
      const chatRef = collection(db, "complaintChats", complaintId, "messages");
      const q = query(
        chatRef, 
        where("sender", "==", "member"),
        where("readBy", "not-in", [[user.uid]])
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        const messageRef = doc.ref;
        batch.update(messageRef, {
          readBy: arrayUnion(user.uid),
        });
      });

      await batch.commit();

      // Update the unread count to zero for this complaint
      setUnreadMessageCounts(prev => ({
        ...prev,
        [complaintId]: 0,
      }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Contact Form Functions
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

  // Authentication Functions
 const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

// ==============================
// USE EFFECT HOOKS
// ==============================
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, "admins", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setIsAdmin(true);
          setAdminDetails(docSnap.data());
          fetchData();
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDeletionRequests();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let filtered = payments;
    
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === paymentStatusFilter);
    }
    
    if (paymentTypeFilter !== "all") {
      filtered = filtered.filter((payment) => payment.type === paymentTypeFilter);
    }
    
    setFilteredPayments(filtered);
  }, [payments, paymentStatusFilter, paymentTypeFilter]);

// ==============================
// FILTERED DATA CALCULATIONS
// ==============================

  const extractWingAndFlat = (unitNumber: string) => {
    if (!unitNumber) return { wing: "", flatNumber: "" };
    const wing = unitNumber.charAt(0);
    const flatNumber = unitNumber.substring(1);
    return { wing, flatNumber };
  };

const filteredMembers = members.filter((member) => {
    const { wing, flatNumber } = extractWingAndFlat(member.unitNumber);
    const matchesSearch = member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      member.unitNumber.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchTerm.toLowerCase());
    const matchesWing = wingFilter === "all" || wing === wingFilter;
    const matchesFlat = flatNumberFilter === "all" || flatNumber === flatNumberFilter;
    
    return matchesSearch && matchesWing && matchesFlat;
  });

  const uniqueWings = Array.from(new Set(members.map((member) => extractWingAndFlat(member.unitNumber).wing))).filter((wing) => wing !== "");
  const uniqueFlatNumbers = Array.from(new Set(members.map((member) => extractWingAndFlat(member.unitNumber).flatNumber))).filter((flat) => flat !== "");

  const extractWingFromUnit = (unitNumber: string) => {
    if (!unitNumber) return "";
    return unitNumber.charAt(0);
  };

  const extractFlatFromUnit = (unitNumber: string) => {
    if (!unitNumber) return "";
    return unitNumber.substring(1);
  };
  
  const filteredVehicles = vehicles
    .filter((vehicle: any) => {
      if (vehicleFilter === "all") return true;
      if (vehicleFilter === "current") return vehicle.isCurrent;
      if (vehicleFilter === "past") return !vehicle.isCurrent;
      return true;
    })
    .filter((vehicle: any) => {
      const wing = extractWingFromUnit(vehicle.memberUnit);
      const flat = extractFlatFromUnit(vehicle.memberUnit);
      const matchesWing = vehicleWingFilter === "all" || wing === vehicleWingFilter;
      const matchesFlat = vehicleFlatFilter === "all" || flat === vehicleFlatFilter;
      
      return matchesWing && matchesFlat;
    });

  const uniqueVehicleWings = Array.from(new Set(vehicles.map((vehicle: any) => extractWingFromUnit(vehicle.memberUnit)))).filter((wing) => wing !== "");
  const uniqueVehicleFlats = Array.from(new Set(vehicles.map((vehicle: any) => extractFlatFromUnit(vehicle.memberUnit)))).filter((flat) => flat !== "");

  const filteredForms = redevelopmentForms.filter((form) => {
    const matchesSearch = form.name.toLowerCase().includes(redevelopmentSearchTerm.toLowerCase()) ||
      form.userUnit.toLowerCase().includes(redevelopmentSearchTerm.toLowerCase()) ||
      form.email.toLowerCase().includes(redevelopmentSearchTerm.toLowerCase());
    const matchesStatus = redevelopmentStatusFilter === "all" || form.status === redevelopmentStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

// ==============================
// RENDER FUNCTIONS
// ==============================

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Loading dashboard...</p>
        </div>
      </div>
    );
  }

// ==============================
// MAIN COMPONENT RENDER
// ==============================
 return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile menu button */}
      <div className="md:hidden bg-gray-900 p-4 flex justify-between items-center">
        <h1>Welcome {adminDetails?.name}</h1>
        <p>Position: {adminDetails?.position}</p>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white focus:outline-none cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block md:w-75 flex-shrink-0`}
        style={{ backgroundColor: "#152238" }}
      >
        <div className="p-6 border-b border-blue-200 hidden md:block">
          <h1 className="text-xl font-bold text-white">
            Welcome {adminDetails?.name}
          </h1>
          <p className="text-sm text-blue-200">
            Position: {adminDetails?.position}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
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

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setActiveTab("deletionRequests");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                  activeTab === "deletionRequests"
                    ? "bg-blue-200 text-black shadow-md"
                    : "text-blue-100 hover:bg-blue-200 hover:text-black"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="ml-3">Deletion Requests</span>
                {deletionRequests.filter((req) => req.status === "pending")
                  .length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {
                      deletionRequests.filter((req) => req.status === "pending")
                        .length
                    }
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab("committeeMembers");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "committeeMembers"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="ml-3">Committee Members</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("admin");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "admin"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="ml-3">Admins</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("redevelopmentForms");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "redevelopmentForms"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <RedevelopmentFormIcon />
              <span className="ml-3">Redevelopment Forms</span>
              {redevelopmentStats.pending > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {redevelopmentStats.pending}
                </span>
              )}
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
              <SuggestionsIcon />
              <span className="ml-3">Suggestions</span>
              {suggestions.filter((s) => s.status === "pending").length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {suggestions.filter((s) => s.status === "pending").length}
                </span>
              )}
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
              {stats.pendingTestimonials > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingTestimonials}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("faqs");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "faqs"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <FAQsIcon />
              <span className="ml-3">FAQs</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("members");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "members"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <MembersIcon />
              <span className="ml-3">Members</span>
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
              {stats.pendingPayments > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingPayments}
                </span>
              )}
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
              <span className="ml-3">Complaints</span>
              {stats.pendingComplaints > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingComplaints}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("documents");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "documents"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="ml-3">Documents & Notices</span>
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
              <ServiceProviderIcon />
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
              <span className="ml-3">Vehicle Management</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("queries");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                activeTab === "queries"
                  ? "bg-blue-200 text-black shadow-md"
                  : "text-blue-100 hover:bg-blue-200 hover:text-black"
              }`}
            >
              <QueriesIcon />
              <span className="ml-3">Contact Queries</span>
              {stats.newQueries > 0 && (
                <span className="ml-auto bg-red-500 text-black text-xs px-2 py-1 rounded-full">
                  {stats.newQueries}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-blue-200">
          <div className="flex items-center px-2 py-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-blue-200 truncate">{user?.email}</p>
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

      {showDeleteReasonModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Reason for Deletion
              </h3>
              <button
                onClick={() => {
                  setShowDeleteReasonModal(false);
                  setDeleteReason("");
                  setPendingDeletion(null);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide a reason for deleting{" "}
                  <strong>{pendingDeletion?.itemName}</strong>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain why this item should be deleted..."
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={submitDeletionRequest}
                  disabled={!deleteReason.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => {
                    setShowDeleteReasonModal(false);
                    setDeleteReason("");
                    setPendingDeletion(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8">
          <header
            className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200/70 relative overflow-hidden"
            style={{ backgroundImage: "url('/assets/b8.jpg')" }}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>

            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-500/5 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-indigo-400/5 rounded-full"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-0 text-white">
                  {activeTab === "dashboard" && "Dashboard Overview"}
                  {activeTab === "admin" && "Admin Management"}
                  {activeTab === "committeeMembers" && "Committee Members"}
                  {activeTab === "testimonials" && "Testimonials Management"}
                  {activeTab === "faqs" && "FAQs Management"}
                  {activeTab === "queries" && "Contact Queries"}
                  {activeTab === "members" && "Members Management"}
                  {activeTab === "payments" && "Payments Management"}
                  {activeTab === "complaints" && "Complaint Management"}
                  {activeTab === "vehicles" && "Vehicle Management"}
                  {activeTab === "serviceProviders" &&
                    "Service Providers Management"}
                  {activeTab === "redevelopmentForms" &&
                    "Redevelopment Applications"}
                  {activeTab === "documents" && "Document Management"}
                  {activeTab === "suggestions" && "Suggestions Box"}
                  {activeTab === "deletionRequests" && "Deletion Requests"}
                </h2>
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-2"></div>
              </div>

              <div className="flex items-center mt-4 md:mt-0">
                <div className="bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-gray-200/60 text-sm text-gray-600 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Last updated: {new Date().toLocaleDateString("en-GB")}
                </div>
              </div>
            </div>
          </header>
          {activeTab === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                {/* Stats cards */}
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Testimonials</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.totalTestimonials}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending Approval</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.pendingTestimonials}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">FAQs</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.totalFAQs}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-teal-100 text-teal-700 rounded-lg mr-4">
                      <ServiceProviderIcon />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service Providers</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.totalServiceProviders}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Members</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.totalMembers}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending Payments</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.pendingPayments}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 text-orange-700 rounded-lg mr-4">
                      <ComplaintsIcon />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Pending Complaints
                      </p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">
                        {stats.pendingComplaints}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Add New Member Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Add New Member
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Quickly add a new society member to the system
                    </p>
                    <button
                      onClick={() => setActiveTab("members")}
                      className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Add Member
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                </div>

                {/* Add Admin Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
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
                          d="M12 11c0-1.657 0-3.343 0-5a4 4 0 118 0c0 1.657 0 3.343 0 5M4 21v-1a7 7 0 0114 0v1H4z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Add Admin
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create a new administrator for managing the system
                    </p>
                    <button
                      onClick={() => setActiveTab("admin")}
                      className="px-4 py-2 cursor-pointer bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Add Admin
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                </div>

                {/* Add Committee Member Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
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
                          d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M12 12a4 4 0 100-8 4 4 0 000 8zm6 8v0m-12 0v0"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Add Committee Member
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add a new committee member to the society’s panel
                    </p>
                    <button
                      onClick={() => setActiveTab("committeeMembers")}
                      className="px-4 py-2 cursor-pointer bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Add Committee Member
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
                </div>

                {/* Manage Payments Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Manage Payments
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Process and track member payments
                    </p>
                    <button
                      onClick={() => setActiveTab("payments")}
                      className="px-4 py-2 cursor-pointer bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Manage Payments
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-600"></div>
                </div>

                {/* Manage Complaints Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Management Complaints
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      View and resolve member complaints
                    </p>
                    <button
                      onClick={() => setActiveTab("complaints")}
                      className="px-4 py-2 cursor-pointer bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Manage Complaints
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-600"></div>
                </div>
              </div>
            </>
          )}

          {activeTab === "committeeMembers" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Committee Members Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add and manage society committee members
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCommitteeMember(null);
                    setNewCommitteeMember({
                      name: "",
                      email: "",
                      phone: "",
                      position: "",
                      description: "",
                    });
                    setShowAddCommitteePopup(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add Committee Member
                </button>
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Position
                    </label>
                    <select
                      value={committeeFilter}
                      onChange={(e) => setCommitteeFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Positions</option>
                      <option value="Chairman">Chairman</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Treasurer">Treasurer</option>
                      <option value="Member">Member</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setCommitteeFilter("all")}
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
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Committee Members Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Name",
                          "Position",
                          "Contact",
                          "Description",
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
                      {committeeMembers
                        .filter(
                          (member) =>
                            committeeFilter === "all" ||
                            member.position === committeeFilter
                        )
                        .map((member) => (
                          <tr
                            key={member.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {member.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {member.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {member.position}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {member.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 max-w-xs">
                                {member.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() =>
                                    handleEditCommitteeMember(member)
                                  }
                                  className="text-blue-600 hover:text-blue-900 text-left cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCommitteeMember(member.id)
                                  }
                                  className="text-red-600 hover:text-red-900 text-left cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {committeeMembers.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No committee members found
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Add committee members to start managing them
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "admin" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Admins Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add and manage system administrators
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAdmin(null);
                    setNewAdmin({
                      name: "",
                      email: "",
                      position: "",
                      //password: "",
                      adminPosition: "",
                    });
                    setShowAddAdminPopup(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add Admin
                </button>
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Administrator Position
                    </label>
                    <select
                      value={adminFilter}
                      onChange={(e) => setAdminFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Positions</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setAdminFilter("all")}
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
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Admins Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Name",
                          "Email",
                          "Society Position",
                          "Administrator Position",
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
                      {admins
                        .filter(
                          (admin) =>
                            adminFilter === "all" ||
                            admin.position === adminFilter
                        )
                        .map((admin) => (
                          <tr
                            key={admin.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {admin.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {admin.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {admin.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {admin.position}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {admin.adminPosition}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => handleEditAdmin(admin)}
                                  className="text-blue-600 hover:text-blue-900 text-left cursor-pointer"
                                >
                                  Edit
                                </button>
                                {admin.id !== user?.uid && (
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="text-red-600 hover:text-red-900 text-left cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {admins.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No admins found
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Add admins to start managing them
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Add Committee Member Popup */}
          {showAddCommitteePopup && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    {editingCommitteeMember
                      ? "Edit Committee Member"
                      : "Add Committee Member"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddCommitteePopup(false);
                      setEditingCommitteeMember(null);
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>
                <div className="p-6">
                  <form
                    onSubmit={
                      editingCommitteeMember
                        ? handleUpdateCommitteeMember
                        : handleAddCommitteeMember
                    }
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newCommitteeMember.name}
                        onChange={(e) =>
                          setNewCommitteeMember({
                            ...newCommitteeMember,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={newCommitteeMember.email}
                        onChange={(e) =>
                          setNewCommitteeMember({
                            ...newCommitteeMember,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email Address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        required
                        value={newCommitteeMember.phone}
                        onChange={(e) =>
                          setNewCommitteeMember({
                            ...newCommitteeMember,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Phone Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select
                        required
                        value={newCommitteeMember.position}
                        onChange={(e) =>
                          setNewCommitteeMember({
                            ...newCommitteeMember,
                            position: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Position</option>
                        <option value="Chairman">Chairman</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Treasurer">Treasurer</option>
                        <option value="Member">Member</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newCommitteeMember.description}
                        onChange={(e) =>
                          setNewCommitteeMember({
                            ...newCommitteeMember,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description/Role"
                      />
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <button
                        type="submit"
                        disabled={isAddingCommittee || isEditingCommittee}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {editingCommitteeMember
                          ? isEditingCommittee
                            ? "Updating..."
                            : "Update Member"
                          : isAddingCommittee
                          ? "Adding..."
                          : "Add Member"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCommitteePopup(false);
                          setEditingCommitteeMember(null);
                        }}
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
          {/* Add Admin Popup */}
          {showAddAdminPopup && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    {editingAdmin ? "Edit Admin" : "Add Admin"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddAdminPopup(false);
                      setEditingAdmin(null);
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>
                <div className="p-6">
                  <form
                    onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newAdmin.name}
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={newAdmin.email}
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email Address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Society Position
                      </label>
                      <select
                        required
                        value={newAdmin.position}
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, position: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Positions</option>
                        <option value="Chairman">Chairman</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Treasurer">Treasurer</option>
                        <option value="Member">Member</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Administrator Position
                      </label>
                      <select
                        required
                        value={newAdmin.adminPosition}
                        onChange={(e) =>
                          setNewAdmin({
                            ...newAdmin,
                            adminPosition: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Position</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <button
                        type="submit"
                        disabled={isAddingAdmin || isEditingAdmin}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {editingAdmin
                          ? isEditingAdmin
                            ? "Updating..."
                            : "Update Admin"
                          : isAddingAdmin
                          ? "Adding..."
                          : "Add Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAdminPopup(false);
                          setEditingAdmin(null);
                        }}
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
          {activeTab === "documents" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Documents & Notices Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Upload and manage documents and notices for members
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDocumentModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md cursor-pointer"
                >
                  Upload New Document
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Documents Card */}
                  <div className="relative overflow-hidden rounded-xl border border-blue-200/60 bg-white p-6 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg border-t-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-base font-medium text-slate-500">
                          Total Documents
                        </h4>
                        <p className="text-4xl font-bold text-slate-800 tracking-tight">
                          {
                            documents.filter((d) => d.category === "document")
                              .length
                          }
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <DocumentsIcon />
                      </div>
                    </div>
                  </div>

                  {/* Notices Card */}
                  <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg border-t-4 border-teal-500">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-base font-medium text-slate-500">
                          Total Notices
                        </h4>
                        <p className="text-4xl font-bold text-slate-800 tracking-tight">
                          {
                            documents.filter((d) => d.category === "notice")
                              .length
                          }
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                        <NoticesIcon />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Title",
                          "Type",
                          "Category",
                          "Visibility",
                          "Uploaded",
                          "Actions",
                        ].map((header) => (
                          <th
                            key={header}
                            scope="col"
                            className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wide"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {doc.fileType}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                doc.category === "document"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {doc.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                doc.isPublic
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {doc.isPublic ? "Public" : "Private"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDateTime(doc.uploadedAt)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-4">
                              <button
                                className="cursor-pointer"
                                onClick={() =>
                                  toggleDocumentVisibility(doc.id, doc.isPublic)
                                }
                                title={
                                  doc.isPublic ? "Make Private" : "Make Public"
                                }
                              >
                                {doc.isPublic ? <LockIcon /> : <UnlockIcon />}
                              </button>

                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View Document"
                              >
                                <ViewIcon />
                              </a>

                              <button
                                className="cursor-pointer"
                                onClick={() => handleDeleteDocument(doc.id)}
                                title="Delete Document"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {documents.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No documents found
                      </h3>
                      <p className="text-gray-500">
                        Upload your first document to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {showAddDocumentModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer">
              <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    Upload New Document
                  </h3>
                  <button
                    onClick={() => setShowAddDocumentModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleUploadDocument} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newDocument.title}
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Document title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newDocument.description}
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Document description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newDocument.category}
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            category: e.target.value as "document" | "notice",
                          })
                        }
                        className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="document">Document</option>
                        <option value="notice">Notice</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File
                      </label>
                      <input
                        type="file"
                        required
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            file: e.target.files?.[0] || null,
                          })
                        }
                        className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newDocument.isPublic}
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            isPublic: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Make this document public
                      </label>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Upload Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddDocumentModal(false)}
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

          {activeTab === "redevelopmentForms" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Redevelopment Applications
                  </h3>
                  <p className="text-sm text-gray-500">
                    Review and manage redevelopment form submissions
                  </p>
                </div>
                <button
                  onClick={handleExportForms}
                  disabled={exportLoading || redevelopmentForms.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {exportLoading ? "Exporting..." : "Export to CSV"}
                </button>
              </div>

              {/* Redevelopment Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    title: "Total Forms",
                    value: redevelopmentStats.total,
                    gradient: "from-blue-500 to-indigo-600",
                    text: "text-blue-100 md:font-bold md:text-xl",
                  },
                  {
                    title: "Pending",
                    value: redevelopmentStats.pending,
                    gradient: "from-amber-500 to-orange-600",
                    text: "text-amber-100 md:font-bold md:text-xl",
                  },
                  {
                    title: "Approved",
                    value: redevelopmentStats.approved,
                    gradient: "from-emerald-500 to-green-600",
                    text: "text-emerald-100 md:font-bold md:text-xl",
                  },
                  {
                    title: "Rejected",
                    value: redevelopmentStats.rejected,
                    gradient: "from-red-500 to-pink-600",
                    text: "text-red-100 md:font-bold md:text-xl",
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl shadow-xl p-6 overflow-hidden group transition-all duration-300 hover:scale-105`}
                  >
                    <div className="absolute inset-0 bg-white/10 transform origin-bottom rotate-12 scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 bg-white/20 rounded-xl backdrop-blur-sm text-white">
                        <RedevelopmentFormIcon />
                      </div>
                      <div>
                        <h3 className={`text-sm font-medium ${card.text}`}>
                          {card.title}
                        </h3>
                        <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Forms
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, unit or email..."
                      value={redevelopmentSearchTerm}
                      onChange={(e) =>
                        setRedevelopmentSearchTerm(e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={redevelopmentStatusFilter}
                      onChange={(e) =>
                        setRedevelopmentStatusFilter(e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setRedevelopmentStatusFilter("all");
                        setRedevelopmentSearchTerm("");
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
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Redevelopment Forms Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Name",
                          "Unit",
                          "Phone",
                          "Email",
                          "Status",
                          "Submitted",
                          "Vacate Date",
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
                      {filteredForms.map((form) => (
                        <tr
                          key={form.id}
                          className="hover:bg-blue-50/30 transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {form.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {form.userUnit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {form.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {form.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                form.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : form.status === "reviewed"
                                  ? "bg-blue-100 text-blue-800"
                                  : form.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {form.status.charAt(0).toUpperCase() +
                                form.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatDateTime(form.submittedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatDateToDDMMYYYY(form.vacateDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewForm(form)}
                              className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredForms.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <RedevelopmentFormIcon />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {redevelopmentForms.length === 0
                          ? "No redevelopment forms found"
                          : "No matching forms found"}
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {redevelopmentForms.length === 0
                          ? "Member redevelopment form submissions will appear here"
                          : "Try adjusting your search or filters"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Details Modal */}
          {showFormModal && selectedForm && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Redevelopment Form Details
                  </h3>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Name
                      </h4>
                      <p className="text-gray-900">{selectedForm.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Unit
                      </h4>
                      <p className="text-gray-900">{selectedForm.userUnit}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Phone
                      </h4>
                      <p className="text-gray-900">{selectedForm.phone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Email
                      </h4>
                      <p className="text-gray-900">{selectedForm.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Status
                      </h4>
                      <p className="text-gray-900 capitalize">
                        {selectedForm.status}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Submitted
                      </h4>
                      <p className="text-gray-900">
                        {formatDateTime(selectedForm.submittedAt)}
                      </p>
                    </div>
                    {selectedForm.alternateAddress && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Alternate Address
                        </h4>
                        <p className="text-gray-900">
                          {selectedForm.alternateAddress}
                        </p>
                      </div>
                    )}
                    {selectedForm.vacateDate && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Vacate Date
                        </h4>
                        <p className="text-gray-900">
                          {formatDateToDDMMYYYY(selectedForm.vacateDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedForm.fileUrls &&
                    selectedForm.fileUrls.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">
                          Attached Files
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedForm.fileUrls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                            >
                              Document {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Comments Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">
                      Comments History
                    </h4>

                    {selectedForm.comments &&
                    selectedForm.comments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedForm.comments
                          ?.sort(
                            (a, b) =>
                              b.timestamp.toMillis() - a.timestamp.toMillis()
                          )
                          .map((comment, index) => (
                            <div
                              key={index}
                              className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-900">
                                  {comment.userName} ({comment.userType})
                                </p>
                                <span className="text-sm text-gray-500">
                                  {formatDateTime(comment.timestamp)}
                                </span>
                              </div>
                              {comment.statusChange && (
                                <div className="my-1">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            comment.statusChange === "approved"
                              ? "bg-green-100 text-green-800"
                              : comment.statusChange === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                                  >
                                    Status changed to: {comment.statusChange}
                                  </span>
                                </div>
                              )}
                              <p className="text-gray-700 mt-1">
                                {comment.comment}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No comments yet.</p>
                    )}
                  </div>

                  {/* Add Comment Section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Add New Comment
                    </h4>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add your comment here..."
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        handleUpdateFormStatus(selectedForm.id, "approved")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                      disabled={!formNotes.trim()}
                    >
                      Approve with Comment
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateFormStatus(selectedForm.id, "reviewed")
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      disabled={!formNotes.trim()}
                    >
                      Mark as Reviewed with Comment
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateFormStatus(selectedForm.id, "rejected")
                      }
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      disabled={!formNotes.trim()}
                    >
                      Reject with Comment
                    </button>
                    <button
                      onClick={() => setShowFormModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deletionRequests" && isSuperAdmin && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  Deletion Requests
                </h3>
                <p className="text-sm text-gray-500">
                  Review and approve/reject deletion requests from other admins
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#152238]">
                    <tr>
                      {[
                        "Requested By",
                        "Item Type",
                        "Item Name",
                        "Requested",
                        "Reason",
                        "Status",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {deletionRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.adminName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.adminEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                          {request.itemType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {request.itemName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {request.status === "pending" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleDeletionRequest(request.id, true)
                                }
                                className="text-green-600 hover:text-green-900 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleDeletionRequest(request.id, false)
                                }
                                className="text-red-600 hover:text-red-900 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status !== "pending" && (
                            <span className="text-gray-500">
                              Reviewed by {request.reviewedBy}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {deletionRequests.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No deletion requests
                    </h3>
                    <p className="text-gray-500">
                      Deletion requests from other admins will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Member Suggestions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Review and manage member suggestions and ideas
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={suggestionStatusFilter}
                      onChange={(e) =>
                        setSuggestionStatusFilter(e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Category
                    </label>
                    <select
                      value={suggestionCategoryFilter}
                      onChange={(e) =>
                        setSuggestionCategoryFilter(e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Categories</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Security">Security</option>
                      <option value="Amenities">Amenities</option>
                      <option value="Events">Events</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Priority
                    </label>
                    <select
                      value={suggestionPriorityFilter}
                      onChange={(e) =>
                        setSuggestionPriorityFilter(e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSuggestionStatusFilter("all");
                        setSuggestionCategoryFilter("all");
                        setSuggestionPriorityFilter("all");
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
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Member",
                          "Title",
                          "Category",
                          "Priority",
                          "Status",
                          "Created",
                          "Votes",
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
                      {suggestions
                        .filter((suggestion) => {
                          const matchesStatus =
                            suggestionStatusFilter === "all" ||
                            suggestion.status === suggestionStatusFilter;
                          const matchesCategory =
                            suggestionCategoryFilter === "all" ||
                            suggestion.category === suggestionCategoryFilter;
                          const matchesPriority =
                            suggestionPriorityFilter === "all" ||
                            suggestion.priority === suggestionPriorityFilter;
                          return (
                            matchesStatus && matchesCategory && matchesPriority
                          );
                        })
                        .map((suggestion) => (
                          <tr
                            key={suggestion.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {suggestion.userName?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {suggestion.userName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {suggestion.unitNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {suggestion.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {suggestion.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {suggestion.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  suggestion.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : suggestion.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {suggestion.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  suggestion.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : suggestion.status === "reviewed"
                                    ? "bg-blue-100 text-blue-800"
                                    : suggestion.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {suggestion.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(suggestion.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600 text-sm">
                                  ↑ {suggestion.votes?.upvotes || 0}
                                </span>
                                <span className="text-red-600 text-sm">
                                  ↓ {suggestion.votes?.downvotes || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => {
                                    setSelectedSuggestion(suggestion);
                                    setShowSuggestionModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 text-left cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSuggestion(suggestion.id)
                                  }
                                  className="text-red-600 hover:text-red-900 text-left cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {suggestions.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <SuggestionsIcon />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No suggestions found
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Member suggestions will appear here once submitted
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSuggestionModal && selectedSuggestion && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Suggestion Details
                  </h3>
                  <button
                    onClick={() => {
                      setShowSuggestionModal(false);
                      setSelectedSuggestion(null);
                      setSuggestionComment("");
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Member
                      </h4>
                      <p className="text-gray-900">
                        {selectedSuggestion.userName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedSuggestion.unitNumber}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Category
                      </h4>
                      <p className="text-gray-900">
                        {selectedSuggestion.category}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Priority
                      </h4>
                      <p className="text-gray-900 capitalize">
                        {selectedSuggestion.priority}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Status
                      </h4>
                      <p className="text-gray-900 capitalize">
                        {selectedSuggestion.status}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Title
                      </h4>
                      <p className="text-gray-900 font-medium">
                        {selectedSuggestion.title}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Description
                      </h4>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedSuggestion.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Created
                      </h4>
                      <p className="text-gray-900">
                        {formatDateTime(selectedSuggestion.createdAt)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Votes
                      </h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600">
                          ↑ {selectedSuggestion.votes?.upvotes || 0}
                        </span>
                        <span className="text-red-600">
                          ↓ {selectedSuggestion.votes?.downvotes || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {selectedSuggestion.comments &&
                    selectedSuggestion.comments.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                          Comments
                        </h4>
                        <div className="space-y-3">
                          {selectedSuggestion.comments.map((comment, index) => (
                            <div
                              key={index}
                              className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-gray-900">
                                  {comment.userName}
                                </p>
                                <span className="text-sm text-gray-500">
                                  {formatDateTime(comment.timestamp)}
                                </span>
                              </div>
                              {comment.statusChange && (
                                <div className="my-1">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      comment.statusChange === "approved"
                                        ? "bg-green-100 text-green-800"
                                        : comment.statusChange === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    Status changed to: {comment.statusChange}
                                  </span>
                                </div>
                              )}
                              <p className="text-gray-700 mt-1">
                                {comment.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Add Comment Section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Add Comment
                    </h4>
                    <textarea
                      value={suggestionComment}
                      onChange={(e) => setSuggestionComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add your comment here..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        handleUpdateSuggestionStatus(
                          selectedSuggestion.id,
                          "approved",
                          suggestionComment
                        )
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateSuggestionStatus(
                          selectedSuggestion.id,
                          "reviewed",
                          suggestionComment
                        )
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateSuggestionStatus(
                          selectedSuggestion.id,
                          "rejected",
                          suggestionComment
                        )
                      }
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setShowSuggestionModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "testimonials" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Feedback & Reviews
                  </h3>
                  <p className="text-sm text-gray-500">
                    Approve or delete resident testimonials
                  </p>
                </div>
                {stats.pendingTestimonials > 0 && (
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.pendingTestimonials} Pending Approval
                  </div>
                )}
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Approval Status
                    </label>
                    <select
                      value={testimonialFilter}
                      onChange={(e) => setTestimonialFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Testimonials</option>
                      <option value="approved">Approved Only</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setTestimonialFilter("all")}
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
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Testimonials Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Member",
                          "Rating",
                          "Testimonial",
                          "Status",
                          "Submitted",
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
                      {testimonials
                        .filter((testimonial) => {
                          if (testimonialFilter === "all") return true;
                          if (testimonialFilter === "approved")
                            return testimonial.approved;
                          if (testimonialFilter === "pending")
                            return !testimonial.approved;
                          return true;
                        })
                        .map((testimonial) => (
                          <tr
                            key={testimonial.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {testimonial.name?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {testimonial.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {testimonial.unit}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < testimonial.rating
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 max-w-xs truncate">
                                {testimonial.content}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  testimonial.approved
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {testimonial.approved ? "Approved" : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {formatDateTime(testimonial.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col space-y-2">
                                {!testimonial.approved && (
                                  <button
                                    onClick={() =>
                                      handleApproveTestimonial(testimonial.id)
                                    }
                                    className="text-green-600 hover:text-green-900 text-left cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteTestimonial(testimonial.id)
                                  }
                                  className="text-red-600 hover:text-red-900 text-left cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {testimonials.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <TestimonialsIcon />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No testimonials found
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Resident testimonials will appear here once submitted
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "faqs" && (
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Manage FAQs
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add, edit or remove frequently asked questions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingFAQ(null);
                    setShowFAQPopup(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add New FAQ
                </button>
              </div>

              {/* FAQs Table */}
              <div className="overflow-x-auto shadow-lg border border-gray-100">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#152238]">
                    <tr>
                      {["Question", "Answer", "Actions"].map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wide"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {faqs.map((faq) => (
                      <tr
                        key={faq.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {faq.question}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {faq.answer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-3">
                          <button
                            onClick={() => handleEditFAQ(faq)}
                            className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="text-red-600 hover:text-red-800 font-semibold cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {faqs.length === 0 && (
                  <div className="p-6 text-center text-gray-500 italic">
                    No FAQs found.
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Add FAQ Popup */}
          {showFAQPopup && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowFAQPopup(false);
                      setEditingFAQ(null);
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>
                <div className="p-6">
                  <form
                    onSubmit={editingFAQ ? handleUpdateFAQ : handleAddFAQ}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        required
                        value={
                          editingFAQ ? editingFAQ.question : newFAQ.question
                        }
                        onChange={(e) =>
                          editingFAQ
                            ? setEditingFAQ({
                                ...editingFAQ,
                                question: e.target.value,
                              })
                            : setNewFAQ({ ...newFAQ, question: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter question"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Answer
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={editingFAQ ? editingFAQ.answer : newFAQ.answer}
                        onChange={(e) =>
                          editingFAQ
                            ? setEditingFAQ({
                                ...editingFAQ,
                                answer: e.target.value,
                              })
                            : setNewFAQ({ ...newFAQ, answer: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter answer"
                      />
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <button
                        type="submit"
                        disabled={isAddingFAQ || isEditingFAQ}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {editingFAQ
                          ? isEditingFAQ
                            ? "Updating..."
                            : "Update FAQ"
                          : isAddingFAQ
                          ? "Adding..."
                          : "Add FAQ"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFAQPopup(false);
                          setEditingFAQ(null);
                        }}
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
          {activeTab === "queries" && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">
                  Assistance Requests
                </h3>
                <p className="text-sm text-gray-500">
                  Manage resident inquiries and concerns
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {queries.map((query) => (
                  <div key={query.id} className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {query.name}
                        </h4>
                        <p className="text-sm text-gray-500">{query.email}</p>
                        {query.phone && (
                          <p className="text-sm text-gray-500">{query.phone}</p>
                        )}
                      </div>

                      <div className="flex items-center mt-2 md:mt-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            query.status === "new"
                              ? "bg-blue-100 text-blue-800"
                              : query.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {query.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{query.query}</p>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <p className="text-sm text-gray-500 mb-2 md:mb-0">
                        Submitted on {formatDateTime(query.createdAt)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={query.status}
                          onChange={(e) =>
                            handleUpdateQueryStatus(query.id, e.target.value)
                          }
                          className="text-sm border text-black border-gray-300 rounded-lg px-3 py-1 cursor-pointer"
                        >
                          <option value="new">New</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>

                        <button
                          onClick={() =>
                            handleReplyToQuery(query.email, query.name)
                          }
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {queries.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No queries found.
                  </div>
                )}
              </div>
            </div>
          )}
          {showMemberDetails && selectedMember && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4">
              <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#152238] via-[#1b2a41] to-[#243b55] p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedMember.name}
                      </h2>
                      <p className="text-blue-100">
                        Unit {selectedMember.unitNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowMemberDetails(false);
                        setSelectedMember(null);
                      }}
                      className="text-white/80 cursor-pointer hover:text-white text-2xl cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-full text-sm">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {selectedMember.email}
                    </div>
                    <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-full text-sm">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {selectedMember.phone}
                    </div>
                    <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-full text-sm">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Member since {selectedMember.memberSince}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Family Members Section */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      Family Members
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMember.familyMembers?.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm 
                           hover:shadow-md hover:border-blue-300 transition-all"
                        >
                          <h4 className="font-medium text-gray-900">
                            {member.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {member.relation} · {member.age} years
                          </p>
                          {member.phone && (
                            <p className="text-sm text-gray-500 mt-1">
                              {member.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vehicles Section */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-5a1 1 0 00-.293-.707l-4-4A1 1 0 0016 4H3z" />
                      </svg>
                      Vehicles
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMember.vehicles
                        ?.filter((v) => v.isCurrent)
                        .map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                          >
                            <h4 className="font-medium text-gray-800">
                              {vehicle.model}
                            </h4>

                            <div className="flex items-center mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {vehicle.type}
                              </span>
                              <span className="ml-2 text-sm text-gray-600">
                                {vehicle.numberPlate}
                              </span>
                              <span className="ml-2 text-sm text-gray-600">
                                {vehicle.parking
                                  ? "Parking: Yes"
                                  : "Parking: No"}
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 mt-2">
                              Since: {formatDateTime(vehicle.startDate)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Property Status Section */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Alternate Property Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                        <h4 className="font-medium text-gray-900">Status</h4>
                        <p className="text-sm text-gray-600">
                          {selectedMember.propertyStatus || "Not specified"}
                        </p>
                      </div>
                      {selectedMember.alternateAddress && (
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                          <h4 className="font-medium text-gray-900">
                            Alternate Address
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedMember.alternateAddress}
                          </p>
                        </div>
                      )}
                      {selectedMember.agreementStartDate && (
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                          <h4 className="font-medium text-gray-900">
                            Agreement Start Date
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedMember.agreementStartDate}
                          </p>
                        </div>
                      )}
                      {selectedMember.agreementEndDate && (
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                          <h4 className="font-medium text-gray-900">
                            Agreement End Date
                          </h4>
                          <p className="text-sm text-gray-600">
                            {selectedMember.agreementEndDate}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "members" && (
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Manage Members
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add and manage society members
                  </p>
                </div>
                <button
                  onClick={() => setShowMemberPopup(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Add New Member
                </button>
              </div>

              {/* Add filter controls */}
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Wing
                  </label>
                  <select
                    value={wingFilter}
                    onChange={(e) => setWingFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Wings</option>
                    {uniqueWings.map((wing) => (
                      <option key={wing} value={wing}>
                        Wing {wing}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Flat Number
                  </label>
                  <select
                    value={flatNumberFilter}
                    onChange={(e) => setFlatNumberFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Flats</option>
                    {uniqueFlatNumbers.map((flat) => (
                      <option key={flat} value={flat}>
                        Flat {flat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setWingFilter("all");
                      setFlatNumberFilter("all");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Add Member Popup */}
              {showMemberPopup && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">
                        Add New Member
                      </h3>
                      <button
                        onClick={() => {
                          setShowMemberPopup(false);
                          setNewMember({
                            name: "",
                            email: "",
                            phone: "",
                            unitNumber: "",
                            memberSince: "",
                          });
                        }}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        <svg
                          className="w-6 h-6"
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
                      </button>
                    </div>
                    <div className="p-6">
                      <form onSubmit={handleAddMember} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            required
                            value={newMember.name}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            value={newMember.email}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Email Address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            required
                            value={newMember.phone}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Phone Number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Number
                          </label>
                          <input
                            type="text"
                            required
                            value={newMember.unitNumber}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                unitNumber: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Wing FlatNumber (Eg. B405)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Member Since
                          </label>
                          <input
                            type="text"
                            required
                            value={newMember.memberSince}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                memberSince: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Input only Year"
                          />
                        </div>
                        <div className="flex space-x-2 pt-4">
                          <button
                            type="submit"
                            disabled={isAddingMember}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isAddingMember ? "Adding Member..." : "Add Member"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowMemberPopup(false);
                              setNewMember({
                                name: "",
                                email: "",
                                phone: "",
                                unitNumber: "",
                                memberSince: "",
                              });
                            }}
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

              {/* Members Table */}
              <div className="overflow-x-auto shadow-lg border border-gray-100">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#152238]">
                    <tr>
                      {[
                        "Name",
                        "Email",
                        "Phone",
                        "Unit Number",
                        "Member Since",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wide"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-blue-100 transition-colors duration-200 cursor-pointer"
                        onClick={() => handleMemberRowClick(member.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {member.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {member.unitNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {member.memberSince}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMember(member.id);
                            }}
                            className="text-red-600 hover:text-red-800 font-semibold transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {members.length === 0 && (
                  <div className="p-6 text-center text-gray-500 italic">
                    No members found.
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "payments" && (
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Manage Payments
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add and manage member payments
                  </p>
                </div>
                {/* Add Payment  */}
                <div className="p-4 md:p-2 border-gray-200">
                  <button
                    onClick={() => setShowAddPaymentPopup(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Add New Payment
                  </button>
                </div>
              </div>

              {/* Add Payment Popup */}
              {showAddPaymentPopup && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">
                        Add New Payment
                      </h3>
                      <button
                        onClick={() => setShowAddPaymentPopup(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        <svg
                          className="w-6 h-6"
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
                      </button>
                    </div>
                    <div className="p-6">
                      <form onSubmit={handleAddPayment} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Member
                          </label>
                          <div className="relative">
                            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                              <svg
                                className="w-5 h-5 text-gray-400 ml-3"
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
                              <input
                                type="text"
                                id="memberSearch"
                                placeholder="Search members..."
                                className="w-full px-3 py-2 text-black border-none focus:ring-0 bg-transparent caret-blue-600"
                                value={memberSearchTerm}
                                onChange={(e) => {
                                  setMemberSearchTerm(e.target.value);
                                  setShowMemberDropdown(true);
                                }}
                                onFocus={() => setShowMemberDropdown(true)}
                              />
                            </div>

                            {showMemberDropdown && memberSearchTerm && (
                              <div className="absolute z-10 w-full mt-1 bg-white border text-black border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredMembers.length > 0 ? (
                                  filteredMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      className="px-4 py-2 cursor-pointer text-black hover:bg-blue-100"
                                      onClick={() => {
                                        setNewPayment({
                                          ...newPayment,
                                          memberId: member.id,
                                        });
                                        setMemberSearchTerm(
                                          `${member.name} (${member.unitNumber})`
                                        );
                                        setShowMemberDropdown(false);
                                      }}
                                    >
                                      {member.name} ({member.unitNumber})
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-gray-500">
                                    No members found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            required
                            value={newPayment.amount}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                amount: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Amount"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            required
                            value={newPayment.dueDate}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                dueDate: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Due Date"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            required
                            value={newPayment.type}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                type: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Maintenance">Maintenance</option>
                            <option value="Water">Water Bill</option>
                            <option value="Electricity">
                              Electricity Bill
                            </option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            required
                            value={newPayment.status}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                status: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>

                        <div className="flex space-x-2 pt-4">
                          <button
                            type="submit"
                            disabled={isAddingPayment}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isAddingPayment
                              ? "Adding Payment..."
                              : "Add Payment"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddPaymentPopup(false)}
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

              {/* Payments Section */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                {/* Filter */}
                <div className="p-6 flex flex-col shadow-sm md:flex-row gap-4 md:items-end border-b border-gray-100">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Type
                    </label>
                    <select
                      value={paymentTypeFilter}
                      onChange={(e) => setPaymentTypeFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">Types</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Water">Water Bill</option>
                      <option value="Electricity">Electricity Bill</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setPaymentStatusFilter("all");
                        setPaymentTypeFilter("all");
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
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/*Payments Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Member",
                          "Amount",
                          "Type",
                          "Due Date",
                          "Status",
                          "Paid Date",
                          "Transaction ID",
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
                      {filteredPayments.map((payment) => {
                        return (
                          <tr
                            key={payment.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {payment.memberName?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {payment.memberName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                ₹{payment.amount}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {payment.type}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 font-medium">
                                {formatDateTime(payment.dueDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={payment.status}
                                onChange={(e) =>
                                  handleUpdatePaymentStatus(
                                    payment.memberId,
                                    payment.transactionId,
                                    e.target.value
                                  )
                                }
                                className={`text-sm text-black font-medium rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {payment.paidDate
                                  ? formatDateTime(payment.paidDate)
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-xs font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 border border-gray-200">
                                  {payment.transactionId}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      payment.transactionId
                                    );
                                    alert(
                                      "Transaction ID copied to clipboard!"
                                    );
                                  }}
                                  className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Copy Transaction ID"
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
                                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() =>
                                  handleDeletePayment(
                                    payment.memberId,
                                    payment.transactionId
                                  )
                                }
                                className="text-rose-600 cursor-pointer hover:text-rose-800 font-medium transition-all flex items-center gap-1.5 group/delete"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                <span className="group-hover/delete:underline">
                                  Delete
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredPayments.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {payments.length === 0
                          ? "No payments yet"
                          : "No matching payments"}
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {payments.length === 0
                          ? "Get started by adding your first payment record."
                          : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "complaints" && (
            <div className="bg-white shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Manage Complaints
                  </h3>
                  <p className="text-sm text-gray-500">
                    View and manage member complaints
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div className="p-6 flex flex-col shadow-sm md:flex-row gap-4 md:items-end border-b border-gray-100">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={complaintStatusFilter}
                    onChange={(e) => setComplaintStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                  >
                    <option value="all">Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setComplaintStatusFilter("all")}
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
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Complaints Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Member",
                          "Unit",
                          "Type",
                          "Title",
                          "Description",
                          "Status",
                          "Created",
                          "Actions",
                          "Files",
                          "Updated",
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
                      {complaints
                        .filter(
                          (complaint) =>
                            complaintStatusFilter === "all" ||
                            complaint.status === complaintStatusFilter
                        )
                        .map((complaint) => (
                          <tr
                            key={complaint.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {complaint.memberName?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {complaint.memberName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 font-medium">
                                {complaint.unitNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {complaint.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {complaint.title}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 max-w-xs">
                                {complaint.description}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 max-w-xs">
                                <select
                                  value={complaint.status}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      complaint.memberId,
                                      complaint.id,
                                      e.target.value
                                    )
                                  }
                                  className={`text-sm text-black font-medium rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                    complaint.status === "pending"
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in-progress">
                                    In Progress
                                  </option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {formatDateTime(complaint.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenChat(
                                      complaint.id,
                                      complaint.memberId
                                    );
                                  }}
                                  className="cursor-pointer relative px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-sm font-medium"
                                  title="View Chat"
                                >
                                  View Chat
                                  {unreadMessageCounts[complaint.id] > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                      {unreadMessageCounts[complaint.id]}
                                    </span>
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveComplaint(
                                      complaint.memberId,
                                      complaint.id
                                    );
                                  }}
                                  className="cursor-pointer px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 text-sm font-medium"
                                  title="Approve Complaint"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComplaint(
                                      complaint.memberId,
                                      complaint.id
                                    );
                                  }}
                                  className="cursor-pointer p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                  title="Delete Complaint"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                {complaint.files &&
                                complaint.files.length > 0 ? (
                                  complaint.files.map((file) => (
                                    <a
                                      key={file.id}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                    >
                                      <svg
                                        className="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                        />
                                      </svg>
                                      {file.name}
                                    </a>
                                  ))
                                ) : (
                                  <span className="text-gray-500 text-sm">
                                    No files
                                  </span>
                                )}
                                <button
                                  onClick={() =>
                                    handleUploadFile(
                                      complaint.memberId,
                                      complaint.id
                                    )
                                  }
                                  className="text-green-600 hover:text-green-800 text-sm flex items-center mt-1 cursor-pointer"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                  </svg>
                                  Add File
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {formatDateTime(complaint.updatedAt)}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {complaints.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {complaints.length === 0
                          ? "No complaints yet"
                          : "No matching complaints"}
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {complaints.length === 0
                          ? "All member complaints will appear here."
                          : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Automotive Assets
                  </h3>
                  <p className="text-sm text-gray-500">
                    Track and manage all member vehicles
                  </p>
                </div>
                <button
                  onClick={() => setShowAddVehiclePopup(true)}
                  className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  Add New Vehicle
                </button>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Wing
                    </label>
                    <select
                      value={vehicleWingFilter}
                      onChange={(e) => setVehicleWingFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Wings</option>
                      {uniqueVehicleWings.map((wing) => (
                        <option key={wing} value={wing}>
                          Wing {wing}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Flat
                    </label>
                    <select
                      value={vehicleFlatFilter}
                      onChange={(e) => setVehicleFlatFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Flats</option>
                      {uniqueVehicleFlats.map((flat) => (
                        <option key={flat} value={flat}>
                          Flat {flat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setVehicleFilter("all");
                        setVehicleWingFilter("all");
                        setVehicleFlatFilter("all");
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
                      Clear Filters
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
                          "Member & Unit",
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
                          key={`${vehicle.memberId}-${vehicle.id}`}
                          className="hover:bg-blue-50/30 transition-colors duration-150 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                <span className="font-medium text-blue-700">
                                  {vehicle.memberName?.charAt(0) || "U"}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {vehicle.memberName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Unit {vehicle.memberUnit}
                                </div>
                              </div>
                            </div>
                          </td>
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
                              Start:{" "}
                              {vehicle.startDate
                                ? formatDateTime(vehicle.startDate)
                                : "-"}
                            </div>
                            <div>
                              End:{" "}
                              {vehicle.endDate
                                ? formatDateTime(vehicle.endDate)
                                : "-"}
                            </div>
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
                                      vehicle.memberId,
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
                                  handleUpdateVehicleStatus(
                                    vehicle.memberId,
                                    vehicle.id,
                                    true
                                  )
                                }
                                className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                              >
                                Mark as Current
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDeleteVehicle(
                                  vehicle.memberId,
                                  vehicle.id
                                )
                              }
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                            >
                              Delete
                            </button>
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
                  <button
                    onClick={() => setShowAddVehiclePopup(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
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
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    {/* Member Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Member
                      </label>
                      <select
                        required
                        value={selectedVehicleMember?.id || ""}
                        onChange={(e) => {
                          const member = members.find(
                            (m) => m.id === e.target.value
                          );
                          setSelectedVehicleMember(member || null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.unitNumber})
                          </option>
                        ))}
                      </select>
                    </div>

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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Parking space assigned
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RC Book Number
                      </label>
                      <input
                        type="text"
                        value={newVehicle.rcBookNumber || ""}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            rcBookNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="RC Book Number"
                      />
                    </div>

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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
          {activeTab === "serviceProviders" && (
            <div className="bg-white shadow-sm overflow-hidden rounded-xl">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Personnel Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage watchmen, accountants, sweepers, and other service
                    providers
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProvider(null);
                    setNewProvider({
                      name: "",
                      role: "Watchman",
                      phone: "",
                      email: "",
                      address: "",
                      monthlySalary: "",
                      joiningDate: new Date().toISOString().split("T")[0],
                      isActive: true,
                      documents: {
                        aadhaar: "",
                        pan: "",
                        contract: "",
                      },
                    });
                    setShowAddProviderPopup(true);
                  }}
                  className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  Add New Provider
                </button>
              </div>

              {/* Filter Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Role
                    </label>
                    <select
                      value={providerRoleFilter}
                      onChange={(e) => setProviderRoleFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Roles</option>
                      <option value="Watchman">Watchman</option>
                      <option value="Sweeper">Sweeper</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Gardener">Gardener</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={providerStatusFilter}
                      onChange={(e) => setProviderStatusFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setProviderRoleFilter("all");
                        setProviderStatusFilter("all");
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
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Providers Table */}
              <div className="shadow-xl overflow-hidden border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#152238]">
                      <tr>
                        {[
                          "Name",
                          "Role",
                          "Contact",
                          "Salary",
                          "Status",
                          "Joined",
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
                      {serviceProviders
                        .filter(
                          (provider) =>
                            (providerRoleFilter === "all" ||
                              provider.role === providerRoleFilter) &&
                            (providerStatusFilter === "all" ||
                              (providerStatusFilter === "active" &&
                                provider.isActive) ||
                              (providerStatusFilter === "inactive" &&
                                !provider.isActive))
                        )
                        .map((provider) => (
                          <tr
                            key={provider.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                  <span className="font-medium text-blue-700">
                                    {provider.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {provider.name}
                                  </div>
                                  {provider.email && (
                                    <div className="text-sm text-gray-500">
                                      {provider.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {provider.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {provider.phone}
                              </div>
                              {provider.address && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {provider.address}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{provider.monthlySalary}
                              </div>
                              <div className="text-xs text-gray-500">
                                per month
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  provider.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {provider.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(provider.joiningDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => handleEditProvider(provider)}
                                  className="text-blue-600 hover:text-blue-900 text-left cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleProviderStatus(
                                      provider.id,
                                      provider.isActive
                                    )
                                  }
                                  className={`text-left cursor-pointer ${
                                    provider.isActive
                                      ? "text-orange-600 hover:text-orange-900"
                                      : "text-green-600 hover:text-green-900"
                                  }`}
                                >
                                  {provider.isActive
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProvider(provider.id)
                                  }
                                  className="text-red-600 hover:text-red-900 text-left cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {serviceProviders.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-24 h-24 text-black rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <ServiceProviderIcon />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No service providers found
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Add service providers to start managing them
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Service Provider Popup */}
        {showAddProviderPopup && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingProvider
                    ? "Edit Service Provider"
                    : "Add New Service Provider"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddProviderPopup(false);
                    setEditingProvider(null);
                  }}
                  className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>

              <div className="p-6">
                <form
                  onSubmit={
                    editingProvider ? handleUpdateProvider : handleAddProvider
                  }
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newProvider.name}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Full Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={newProvider.role}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="Watchman">Watchman</option>
                        <option value="Sweeper">Sweeper</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Electrician">Electrician</option>
                        <option value="Plumber">Plumber</option>
                        <option value="Gardener">Gardener</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={newProvider.phone}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Phone Number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newProvider.email}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Email Address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Salary <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={newProvider.monthlySalary}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            monthlySalary: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Salary Amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Joining Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newProvider.joiningDate}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            joiningDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={newProvider.address}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Full Address"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newProvider.isActive}
                      onChange={(e) =>
                        setNewProvider({
                          ...newProvider,
                          isActive: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Active Service Provider
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={isAddingProvider || isEditingProvider}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {editingProvider
                        ? isEditingProvider
                          ? "Updating..."
                          : "Update Provider"
                        : isAddingProvider
                        ? "Adding..."
                        : "Add Provider"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProviderPopup(false);
                        setEditingProvider(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 text-center transition-colors flex items-center justify-center cursor-pointer"
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
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
    </div>
  );
}
