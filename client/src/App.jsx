import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import HomeView from './components/HomeView';
import DiscoverView from './components/DiscoverView';
import ConnectionsView from './components/ConnectionsView';
import ChatView from './components/ChatView';
import ProfileView from './components/ProfileView';
import StudentDirectoryView from './components/StudentDirectoryView';
import AdminView from './components/AdminView';

import AuthModal from './components/AuthModal';
import MatchModal from './components/MatchModal';
import OnboardingModal from './components/OnboardingModal';
import NotificationsDrawer from './components/NotificationsDrawer';
import EditStudentModal from './components/EditStudentModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

import {
  authApi,
  profileApi,
  discoverApi,
  connectionApi,
  chatApi,
  notificationApi,
} from './services/campusApi';
import { initSocketClient, getSocket, disconnectSocket } from './services/socket';
import { fireConfetti } from './utils/confetti';

import {
  fetchStudents,
  fetchStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from './services/api';

/**
 * Main CampusMitra Application Component
 * Full-stack MERN campus social and networking platform.
 * Real MongoDB data, strict @mitwpu.edu.in authentication,
 * dynamic interest compatibility, real-time Socket.IO chat,
 * 6-photo profiles, admin moderation, and Student Directory CRUD.
 */
export default function App() {
  // Navigation & Auth State
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem('campusmitra_token') ? 'home' : 'landing'
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Real Campus Data Collections
  const [discoverProfiles, setDiscoverProfiles] = useState([]);
  const [connections, setConnections] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Modals & UI Controls
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // MERN CRUD State (Student Directory)
  const [students, setStudents] = useState([]);
  const [storageMode, setStorageMode] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [crudError, setCrudError] = useState(null);

  // CRUD Modals
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Global Toast Helper
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  // =========================================================================
  // Load Real Campus Data
  // =========================================================================
  const loadDiscoverProfiles = useCallback(async () => {
    try {
      const res = await discoverApi.getProfiles();
      if (res.success) {
        setDiscoverProfiles(res.data || []);
      }
    } catch (err) {
      console.warn('Discover load failed:', err.message);
    }
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      const res = await connectionApi.getConnections();
      if (res.success) {
        setConnections(res.data || []);
      }
    } catch (err) {
      console.warn('Connections load failed:', err.message);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      if (res.success) {
        setConversations(res.data || []);
      }
    } catch (err) {
      console.warn('Conversations load failed:', err.message);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.warn('Notifications load failed:', err.message);
    }
  }, []);

  // Fetch Current Logged In Student
  const checkAuthAndLoad = useCallback(async () => {
    const token = localStorage.getItem('campusmitra_token');
    if (!token) {
      setCurrentUser(null);
      setCurrentProfile(null);
      setActiveTab('landing');
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setCurrentUser(res.data.user);
        setCurrentProfile(res.data.profile);
        initSocketClient();

        // Load social records concurrently
        loadDiscoverProfiles();
        loadConnections();
        loadConversations();
        loadNotifications();
      } else {
        throw new Error('Invalid session');
      }
    } catch {
      localStorage.removeItem('campusmitra_token');
      setCurrentUser(null);
      setCurrentProfile(null);
      setActiveTab('landing');
    }
  }, [
    loadDiscoverProfiles,
    loadConnections,
    loadConversations,
    loadNotifications,
  ]);

  // Load Student Directory CRUD
  const loadStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    setCrudError(null);
    try {
      const response = await fetchStudents();
      if (response.success) {
        setStudents(response.data || []);
        if (response.storageMode) setStorageMode(response.storageMode);
      } else {
        throw new Error(response.message || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setCrudError(
        err.message ||
          'Unable to reach backend at http://localhost:5000. Ensure the server is running.'
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    checkAuthAndLoad();
    loadStudents();
  }, [checkAuthAndLoad, loadStudents]);

  // Setup Socket.IO Event Handlers
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !currentUser) return;

    const handleMatchCelebration = (data) => {
      setMatchedUser(data.matchedUser);
      setIsMatchModalOpen(true);
      fireConfetti(3000);
      loadConnections();
      loadConversations();
      loadNotifications();
    };

    const handleNewMessage = () => {
      loadConversations();
    };

    socket.on('match_celebration', handleMatchCelebration);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('match_celebration', handleMatchCelebration);
      socket.off('new_message', handleNewMessage);
    };
  }, [currentUser, loadConnections, loadConversations, loadNotifications]);

  // =========================================================================
  // Auth Handlers
  // =========================================================================
  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user, profile) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setIsAuthModalOpen(false);
    initSocketClient();
    setActiveTab('home');
    showToast(`Welcome to CampusMitra, ${user.firstName}! ✨`, 'success');

    loadDiscoverProfiles();
    loadConnections();
    loadConversations();
    loadNotifications();
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('campusmitra_token');
    setCurrentUser(null);
    setCurrentProfile(null);
    setActiveTab('landing');
    showToast('You have been logged out. See you soon! 👋', 'info');
  };

  // =========================================================================
  // Social & Discovery Swiping Handlers
  // =========================================================================
  const handleSwipeRight = async (candidate) => {
    const targetUserId = candidate.userId || candidate.id;
    try {
      const res = await connectionApi.sendInterest(targetUserId);

      // Remove from discover deck immediately
      setDiscoverProfiles((prev) =>
        prev.filter((p) => (p.userId || p.id) !== targetUserId)
      );

      if (res.data?.isMatch) {
        setMatchedUser(
          res.data.matchedUser || {
            id: targetUserId,
            name: candidate.name,
            avatar: candidate.avatar || candidate.photos?.[0],
            program: candidate.program,
          }
        );
        setIsMatchModalOpen(true);
        fireConfetti(3000);
        loadConnections();
        loadConversations();
      } else {
        showToast(`Interest sent to ${candidate.name} 💜`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleSwipeLeft = async (candidate) => {
    const targetUserId = candidate.userId || candidate.id;
    try {
      await connectionApi.sendPass(targetUserId);
      setDiscoverProfiles((prev) =>
        prev.filter((p) => (p.userId || p.id) !== targetUserId)
      );
    } catch (err) {
      console.warn('Pass action failed:', err.message);
    }
  };

  const handleShowFriendshipToast = (name) => {
    showToast(`Wave sent to ${name}! 👋 They will be notified.`, 'success');
  };

  const handleStartChat = (student) => {
    setActiveChatUser(student);
    setIsMatchModalOpen(false);
    setActiveTab('chat');
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      showToast('All notifications marked as read', 'info');
    } catch (err) {
      console.warn('Mark read failed:', err.message);
    }
  };

  // =========================================================================
  // Student Directory CRUD Handlers
  // =========================================================================
  const handleAddStudent = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await createStudent(formData);
      showToast(
        result.message || `Student "${formData.name}" enrolled successfully!`,
        'success'
      );
      await loadStudents();
    } catch (err) {
      console.error('Error adding student:', err);
      showToast(err.message || 'Failed to add student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);

    const studentId = student._id || student.id;
    try {
      const result = await fetchStudentById(studentId);
      if (result.success && result.data) {
        setEditingStudent(result.data);
      }
    } catch {
      // Kept fallback to table row
    }
  };

  const handleSaveEdit = async (formData) => {
    if (!editingStudent) return;
    setIsSubmitting(true);
    const studentId = editingStudent._id || editingStudent.id;

    try {
      const result = await updateStudent(studentId, formData);
      showToast(
        result.message || `Student "${formData.name}" updated successfully!`,
        'success'
      );
      setIsEditModalOpen(false);
      setEditingStudent(null);
      await loadStudents();
    } catch (err) {
      console.error('Error updating student:', err);
      showToast(err.message || 'Failed to update student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (id, studentName) => {
    setIsDeleting(true);
    try {
      const result = await deleteStudent(id);
      showToast(
        result.message || `Student "${studentName}" deleted successfully.`,
        'success'
      );
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);

      if (
        editingStudent &&
        (editingStudent._id === id || editingStudent.id === id)
      ) {
        setIsEditModalOpen(false);
        setEditingStudent(null);
      }

      await loadStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
      showToast(err.message || 'Failed to delete student.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Badge calculations
  const unreadChatCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );
  const unreadNotificationCount = notifications.filter(
    (n) => !n.isRead && !n.read
  ).length;

  return (
    <div className="campus-app-shell">
      {/* Soft Ambient Sparkle Meshes */}
      <div className="ambient-background-mesh" aria-hidden="true">
        <div className="ambient-blob blob-purple" />
        <div className="ambient-blob blob-blue" />
        <div className="ambient-blob blob-pink" />
      </div>

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadChatCount}
        notificationCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLaunchOnboarding={() => setIsOnboardingOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
      />

      {/* Global Toast */}
      {toast && (
        <div className={`campus-toast toast-${toast.type} animate-slide-down`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Router */}
      <main className="campus-main-content">
        {/* LANDING VIEW (Unauthenticated) */}
        {activeTab === 'landing' && (
          <LandingView onOpenAuth={handleOpenAuth} />
        )}

        {/* HOME VIEW */}
        {activeTab === 'home' && (
          <HomeView
            user={currentUser}
            profile={currentProfile}
            onNavigate={setActiveTab}
            onOpenMatch={(p) => {
              setMatchedUser(p);
              setIsMatchModalOpen(true);
            }}
            discoverProfiles={discoverProfiles}
            connectionsCount={connections.length}
            unreadCount={unreadChatCount}
          />
        )}

        {/* DISCOVER VIEW */}
        {activeTab === 'discover' && (
          <DiscoverView
            profiles={discoverProfiles}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onRefresh={loadDiscoverProfiles}
          />
        )}

        {/* CONNECTIONS VIEW */}
        {activeTab === 'connections' && (
          <ConnectionsView
            connections={connections}
            onStartChat={handleStartChat}
            onShowFriendshipToast={handleShowFriendshipToast}
            onNavigate={setActiveTab}
          />
        )}

        {/* REAL-TIME CHAT VIEW */}
        {activeTab === 'chat' && (
          <ChatView
            conversations={conversations}
            activeChatUser={activeChatUser}
            currentUser={currentUser}
            onNavigate={setActiveTab}
            onRefreshConversations={loadConversations}
          />
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <ProfileView
            user={currentUser}
            profile={currentProfile}
            onProfileUpdated={(updated) => setCurrentProfile(updated)}
            onNavigate={setActiveTab}
            showToast={showToast}
          />
        )}

        {/* STUDENT DIRECTORY API (MERN CRUD) */}
        {activeTab === 'records' && (
          <StudentDirectoryView
            students={students}
            isLoading={isLoadingStudents}
            error={crudError}
            storageMode={storageMode}
            onRefresh={loadStudents}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            isSubmitting={isSubmitting}
            editingStudentId={editingStudent?._id || editingStudent?.id}
          />
        )}

        {/* ADMIN & SAFETY VIEW (Admin Role Only) */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminView onToast={showToast} />
        )}
      </main>

      {/* AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* MUTUAL MATCH CELEBRATION MODAL */}
      <MatchModal
        isOpen={isMatchModalOpen}
        matchedUser={matchedUser}
        currentUser={currentUser}
        onStartChat={handleStartChat}
        onClose={() => setIsMatchModalOpen(false)}
      />

      {/* ONBOARDING JOURNEY MODAL */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        userName={currentUser?.firstName || 'Student'}
      />

      {/* NOTIFICATIONS DRAWER */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigate={setActiveTab}
      />

      {/* CRUD EDIT STUDENT MODAL */}
      <EditStudentModal
        student={editingStudent}
        isOpen={isEditModalOpen}
        onSave={handleSaveEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        isSubmitting={isSubmitting}
      />

      {/* CRUD DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        student={studentToDelete}
        isOpen={isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        isDeleting={isDeleting}
      />

      {/* GLOBAL FOOTER */}
      <footer className="campus-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🎓 CampusMitra</span>
            <span className="footer-tagline">
              Connecting Students Across MIT-WPU &bull; Full-Stack MERN Architecture
            </span>
          </div>
          <div className="footer-links">
            <button type="button" onClick={() => setActiveTab('home')}>Home</button>
            <button type="button" onClick={() => setActiveTab('discover')}>Discover</button>
            <button type="button" onClick={() => setActiveTab('records')}>Directory API (CRUD)</button>
            <button type="button" onClick={() => setIsOnboardingOpen(true)}>Tour</button>
          </div>
          <p className="footer-copy">
            CampusMitra is an independent student project. Not an official MIT-WPU service.
          </p>
        </div>
      </footer>
    </div>
  );
}
