import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import './index.css';
import projects from './projects.json';

// Helper function to handle image URLs with base path
const getImageUrl = (path) => {
  // Handle external URLs (like GitHub opengraph images)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Prepend base URL for local images
  const base = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path if base already ends with one
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};

export default function Portfolio() {
  return (
    <Router basename={import.meta.env.BASE_URL || ''}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:projectId" element={<ProjectDetailPageWrapper />} />
      </Routes>
    </Router>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({ logo: '', url: '' });
  const [slideDirection, setSlideDirection] = useState('left');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const tabOrder = ['all', 'web', 'ai', 'ux'];
  
  // Smooth scroll state
  const scrollRef = useRef({ current: 0, target: 0 });
  const rafRef = useRef(null);
  
  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouchScreen = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
      );
      const isSmallScreen = window.innerWidth <= 768;
      setIsTouchDevice(hasTouchScreen || isSmallScreen);
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);
  
  // Optimized smooth scroll - stops when idle
  useEffect(() => {
    if (isTouchDevice) return;
    
    const ease = 0.08;
    let isAnimating = false;
    
    const handleWheel = (e) => {
      e.preventDefault();
      scrollRef.current.target += e.deltaY;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current.target = Math.max(0, Math.min(scrollRef.current.target, maxScroll));
      
      // Start animation if not already running
      if (!isAnimating) {
        isAnimating = true;
        rafRef.current = requestAnimationFrame(smoothScroll);
      }
    };
    
    const smoothScroll = () => {
      const diff = scrollRef.current.target - scrollRef.current.current;
      
      // Stop animating if difference is negligible (< 0.5px)
      if (Math.abs(diff) > 0.5) {
        scrollRef.current.current += diff * ease;
        window.scrollTo(0, scrollRef.current.current);
        rafRef.current = requestAnimationFrame(smoothScroll);
      } else {
        // Snap to target and stop
        scrollRef.current.current = scrollRef.current.target;
        window.scrollTo(0, scrollRef.current.current);
        isAnimating = false;
        rafRef.current = null;
      }
    };
    
    // Initialize scroll position
    scrollRef.current.current = window.scrollY;
    scrollRef.current.target = window.scrollY;
    
    const handleKeyDown = (e) => {
      const scrollAmount = 100;
      let shouldScroll = false;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollRef.current.target += e.key === 'PageDown' ? window.innerHeight : scrollAmount;
        shouldScroll = true;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollRef.current.target -= e.key === 'PageUp' ? window.innerHeight : scrollAmount;
        shouldScroll = true;
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollRef.current.target = 0;
        shouldScroll = true;
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollRef.current.target = document.documentElement.scrollHeight - window.innerHeight;
        shouldScroll = true;
      }
      
      if (shouldScroll) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollRef.current.target = Math.max(0, Math.min(scrollRef.current.target, maxScroll));
        
        // Start animation if not already running
        if (!isAnimating) {
          isAnimating = true;
          rafRef.current = requestAnimationFrame(smoothScroll);
        }
      }
    };
    
    const handleResize = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current.target = Math.min(scrollRef.current.target, maxScroll);
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isTouchDevice]);
  
  useEffect(() => {
    if (isTouchDevice) return;
    
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      setTooltipPos(prev => ({
        x: prev.x + (e.clientX - prev.x) * 0.10,
        y: prev.y + (e.clientY - prev.y) * 0.10
      }));
      
      if (!isVisible) setIsVisible(true);
    };
    
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    
    const links = document.querySelectorAll('a[data-tooltip]');
    links.forEach(link => {
      link.addEventListener('mouseenter', (e) => {
        setTooltipData({
          logo: e.target.getAttribute('data-logo'),
          url: e.target.getAttribute('data-url')
        });
        setTooltipVisible(true);
      });
      link.addEventListener('mouseleave', () => {
        setTooltipVisible(false);
      });
    });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, isTouchDevice]);
  
  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(p => p.category === activeTab);

  const openProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="portfolio-container">
      {/* Liquid Glass Cursor */}
      {!isTouchDevice && isVisible && (
        <div 
          className="liquid-cursor"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: `translate(-50%, -50%) scale(${isPressed ? 0.75 : 1})`,
            width: '36px',
            height: '36px'
          }}
        >
          <div className="liquid-cursor-body" />
          <div className="liquid-cursor-dot">
            <div className="liquid-cursor-dot-inner" />
          </div>
        </div>
      )}
      
      {/* Glass Tooltip */}
      {!isTouchDevice && tooltipVisible && (
        <div 
          className="glass-tooltip"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            opacity: tooltipVisible ? 1 : 0,
          }}
        >
          {tooltipData.logo && <img src={tooltipData.logo} alt="site logo" className="tooltip-logo" />}
          <span className="tooltip-url">{tooltipData.url}</span>
        </div>
      )}

      {/* Header */}
      <header className="portfolio-header">
        <h1 className="portfolio-name">Soheil Lotfi</h1>
        <p className="portfolio-bio">
          HCI Student at the intersection of HCI, UX, and AI
          <br />
          Master's student in HCI at <a 
            href="https://www.ip-paris.fr/" 
            target="_blank"
            data-tooltip="true"
            data-logo="https://www.google.com/s2/favicons?sz=64&domain=ip-paris.fr"
            data-url="ip-paris.fr"
          ><span className="portfolio-bio-underline">Institut Polytechnique de Paris</span></a>.
        </p>
        <div className="portfolio-header-links">
          <a 
            href="https://www.linkedin.com/in/soheil-lotfi" 
            className="portfolio-more-info" 
            target="_blank" 
            rel="noopener noreferrer"
            data-tooltip="true"
            data-logo="https://cdn-icons-png.flaticon.com/512/174/174857.png"
            data-url="linkedin.com"
          >
            ↗ LinkedIn
          </a>
          <span className="portfolio-link-separator">·</span>
          <a 
            href="mailto:soheil.lotfi@ip-paris.fr" 
            className="portfolio-more-info"
            data-tooltip="true"
            data-logo="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico"
            data-url="soheil.lotfi@ip-paris.fr"
            target='_blank'
          >
            Contact
          </a>
        </div>
        <div className='portfolio-bio'>* My research has not been discussed here.</div>
      </header>

      {/* Tabs */}
      <nav className="portfolio-tabs">
        <button 
          onClick={() => {
            if (tabOrder.indexOf('all') > tabOrder.indexOf(activeTab)) {
              setSlideDirection('right');
            } else {
              setSlideDirection('left');
            }
            setActiveTab('all');
          }}
          className={`portfolio-tab ${activeTab === 'all' ? 'active' : ''}`}
        >
          All
        </button>
        <button 
          onClick={() => {
            if (tabOrder.indexOf('web') > tabOrder.indexOf(activeTab)) {
              setSlideDirection('right');
            } else {
              setSlideDirection('left');
            }
            setActiveTab('web');
          }}
          className={`portfolio-tab ${activeTab === 'web' ? 'active' : ''}`}
        >
          Web
        </button>
        <button 
          onClick={() => {
            if (tabOrder.indexOf('ai') > tabOrder.indexOf(activeTab)) {
              setSlideDirection('right');
            } else {
              setSlideDirection('left');
            }
            setActiveTab('ai');
          }}
          className={`portfolio-tab ${activeTab === 'ai' ? 'active' : ''}`}
        >
          AI
        </button>
        <button 
          onClick={() => {
            if (tabOrder.indexOf('ux') > tabOrder.indexOf(activeTab)) {
              setSlideDirection('right');
            } else {
              setSlideDirection('left');
            }
            setActiveTab('ux');
          }}
          className={`portfolio-tab ${activeTab === 'ux' ? 'active' : ''}`}
        >
          UX
        </button>
      </nav>

      {/* Projects Grid */}
      <div className="portfolio-grid" key={activeTab} data-direction={slideDirection}>
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onClick={() => openProject(project.id)} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <article 
      className="portfolio-card"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="portfolio-image-wrapper">
        {imageError ? (
          <div 
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#e8e6e3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#999"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ color: '#999', fontSize: '12px', fontWeight: '500' }}>
              Image not available
            </span>
          </div>
        ) : (
          <img 
            src={getImageUrl(project.image)} 
            alt={project.title}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
        {project.badge && (
          <div className="portfolio-badge">
            <span className="portfolio-badge-dash">—</span>
            <span className="portfolio-badge-title">{project.badge}</span>
            <span className="portfolio-badge-sub">{project.badgeSub}</span>
          </div>
        )}
      </div>
      
      <div className="portfolio-card-content">
        <h3 className="portfolio-project-title">
          <span className="portfolio-project-title-bold">{project.title}</span>
          <span className="portfolio-project-title-light"> {project.subtitle}</span>
        </h3>
        
        <div className="portfolio-tag-row">
          <span className="portfolio-tag">{project.year}</span>
          {project.tags.map((tag, i) => (
            <span key={i} className="portfolio-tag">{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function ProjectDetailPageWrapper() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({ logo: '', url: '' });
  
  // Smooth scroll state
  const scrollRef = useRef({ current: 0, target: 0 });
  const rafRef = useRef(null);
  
  const project = projects.find(p => p.id === parseInt(projectId));
  
  // Reset scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    scrollRef.current = { current: 0, target: 0 };
  }, [projectId]);
  
  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouchScreen = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
      );
      const isSmallScreen = window.innerWidth <= 768;
      setIsTouchDevice(hasTouchScreen || isSmallScreen);
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // Optimized smooth scroll - stops when idle
  useEffect(() => {
    if (isTouchDevice) return;
    
    const ease = 0.08;
    let isAnimating = false;
    
    const handleWheel = (e) => {
      e.preventDefault();
      scrollRef.current.target += e.deltaY;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current.target = Math.max(0, Math.min(scrollRef.current.target, maxScroll));
      
      // Start animation if not already running
      if (!isAnimating) {
        isAnimating = true;
        rafRef.current = requestAnimationFrame(smoothScroll);
      }
    };
    
    const smoothScroll = () => {
      const diff = scrollRef.current.target - scrollRef.current.current;
      
      // Stop animating if difference is negligible (< 0.5px)
      if (Math.abs(diff) > 0.5) {
        scrollRef.current.current += diff * ease;
        window.scrollTo(0, scrollRef.current.current);
        rafRef.current = requestAnimationFrame(smoothScroll);
      } else {
        // Snap to target and stop
        scrollRef.current.current = scrollRef.current.target;
        window.scrollTo(0, scrollRef.current.current);
        isAnimating = false;
        rafRef.current = null;
      }
    };
    
    // Initialize scroll position
    scrollRef.current.current = window.scrollY;
    scrollRef.current.target = window.scrollY;
    
    const handleKeyDown = (e) => {
      const scrollAmount = 100;
      let shouldScroll = false;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollRef.current.target += e.key === 'PageDown' ? window.innerHeight : scrollAmount;
        shouldScroll = true;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollRef.current.target -= e.key === 'PageUp' ? window.innerHeight : scrollAmount;
        shouldScroll = true;
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollRef.current.target = 0;
        shouldScroll = true;
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollRef.current.target = document.documentElement.scrollHeight - window.innerHeight;
        shouldScroll = true;
      }
      
      if (shouldScroll) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollRef.current.target = Math.max(0, Math.min(scrollRef.current.target, maxScroll));
        
        // Start animation if not already running
        if (!isAnimating) {
          isAnimating = true;
          rafRef.current = requestAnimationFrame(smoothScroll);
        }
      }
    };
    
    const handleResize = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current.target = Math.min(scrollRef.current.target, maxScroll);
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isTouchDevice]);

  useEffect(() => {
    if (isTouchDevice) return;
    
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      setTooltipPos(prev => ({
        x: prev.x + (e.clientX - prev.x) * 0.10,
        y: prev.y + (e.clientY - prev.y) * 0.10
      }));
      
      if (!isVisible) setIsVisible(true);
    };
    
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    
    const links = document.querySelectorAll('a[data-tooltip]');
    links.forEach(link => {
      link.addEventListener('mouseenter', (e) => {
        setTooltipData({
          logo: e.target.getAttribute('data-logo'),
          url: e.target.getAttribute('data-url')
        });
        setTooltipVisible(true);
      });
      link.addEventListener('mouseleave', () => {
        setTooltipVisible(false);
      });
    });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, isTouchDevice]);
  
  if (!project) {
    return (
      <div className="portfolio-container">
        <div className="project-detail-page">
          <h1>Project not found</h1>
          <button onClick={() => navigate('/')} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  const goBackHome = () => {
    navigate('/');
  };

  return (
    <div className="portfolio-container">
      {/* Liquid Glass Cursor */}
      {!isTouchDevice && isVisible && (
        <div 
          className="liquid-cursor"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: `translate(-50%, -50%) scale(${isPressed ? 0.75 : 1})`,
            width: '36px',
            height: '36px'
          }}
        >
          <div className="liquid-cursor-body" />
          <div className="liquid-cursor-dot">
            <div className="liquid-cursor-dot-inner" />
          </div>
        </div>
      )}
      
      {/* Glass Tooltip */}
      {!isTouchDevice && tooltipVisible && (
        <div 
          className="glass-tooltip"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            opacity: tooltipVisible ? 1 : 0,
          }}
        >
          {tooltipData.logo && <img src={tooltipData.logo} alt="site logo" className="tooltip-logo" />}
          <span className="tooltip-url">{tooltipData.url}</span>
        </div>
      )}

      <ProjectDetailPage project={project} onBack={goBackHome} />
    </div>
  );
}

