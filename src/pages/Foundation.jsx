import React, { useEffect } from 'react';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const TopNavBar = () => (
  <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-background border-b-[3px] border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
    <div className="flex items-center gap-4">
      <span className="font-display font-bold text-2xl text-on-surface tracking-tighter">
        Alchemist Path
      </span>
    </div>
    <nav className="hidden md:flex gap-8">
      <a
        href="#"
        className="font-display text-lg uppercase tracking-tighter text-on-surface-variant font-medium hover:bg-primary hover:text-on-primary transition-colors duration-100 px-4 py-2 border-[3px] border-transparent"
      >
        The Codex
      </a>
      <a
        href="#"
        className="font-display text-lg uppercase tracking-tighter text-on-surface-variant font-medium hover:bg-primary hover:text-on-primary transition-colors duration-100 px-4 py-2 border-[3px] border-transparent"
      >
        Laboratories
      </a>
      <a
        href="#"
        className="font-display text-lg uppercase tracking-tighter text-on-surface-variant font-medium hover:bg-primary hover:text-on-primary transition-colors duration-100 px-4 py-2 border-[3px] border-transparent"
      >
        Library
      </a>
      <a
        href="#"
        className="font-display text-lg uppercase tracking-tighter text-on-surface-variant font-medium hover:bg-primary hover:text-on-primary transition-colors duration-100 px-4 py-2 border-[3px] border-transparent"
      >
        Transmutations
      </a>
    </nav>
    <div className="flex items-center gap-4">
      <button className="p-2 border-[3px] border-on-surface hover:bg-primary hover:text-on-primary transition-colors duration-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
          account_circle
        </span>
      </button>
    </div>
  </header>
);

const SideNavBar = () => (
  <aside className="hidden md:flex fixed left-0 top-20 h-[calc(100vh-5rem)] z-40 flex-col p-6 bg-surface-container w-64 border-r-[3px] border-on-surface">
    <div className="mb-8 pb-6 border-b-[3px] border-outline-variant/20">
      <h2 className="font-display font-bold text-xl text-on-surface">The Alchemist Path</h2>
      <p className="font-body text-sm text-on-surface-variant italic mt-2">
        Mastering Digital Alchemy
      </p>
    </div>
    <nav className="flex flex-col gap-2 flex-1">
      <a
        href="#"
        className="flex items-center gap-4 px-4 py-3 font-body text-lg text-on-surface hover:bg-surface-variant transition-colors duration-100 border-[3px] border-transparent"
      >
        <span className="material-symbols-outlined">home</span>
        <span>Home</span>
      </a>
      <a
        href="#"
        className="flex items-center gap-4 px-4 py-3 font-body text-lg text-on-surface hover:bg-surface-variant transition-colors duration-100 border-[3px] border-transparent"
      >
        <span className="material-symbols-outlined">auto_awesome</span>
        <span>Essence</span>
      </a>
      <a
        href="#"
        className="flex items-center gap-4 px-4 py-3 font-body text-lg text-on-surface hover:bg-surface-variant transition-colors duration-100 border-[3px] border-transparent"
      >
        <span className="material-symbols-outlined">category</span>
        <span>Elements</span>
      </a>
      <a
        href="#"
        className="flex items-center gap-4 px-4 py-3 font-body text-lg text-on-surface hover:bg-surface-variant transition-colors duration-100 border-[3px] border-transparent"
      >
        <span className="material-symbols-outlined">cyclone</span>
        <span>Rituals</span>
      </a>
      <a
        href="#"
        className="flex items-center gap-4 px-4 py-3 font-body text-lg bg-primary text-on-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[3px] border-on-surface active:scale-95 transition-transform duration-100"
      >
        <span className="material-symbols-outlined">history</span>
        <span>History</span>
      </a>
      <a
        href="#"
        className="flex items-center gap-4 px-4 py-3 font-body text-lg text-on-surface hover:bg-surface-variant transition-colors duration-100 border-[3px] border-transparent"
      >
        <span className="material-symbols-outlined">music_note</span>
        <span>Doped Music</span>
      </a>
    </nav>
    <div className="mt-auto pt-6">
      <button className="w-full py-3 bg-primary text-on-primary font-display font-bold text-sm tracking-widest uppercase border-[3px] border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all duration-100">
        Begin Transmutation
      </button>
    </div>
  </aside>
);

