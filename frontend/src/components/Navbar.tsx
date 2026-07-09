import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Templates', href: '#templates' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If we are not on the landing page, navigate first
      navigate('/' + href);
    }
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-smooth ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-4'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
            B
          </div>
          <span className="font-extrabold text-slate-900 text-xl tracking-tight">Bimba AI</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollToSection(e, link.href)}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-smooth"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Call to Actions */}
        <div className="hidden md:flex items-center gap-3">
          <NavLink to="/login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </NavLink>
          <NavLink to="/activate">
            <Button variant="primary" size="sm">
              Activate Account
            </Button>
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1 text-slate-600 hover:text-slate-900 transition-smooth cursor-pointer"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Navigation */}
      {isOpen && (
        <div className="md:hidden fixed top-[68px] inset-x-0 bg-white/95 backdrop-blur-lg border-b border-slate-200/80 p-6 flex flex-col gap-5 z-40 shadow-lg">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollToSection(e, link.href)}
                className="text-slate-700 hover:text-slate-900 text-base font-semibold py-1 border-b border-slate-50"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link to="/login" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="outline" className="w-full" size="md">
                Log In
              </Button>
            </Link>
            <Link to="/activate" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="primary" className="w-full" size="md">
                Activate Account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
