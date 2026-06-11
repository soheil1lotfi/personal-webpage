import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import './index.css';
import projects from './projects.json';

const ASCII_ART = `                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                            =======                                                 
                                        =++-=-=-==--====                                            
                                     ===+=-=+*#####*++++===                                         
                                  ===++*#%@@@@@@@@@@@@@%#*++==                                      
                                ++++*#%@@@@@@@@@@@@@@@@@@@%#*++                                     
                               +*+*%@@@@@@@@@@@@@@@@@@@@@@@@@%*+                                    
                              +++#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#                                   
                              +#%@@@@@@@@@@%%%%#####%%@@@@@@@@@@@%%                                 
                             +#@@@@@@@@@@@@%#********#@@@@@@@@@@@@%                                 
                             *%@@@@@@@@@@@%%%*+++++++**#%%%@@@@@@@##                                
                           #**%@@@@%@@@@%%%@%*++++++++++***#%@@@%##*#                               
                           #*%%@@@@@%%%@@@@@#+===========+++*#%@@@%**                               
                           *#%@@@@%%%%@@@@%*+=========+++*++++#@@@%%*                               
                           *%%%@@@#**%%@@@%%#*++===+#%%%%%###++%@%%%*                               
                           *%%@@@%**%%#**##%%%*+==+*##**+++***++%%%%%                               
                            @@@@@*+##*#########*=-=#%%###***++#%#%%+-=                              
                           ==%@%##%%##%%%%#*##%#+=+#*####****+++=#++*+=                             
                           +***%*+*#++**********=--++++**++======+=-=+=                             
                           +*++#++=++========+*+=--=====------=-=+*+==                              
                           ++=*#+====-----===++=----=====--------+++==                              
                           ==+*+*==========+*+===----=+***+==---=*=-=+                              
                            ===+#+======++****%#*++*#*+++*#*+====*=-=                               
                             ===#*+=+=++##**##%%@%%%%####%%%*+=+*#+=                                
                             +=+##*++++#%%%######**+***#%%%%++***##                                 
                                #%###*+*%##@%#*++==--==+++##++*####                                 
                                 %####*+#*+++++++++=======*#####%%                                  
                                 %%%%###%*+==+==+++=+=====###%%%%#                                  
                                  %%%%%%%##++*#%%%###*+++*#%%%%%*                                   
                                   %@@@%%%%#**+*#***++*+*##%%%%*=                                   
                                   +*%@%%%%####*++++++*###%%@%*===                                  
                                 *  +*%@@@@%%###**#*#*%#%%%%%*====                                  
                             +++*###++**%@@@@@@%%%%%%%@@%%%#++===--:..                              
                             *++***%*+++*##%@@@@@@@@@@@@%*+++=====--:..:..  +++*****++++**+         
                             #***+*##++++**###%%%@@@%%#*+++========-:::::::+*******++++******       
                           *########*++++++**######***++++========-::::::=**####********##*****     
                          **###%%#####+++++++****#***++++=========-:::::+*######****###**++++++++++ 
                       **+**#%##%%#####*+++++++*****++++=========-::::-*#######**############%%%@%##
                      *#***##%%##%%######*+++++++++++++=========--:::=*######**#########%%@@%#*****+
                   ++**#######%%###########*+++++++++++++=====---:::=#######*#######%%%@@%###******#
                 ++*****#%%%###%@###########*++++****++++==----::::+#############%%%@%%%###****#####
             +++******#####%@%###%%#####%%%%*++++++++++==----:::::+#########%%%%%%%%####***######## 
          *############**###%%@%##%@%###%%%%%+=======----------::+###########*##***#########%%##### 
         %#*-::::-*###%%%##**#%%@%##%@%###%##+=======----:--:-::*###*##%@@%%%######%%%%%%%%%####### 
        +-:.::::::::-*##%%%%%####%%%%%%%%##%#*======++*#######******#%@@@@@@@@@@%%######%#%#######  
      :::::::::::::::::-+#%%%%%%%####%%%%@%%%##*###############%#####*##*#%%%#%@@@@%%############   
    ::...::::::::::::::::-=*#%%%%%@@%###%%%@@%%#############%%%@%%%%%%%%****##%#%%@@@@%#########    
      ::::::::::::::::::-----=+*#%%%%%@@@%%%%@@@#####%#######%%%@@@@%%%@#****#*#%#%%%@@%#####*      
        :::::::::::::::--:::::--=+*##%%%%%@@@@@@@%%%%#%%%%%%%%@@@@@@@@@%#####*%##%##%%%%%###        
            ::::::::::-::::::::----===+%@@@@@@@@@@%@@@%%%%@@%@@@@@@@@@@########%##@##%%%            
                    ::-::::::::-::::-=#%%##%%%@@@@@@%%@@@@@@@@@@@%%%%@@########@                    `;

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};

