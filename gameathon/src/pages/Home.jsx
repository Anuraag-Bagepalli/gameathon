import { Link } from 'react-router-dom';
import { ArrowRight, Box, BrainCircuit, CalendarDays, Code2, Gamepad2, Globe2, MapPin, Radio, Sparkles, Trophy, Users } from 'lucide-react';
const hero = 'https://raw.githubusercontent.com/Anuraag-Bagepalli/gameathon/main/gameathon/src/assets/arena-hero.png';

const tracks = [
  { icon: Code2, code: 'BUILD_01', title: 'Create from zero', text: 'Turn an original idea into a playable game within the event window.' },
  { icon: BrainCircuit, code: 'BUILD_02', title: 'Design the loop', text: 'Shape mechanics, progression, player feedback, and a reason to play again.' },
  { icon: Box, code: 'BUILD_03', title: 'Ship the world', text: 'Combine code, art, audio, and story into one polished submission.' },
];
const sponsors=['TITLE SPONSOR','POWERED BY','TECH PARTNER','COMMUNITY PARTNER','PLATFORM PARTNER'];

export default function Home(){return <main>
  <section className="hero" style={{'--hero-image':`url(${hero})`}}><div className="hero-orb"/><div className="container hero-content">
    <div className="eyebrow"><span className="live-dot"/> JIT PRESENTS // 2026</div>
    <div className="version-chip">GAMEATHON 8.0</div>
    <h1>BUILD THE GAME.<br/><span>CHANGE THE RULES.</span></h1>
    <p className="tagline">A global contest.</p>
    <p className="hero-lead">A high-energy game-building event where creators turn bold ideas into playable worlds. Code it. Design it. Ship it.</p>
    <div className="hero-buttons"><Link to="/register" className="btn btn-primary">Register your team <ArrowRight size={18}/></Link><Link to="/about" className="btn btn-secondary">Explore the challenge</Link></div>
    <div className="hero-stats"><div><strong>$2,000</strong><span>USD prize pool</span></div><div><strong>8.0</strong><span>New edition</span></div><div><strong>2026</strong><span>Coming soon</span></div></div>
  </div></section>
  <section className="signal-strip"><div className="ticker"><span>A GLOBAL CONTEST</span><i/><span>BUILD GAMES</span><i/><span>$2,000 USD</span><i/><span>JYOTHY INSTITUTE OF TECHNOLOGY</span><i/><span>2026 · COMING SOON</span><i/></div></section>
  <section className="section modes-section"><div className="container"><div className="section-heading"><div><span className="kicker">// FROM IDEA TO PLAYABLE</span><h2>Your world.<br/>Your rules.</h2></div><p>Bring your imagination and your favorite tools. This is a sprint for developers, artists, designers, storytellers, and people ready to make something unexpected.</p></div><div className="mode-grid">{tracks.map(({icon:Icon,code,title,text})=><article className="mode-card" key={title}><span className="card-code">{code}</span><Icon size={36}/><h3>{title}</h3><p>{text}</p><div className="card-line"/></article>)}</div></div></section>
  <section className="section event-section"><div className="container event-panel"><div><span className="kicker">// SAVE THE SIGNAL</span><h2>Coming soon<br/>to Bengaluru.</h2><p><MapPin size={17}/> Jyothy Institute of Technology, Thataguni, Bengaluru</p></div><div className="event-facts"><div><CalendarDays/><span><small>EVENT DATE</small>Coming soon · 2026</span></div><div><Trophy/><span><small>PRIZE POOL</small>$2,000 USD</span></div><div><Globe2/><span><small>SCALE</small>A global contest</span></div></div></div></section>
  <section className="section sponsors"><div className="container"><span className="kicker">// OUR SPONSORS</span><h2>Back the builders.</h2><p>Sponsor announcements are coming soon.</p><div className="sponsor-window"><div className="sponsor-track">{[...sponsors,...sponsors].map((s,i)=><div className="sponsor-card" key={`${s}-${i}`}><Sparkles size={20}/><span>{s}</span><small>YOUR LOGO HERE</small></div>)}</div></div></div></section>
  <section className="section final-cta"><div className="container"><Gamepad2 size={44}/><span className="kicker">// MAKE SOMETHING PLAYABLE</span><h2>Your next game starts here.</h2><p>Find your team. Bring your idea. Build what nobody else would.</p><Link to="/register" className="btn btn-primary">Join Gameathon 8.0 <ArrowRight size={18}/></Link></div></section>
  <footer className="footer"><div className="container footer-row"><div className="logo">GAME<span>ATHON</span> <small>8.0</small></div><p>A global contest.</p><div><MapPin size={15}/> JIT, THATAGUNI · <Radio size={15}/> 2026</div></div></footer>
  </main>}
