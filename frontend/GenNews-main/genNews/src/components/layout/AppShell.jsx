import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, UserCircle, Globe2, Gavel, Cpu, Briefcase, Clapperboard, Microscope, Dribbble, ChevronRight, Lock, LayoutDashboard, LogOut, User, PenTool, RefreshCw, Home, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import client from '../../api/client';

// --- Profile Menu Dropdown ---
function ProfileMenu({ user, logout, isOpen, setIsOpen }) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-[#121212] border border-white/[0.08] rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-5 py-4 border-b border-white/[0.05] mb-2">
        <p className="text-sm font-bold text-white capitalize cursor-pointer">{user?.name || 'User'}</p>
        <p className="text-[11px] text-gray-400 truncate cursor-pointer">{user?.email}</p>
      </div>

      <div className="px-2 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors group"
        >
          <LogOut className="w-4 h-4 mr-3 text-rose-400" />
          Log Out
        </button>
      </div>
    </div>
  );
}

// --- Dashboard Component ---
function DashboardLocked({ isExpanded }) {
  return (
    <Link to="/login" className={`flex items-center p-2 mb-6 group rounded-2xl transition-all cursor-pointer ${isExpanded ? 'w-full bg-white/[0.04] hover:bg-white/[0.07] p-4' : 'justify-center mx-auto w-12 h-12 hover:bg-white/[0.05]'}`} title="Sign in to start metrics">
      <div className={`rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors ${isExpanded ? 'w-10 h-10 flex-shrink-0' : 'w-10 h-10'}`}>
        <Lock className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
      </div>
      {isExpanded && (
        <div className="ml-3 flex flex-col items-start overflow-hidden whitespace-nowrap">
          <span className="text-sm font-bold text-gray-200">Dashboard Locked</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sign in for metrics</span>
        </div>
      )}
    </Link>
  );
}

