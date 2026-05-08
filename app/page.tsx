import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { Experience } from "./components/Experience";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Nav } from "./components/Nav";
import { Notes } from "./components/Notes";
import { Projects } from "./components/Projects";
import { Reveal } from "./components/Reveal";

export default function Page() {
  return (
    <>
      <div className="wrap">
        <Reveal as="header" className="head">
          <span className="name">Juan Figuera</span>
          <Nav />
        </Reveal>

        <Reveal>
          <Hero />
        </Reveal>

        <Reveal>
          <About />
        </Reveal>

        <Reveal>
          <Notes />
        </Reveal>

        <Reveal>
          <Projects />
        </Reveal>

        <Reveal>
          <Experience />
        </Reveal>

        <Reveal>
          <Contact />
        </Reveal>

        <Footer />
      </div>
    </>
  );
}
