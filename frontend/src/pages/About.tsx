import React from "react";

const About: React.FC = () => {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      {/* Page title */}
      <header className="mb-8 border-b border-[var(--line)] pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          About <span className="text-[var(--accent)]">CodeIT</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Practice DSA problems, compete in contests, and track your progress
          across topics — all in one place.
        </p>
      </header>

      {/* Project description */}
      <section className="mb-8 rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          What this project is about
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">
          Welcome to CodeIT, a dedicated platform for practicing data structures and algorithms 
          through a structured, interactive, and user-focused experience. The website is designed
          to bring together problem solving, coding practice, competition participation, progress tracking,
          and intelligent assistance within a single environment. By encouraging regular practice and
          offering tools that support both learning and performance evaluation, CodeIT aims to help users 
          enhance their technical abilities, develop stronger analytical thinking, and achieve steady growth
          in their problem-solving journey. The platform is built to create a smooth and organized workflow
          where learners can approach problems systematically, evaluate their performance, and refine their
          coding strategies over time. It also emphasizes consistency and self-improvement by enabling users
          to monitor progress across different topics and practice sessions. Through its combination of
          usability, functionality, and guided support, CodeIT seeks to provide an effective digital space 
          for learners to strengthen their foundations and build confidence in tackling technical challenges 
          with clarity and precision.
        </p>
      </section>

      {/* Authors section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">
          Authors
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Author 1 */}
          <article className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <h3 className="text-base font-semibold text-[var(--text)]">
              Sobhagya Verma
            </h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--accent)]">
              Backend / Database
            </p>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
             Sobhagya Verma is a Computer Science undergraduate and aspiring AI/ML engineer 
             passionate about building intelligent, scalable, and impactful software solutions. 
             He enjoys exploring machine learning, artificial intelligence, software engineering, 
             and cloud technologies while continuously strengthening his skills through hands-on projects. 
             His work reflects a practical, problem-solving mindset focused on creating reliable and 
             efficient applications. Driven by curiosity, continuous learning, and innovation, Sobhagya values clean code, 
             collaboration, and developing technology that delivers meaningful real-world impact.

            </p>
          </article>

          {/* Author 2 */}
          <article className="rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <h3 className="text-base font-semibold text-[var(--text)]">
              Manya Katakol
            </h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--accent)]">
              Frontend / UI
            </p>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
              Manya Katakol is a Computer Science undergraduate with a passion for building 
              innovative and impactful technology solutions. She enjoys exploring emerging fields 
              such as IoT, cybersecurity, blockchain, artificial intelligence, and software development.
               Over the years, she has worked on a variety of academic and personal projects that combine 
               creativity with practical problem-solving. Beyond technical work, she values 
               continuous learning, research, and collaboration on challenging ideas. She is always eager 
               to expand her knowledge and adapt to new technologies. Through every project, Manya aims to 
               create meaningful solutions that bridge innovation with real-world applications.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default About;