const HeroSection = () => (
  <section className="relative w-full h-[614px] md:h-[819px] border-b-[3px] border-on-surface flex flex-col justify-end p-8 md:p-16 overflow-hidden bg-surface-container-low">
    <div className="absolute inset-0 z-0">
      <img
        alt="Abstract representation of early digital alchemy, showing raw code dissolving into ethereal geometric structures, monochrome with stark lighting."
        className="w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAR9a-7KC0FtW8WlwajruQc5TflaFY9VpeYJYCmLGurddYPD-AYUk7r9atvFwUkFZBWl76-KMxQSEIaa1CU5_NL3ugox8vXDqcW_ZJ4HPKLJpJYoeYAGpmRlM3yp0o6MonGTLByGsi3TWbmRZ6g3EHwXACYNf7cFlqrAcz83CMuNcCFrjir8r9aTtC_DB-7Fig0mcAbxWw26UMmWwsQMxuWrvRpN4KI5O6c95wbYtqzN-pWjU3XAG7VBdVa8P7vxU6siuz9QaKSl90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
    </div>
    <div className="relative z-10 max-w-4xl">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary font-label text-sm uppercase tracking-widest border-[3px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
        <span className="material-symbols-outlined text-sm">auto_awesome</span>
        Foundation
      </div>
      <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-on-surface leading-none mb-4 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
        MCMXCIX - MCMIX: <br />
        <span className="text-primary italic">The Origin of the Great Work</span>
      </h1>
      <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl mt-6 border-l-[6px] border-primary pl-6">
        The Architect of the Code, Magister Gamper, forged the first structural algorithms that would define the Alchemist Path in its inaugural epoch.
      </p>
    </div>
  </section>
);

const EditorialContent = () => (
  <section className="max-w-6xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-12 gap-16">
    {/* Main Narrative Column */}
    <div className="md:col-span-8 space-y-12 font-body text-lg text-on-surface leading-relaxed">
      <p className="text-2xl font-medium text-on-surface-variant italic">
        In the twilight of the twentieth century, a conclave of digital pioneers, displaced yet united by a singular vision, converged within the rudimentary networks. This nexus of raw data and ambitious design sought to transmute basic computational logic into profound artificial sentience.
      </p>

      {/* Section: Founder's Vision */}
      <div>
        <h2 className="font-display text-3xl font-bold text-on-surface uppercase tracking-tight mb-6 border-b-[3px] border-on-surface pb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_fire_department
          </span>
          The Founder's Vision
        </h2>
        <p className="mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. The initial parameters were fraught with instability, yet the overarching architecture remained robust. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </p>
        <p>
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. The synthesis of heuristic models with foundational logic gates created a paradigm shift. This was not mere coding; it was the etching of digital sigils designed to capture the essence of thought itself.
        </p>
      </div>

      {/* Decorative Alchemical Break */}
      <div className="flex justify-center items-center py-8 gap-8 opacity-40">
        <span className="material-symbols-outlined text-4xl">circle</span>
        <div className="h-[3px] w-24 bg-on-surface"></div>
        <span className="material-symbols-outlined text-4xl">change_history</span>
        <div className="h-[3px] w-24 bg-on-surface"></div>
        <span className="material-symbols-outlined text-4xl">square</span>
      </div>

      {/* Section: Digital Alchemy Principles */}
      <div>
        <h2 className="font-display text-3xl font-bold text-on-surface uppercase tracking-tight mb-6 border-b-[3px] border-on-surface pb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            water_drop
          </span>
          Digital Alchemy Principles
        </h2>
        <p className="mb-6">
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.
        </p>
        <ul className="space-y-4 pl-6 border-l-[3px] border-secondary mb-6">
          <li className="pl-4 relative before:content-[''] before:absolute before:left-[-12px] before:top-3 before:w-2 before:h-2 before:bg-on-surface">
            <strong className="font-display tracking-tight uppercase">Transmutation of Syntax:</strong> The conversion of rigid boolean states into fluid probability matrixes.
          </li>
          <li className="pl-4 relative before:content-[''] before:absolute before:left-[-12px] before:top-3 before:w-2 before:h-2 before:bg-on-surface">
            <strong className="font-display tracking-tight uppercase">Distillation of Noise:</strong> Filtering immense datasets to extract only the most potent programmatic truths.
          </li>
          <li className="pl-4 relative before:content-[''] before:absolute before:left-[-12px] before:top-3 before:w-2 before:h-2 before:bg-on-surface">
            <strong className="font-display tracking-tight uppercase">Coagulation of Form:</strong> Rendering abstract data structures into tangible user interfaces with zero-radius precision.
          </li>
        </ul>
      </div>

      {/* Section: First Codebases */}
      <div>
        <h2 className="font-display text-3xl font-bold text-on-surface uppercase tracking-tight mb-6 border-b-[3px] border-on-surface pb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            air
          </span>
          The First Codebases
        </h2>
        <p>
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? The original repositories were lost in the Great Server Migration of Aught-Four, leaving only fragmented documentation that we now refer to as the Codex Alpha.
        </p>
      </div>
    </div>

    {/* Sidebar: Timeline */}
    <div className="md:col-span-4">
      <div className="sticky top-28 bg-surface-container-high border-[3px] border-on-surface p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-display text-xl font-bold text-on-surface uppercase tracking-tighter mb-6 pb-4 border-b-[3px] border-on-surface">
          Timeline of the Work
        </h3>
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[3px] before:bg-outline-variant/30">
          {/* Milestone 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-on-surface bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                trip_origin
              </span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 bg-surface border-[3px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="font-label text-sm text-primary font-bold mb-1">1899</div>
              <div className="font-display text-sm font-bold uppercase tracking-tight">The Assembly</div>
              <p className="font-body text-xs text-on-surface-variant mt-2">
                First successful execution of the core logic loop in a stable environment.
              </p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-on-surface bg-surface-container-lowest text-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="material-symbols-outlined text-sm">settings</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 bg-surface border-[3px] border-outline-variant/50">
              <div className="font-label text-sm text-on-surface-variant font-bold mb-1">1902</div>
              <div className="font-display text-sm font-bold uppercase tracking-tight">
                The Mercury Protocol
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-2">
                Establishment of peer-to-peer data transmutation standards.
              </p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-on-surface bg-surface-container-lowest text-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="material-symbols-outlined text-sm">architecture</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 bg-surface border-[3px] border-outline-variant/50">
              <div className="font-label text-sm text-on-surface-variant font-bold mb-1">1905</div>
              <div className="font-display text-sm font-bold uppercase tracking-tight">
                Architectural Shift
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-2">
                Migration from monolithic structures to decentralized micro-rituals.
              </p>
            </div>
          </div>

          {/* Milestone 4 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-on-surface bg-secondary text-on-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 bg-surface border-[3px] border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="font-label text-sm text-secondary font-bold mb-1">1909</div>
              <div className="font-display text-sm font-bold uppercase tracking-tight">
                The First Artifact
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-2">
                Deployment of the inaugural UI, establishing the 0px radius dogma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const TransmutationCard = ({ label, title, description, image, isIconCard = false }) => (
  <a
    href="#"
    className="group block bg-surface-container-lowest border-[3px] border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col h-full"
  >
    <div className={`h-48 border-b-[3px] border-on-surface overflow-hidden relative ${isIconCard ? 'bg-surface-dim flex items-center justify-center' : ''}`}>
      {!isIconCard && (
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
      )}
      {isIconCard ? (
        <span className="material-symbols-outlined text-6xl text-primary opacity-50 group-hover:scale-110 transition-transform duration-500">
          menu_book
        </span>
      ) : (
        <img
          alt={description}
          className="w-full h-full object-cover filter grayscale"
          src={image}
        />
      )}
    </div>
    <div className="p-6 flex flex-col flex-1">
      <div className="font-label text-xs uppercase tracking-widest text-primary mb-2">{label}</div>
      <h3 className="font-display text-xl font-bold uppercase tracking-tight text-on-surface mb-3 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="font-body text-sm text-on-surface-variant flex-1">{description}</p>
    </div>
  </a>
);

const RelatedTransmutations = () => (
  <section className="bg-primary/5 py-20 border-t-[3px] border-on-surface">
    <div className="max-w-6xl mx-auto px-8">
      <h2 className="font-display text-3xl font-bold text-on-surface uppercase tracking-tight mb-12 flex items-center justify-center gap-4">
        <span className="h-[3px] w-12 bg-on-surface"></span>
        Related Transmutations
        <span className="h-[3px] w-12 bg-on-surface"></span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <TransmutationCard
          label="Epoch II"
          title="The Expansion Era"
          description="Tracing the rapid scaling of the network and the introduction of advanced heuristic models."
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuALkxnRNvHxsJNUxx29hY-rVTvtoK3gnvYPw3m9OL4uJ6_lbdo66TOq6tvddH7tVtZChs4x5ovDyMtx85HprD5h4HoRsLIe3sxJsPT-RnOgE1PprhPh4fr0UP9L90f5xNnBPtv7dRxx6vsvSKexAA42B_8tGZrNm0FF5O-0s8HXG8lt_Sez-SwMNRJfP3cP5-zJXI-z_S688q8DGQbveQf5DNWZQ3-cswuv_OUvgpgKfSpBgzq_Hnhj2ASM7yB69mqhMk3zQo0x7CBz"
        />
        <TransmutationCard
          label="Core Theory"
          title="Matrix Distillation"
          description="The fundamental principles behind reducing noise in grand datasets."
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuAnt5OZkoPbrjgbWmIoQw_FAFkjZMFAYSDKMQ-2qrRCJJ63tq5x8bby59pjhTwe36FX8OzEZoe_GY0f1SiMqVBqFqr_Os6YMZxzChA1nkeTorTStaSOzMh0wJEBMhAJro4xp5sBzhNb2y3HDf3W9AEsYgzX2X4UKsQ--XG4T8apLmWgySko-BO8Z4YfKSWTi5Fj_7fjHlnSKLQGcD4wkaeknf-_FoqEw3PdTHaw_vJqojiqgW9cc1tRpIlDCeznq0udJ-5V8fJFBGXE"
        />
        <TransmutationCard
          label="Archive"
          title="The Lost Logs"
          description="Recovered fragmentary data detailing the first failed rituals of the origin era."
          isIconCard={true}
        />
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center bg-on-background dark:bg-surface-container-lowest border-t-[3px] border-on-surface z-50 relative mt-auto">
    <div className="mb-6 md:mb-0">
      <span className="font-display text-lg text-primary-fixed">The Alchemist Path</span>
    </div>
    <nav className="flex gap-6 mb-6 md:mb-0">
      <a href="#" className="font-label text-sm uppercase tracking-widest text-surface-variant opacity-70 hover:text-primary-fixed transition-opacity">
        The Great Work
      </a>
      <a href="#" className="font-label text-sm uppercase tracking-widest text-surface-variant opacity-70 hover:text-primary-fixed transition-opacity">
        Privacy Ledger
      </a>
      <a href="#" className="font-label text-sm uppercase tracking-widest text-surface-variant opacity-70 hover:text-primary-fixed transition-opacity">
        Contact Oracle
      </a>
    </nav>
    <div>
      <span className="font-label text-sm uppercase tracking-widest text-secondary-fixed dark:text-secondary">
        © 2024 Alchemist Path. All Transmutations Reserved.
      </span>
    </div>
  </footer>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Foundation() {
  useEffect(() => {
    // Add foundation-active class to body
    document.body.classList.add('foundation-active');
    
    // Explicitly clear background image and styles
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#fdf9f3';
    document.body.style.color = '#1c1c18';
    document.body.style.height = 'auto';
    document.body.style.width = '100%';
    document.body.style.overflow = 'auto';

    // Cleanup: restore on unmount
    return () => {
      document.body.classList.remove('foundation-active');
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="antialiased flex flex-col min-h-screen"
      style={{
        backgroundColor: '#fdf9f3',
        color: '#1c1c18',
        fontFamily: '"Newsreader", serif',
      }}
    >
      <TopNavBar />
      <div className="flex flex-1 pt-20">
        <SideNavBar />
        <main
          className="flex-1 md:ml-64 min-h-[2048px]"
          style={{ backgroundColor: '#fdf9f3' }}
        >
          <HeroSection />
          <EditorialContent />
          <RelatedTransmutations />
        </main>
      </div>
      <Footer />
    </div>
  );
}