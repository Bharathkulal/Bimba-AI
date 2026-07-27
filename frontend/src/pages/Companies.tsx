import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Search, MapPin, Globe, Users, 
  Star, Briefcase, DollarSign, MessageSquare, AlertCircle, ChevronRight
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatsCard } from '../components/StatsCard';

interface CompanyData {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  location: string;
  logo: string;
  description: string;
  rating: number;
  hiringStatus: 'Hiring' | 'No Active Roles' | 'Slow Hiring';
  salaryRange: string;
  reviewsCount: number;
  openPositionsCount: number;
  featured: boolean;
}

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // High quality static company datasets matching the mock LinkedIn service
  const companiesData: CompanyData[] = [
    {
      id: 'vercel',
      name: 'Vercel',
      industry: 'Software & Technology',
      size: '500-1000 employees',
      website: 'vercel.com',
      location: 'San Francisco, CA',
      logo: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=100&auto=format&fit=crop&q=60',
      description: 'Vercel provides the developer experience and infrastructure to build, deploy, and scale the decentralized web. Vercel enables developers to host websites and web applications that deploy instantly and scale automatically.',
      rating: 4.8,
      hiringStatus: 'Hiring',
      salaryRange: '$135,000 - $190,000',
      reviewsCount: 42,
      openPositionsCount: 4,
      featured: true
    },
    {
      id: 'openai',
      name: 'OpenAI',
      industry: 'Artificial Intelligence',
      size: '1000-5000 employees',
      website: 'openai.com',
      location: 'San Francisco, CA',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
      description: 'OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity. OpenAI is leading the developer community in building secure and aligned generative model systems.',
      rating: 4.9,
      hiringStatus: 'Hiring',
      salaryRange: '$170,000 - $260,000',
      reviewsCount: 156,
      openPositionsCount: 6,
      featured: true
    },
    {
      id: 'stripe',
      name: 'Stripe',
      industry: 'Fintech / Payments',
      size: '5000-10000 employees',
      website: 'stripe.com',
      location: 'San Francisco, CA & Remote',
      logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&auto=format&fit=crop&q=60',
      description: 'Stripe is a financial infrastructure platform for the internet. Millions of companies—from the world’s largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.',
      rating: 4.7,
      hiringStatus: 'Hiring',
      salaryRange: '$140,000 - $210,000',
      reviewsCount: 204,
      openPositionsCount: 3,
      featured: true
    },
    {
      id: 'google',
      name: 'Google',
      industry: 'Software & Cloud Services',
      size: '100,000+ employees',
      website: 'google.com',
      location: 'Mountain View, CA & India',
      logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=60',
      description: 'Google’s mission is to organize the world’s information and make it universally accessible and useful. We build systems, platforms, databases, and search structures that power the daily workflow of billions of developers and users worldwide.',
      rating: 4.6,
      hiringStatus: 'Slow Hiring',
      salaryRange: '$120,000 - $240,000',
      reviewsCount: 1204,
      openPositionsCount: 2,
      featured: false
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      industry: 'Travel & Hospitality',
      size: '5000+ employees',
      website: 'airbnb.com',
      location: 'San Francisco, CA',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60',
      description: 'Airbnb operates an online marketplace for lodging, primarily homestays for vacation rentals, and tourism activities. Based in San Francisco, California, the platform is accessible via website and mobile app.',
      rating: 4.5,
      hiringStatus: 'No Active Roles',
      salaryRange: '$130,000 - $185,000',
      reviewsCount: 89,
      openPositionsCount: 1,
      featured: false
    },
    {
      id: 'figma',
      name: 'Figma',
      industry: 'Collaborative Design',
      size: '1000-2000 employees',
      website: 'figma.com',
      location: 'San Francisco, CA & Remote',
      logo: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=100&auto=format&fit=crop&q=60',
      description: 'Figma is a leading collaborative web application for interface design, with additional offline features enabled by desktop applications for macOS and Windows. Figma connects creative UI/UX teams.',
      rating: 4.8,
      hiringStatus: 'Hiring',
      salaryRange: '$125,000 - $180,000',
      reviewsCount: 65,
      openPositionsCount: 4,
      featured: false
    }
  ];

  const filteredCompanies = companiesData.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = companiesData.find(c => c.id === selectedCompanyId) || filteredCompanies[0];

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-7xl mx-auto">
      
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l -[#111111]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Company Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Explore premium hiring companies, read ratings & reviews, and search open positions.
          </p>
        </div>
      </section>

      {/* Main Layout Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Side: Search & Companies List */}
        <div className="flex flex-col gap-4">
          <Card className="p-4 flex items-center gap-2">
            <Search className="text-slate-400 shrink-0" size={16} />
            <input 
              type="text"
              placeholder="Search companies by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 focus:outline-none font-medium"
            />
          </Card>

          {/* Featured & Filtered list */}
          <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold bg-white border border-slate-200/80 rounded-2xl">
                No companies found matching search criteria.
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div 
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`p-4 border rounded-2xl cursor-pointer text-left transition-all ${
                    selectedCompany?.id === company.id 
                      ? 'bg-[#F8F8F8] -[#111111] shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={company.logo} 
                      alt={company.name} 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" 
                    />
                    <div className="leading-tight flex-grow">
                      <h4 className="font-bold text-xs text-slate-800">{company.name}</h4>
                      <p className="text-[10px] text-slate-450 font-bold mt-0.5">{company.industry}</p>
                      <span className="text-[9px] text-slate-450 block mt-1">{company.location}</span>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      company.hiringStatus === 'Hiring' 
                        ? 'bg-[#F8F8F8] -[#111111]' 
                        : company.hiringStatus === 'Slow Hiring'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 text-slate-500'
                    }`}>
                      {company.hiringStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Company Details Portal */}
        <div className="lg:col-span-2">
          {selectedCompany ? (
            <Card className="p-6 h-full flex flex-col justify-between gap-6">
              
              {/* Header profile banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4 text-left">
                  <img 
                    src={selectedCompany.logo} 
                    alt={selectedCompany.name} 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" 
                  />
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                      {selectedCompany.name}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {selectedCompany.industry} • {selectedCompany.location}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-500">
                        <Star size={12} className="fill-current" />
                        <span className="text-xs font-bold text-slate-800 ml-1">{selectedCompany.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">• {selectedCompany.reviewsCount} reviews</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 items-start sm:items-end">
                  <span className={`text-[9.5px] font-black px-2.5 py-1 rounded-full uppercase ${
                    selectedCompany.hiringStatus === 'Hiring' 
                      ? 'bg-[#F8F8F8] -[#111111] border border-[#E5E7EB]' 
                      : selectedCompany.hiringStatus === 'Slow Hiring'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {selectedCompany.hiringStatus}
                  </span>
                  <a 
                    href={`https://${selectedCompany.website}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] font-bold -[#111111] hover:underline flex items-center gap-0.5 mt-1"
                  >
                    <Globe size={11} /> {selectedCompany.website}
                  </a>
                </div>
              </div>

              {/* Description Body */}
              <div className="text-left flex-grow">
                <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-2">
                  Company Overview
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed font-medium mb-6">
                  {selectedCompany.description}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-100 py-5 my-5">
                  <div className="flex items-center gap-2 text-xs">
                    <Users size={16} className="text-slate-450" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Company Size</p>
                      <p className="font-extrabold text-slate-800 mt-1 leading-none">{selectedCompany.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <DollarSign size={16} className="text-slate-450" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Salary Overview</p>
                      <p className="font-extrabold text-slate-800 mt-1 leading-none">{selectedCompany.salaryRange}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Briefcase size={16} className="text-slate-450" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Open Positions</p>
                      <p className="font-extrabold text-slate-800 mt-1 leading-none">{selectedCompany.openPositionsCount} jobs active</p>
                    </div>
                  </div>
                </div>

                {/* Open Positions List Preview */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-3">
                    Active Open Positions
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <div 
                      onClick={() => navigate('/jobs')}
                      className="p-3 border border-slate-150 rounded-xl hover:border-slate-350 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-slate-800">Software Developer / Engineer</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedCompany.location} • Full-time</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button footer */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button 
                  onClick={() => navigate(`/jobs?keyword=${selectedCompany.name}`)}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Briefcase size={14} />
                  View All Open Positions
                </Button>
              </div>

            </Card>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs font-semibold bg-white border border-slate-200/80 rounded-2xl h-full flex items-center justify-center">
              Please select a company to view profiles and details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Companies;