function ProjectDetailPage({ project, onBack }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="project-detail-page">
      {/* Back button */}
      <button className="back-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to projects
      </button>

      {/* Project header */}
      <div className="project-detail-header">
        <h1 className="project-detail-title">{project.title}</h1>
        <p className="project-detail-subtitle">{project.subtitle}</p>
        
        <div className="project-detail-tags">
          <span className="project-detail-tag">{project.year}</span>
          {project.tags.map((tag, i) => (
            <span key={i} className="project-detail-tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* Project image */}
      <div className="project-detail-image-wrapper">
        {imageError ? (
          <div className="project-detail-image-placeholder">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#999"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Image not available</span>
          </div>
        ) : (
          <img 
            src={getImageUrl(project.image)} 
            alt={project.title}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Project content */}
      <div className="project-detail-content">
        <div className="project-detail-section">
          <h2 className="project-detail-section-title">About this project</h2>
          <p className="project-detail-description">{project.description}</p>
        </div>

        {(project.repo || project.notion) && (
          <div className="project-detail-actions">
            {project.repo && (
              <a 
                href={project.repo} 
                className="project-detail-github-link" 
                target="_blank" 
                rel="noopener noreferrer"
                data-tooltip="true"
                data-logo="https://github.githubassets.com/favicons/favicon.svg"
                data-url="github.com"
              >
                View on GitHub ↗
              </a>
            )}
            {project.notion && (
              <a 
                href={project.notion} 
                className="project-detail-notion-link" 
                target="_blank" 
                rel="noopener noreferrer"
                data-tooltip="true"
                data-logo="https://www.notion.so/images/favicon.ico"
                data-url="notion.so"
              >
                View Case Study ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}