const SCRAMBLE_CHARS = '_1/0X#';
const activeScrambleStop = { current: null };

function useScramble(text, startBlank = false) {
  const [display, setDisplay] = useState(startBlank ? '' : text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef(null);
  const iterRef = useRef(0);
  const revealTimesRef = useRef(null);

  const start = useCallback((skipMutex, scattered = false) => {
    const solo = skipMutex !== true;
    const loadMode = !solo;

    if (solo && activeScrambleStop.current) activeScrambleStop.current();

    iterRef.current = 0;
    setIsScrambling(true);

    if (scattered && loadMode) {
      revealTimesRef.current = text.split('').map(char =>
        (char === ' ' || char === '\n' || char.charCodeAt(0) > 127) ? -1 : Math.random() * text.length
      );
    } else {
      revealTimesRef.current = null;
    }

    setDisplay(text.split('').map(char => {
      if (char === ' ' || char === '\n' || char.charCodeAt(0) > 127) return char;
      return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }).join(''));
    clearInterval(intervalRef.current);

    if (solo) {
      activeScrambleStop.current = () => {
        clearInterval(intervalRef.current);
        setDisplay(text);
        setIsScrambling(false);
      };
    }

    const step = text.length / 40;
    intervalRef.current = setInterval(() => {
      const iter = iterRef.current;
      const revealTimes = revealTimesRef.current;
      setDisplay(
        text.split('').map((char, i) => {
          if (char === ' ' || char === '\n' || char.charCodeAt(0) > 127) return char;
          const revealed = revealTimes ? iter >= revealTimes[i] : i < Math.floor(iter);
          if (revealed) return char;
          if (loadMode) return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          const prob = Math.max(0, 1 - (i - iter) / text.length);
          if (Math.random() < prob) return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          return char;
        }).join('')
      );
      iterRef.current += step;
      if (iterRef.current > text.length) {
        clearInterval(intervalRef.current);
        setDisplay(text);
        setIsScrambling(false);
        if (solo) activeScrambleStop.current = null;
      }
    }, 20);
  }, [text]);

  return { display, start, isScrambling };
}

function ScrambleText({ text, delay, interactive = true, scattered = false }) {
  const { display, start } = useScramble(text, delay != null);

  useEffect(() => {
    if (delay == null) return;
    const t = setTimeout(() => start(true, scattered), delay);
    return () => clearTimeout(t);
  }, [delay, start, scattered]);

  if (!interactive) {
    return <span>{display}</span>;
  }

  return (
    <span onMouseEnter={start} style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ visibility: 'hidden' }}>{text}</span>
      <span style={{ position: 'absolute', left: 0, top: 0 }}>{display}</span>
    </span>
  );
}

function ScrambleParagraph({ text, delay, className }) {
  const { display, start, isScrambling } = useScramble(text, true);
  useEffect(() => {
    const t = setTimeout(() => start(true), delay ?? 0);
    return () => clearTimeout(t);
  }, [delay, start]);
  return (
    <p className={className}>
      {isScrambling ? display : (display ? renderInline(text) : '')}
    </p>
  );
}

