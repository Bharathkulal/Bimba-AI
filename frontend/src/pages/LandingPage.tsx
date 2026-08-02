import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  Sparkles, HelpCircle, ArrowRight, Star,
  Upload, Briefcase, FileText, ChevronRight, TrendingUp, CreditCard, Users
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { TemplateShowcase } from '../components/TemplateShowcase';
import { DisplayHeading } from '../components/DisplayHeading';

const AnimatedNumber: React.FC<{ value: number; suffix?: string; duration?: number }> = ({ value, suffix = '', duration = 1200 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      const incrementTime = Math.max(Math.floor(duration / end), 15);
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Animation Variants
const sectionVariants: any = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1], // easeOut
      staggerChildren: 0.1
    }
  }
};

const childVariants: any = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const floatingVariants: any = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const LandingPage: React.FC = () => {

  return (
    <div className="overflow-hidden bg-white">
      {/* Background soft blurs */}
      <div className="absolute top-0 inset-x-0 h-[1000px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-[#F8F8F8] blur-[130px]" />
        <div className="absolute top-[30%] right-[-20%] w-[50%] h-[50%] rounded-full bg-[#F8F8F8] blur-[140px]" />
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 z-10">
        <motion.div 
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          {/* Hero Left Content */}
          <motion.div 
            variants={childVariants}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-emerald-100">
              <Sparkles size={11} className="text-emerald-600 animate-pulse" /> AI Powered Career Accelerator
            </div>

            <DisplayHeading size="hero" as="h1" className="!my-0 text-slate-900">
              Your perfect resume, <span className="text-emerald-700">powered by AI.</span>
            </DisplayHeading>

            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-lg">
              Create ATS-optimized resumes, get AI suggestions, discover matching jobs and apply with confidence. All in one smart platform.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link to="/login" className="btn-uiverse-wrapper">
                <button className="btn-uiverse bg-[#101010] hover:bg-slate-900">
                  <svg className="btn-uiverse-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                    />
                  </svg>
                  <span>Create AI Resume Now</span>
                </button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="font-semibold border-slate-250 hover:bg-slate-50 flex items-center gap-2">
                  <Upload size={16} /> Upload Resume
                </Button>
              </Link>
            </div>

            {/* Placement stats */}
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100 text-left">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <span className="text-slate-800 text-sm font-extrabold block leading-tight">
                    <AnimatedNumber value={48} suffix="%" />
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1 font-bold">More likely to get hired</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <CreditCard size={14} />
                </div>
                <div>
                  <span className="text-slate-800 text-sm font-extrabold block leading-tight">
                    <AnimatedNumber value={12} suffix="%" />
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1 font-bold">Better pay with your next job</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Users size={14} />
                </div>
                <div>
                  <span className="text-slate-800 text-sm font-extrabold block leading-tight">
                    <AnimatedNumber value={50} suffix="K+" />
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1 font-bold">Resumes optimized this month</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Right Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative flex flex-col items-center justify-center w-full max-w-[640px] mx-auto scale-90 sm:scale-100 z-10"
          >
            {/* Floating Badges Row (Above) */}
            <div className="flex gap-4 mb-6 w-full justify-between z-20">
              {/* Card 1: ATS Score */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 flex items-center gap-3 flex-1">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">ATS Score</span>
                  <span className="text-lg font-extrabold text-slate-800">94</span>
                  <span className="text-xs text-slate-400">/100</span>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Excellent Match</span>
                </div>
                <div className="relative w-9 h-9 flex items-center justify-center ml-auto flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="14" stroke="#F1F5F9" strokeWidth="3" fill="transparent" />
                    <circle cx="18" cy="18" r="14" stroke="#10B981" strokeWidth="3" fill="transparent" strokeDasharray="88" strokeDashoffset="10" />
                  </svg>
                </div>
              </div>
              {/* Card 2: Keyword Match */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 flex flex-col justify-between flex-1">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Keyword Match</span>
                  <span className="text-sm font-extrabold text-slate-800">92%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-[9px] text-slate-400 font-bold mt-1.5">Top Keywords Found</span>
              </div>
              {/* Card 3: Job Matches */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 flex items-center gap-3 flex-1">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Job Matches</span>
                  <span className="text-lg font-extrabold text-slate-800">48</span>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">High Match Jobs</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center ml-auto text-emerald-600 flex-shrink-0">
                  <Briefcase size={14} />
                </div>
              </div>
            </div>

            {/* Main Layout Row (AI Suggestions + Resume + Matching Jobs) */}
            <div className="flex gap-4 w-full items-stretch justify-center relative">
              {/* Left Card: AI Suggestions */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-150 p-4 w-[180px] flex flex-col gap-3.5 text-left z-20 self-center">
                <span className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wide">AI Suggestions</span>
                <div className="flex flex-col gap-2.5">
                  {[
                    { title: 'Improve Summary', desc: 'Make your summary more impactful' },
                    { title: 'Add Keywords', desc: '3 important keywords added' },
                    { title: 'Enhance Skills', desc: 'Skills section optimized' },
                    { title: 'Strong Action Verbs', desc: '12 strong verbs added' }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-2 items-start text-[9px]">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mt-0.5 flex-shrink-0">
                        ✓
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block leading-tight">{s.title}</span>
                        <span className="text-slate-400 leading-tight block mt-0.5">{s.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer border-t border-slate-50 pt-2 mt-1">
                  View All Suggestions →
                </div>
              </div>

              {/* Center Card: Resume Preview */}
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 p-6 flex-1 flex flex-col gap-5 text-center min-w-[240px] z-10">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Samantha Williams</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">New York, NY • samantha@example.com • (123) 456-7890</p>
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider">Professional Summary</span>
                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 bg-slate-100 rounded w-full" />
                    <div className="h-1.5 bg-slate-100 rounded w-11/12" />
                    <div className="h-1.5 bg-slate-100 rounded w-4/5" />
                  </div>
                </div>

                {/* Experience */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider">Experience</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="h-1.5 bg-slate-200 rounded w-1/3" />
                      <div className="h-1 bg-slate-100 rounded w-3/4" />
                      <div className="h-1 bg-slate-100 rounded w-11/12" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-1.5 bg-slate-200 rounded w-1/4" />
                      <div className="h-1 bg-slate-100 rounded w-4/5" />
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider">Education</span>
                  <div className="h-1.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>

              {/* Right Card: Matching Jobs */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-150 p-4 w-[180px] flex flex-col gap-3 text-left z-20 self-center">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wide">Matching Jobs</span>
                  <span className="text-[8px] font-bold text-slate-400">View all</span>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { title: 'Marketing Specialist', comp: 'Google', loc: 'New York, NY' },
                    { title: 'Digital Marketing Manager', comp: 'Microsoft', loc: 'Remote' },
                    { title: 'Marketing Analyst', comp: 'Amazon', loc: 'Seattle, WA' }
                  ].map((j, i) => (
                    <div key={i} className="flex gap-2.5 items-center text-[9px]">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs flex-shrink-0 text-slate-700">
                        {j.comp[0]}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block leading-tight">{j.title}</span>
                        <span className="text-slate-400 block mt-0.5 leading-none">{j.comp} • {j.loc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer border-t border-slate-50 pt-2.5 mt-1 flex items-center justify-between">
                  <span>See 45 more matches</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Behind blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-2xl z-0" />
          </motion.div>
        </motion.div>
      </section>

      {/* 2. LOGO TRUST BAR */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="py-8 bg-slate-50 border-y border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.p variants={childVariants} className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-6">
            TRUSTED BY PROFESSIONALS AT
          </motion.p>
          <motion.div variants={childVariants} className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {['Google', 'Microsoft', 'Amazon', 'DHL', 'Spotify', 'Facebook'].map((brand) => (
              <span key={brand} className="text-slate-700 font-extrabold text-lg tracking-tight select-none">
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How Bimba AI Works Timeline */}
      <div className="max-w-4xl mx-auto px-6 mt-12 mb-16 text-center animate-fadeIn">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block mb-4">How Bimba AI Works</span>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          {[
            { step: '1', title: 'Upload Resume', desc: 'Upload your current resume', icon: Upload, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { step: '2', title: 'AI Optimization', desc: 'AI analyzes and optimizes content', icon: Sparkles, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { step: '3', title: 'ATS Score', desc: 'Get your ATS score and suggestions', icon: FileText, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { step: '4', title: 'Get Hired', desc: 'Apply to matched jobs with confidence', icon: Briefcase, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-3 text-left">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">{item.step}. {item.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </div>
              {idx < 3 && (
                <div className="hidden md:block text-slate-300 font-bold">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. 3-STEP TIMELINE SECTION */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Visual Cards Mockup on Left */}
          <motion.div variants={childVariants} className="relative flex justify-center">
            <Card className="w-full max-w-[400px] border border-slate-100 shadow-xl relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xs">
                  S
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-xs">Samantha Williams</h4>
                  <p className="text-[9px] text-slate-400">Senior Analyst</p>
                </div>
              </div>
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col gap-1.5 relative">
                <div className="h-2.5 bg-slate-200 rounded w-1/3 mb-1" />
                <div className="h-2 bg-slate-100 rounded w-11/12" />
                <div className="h-2 bg-slate-100 rounded w-4/5" />
                {/* Floating "Ideas Suggestion" popup */}
                <div className="absolute top-[-30px] right-[-30px] z-20 w-40 bg-white shadow-lg border border-slate-100 rounded-xl p-3 text-[9px] text-slate-500">
                  <div className="flex items-center gap-1.5 mb-1 text-primary font-bold">
                    <Sparkles size={10} /> Ideas Suggestion
                  </div>
                  Implemented strategies that boosted sales by 30% in 6 months...
                </div>
              </div>

              {/* Bottom tag */}
              <div className="mt-4 bg-primary text-white text-[10px] font-bold py-2 px-4 rounded-xl text-center shadow-sm">
                Create your Job Winning resume 2x faster
              </div>
            </Card>

            {/* Blob behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-50 blur-xl z-0" />
          </motion.div>

          {/* Timeline Steps on Right */}
          <motion.div variants={childVariants}>
            <SectionTitle 
              title="Create your job-winning, AI-powered resume in 3 steps" 
              subtitle="Job search is stressful enough. Avoid the design headache with our recruiter-approved placement builder."
            />

            <div className="flex flex-col gap-8 mt-10">
              {[
                { step: 'STEP 1', title: 'Choose a resume template', desc: 'Select from our library of slick, recruiter-approved templates tailored to land you interviews.' },
                { step: 'STEP 2', title: 'Customize each section with AI', desc: 'Our AI resume builder suggests powerful, role-specific bullet points and summaries. Simply tweak and approve!' },
                { step: 'STEP 3', title: 'Download your resume in seconds', desc: 'Export an ATS-friendly, beautifully designed PDF. You are now extra ready for interviews.' }
              ].map((s, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-extrabold text-xs shrink-0 shadow-sm">
                      {idx + 1}
                    </div>
                    {idx < 2 && <div className="w-0.5 bg-slate-150 flex-grow my-2" />}
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">{s.step}</span>
                    <h3 className="text-base font-bold text-slate-800 mt-0.5">{s.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link to="/login">
                <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/20 font-semibold">
                  Build My Resume with AI
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>
      </motion.section>

      {/* 4. TEMPLATE SHOWCASE SECTION */}
      <TemplateShowcase />

      {/* 5. TESTIMONIAL / TRUST SECTION */}
      <section className="py-24 bg-slate-50 relative z-10 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle 
            title="Learn why people choose our AI-powered resumes" 
            subtitle="Read feedback from students and job seekers who used Bimba AI to unlock placements."
            centered
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center mt-12">
            
            {/* Rating Widget */}
            <div className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left bg-white p-6 rounded-[20px] border border-slate-150 shadow-sm gap-4">
              <span className="text-slate-800 font-extrabold text-3xl">4.5 out of 5</span>
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((st) => (
                  <Star key={st} size={18} className="text-amber-500 fill-amber-500" />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-slate-750 font-bold text-sm">
                <span className="text-amber-500">★</span> Trustpilot
              </div>
              <p className="text-[11px] text-slate-400">based on 3,112 reviews</p>
            </div>

            {/* Testimonial slider / list */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Sarah Thompson', time: 'about 1 day ago', text: 'Bimba AI made it sooo easy. Like many others here, I had no idea how to write my resume at all. The AI suggestions were spot-on!' },
                { name: 'Jason Miller', time: 'about 1 day ago', text: 'Landed several interviews! I created my resume in 10 minutes and got two callbacks the same week. Super easy!' },
                { name: 'Priya Ramesh', time: 'about 1 day ago', text: 'Fast and effective. Bimba AI helped me say what I meant, and believe it or not, my bullet points sound so professional!' }
              ].map((rev, idx) => (
                <Card key={idx} className="flex flex-col justify-between gap-5 p-5 bg-white border border-slate-150 shadow-sm h-full hover:-translate-y-1 transition-all duration-250 hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-0.5 text-amber-500 mb-3">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star key={st} size={10} className="text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">"{rev.text}"</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{rev.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rev.time}</p>
                  </div>
                </Card>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 6. WHY USE BIMBA AI FEATURE CARDS */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 bg-white relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <SectionTitle 
            title="Why use Bimba AI's AI Resume Builder?" 
            subtitle="Everything you need to showcase your best self and unlock placement offers."
            centered
          />

          <motion.div variants={childVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              {
                title: 'Enjoy the head start',
                desc: 'AI suggests ideas and helps you find the proper words to highlight your achievements.',
                visual: (
                  <div className="w-full h-24 bg-blue-50/50 rounded-xl border border-slate-100 flex items-center justify-center p-3 relative overflow-hidden">
                    <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-100 text-[8px] text-slate-500 flex flex-col gap-1 w-full">
                      <div className="h-1.5 bg-slate-200 rounded w-1/3 mb-1" />
                      <div className="h-1.5 bg-slate-100 rounded w-full" />
                      <div className="h-1.5 bg-slate-100 rounded w-5/6" />
                    </div>
                    <span className="absolute bottom-1 right-2 bg-primary text-white text-[7px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-0.5 shadow">
                      <Sparkles size={6} /> Generate
                    </span>
                  </div>
                )
              },
              {
                title: 'Fully customizable templates',
                desc: 'We took care of the design and formatting so you can create a resume with AI in no time.',
                visual: (
                  <div className="w-full h-24 bg-blue-50/50 rounded-xl border border-slate-100 flex items-center justify-center gap-2.5 p-3 relative overflow-hidden">
                    <div className="w-12 h-16 bg-white rounded border border-slate-150 flex flex-col p-1.5 gap-1 shadow-sm shrink-0">
                      <div className="h-2 bg-slate-200 rounded w-1/2" />
                      <div className="h-1 bg-slate-100 rounded w-full" />
                      <div className="h-1 bg-slate-100 rounded w-full" />
                    </div>
                    <div className="w-12 h-16 bg-white rounded border border-slate-150 flex flex-col p-1.5 gap-1 shadow-sm shrink-0 scale-105">
                      <div className="h-2 bg-primary/70 rounded w-2/3" />
                      <div className="h-1 bg-slate-100 rounded w-full" />
                      <div className="h-1 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                )
              },
              {
                title: 'Attention-grabbing summaries',
                desc: 'Make a lasting impression with an AI-generated introduction that sparks recruiter curiosity.',
                visual: (
                  <div className="w-full h-24 bg-blue-50/50 rounded-xl border border-slate-100 flex items-center justify-center p-3 relative overflow-hidden">
                    <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-150 text-[8px] text-slate-500 text-center w-full">
                      <p className="font-extrabold text-slate-800 text-[9px] mb-1">Generating idea</p>
                      <div className="w-5 h-5 rounded-full border border-primary border-t-transparent animate-spin mx-auto mt-2" />
                    </div>
                  </div>
                )
              },
              {
                title: 'Level up your paycheck',
                desc: 'AI frames your skills and accomplishments the right way to beat your competition.',
                visual: (
                  <div className="w-full h-24 bg-blue-50/50 rounded-xl border border-slate-100 flex items-center justify-center p-3 relative overflow-hidden">
                    <div className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-150 text-center w-full flex flex-col items-center justify-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#F8F8F8] text-emerald-650 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </div>
                      <span className="text-[8px] font-bold text-slate-650">Accept the offer!</span>
                    </div>
                  </div>
                )
              }
            ].map((card, idx) => (
              <div key={idx} className="flex flex-col bg-white p-6 rounded-[20px] border border-slate-150 shadow-sm text-left h-full justify-between gap-5 card-hover-premium hover:shadow-md transition-all duration-250 cursor-pointer">
                <div className="flex flex-col gap-4">
                  {card.visual}
                  <h4 className="font-extrabold text-slate-800 text-sm mt-1">{card.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{card.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={childVariants} className="mt-12 flex justify-center">
            <Link to="/login">
              <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/20 font-semibold">
                Create My AI Resume
              </Button>
            </Link>
          </motion.div>

        </div>
      </motion.section>

      {/* 7. FAQ SECTION */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 bg-slate-50 border-t border-slate-100 relative z-10"
      >
        <div className="max-w-4xl mx-auto px-6">
          <SectionTitle 
            title="Frequently Asked Questions" 
            subtitle="Got questions about Bimba AI's student placement resume builder? We have answers."
            centered
          />
          <motion.div variants={childVariants} className="flex flex-col gap-5 mt-10">
            {[
              { q: 'Is my resume secure?', a: 'Yes, we take security very seriously. All student data is stored securely in accordance with college database policies.' },
              { q: 'Will my resume bypass applicant tracking systems (ATS)?', a: 'Absolutely. Every template is rigorously structured following standard parser rules to guarantee maximum ATS scores.' },
              { q: 'How does the AI assistance work?', a: 'The AI analyzes your details and dynamically drafts high-impact achievements and job descriptions tailored to your target roles.' }
            ].map((faq, idx) => (
              <Card key={idx} className="p-6 bg-white border border-slate-150 shadow-sm hover:shadow-md transition-all duration-250 cursor-pointer">
                <h4 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2.5 mb-2">
                  <HelpCircle size={18} className="text-primary shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs md:text-sm text-slate-500 pl-7 leading-relaxed font-medium">{faq.a}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};
export default LandingPage;
