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

const SCRAMBLE_CHARS = '><1#\\0?$';
const activeScrambleStop = { current: null };

function useScramble(text) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef(null);
  const iterRef = useRef(0);

  const start = useCallback(() => {
    if (activeScrambleStop.current) activeScrambleStop.current();

    iterRef.current = 0;
    clearInterval(intervalRef.current);

    activeScrambleStop.current = () => {
      clearInterval(intervalRef.current);
      setDisplay(text);
    };

    intervalRef.current = setInterval(() => {
      const iter = iterRef.current;
      setDisplay(
        text.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (i < Math.floor(iter)) return char;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join('')
      );
      iterRef.current += 0.8;
      if (iterRef.current > text.length) {
        clearInterval(intervalRef.current);
        setDisplay(text);
        activeScrambleStop.current = null;
      }
    }, 20);
  }, [text]);

  return { display, start };
}

function ScrambleText({ text }) {
  const { display, start } = useScramble(text);
  return <span onMouseEnter={start}>{display}</span>;
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
        <h1 className="site-name">Soheil Lotfi</h1>
        <div className="site-header-top">
          <pre className="ascii-portrait">{ASCII_ART}</pre>
          <p className="site-bio">
            MSc student at{' '}
            <a href="https://www.ip-paris.fr/" target="_blank" rel="noopener noreferrer">
              Institut Polytechnique de Paris
            </a>{' '}
            working at the intersection of HCI and AI. My research interests center on two threads:
            how AI is redrawing the boundaries of interaction — as more tasks get delegated to
            models, where does the human role go, and how do we design for that shift — and how
            sustained AI use quietly reshapes human cognition, and whether we can design systems
            that push back against that. Currently interning at{' '}
            <a href="https://www.lisn.upsaclay.fr/" target="_blank" rel="noopener noreferrer">
              LISN–CNRS
            </a>
            , building a collaborative AI platform for French Sign Language with the Deaf community.
            <br />Outside of research, I'm a former competitive speedcuber and a lifelong tennis player.
            </p><br />

            <p><i>*Interests: Interaction Design, Human-AI Interaction, Visualization, UX</i></p>
            <br />
            <span className="phd-badge">Actively looking for a job position</span>
            <br /><br />

          <nav className="site-links">
            <a href="https://www.linkedin.com/in/soheil-lotfi" target="_blank" rel="noopener noreferrer">
              <ScrambleText text="LinkedIn ↗" />
            </a>
            <span className="site-links-sep">·</span>
            <a href="mailto:soheil.lotfi@ip-paris.fr"><ScrambleText text="Contact" /></a>
          </nav>
        </div>
      </header>

      <main>
        <h2 className="projects-heading">Projects</h2>

        <ul className="project-list">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} onClick={() => navigate(`/project/${project.id}`)} />
          ))}
        </ul>
      </main>
    </div>
  );
}

function ProjectRow({ project, onClick }) {
  const [imageError, setImageError] = useState(false);
  const { display, start } = useScramble(project.title);

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
          <span className="project-row-title" onMouseEnter={start}>{display}</span>
          <span className="project-row-year">{project.year}</span>
        </div>
        <p className="project-row-subtitle">{project.subtitle}</p>
        <p className="project-row-tags">{project.tags.join(' · ')}</p>
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
      <button className="back-link" onClick={() => navigate('/')}><ScrambleText text="← Back" /></button>

      <article className="project-article">
        <header className="project-article-header">
          <p className="project-article-meta">{project.year} · {project.tags.join(' · ')}</p>
          <h1 className="project-article-title">{project.title}</h1>
          <p className="project-article-subtitle">{project.subtitle}</p>
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
            project.sections.map((s, i) => (
              <div key={i} className="project-section">
                {s.heading && <h2 className="project-section-heading">{s.heading}</h2>}
                {s.subheading && <h3 className="project-section-subheading">{s.subheading}</h3>}
                {s.body && s.body.split('\n\n').map((para, j) => <p key={j}>{renderInline(para)}</p>)}
                {s.image && (
                  <div className="project-section-image">
                    <img src={getImageUrl(s.image)} alt={s.heading || ''} />
                    {s.caption && <p className="project-section-caption">{s.caption}</p>}
                  </div>
                )}
              </div>
            ))
          ) : (
            project.description.split('\n\n').map((para, i) => <p key={i}>{renderInline(para)}</p>)
          )}
        </div>

        {(project.repo || project.notion || project.weblog) && (
          <div className="project-article-links">
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noopener noreferrer">
                <ScrambleText text="View on GitHub ↗" />
              </a>
            )}
            {project.weblog && (
              <a href={project.weblog} target="_blank" rel="noopener noreferrer">
                <ScrambleText text="Our Course Weblog ↗" />
              </a>
            )}
            {project.notion && (
              <a href={project.notion} target="_blank" rel="noopener noreferrer">
                <ScrambleText text="View Case Study ↗" />
              </a>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