function ScatterReveal({ text, delay = 0 }) {
  const [display, setDisplay] = useState(() =>
    text.split('').map(c => (c === '\n' || c === ' ') ? c : ' ').join('')
  );

  useEffect(() => {
    let timeout, interval;
    timeout = setTimeout(() => {
      const chars = text.split('');
      const len = chars.length;
      const revealTimes = chars.map(c =>
        (c === ' ' || c === '\n') ? -1 : Math.random() * len
      );
      let iter = 0;
      const step = len / 40;
      interval = setInterval(() => {
        iter += step;
        if (iter > len) {
          clearInterval(interval);
          setDisplay(text);
          return;
        }
        setDisplay(chars.map((c, i) => {
          if (c === ' ' || c === '\n') return c;
          return iter >= revealTimes[i] ? c : ' ';
        }).join(''));
      }, 20);
    }, delay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [delay, text]);

  return <span>{display}</span>;
}

const RUBIK_COLORS = ['#FF5555', '#FF9B00', '#4A90E2', '#50C878', '#FFE84D', '#FFFFFF'];

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000' : '#fff';
}

function RubikText({ text }) {
  const [colors, setColors] = useState(() => Array(text.length).fill(null));
  const intervalRef = useRef(null);

  const startCycling = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setColors(text.split('').map(() => RUBIK_COLORS[Math.floor(Math.random() * RUBIK_COLORS.length)]));
    }, 140);
  }, [text]);

  const stopCycling = useCallback(() => {
    clearInterval(intervalRef.current);
    text.split('').forEach((_, i) => {
      setTimeout(() => {
        setColors(prev => {
          const next = [...prev];
          next[i] = null;
          return next;
        });
      }, Math.random() * 400);
    });
  }, [text]);

  return (
    <span onMouseEnter={startCycling} onMouseLeave={stopCycling}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            backgroundColor: colors[i] ?? 'transparent',
            color: colors[i] ? getContrastColor(colors[i]) : 'inherit',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export default function Portfolio() {
  return (
    <Router basename={import.meta.env.BASE_URL || ''}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:projectId" element={<ProjectDetailPage />} />
      </Routes>
    </Router>
  );
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <header className="site-header">
        <h1 className="site-name"><ScrambleText text="Soheil Lotfi" delay={0} /></h1>
        <div className="site-header-top">
          <pre className="ascii-portrait"><ScatterReveal text={ASCII_ART} delay={50} /></pre>
          <p className="site-bio">
            <ScrambleText text="MSc student at " delay={80} interactive={false} />
            <a href="https://www.ip-paris.fr/" target="_blank" rel="noopener noreferrer">
              <ScrambleText text="Institut Polytechnique de Paris" delay={90} interactive={false} />
            </a>{' '}
            <ScrambleText text="working at the intersection of HCI and AI. My research interests center on two threads: how AI is redrawing the boundaries of interaction — as more tasks get delegated to models, where does the human role go, and how do we design for that shift — and how sustained AI use quietly reshapes human cognition, and whether we can design systems that push back against that. Currently interning at " delay={100} interactive={false} />
            <a href="https://www.lisn.upsaclay.fr/" target="_blank" rel="noopener noreferrer">
              <ScrambleText text="LISN–CNRS" delay={110} interactive={false} />
            </a>
            <ScrambleText text=", building a collaborative AI platform for French Sign Language with the Deaf community." delay={120} interactive={false} />
            <br /><ScrambleText text="Outside of research, I'm a former competitive " delay={135} interactive={false} /><RubikText text="speedcuber" /> <ScrambleText text="and a lifelong tennis player." delay={155} interactive={false} />
          </p><br />

            <p><i><ScrambleText text="*Interests: Interaction Design, Human-AI Interaction, Visualization, UX" delay={170} interactive={false} /></i></p>
            <br />
            <span className="phd-badge"><ScrambleText text="Actively looking for a job position" delay={190} interactive={false} /></span>
            <br /><br />

          <nav className="site-links">
            <a href="https://www.linkedin.com/in/soheil-lotfi" target="_blank" rel="noopener noreferrer">
              <ScrambleText text="LinkedIn ↗" delay={300} />
            </a>
            <span className="site-links-sep">·</span>
            <a href="mailto:soheil.lotfi@ip-paris.fr"><ScrambleText text="Contact" delay={450} /></a>
          </nav>
        </div>
      </header>

      <main>
        <h2 className="projects-heading"><ScrambleText text="Projects" delay={200} /></h2>

        <ul className="project-list">
          {projects.map((project, i) => (
            <ProjectRow key={project.id} project={project} onClick={() => navigate(`/project/${project.id}`)} baseDelay={200 + i * 100} />
          ))}
        </ul>
      </main>
    </div>
  );
}

