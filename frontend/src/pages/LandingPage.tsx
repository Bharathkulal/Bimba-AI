import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  Sparkles, HelpCircle, ArrowRight, Star 
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { TemplateShowcase } from '../components/TemplateShowcase';

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
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-emerald-100/10 blur-[130px]" />
        <div className="absolute top-[30%] right-[-20%] w-[50%] h-[50%] rounded-full bg-emerald-50/10 blur-[140px]" />
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
            {/* Resumes created today indicator */}
            <div className="flex items-center gap-2 self-start bg-emerald-50 border border-emerald-100/60 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span><AnimatedNumber value={48827} duration={1500} /> resumes created today</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 tracking-tight leading-[1.1] !my-0">
              Your <span className="text-emerald-500">professional AI resume</span>, ready in minutes
            </h1>

            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-lg">
              Our AI resume builder saves your time with smart content suggestions and impactful summaries. Get hired faster, stress-free!
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link to="/activate">
                <Button variant="primary" size="lg" className="shadow-lg shadow-emerald-500/20 font-semibold gap-2">
                  Create AI Resume Now <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#templates">
                <Button variant="outline" size="lg" className="font-semibold border-slate-250 hover:bg-slate-50">
                  Improve My Resume
                </Button>
              </a>
            </div>

            {/* Placement stats */}
            <div className="flex items-center gap-8 mt-6 pt-6 border-t border-slate-100">
              <div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                  <AnimatedNumber value={48} suffix="%" />
                </span>
                <p className="text-xs text-slate-400 font-medium mt-2">more likely to get hired</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">
                  <AnimatedNumber value={12} suffix="%" />
                </span>
                <p className="text-xs text-slate-400 font-medium mt-2">better pay with your next job</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Right Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Main Interactive Resume Graphic */}
            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="relative w-full max-w-[430px] bg-white rounded-[24px] shadow-2xl p-6 border border-slate-150 relative z-10 flex flex-col gap-5"
            >
              {/* Header */}
              <div className="text-center border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-slate-800 text-base">Samantha Williams</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">New York, NY • samantha@example.com</p>
              </div>

              {/* Summary Block */}
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Summary</h4>
                <div className="h-0.5 bg-slate-200 rounded" />
                <div className="h-10 bg-slate-50 rounded-lg p-2.5 relative border border-slate-100/60">
                  <div className="h-2 bg-slate-200 rounded w-11/12 mb-1.5" />
                  <div className="h-2 bg-slate-150 rounded w-4/5" />
                </div>
              </div>

              {/* Experience Block */}
              <div className="flex flex-col gap-1.5 relative">
                <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Experience</h4>
                <div className="h-0.5 bg-slate-200 rounded" />
                <div className="h-16 bg-slate-50 rounded-lg p-3 relative border border-slate-100/60 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="h-2 bg-slate-350 rounded w-1/3" />
                    <div className="h-2 bg-slate-200 rounded w-1/6" />
                  </div>
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                  <div className="h-1.5 bg-slate-150 rounded w-11/12" />
                </div>

                {/* Floating "Generate with AI" button on resume */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-smooth uppercase tracking-wider cursor-pointer">
                    <Sparkles size={9} /> Generate with AI
                  </button>
                </div>
              </div>

              {/* Floating Tooltip pointing to summary */}
              <div className="absolute top-16 -left-12 z-20 w-44 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-slate-100 p-2 text-[9px] text-slate-500 leading-relaxed">
                <span className="font-extrabold text-slate-800 block mb-0.5">Summary Idea</span>
                Marketing specialist with 2+ years of experience in digital marketing...
                <div className="absolute top-4 -right-1 w-2 h-2 rotate-45 bg-white border-t border-r border-slate-100" />
              </div>
            </motion.div>

            {/* Decorative character looking at resume */}
            <div className="absolute bottom-[-20px] right-[-20px] z-20 w-24 h-24 overflow-hidden pointer-events-none hidden md:block">
              {/* Simple avatar representation */}
              <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-white shadow absolute bottom-4 right-4 flex items-center justify-center text-white font-bold text-lg">
                AI
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
            Our customers have been hired at:
          </motion.p>
          <motion.div variants={childVariants} className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {['Google', 'DHL', 'Booking.com', 'Spotify', 'Facebook', 'Amazon'].map((brand) => (
              <span key={brand} className="text-slate-600 font-bold text-lg tracking-tight select-none">
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.section>

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
              <Link to="/activate">
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
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 bg-slate-50 relative z-10 border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle 
            title="Learn why people choose our AI-powered resumes" 
            subtitle="Read feedback from students and job seekers who used Bimba AI to unlock placements."
            centered
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center mt-12">
            
            {/* Rating Widget */}
            <motion.div variants={childVariants} className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left bg-white p-6 rounded-[20px] border border-slate-150 shadow-sm gap-4">
              <span className="text-slate-800 font-extrabold text-3xl">4.5 out of 5</span>
              <div className="flex items-center gap-1 text-emerald-500">
                {[1, 2, 3, 4, 5].map((st) => (
                  <Star key={st} size={18} className="fill-emerald-500" />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                <span className="text-emerald-500">★</span> Trustpilot
              </div>
              <p className="text-[11px] text-slate-400">based on 3,112 reviews</p>
            </motion.div>

            {/* Testimonial slider / list */}
            <motion.div variants={childVariants} className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Sarah Thompson', time: 'about 1 day ago', text: 'Bimba AI made it sooo easy. Like many others here, I had no idea how to write my resume at all. The AI suggestions were spot-on!' },
                { name: 'Jason Miller', time: 'about 1 day ago', text: 'Landed several interviews! I created my resume in 10 minutes and got two callbacks the same week. Super easy!' },
                { name: 'Priya Ramesh', time: 'about 1 day ago', text: 'Fast and effective. Bimba AI helped me say what I meant, and believe it or not, my bullet points sound so professional!' }
              ].map((rev, idx) => (
                <Card key={idx} className="flex flex-col justify-between gap-5 p-5 bg-white border border-slate-150 shadow-sm h-full hover:-translate-y-1 transition-all duration-250 hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-0.5 text-emerald-500 mb-3">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star key={st} size={10} className="fill-emerald-500" />
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
            </motion.div>

          </div>
        </div>
      </motion.section>

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
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-650 flex items-center justify-center font-bold text-[10px]">
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
            <Link to="/activate">
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
