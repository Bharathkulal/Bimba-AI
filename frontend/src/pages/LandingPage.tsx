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
      <section className="py-[70px] bg-white relative overflow-hidden select-none">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee-right {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          .marquee-wrap {
            mask-image: linear-gradient(to right, transparent, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, transparent);
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee-right 30s linear infinite;
            will-change: transform;
          }
          .marquee-wrap:hover .marquee-track {
            animation-play-state: paused;
          }
          .marquee-item {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0.45;
          }
          .marquee-item:hover {
            transform: scale(1.05);
            opacity: 0.95;
            color: #059669; /* Emerald accent */
          }
        `}} />

        {/* Subtle radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(240,253,250,0.4)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <p className="text-[10px] uppercase font-extrabold tracking-[0.25em] text-slate-400 mb-8">
            TRUSTED BY PROFESSIONALS AT
          </p>
          
          <div className="marquee-wrap overflow-hidden w-full py-4">
            <div className="marquee-track flex gap-12 items-center">
              {/* Duplicated list of 25 companies for seamless looping */}
              {(() => {
                const list = [
                { name: 'Google', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 1.096 15.42 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.085-1.4-.19-1.925H12.24z"/>
                  </svg>
                )},
                { name: 'Microsoft', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 0h11.2v11.2H0zm12.8 0H24v11.2H12.8zM0 12.8h11.2V24H0zm12.8 0H24V24H12.8z"/>
                  </svg>
                )},
                { name: 'Amazon', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.93 17.09c-.93.68-2.3 1.11-3.69 1.11-2.4 0-4.57-1.34-5.06-3.83-.07-.36.14-.52.41-.36.75.46 2.05.82 3.26.82 2.16 0 4.18-.9 4.88-2.61.12-.29.35-.11.27.18-.32 1.34-.84 3.73-.07 4.69zm7.32.96c-.34-.41-.75-.82-1.16-1.2-.41-.38-.85-.75-1.3-1.13-.38-.32-.22-.53.17-.38 1.48.58 3.51 1.71 3.97 2.36.41.58.17 1.03-.48.96-.86-.1-2.2-.48-3.4-.89-.38-.13-.32-.38.07-.48 1.02-.26 2.05-.29 2.13-.32zm-12.78.29C5.46 14.54 3.82 11.16 3.82 7.74c0-3.52 1.71-6.17 4.79-6.17.65 0 1.27.1 1.88.32.2.07.26.26.1.42-.92.88-1.57 2.21-1.57 3.89 0 3.22 2.35 5.82 5.51 5.82 1.14 0 2.18-.32 2.92-.85.2-.13.36 0 .23.23-.98 1.63-2.67 3.32-4.59 4.33-.29.15-.49.03-.62-.16z"/>
                  </svg>
                )},
                { name: 'Apple', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.31.08.31.08.97 0 2.05-.6 2.5-1.41z"/>
                  </svg>
                )},
                { name: 'Meta', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.846 11.236c-.407-1.025-1.196-1.933-2.222-2.557a5.952 5.952 0 0 0-3.036-.826c-1.393 0-2.652.487-3.585 1.343l-.974.9-.974-.9c-.933-.856-2.192-1.343-3.585-1.343-.883 0-1.727.202-2.502.585a6.002 6.002 0 0 0-2.756 2.798c-.443.992-.53 2.08-.246 3.065a5.95 5.95 0 0 0 2.222 2.557 5.952 5.952 0 0 0 3.036.826c1.393 0 2.652-.487 3.585-1.343l.974-.9.974.9c.933.856 2.192 1.343 3.585 1.343.883 0 1.727-.202 2.502-.585a6.002 6.002 0 0 0 2.756-2.798c.443-.992.53-2.08.246-3.065zm-15.36 4.305c-.655 0-1.282-.243-1.764-.683a2.38 2.38 0 0 1-.77-1.802 2.38 2.38 0 0 1 .77-1.803c.482-.44.11-.683.764-.683.655 0 1.282.243 1.764.683.483.44.77 1.05.77 1.803 0 .753-.287 1.363-.77 1.802a2.404 2.404 0 0 1-1.764.683zm9.028-2.485c0-.753.287-1.363.77-1.803.482-.44 1.11-.683 1.764-.683.655 0 1.282.243 1.764.683.483.44.77 1.05.77 1.803 0 .753-.287 1.363-.77 1.802a2.404 2.404 0 0 1-1.764.683c-.655 0-1.282-.243-1.764-.683a2.38 2.38 0 0 1-.77-1.802z"/>
                  </svg>
                )},
                { name: 'Netflix', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.562 0H8.38l6.059 16.326L20.497 0h2.818v24H20.497V7.674l-6.058 16.326H11.62L5.562 7.674V24H2.744V0h2.818z" transform="scale(0.8) translate(3, 3)" />
                  </svg>
                )},
                { name: 'Spotify', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.49 17.3c-.22.36-.68.48-1.04.26-2.88-1.76-6.5-2.16-10.78-1.18-.41.09-.82-.16-.92-.57-.1-.41.16-.82.57-.92 4.69-1.07 8.7-1.61 11.9 1.35.37.23.49.7.27 1.06zm1.47-3.26c-.28.45-.87.6-1.32.32-3.3-2.03-8.33-2.61-12.23-1.43-.51.15-1.04-.14-1.2-.66-.15-.51.14-1.04.66-1.2 4.46-1.35 10-1.7 13.78.63.45.28.6.87.31 1.34zm.13-3.37C15.17 8.35 8.71 8.14 4.97 9.27c-.58.18-1.2-.16-1.38-.74-.18-.58.16-1.2.74-1.38 4.29-1.3 11.43-1.06 16.03 1.67.52.31.7.99.39 1.51-.31.53-.99.7-1.51.39z"/>
                  </svg>
                )},
                { name: 'Adobe', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.966 2H22v20h-8.034zM9.52 2H2v20h7.52zm2.25 7.641L17.275 22h-3.385l-1.92-4.949H8.563z"/>
                  </svg>
                )},
                { name: 'IBM', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 2h24v2H0zm0 3.43h24v2H0zm0 3.43h24v2H0zm0 3.43h24v2H0zm0 3.43h24v2H0zm0 3.43h24v2H0zm0 3.43h24v2H0zm0 3.43h24v2H0z"/>
                  </svg>
                )},
                { name: 'Intel', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 6.75H0v10.5h24V6.75zM1.5 15.75V8.25h21v7.5h-21z"/>
                  </svg>
                )},
                { name: 'NVIDIA', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.996 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12c.16 0 .31-.02.47-.02v-3.79c-.16.02-.31.04-.47.04A8.25 8.25 0 0 1 3.75 12c0-3.31 1.95-6.17 4.79-7.46l.54.91c-2.42.91-4.14 3.25-4.14 6.01a6.75 6.75 0 0 0 6.75 6.75c.1 0 .21 0 .31-.01v-3.07c-.1 0-.2.01-.31.01a3.75 3.75 0 0 1-3.75-3.75c0-1.48.86-2.76 2.11-3.37l.45.76c-.9.37-1.53 1.27-1.53 2.31a2.25 2.25 0 0 0 2.25 2.25c.16 0 .31-.02.47-.04V6.47c-.16.02-.31.03-.47.03A5.25 5.25 0 0 1 6.75 12c0-2.31 1.5-4.28 3.58-4.99l.5.83c-1.63.48-2.83 1.98-2.83 3.76a3.75 3.75 0 0 0 3.75 3.75c.08 0 .16 0 .24-.01v-6.91a8.25 8.25 0 0 0-1.74 3.16l-.54-.91c.71-1.74 2.18-3.04 3.99-3.52v-2A11.95 11.95 0 0 0 12 0z"/>
                  </svg>
                )},
                { name: 'Oracle', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
                  </svg>
                )},
                { name: 'Salesforce', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.75 10c0-.83-.67-1.5-1.5-1.5-.08 0-.17.01-.25.02C15.34 6.73 13.56 5.5 11.5 5.5S7.66 6.73 7 8.52c-.08-.01-.17-.02-.25-.02-1.24 0-2.25 1.01-2.25 2.25 0 .21.03.41.09.6C3.12 11.89 2 13.56 2 15.5c0 2.48 2.02 4.5 4.5 4.5h11.25c2.35 0 4.25-1.9 4.25-4.25 0-2.07-1.48-3.79-3.46-4.17.07-.18.11-.37.11-.58z"/>
                  </svg>
                )},
                { name: 'LinkedIn', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                )},
                { name: 'Uber', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18c-3.313 0-6-2.687-6-6s2.687-6 6-6 6 2.687 6 6-2.687 6-6 6z"/>
                  </svg>
                )},
                { name: 'Airbnb', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0a6 6 0 0 0-6 6c0 3.313 6 12 6 12s6-8.687 6-12a6 6 0 0 0-6-6zm0 8.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z"/>
                  </svg>
                )},
                { name: 'PayPal', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.07 7.02c0-3.84-2.82-5.52-6.52-5.52H6.38c-.46 0-.85.34-.9.8L2.73 19.38c-.06.39.24.74.63.74h4.15l1.09-6.93h.08l2.97-1.1c4.54-1.25 8.42-3.13 8.42-8.07z"/>
                  </svg>
                )},
                { name: 'Deloitte', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h20v20H2zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  </svg>
                )},
                { name: 'Accenture', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.78 12L3 3v18z"/>
                  </svg>
                )},
                { name: 'Cisco', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 14h2v8H3zm4-4h2v12H7zm4-4h2v16h-2zm4 4h2v12h-2zm4 4h2v8h-2z"/>
                  </svg>
                )},
                { name: 'Samsung', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
                  </svg>
                )},
                { name: 'Tesla', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 6v4l10-2 10 2V6zM2 18v4l10-2 10 2v-4l-10-2z"/>
                  </svg>
                )},
                { name: 'DHL', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6h20v2H2zm0 5h20v2H2zm0 5h20v2H2zm0 5h20v2H2z" />
                  </svg>
                )},
                { name: 'Atlassian', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.986 0L1.758 10.228a1.69 1.69 0 0 0 0 2.391l10.228 10.228a1.69 1.69 0 0 0 2.391 0l10.228-10.228a1.69 1.69 0 0 0 0-2.391L14.377.001a1.69 1.69 0 0 0-2.391 0z"/>
                  </svg>
                )},
                { name: 'GitHub', icon: (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                )}
                ];
                return [...list, ...list].map((company, index) => (
                  <div 
                    key={`${company.name}-${index}`} 
                    className="marquee-item flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    <div className="text-slate-600 dark:text-slate-400">
                      {company.icon}
                    </div>
                    <span>{company.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/10 mx-2" />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </section>

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
              <div className="mt-4 bg-primary text-[10px] font-bold py-2 px-4 rounded-xl text-center shadow-sm" style={{ color: '#ffffff' }}>
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
                    <span className="absolute bottom-1 right-2 bg-primary text-[7px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-0.5 shadow" style={{ color: '#ffffff' }}>
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