function ProjectRow({ project, onClick, baseDelay }) {
  const [imageError, setImageError] = useState(false);

  return (
    <li className="project-row" onClick={onClick}>
      <div className="project-row-thumb">
        {imageError ? (
          <div className="project-row-thumb-placeholder" />
        ) : (
          <img
            src={getImageUrl(project.image)}
            alt={project.title}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <div className="project-row-info">
        <div className="project-row-top">
          <span className="project-row-title"><ScrambleText text={project.title} delay={baseDelay} /></span>
          <span className="project-row-year"><ScrambleText text={String(project.year)} delay={baseDelay} interactive={false} /></span>
        </div>
        <p className="project-row-subtitle"><ScrambleText text={project.subtitle} delay={baseDelay} interactive={false} /></p>
        <p className="project-row-tags"><ScrambleText text={project.tags.join(' · ')} delay={baseDelay} interactive={false} /></p>
      </div>
    </li>
  );
}

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const project = projects.find(p => p.id === parseInt(projectId));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  if (!project) {
    return (
      <div className="page">
        <button className="back-link" onClick={() => navigate('/')}><ScrambleText text="← Back" /></button>
        <p>Project not found.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate('/')}><ScrambleText text="← Back" delay={0} /></button>

      <article className="project-article">
        <header className="project-article-header">
          <p className="project-article-meta"><ScrambleText text={`${project.year} · ${project.tags.join(' · ')}`} delay={60} interactive={false} /></p>
          <h1 className="project-article-title"><ScrambleText text={project.title} delay={120} interactive={false} /></h1>
          <p className="project-article-subtitle"><ScrambleText text={project.subtitle} delay={200} interactive={false} /></p>
        </header>

        {!imageError && (
          <div className="project-article-image">
            <img
              src={getImageUrl(project.image)}
              alt={project.title}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <div className="project-article-body">
          {project.sections ? (
            project.sections.map((s, i) => {
              const d = 300 + i * 200;
              return (
                <div key={i} className="project-section">
                  {s.heading && <h2 className="project-section-heading"><ScrambleText text={s.heading} delay={d} interactive={false} /></h2>}
                  {s.subheading && <h3 className="project-section-subheading"><ScrambleText text={s.subheading} delay={d + 40} interactive={false} /></h3>}
                  {s.body && s.body.split('\n\n').map((para, j) => (
                    <ScrambleParagraph key={j} text={para} delay={d + 80 + j * 60} />
                  ))}
                  {s.image && (
                    <div className="project-section-image">
                      <img src={getImageUrl(s.image)} alt={s.heading || ''} />
                      {s.caption && <ScrambleParagraph text={s.caption} delay={d + 120} className="project-section-caption" />}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            project.description.split('\n\n').map((para, i) => (
              <ScrambleParagraph key={i} text={para} delay={300 + i * 100} />
            ))
          )}
        </div>

        {(project.repo || project.notion || project.weblog) && (
          <div className="project-article-links">
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noopener noreferrer">
                <ScrambleText text="View on GitHub ↗" delay={280} />
              </a>
            )}
            {project.weblog && (
              <a href={project.weblog} target="_blank" rel="noopener noreferrer">
                <ScrambleText text="Our Course Weblog ↗" delay={280} />
              </a>
            )}
            {project.notion && (
              <a href={project.notion} target="_blank" rel="noopener noreferrer">
                <ScrambleText text="View Case Study ↗" delay={320} />
              </a>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