function DashboardPanel({ isExpanded, user }) {
  const postsMade = user?.metrics?.posts_made ?? 0;
  const totalViews = user?.metrics?.total_views ?? 0;

  const [activeTab, setActiveTab] = React.useState('views'); // 'views' or 'posts'
  const [recentVisits, setRecentVisits] = React.useState([]);
  const [recentPosts, setRecentPosts] = React.useState([]);

  React.useEffect(() => {
    const loadActivity = () => {
      try {
        const visits = JSON.parse(localStorage.getItem('gennews_recent_visits') || '[]');
        setRecentVisits(visits.slice(0, 3)); 
        
        const userEmail = user?.email || 'guest';
        const postsKey = `gennews_user_posts_${userEmail}`;
        const posts = JSON.parse(localStorage.getItem(postsKey) || '[]');
        setRecentPosts(posts.slice(0, 3));
      } catch { 
        setRecentVisits([]); 
        setRecentPosts([]); 
      }
    };
    loadActivity();
    const interval = setInterval(loadActivity, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!isExpanded) {
    return (
      <div className="flex flex-col items-center space-y-4 mb-8 mt-2">
        <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full"></span>
        </div>
        <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-black text-white">{postsMade}</span>
            <div className="w-4 h-[1px] bg-white/10"></div>
            <span className="text-[11px] font-black text-gray-400">{totalViews}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
        
        <div className="relative bg-[#1a1a2e]/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5 overflow-hidden flex flex-col h-full min-h-[340px]">
            {/* Abstract background shape */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl flex-shrink-0" />
            
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <User className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white tracking-tight">{user?.name || 'Researcher'}</span>
                        <span className="text-[9px] text-cyan-400/70 font-bold uppercase tracking-widest">Active Member</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 flex-shrink-0">
                <div className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-xl p-3 border border-white/[0.05] group/stat">
                    <div className="flex items-center gap-1.5 mb-1">
                        <PenTool className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Posts</span>
                    </div>
                    <div className="text-xl font-black text-white group-hover/stat:text-cyan-400 transition-colors">{postsMade}</div>
                </div>
                <div className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-xl p-3 border border-white/[0.05] group/stat">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Globe2 className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Views</span>
                    </div>
                    <div className="text-xl font-black text-white group-hover/stat:text-blue-400 transition-colors">{totalViews}</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-3 px-1 border-b border-white/5 pb-2">
                    <button 
                        onClick={() => setActiveTab('views')}
                        className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md transition-colors ${activeTab === 'views' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Recent Views
                    </button>
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md transition-colors ${activeTab === 'posts' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Your Posts
                    </button>
                </div>
                
                <div className="space-y-1.5 min-h-[140px]">
                    {activeTab === 'views' && (
                        recentVisits.length === 0 ? (
                            <div className="text-center py-4 bg-white/[0.02] rounded-xl border border-white/[0.05] h-full flex items-center justify-center flex-col">
                                <p className="text-[11px] text-gray-600 italic">No articles visited yet</p>
                            </div>
                        ) : (
                            recentVisits.map((visit) => (
                                <Link 
                                    key={`visit-${visit.id}`} 
                                    to={`/articles/${visit.id}`}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group/item"
                                >
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/5 flex-shrink-0">
                                        {visit.image_url ? (
                                            <img src={visit.image_url} alt="" className="w-full h-full object-cover opacity-70" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[11px] font-bold text-gray-200 truncate group-hover/item:text-white">{visit.title}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-gray-500 truncate">{visit.publisher_name}</span>
                                            <span className="text-[9px] text-gray-600">· {timeAgo(visit.visited_at)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )
                    )}

                    {activeTab === 'posts' && (
                        recentPosts.length === 0 ? (
                            <div className="text-center py-4 bg-white/[0.02] rounded-xl border border-white/[0.05] h-full flex flex-col items-center justify-center">
                                <p className="text-[11px] text-gray-600 italic mb-2">No recent posts</p>
                                <Link to="/analyze" className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider bg-white/5 py-1.5 px-3 rounded-lg border border-cyan-500/20">Post an article →</Link>
                            </div>
                        ) : (
                            recentPosts.map((post) => (
                                <div key={`post-${post.id || Math.random()}`} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 mb-1.5">
                                    <div className={`w-8 h-8 rounded-lg outline outline-1 outline-offset-[-1px] flex-shrink-0 flex items-center justify-center
                                        ${post.verdict === 'Reliable' ? 'bg-emerald-500/10 outline-emerald-500/30 text-emerald-400' :
                                          post.verdict === 'Mixed' ? 'bg-amber-500/10 outline-amber-500/30 text-amber-400' : 
                                          'bg-red-500/10 outline-red-500/30 text-red-400'}`}
                                    >
                                        <PenTool className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[11px] font-bold text-gray-200 truncate">{post.title}</span>
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider
                                                ${post.verdict === 'Reliable' ? 'text-emerald-500' :
                                                  post.verdict === 'Mixed' ? 'text-amber-500' : 'text-red-500'}`}
                                            >
                                                {post.verdict}
                                            </span>
                                            <span className="text-[9px] text-gray-600">· {timeAgo(post.posted_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/5 mx-1 flex-shrink-0">
                     <Link to="/analyze" className="w-full py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-[11px] font-bold text-center text-white transition-colors flex items-center justify-center gap-2 group/btn">
                        <PenTool className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-cyan-400 transition-colors" />
                        SUBMIT NEW POST
                     </Link>
                </div>
            </div>
        </div>
    </div>
  )
}

// --- Sidebar Component ---
export function Sidebar({ mobileMenuOpen, setMobileMenuOpen, isExpanded }) {
  const { isAuthenticated, user } = useAuth();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  const handleFetch = async () => {
    setIsFetching(true);
    setFetchMessage('');
    try {
      const res = await client.post('/api/fetch');
      setFetchMessage('Fetch started in background!');
      setTimeout(() => setFetchMessage(''), 3000);
    } catch (err) {
      setFetchMessage('Fetch failed.');
      setTimeout(() => setFetchMessage(''), 3000);
    } finally {
      setIsFetching(false);
    }
  };

  // Icons matched to the mockup
  const categories = [
    { name: 'world news', label: 'World News', icon: <Globe2 className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
    { name: 'politics', label: 'Politics', icon: <Gavel className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
    { name: 'technology', label: 'Technology', icon: <Cpu className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
    { name: 'business', label: 'Business', icon: <Briefcase className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
    { name: 'entertainment', label: 'Entertainment', icon: <Clapperboard className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
    { name: 'science', label: 'Science', icon: <Microscope className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
    { name: 'sports', label: 'Sports', icon: <Dribbble className="w-5 h-5 opacity-70 group-hover:opacity-100" /> },
  ];

  const sidebarWidth = (isExpanded || mobileMenuOpen) ? 'w-64' : 'w-[72px]';
  const sidebarClasses = `
    flex flex-col bg-[#121212] border-r border-white/[0.08]
    transform transition-all duration-300 ease-in-out z-40 p-2
    ${mobileMenuOpen ? 'fixed inset-y-0 left-0 translate-x-0 w-64 z-[70] shadow-2xl' : 'fixed inset-y-0 left-0 -translate-x-full w-64 z-[70] sm:relative sm:translate-x-0 sm:z-40'}
    sm:sticky sm:top-[80px] sm:h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden hide-scrollbar ${sidebarWidth} 
  `;


  // Force expanded visually on mobile if the menu is open
  const visuallyExpanded = isExpanded || mobileMenuOpen;

  return (
    <>
      <aside className={sidebarClasses}>
        <div className={`flex flex-col w-full h-full py-6 ${visuallyExpanded ? 'px-4' : 'items-center px-1'}`}>

          <div className="w-full">
            {isAuthenticated ? <DashboardPanel isExpanded={visuallyExpanded} user={user} /> : <DashboardLocked isExpanded={visuallyExpanded} />}
          </div>

          <div className="flex-grow flex flex-col space-y-2 w-full mt-2">
            <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                title={!visuallyExpanded ? "Home" : ""}
                className={({ isActive }) => `
                  w-full flex items-center rounded-2xl transition-all duration-300 group relative
                  ${visuallyExpanded ? 'px-4 py-3 justify-start' : 'h-[52px] justify-center mx-1'}
                  ${isActive
                    ? 'text-white bg-white/[0.1] shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'}
                `}
            >
                {({ isActive }) => (
                  <>
                    <div className="flex-shrink-0"><Home className="w-5 h-5 opacity-70 group-hover:opacity-100" /></div>
                    {visuallyExpanded && (
                      <span className="ml-4 text-sm font-medium whitespace-nowrap">Home</span>
                    )}
                  </>
                )}
            </NavLink>

            {visuallyExpanded && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-4 mb-2 mt-4">Categories</span>}

            {categories.map((c) => (
              <NavLink
                key={c.name}
                to={`/category/${c.name}`}
                onClick={() => setMobileMenuOpen(false)}
                title={!visuallyExpanded ? c.label : ''}
                className={({ isActive }) => `
                  w-full flex items-center rounded-2xl transition-all duration-300 group relative
                  ${visuallyExpanded ? 'px-4 py-3 justify-start' : 'h-[52px] justify-center mx-1'}
                  ${isActive
                    ? 'text-white bg-white/[0.1] shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex-shrink-0">{c.icon}</div>
                    {visuallyExpanded && (
                      <span className="ml-4 text-sm font-medium whitespace-nowrap">{c.label}</span>
                    )}

                    {!visuallyExpanded && isActive && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-gray-500">
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
          
          <div className="mt-4 px-2 w-full">
             <NavLink
                to="/analyze"
                onClick={() => setMobileMenuOpen(false)}
                title={!visuallyExpanded ? "Post Article" : ""}
                className={({ isActive }) => `
                  w-full flex items-center rounded-2xl transition-all duration-300 group relative border border-white/10
                  ${visuallyExpanded ? 'px-4 py-3 justify-start' : 'h-[52px] justify-center mx-1'}
                  ${isActive
                    ? 'text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : 'text-gray-300 bg-white/5 hover:text-white hover:bg-white/10'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex-shrink-0"><PenTool className={`w-5 h-5 ${isActive ? 'opacity-100 text-black' : 'opacity-70 group-hover:opacity-100 group-hover:text-cyan-400'}`} /></div>
                    {visuallyExpanded && (
                      <span className="ml-4 text-sm font-bold whitespace-nowrap">Post Article</span>
                    )}
                  </>
                )}
              </NavLink>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.08] w-full">
            <button
                onClick={handleFetch}
                disabled={isFetching}
                title={!visuallyExpanded ? "Trigger Pipeline" : ""}
                className={`w-full flex items-center justify-center rounded-2xl transition-all group relative border cursor-pointer
                    ${visuallyExpanded ? 'px-4 py-3 bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'h-[52px] w-[52px] mx-auto bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'}
                `}
            >
                {isFetching ? (
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <RefreshCw className={`w-5 h-5 ${visuallyExpanded ? 'mr-3' : 'group-hover:text-cyan-400'}`} />
                )}
                {visuallyExpanded && <span className="text-sm font-bold tracking-wider uppercase whitespace-nowrap">{isFetching ? 'Fetching...' : 'Fetch News'}</span>}
            </button>
            {fetchMessage && visuallyExpanded && (
                <p className="text-xs text-center text-cyan-400 mt-2 font-medium">{fetchMessage}</p>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[65] sm:hidden backdrop-blur-md transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

// --- TopNav Component ---
export function TopNav({ toggleMobileMenu, toggleDesktopMenu }) {
  const { isAuthenticated, logout, user } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#121212]/95 backdrop-blur-md h-[80px] border-b border-white/[0.08]">
      <div className="flex items-center h-full px-2 md:px-4 gap-2 md:gap-4">

        {/* Toggle Menus */}
        <button
          className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={toggleMobileMenu}
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          className="hidden sm:flex p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
          onClick={toggleDesktopMenu}
          title="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Branding Title */}
        <div className="flex-shrink-0 ml-2 hidden sm:block">
          <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center group">
            <span className="text-white">Veri</span>
            <span className="text-white">Sight</span>
            <div className="ml-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-4xl relative group">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search news, topics, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/[0.05] border-none rounded-full text-[13px] md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.08] transition-all"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 md:space-x-3 ml-auto">
          {isAuthenticated ? (
            <>
              <button className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-colors relative border border-transparent hover:border-white/[0.1]">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  title="Profile Settings"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/[0.1] overflow-hidden ${profileOpen ? 'ring-2 ring-white/50 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''}`}
                >
                  <User className="w-5 h-5" />
                </button>

                <ProfileMenu
                  user={user}
                  logout={logout}
                  isOpen={profileOpen}
                  setIsOpen={setProfileOpen}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2 text-sm font-bold text-black bg-white hover:bg-gray-200 rounded-full transition-all shadow-lg cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// --- AppShell Component ---
export function AppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col font-sans">
      <TopNav
        toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        toggleDesktopMenu={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Container */}
      <div className="flex flex-1 w-full relative mt-[80px]">

        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isExpanded={isSidebarExpanded}
        />

        <main className="flex-1 w-full min-w-0 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
