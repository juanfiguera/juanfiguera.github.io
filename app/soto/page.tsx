import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";
import { Esfera } from "./Esfera";
import { Espiral } from "./Espiral";
import { Penetrable } from "./Penetrable";
import { Sonoro } from "./Sonoro";
import { SotoClip } from "./SotoClip";
import { Vibracion } from "./Vibracion";

export const metadata: Metadata = {
  title: "Homenaje a Soto · Juan Figuera",
  description:
    "An interactive tribute to Jesús Rafael Soto, the Venezuelan kinetic artist from Ciudad Bolívar. Walk through a Penetrable, shift an Espiral, play a sound wall of metal rods, and brush through an Esfera.",
  alternates: { canonical: "/soto/" },
};

export default function SotoPage() {
  return (
    <>
      <div className="wrap soto-wrap-top">
        <Reveal as="header" className="head">
          <Link href="/" className="name">
            Juan Figuera
          </Link>
          <Link href="/" className="head-back">
            ← Home
          </Link>
        </Reveal>
      </div>

      <section className="soto-hero" aria-labelledby="soto-title">
        <Penetrable />
        <div className="soto-hero-text">
          <p className="soto-kicker">Homenaje · 1923 Ciudad Bolívar · 2005 París</p>
          <h1 id="soto-title">Jesús Rafael Soto</h1>
          <p className="soto-hint">Move through the threads</p>
        </div>
      </section>

      <div className="wrap">
        <Reveal className="sec soto-intro">
          <p>
            When I was a kid, my dad took my brother and me to the{" "}
            <a href="https://jesus-soto.com/es/museo-soto/">Museo de Arte Moderno Jesús Soto</a> in{" "}
            <em>Ciudad Bolívar</em>, Soto&apos;s hometown, and showed us his work. I&apos;ve loved it
            ever since. Part of it is that it&apos;s genuinely cool. Part of it is that every Soto I see
            takes me back to that day with my family.
          </p>
          <p>
            Soto left Venezuela for Paris in 1950 and spent his life making work that seems to move
            even though it stands still. The motion happens in your eyes and in your body. You
            don&apos;t look at a Soto so much as finish it. This page is my small attempt at the same
            idea, in code.
          </p>
          <p>
            He never forgot where he came from. In 1969 he founded that museum in Ciudad Bolívar, in
            a building by Carlos Raúl Villanueva that opened in 1973.
          </p>
        </Reveal>

        <Reveal className="sec soto-piece">
          <div className="soto-label">
            <span className="soto-num">00</span>
            <h2>A life in lines</h2>
          </div>
          <SotoClip />
          <p>
            Seventy seconds, ten chapters, and the same 150 lines the whole way through, from the
            Orinoco to Paris to a sphere of rods on a Caracas highway.
          </p>
        </Reveal>

        <Reveal className="sec soto-piece">
          <div className="soto-label">
            <span className="soto-num">01</span>
            <h2>Penetrable</h2>
          </div>
          <p>
            Soto&apos;s Penetrables are rooms full of hanging threads that you walk into. The piece
            only exists while someone is inside it. The yellow comes from the{" "}
            <a href="https://jesus-soto.com/wp-content/uploads/2021/06/1993-gran-penetrable-amarillo-musee-soto-ciudad-bolivar-2.jpg">
              Gran Penetrable Amarillo
            </a>{" "}
            at the museum in Ciudad Bolívar. Above, your cursor is the visitor. Leave it alone for a
            moment and three others walk through: one tall, two small.
          </p>
        </Reveal>

        <Reveal className="sec soto-piece">
          <div className="soto-label">
            <span className="soto-num">02</span>
            <h2>Espiral</h2>
          </div>
          <div className="soto-panel">
            <Espiral />
          </div>
          <p>
            Soto&apos;s first kinetic work, from 1955: a white spiral painted on plexiglass, floating
            just above a black one. He wanted the motion of Duchamp&apos;s spinning Rotoreliefs
            without the motor. You are the motor. Move across the panel and the spirals start to
            turn.
          </p>
        </Reveal>

        <Reveal className="sec soto-piece">
          <div className="soto-label">
            <span className="soto-num">03</span>
            <h2>Vibración</h2>
          </div>
          <div className="soto-panel">
            <Vibracion />
          </div>
          <p>
            Fine stripes behind, objects hanging in front. Where they overlap, the lines start to
            shimmer and the solid things seem to dissolve. Move across the panel to tilt the square.
          </p>
        </Reveal>

        <Reveal className="sec soto-piece">
          <div className="soto-label">
            <span className="soto-num">04</span>
            <h2>Sonoro</h2>
          </div>
          <div className="soto-panel">
            <Sonoro />
          </div>
          <p>
            In 1968 Soto made a vibrating wall of hanging metal rods whose movement turned into
            sound. This one you can play. Turn the sound on and brush through the rods.
          </p>
        </Reveal>

        <Reveal className="sec soto-piece">
          <div className="soto-label">
            <span className="soto-num">05</span>
            <h2>Esfera</h2>
          </div>
          <div className="soto-panel">
            <Esfera />
          </div>
          <p>
            The Esfera Caracas is about 1,800 orange aluminum rods hanging along the Francisco
            Fajardo highway. It isn&apos;t a sphere at all, just straight rods, and it shimmers with
            the light and the wind. This one hangs here for you to touch. Drag to walk around it,
            or brush through it and the rods swing, then settle back into a sphere.
          </p>
        </Reveal>

        <Footer />
      </div>
    </>
  );
}
