import React, { useState } from 'react';
import { useJobStore } from '../../store/jobStore';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { Button } from '../Button';

export const JobFilters: React.FC = () => {
  const { filters, setFilters, searchJobs } = useJobStore();
  const [keyword, setKeyword] = useState(filters.keyword);
  const [location, setLocation] = useState(filters.location);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ keyword, location });
    searchJobs(keyword, location);
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl shadow-md flex flex-col md:flex-row gap-4 items-center justify-between text-left w-full"
    >
      <div className="flex flex-col md:flex-row gap-4 flex-grow w-full">
        {/* Keyword */}
        <div className="flex flex-col gap-1 flex-grow">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Search Role / Keywords</label>
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="e.g. React Developer"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1 w-full md:w-60">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Location</label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="e.g. Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-auto self-end md:self-center mt-2 md:mt-0 flex gap-2">
        <Button
          type="submit"
          className="w-full md:w-auto font-black px-6 gap-1 text-xs"
          icon={<Search size={14} />}
        >
          Search Jobs
        </Button>
      </div>
    </form>
  );
};
export default JobFilters;
